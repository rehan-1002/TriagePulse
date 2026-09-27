import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { HOSPITALS, Hospital } from "@/lib/hospitals/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("id");

    if (hospitalId) {
      const match = HOSPITALS.find((h) => h.id === hospitalId) || HOSPITALS[0];
      return NextResponse.json({ success: true, hospital: match });
    }

    // Try to get live tokens and queues to compute dynamic metrics
    let tokensCount = 0;
    try {
      tokensCount = await prisma.token.count({
        where: { status: "WAITING" },
      });
    } catch (_) {}

    // Enhance hospitals with live mock/real telemetry
    const enrichedHospitals = HOSPITALS.map((h, idx) => {
      // Scale wait time slightly based on index to demonstrate variance
      const dynamicWait = Math.max(5, h.currentWaitMin + (idx === 0 ? Math.floor(tokensCount * 1.5) : 0));
      return {
        ...h,
        currentWaitMin: dynamicWait,
        activeWaitingPatients: idx === 0 ? tokensCount || 14 : Math.floor(h.currentWaitMin / 3) + 4,
        occupancyRatePercent: idx === 0 ? 88 : idx === 1 ? 64 : idx === 2 ? 45 : 32,
      };
    });

    return NextResponse.json({
      success: true,
      hospitals: enrichedHospitals,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Error fetching hospitals:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load hospitals" },
      { status: 500 }
    );
  }
}
