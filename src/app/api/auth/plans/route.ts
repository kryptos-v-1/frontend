import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://kryptos-backend-uq36.onrender.com";
    
    const response = await fetch(`${API_BASE_URL}/auth/plans`, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch plans", { status: response.status });
    }

    const plans = await response.json();
    return NextResponse.json(plans, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
