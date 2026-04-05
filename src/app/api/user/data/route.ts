import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      'SELECT scans_count, watchlist FROM user_data WHERE user_id = $1',
      [session.user.id]
    );

    return NextResponse.json({
      scansCount: result.rows[0]?.scans_count || 0,
      watchlist: result.rows[0]?.watchlist || [],
    });
  } catch (error) {
    console.error("GET user data error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Ensure user_data row exists
    await pool.query(
      `INSERT INTO user_data (user_id, scans_count, watchlist) 
       VALUES ($1, 0, '[]'::jsonb) 
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    if (body.action === "increment_scan") {
      await pool.query(
        'UPDATE user_data SET scans_count = scans_count + 1 WHERE user_id = $1',
        [userId]
      );
    } else if (body.action === "add_to_watchlist") {
      await pool.query(
        `UPDATE user_data 
         SET watchlist = (
           SELECT jsonb_agg(elem) FROM (
             SELECT elem FROM jsonb_array_elements(watchlist) elem
             WHERE elem->>'address' != $2
           ) sub
         ) || $3::jsonb
         WHERE user_id = $1`,
        [userId, body.wallet.address, JSON.stringify([body.wallet])]
      );
    } else if (body.action === "remove_from_watchlist") {
      await pool.query(
        `UPDATE user_data 
         SET watchlist = (
           SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) FROM jsonb_array_elements(watchlist) elem
           WHERE elem->>'address' != $2
         )
         WHERE user_id = $1`,
        [userId, body.address]
      );
    } else if (body.action === "set_watchlist") {
      await pool.query(
        'UPDATE user_data SET watchlist = $2::jsonb WHERE user_id = $1',
        [userId, JSON.stringify(body.watchlist)]
      );
    }

    const result = await pool.query(
      'SELECT scans_count, watchlist FROM user_data WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      scansCount: result.rows[0]?.scans_count || 0,
      watchlist: result.rows[0]?.watchlist || [],
    });
  } catch (error) {
    console.error("POST user data error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
