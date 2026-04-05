import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const chain_id = searchParams.get("chain_id") || "1";

    if (!address) {
      return new NextResponse("Missing address parameter", { status: 400 });
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://kryptos-backend-uq36.onrender.com";
    const backendUrl = `${API_BASE_URL}/report/${address}/pdf?chain_id=${chain_id}`;
    
    const backendHeaders: Record<string, string> = {};
    
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("authorization");
    if (authHeader) {
      backendHeaders["Authorization"] = authHeader;
    }

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: backendHeaders
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Backend PDF error (${response.status}):`, text);
      return new NextResponse(`Backend Error: ${response.statusText}`, { status: response.status });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kryptos-report-${address}.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
