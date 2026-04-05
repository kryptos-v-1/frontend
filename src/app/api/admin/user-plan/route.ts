import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const ADMIN_KEY = process.env.ADMIN_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { email, plan } = await req.json();

    if (!email || !plan) {
      return NextResponse.json({ error: "Missing email or plan" }, { status: 400 });
    }

    // Verify admin key
    const authHeader = req.headers.get("X-Admin-Key");
    if (authHeader !== ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user in MongoDB
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection("user");

    const result = await usersCollection.updateOne(
      { email },
      {
        $set: {
          plan,
          updatedAt: new Date(),
        },
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} plan updated to ${plan}`,
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
