import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { HOSPITALS, isTokenForHospital } from "@/lib/hospitals/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalCodeParam = searchParams.get("hospitalCode");
    const hospitalIdParam = searchParams.get("hospitalId");

    const targetHospital = hospitalIdParam
      ? HOSPITALS.find((h) => h.id === hospitalIdParam)
      : hospitalCodeParam
      ? HOSPITALS.find((h) => h.code === hospitalCodeParam)
      : null;

    const hospitalCode = targetHospital ? targetHospital.code : hospitalCodeParam;

    const queues = await prisma.queue.findMany({
      include: {
        counters: true,
        tokens: {
          where: {
            status: "WAITING",
          },
          orderBy: [
            { priority: "desc" },
            { position: "asc" },
            { createdAt: "asc" },
          ],
        },
      },
      orderBy: { code: "asc" },
    });

    const formatted = queues.map((q) => {
      // Filter tokens strictly for this hospital if hospitalCode is specified
      const hospitalTokens = hospitalCode
        ? q.tokens.filter((t) => isTokenForHospital(t, hospitalCode))
        : q.tokens;

      // Find customized name & description for this hospital if available
      const customConfig = targetHospital?.queueConfigs.find((qc) => qc.code === q.code);

      return {
        id: q.id,
        name: customConfig ? customConfig.name : q.name,
        code: q.code,
        department: customConfig ? customConfig.department : q.department,
        description: customConfig ? customConfig.description : q.description,
        status: q.status,
        estimatedServiceTime: customConfig ? customConfig.estimatedServiceTime : q.estimatedServiceTime,
        waitingCount: hospitalTokens.length,
        activeCounters: q.counters.filter((c) => c.status !== "PAUSED" && c.status !== "CLOSED").length,
        waitingTokens: hospitalTokens.map((t) => ({
          id: t.id,
          displayNumber: t.displayNumber,
          position: t.position,
          priority: t.priority,
          visitorName: t.visitorName,
          purpose: t.purpose,
          createdAt: t.createdAt,
        })),
      };
    });

    // Sort queues logically by clinical order (TR -> ED -> OPD -> DX -> RX)
    const queueOrder: Record<string, number> = {
      TR: 1,
      ED: 2,
      OPD: 3,
      DX: 4,
      RX: 5,
    };

    formatted.sort((a, b) => (queueOrder[a.code] || 99) - (queueOrder[b.code] || 99));

    return NextResponse.json({
      success: true,
      hospital: targetHospital?.name || "All Facilities",
      hospitalCode: hospitalCode || "ALL",
      queues: formatted,
    });
  } catch (err: any) {
    console.error("Error fetching queues:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch queues" },
      { status: 500 }
    );
  }
}
