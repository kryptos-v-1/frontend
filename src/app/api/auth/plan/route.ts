import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const PLAN_LIMITS: Record<string, any> = {
  free: {
    plan: "free",
    daily_scans_used: 0,
    daily_scans_limit: 5,
    features: {
      daily_scans: 5,
      chains: 1,
      pdf_reports: false,
      api_access: false,
      watchlist_limit: 0,
      batch_size: 0,
      csv_export: false,
      fund_flow: false,
      contract_audit: false,
      on_chain_reports: false,
    },
  },
  pro: {
    plan: "pro",
    daily_scans_used: 0,
    daily_scans_limit: -1,
    features: {
      daily_scans: -1,
      chains: 14,
      pdf_reports: true,
      api_access: false,
      watchlist_limit: 20,
      batch_size: 10,
      csv_export: true,
      fund_flow: true,
      contract_audit: true,
      on_chain_reports: true,
    },
  },
  enterprise: {
    plan: "enterprise",
    daily_scans_used: 0,
    daily_scans_limit: -1,
    features: {
      daily_scans: -1,
      chains: 14,
      pdf_reports: true,
      api_access: true,
      watchlist_limit: -1,
      batch_size: 50,
      csv_export: true,
      fund_flow: true,
      contract_audit: true,
      on_chain_reports: true,
    },
  },
};

export async function GET(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user) {
      return NextResponse.json(PLAN_LIMITS.free);
    }

    // Get plan from PostgreSQL
    try {
      const result = await pool.query(
        'SELECT plan FROM "user" WHERE email = $1',
        [session.user.email]
      );
      
      if (result.rows[0]?.plan && PLAN_LIMITS[result.rows[0].plan]) {
        return NextResponse.json(PLAN_LIMITS[result.rows[0].plan]);
      }
    } catch (dbError) {
      console.error("Database fetch error:", dbError);
    }

    return NextResponse.json(PLAN_LIMITS.free);
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json(PLAN_LIMITS.free);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLAN_LIMITS[plan]) {
      return new NextResponse("Invalid plan", { status: 400 });
    }

    // Update plan in PostgreSQL
    await pool.query(
      'UPDATE "user" SET plan = $1 WHERE email = $2',
      [plan, session.user.email]
    );

    return NextResponse.json(PLAN_LIMITS[plan]);
  } catch (error) {
    console.error("Error updating plan:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
