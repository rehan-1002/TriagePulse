import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cancelToken, getActiveCounterCount, approveEmergencyRequest } from "@/lib/queue/engine";
import { calculateEstimatedWaitTime } from "@/lib/eta/calculator";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let token = await prisma.token.findUnique({
      where: { id },
      include: {
        queue: true,
        counter: true,
        emergencyRequest: true,
      },
    });

    if (!token) {
      return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
    }

    // 60-Second Fail-Safe Check: If emergency request was unattended for >60s, auto-promote!
    if (
      token.emergencyRequest &&
      token.emergencyRequest.status === "PENDING" &&
      token.status === "WAITING"
    ) {
      const elapsed = Date.now() - new Date(token.emergencyRequest.requestedAt).getTime();
      if (elapsed >= 60000) {
        console.log(`[PASSIVE FAIL-SAFE] Token ${token.displayNumber} emergency unattended for ${Math.round(elapsed / 1000)}s. Auto-promoting.`);
        await approveEmergencyRequest(
          token.emergencyRequest.id,
          "SYSTEM_FAILSAFE_TIMEOUT",
          "Auto-promoted to #1: Triage desk unattended for >60s."
        );
        // Refresh token state after promotion
        token = await prisma.token.findUnique({
          where: { id },
          include: {
            queue: true,
            counter: true,
            emergencyRequest: true,
          },
        });
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
    }

    // Dynamic ETA recalculation
    const activeCounters = await getActiveCounterCount(token.queueId);
    const estimatedWaitMins = calculateEstimatedWaitTime({
      position: token.position,
      estimatedServiceTimeMins: token.queue.estimatedServiceTime,
      activeCounterCount: activeCounters,
      triageLevel: token.triageLevel,
      isDeteriorating: token.isDeteriorating,
    });

    const peopleAhead = Math.max(0, token.position - 1);

    return NextResponse.json({
      success: true,
      token,
      estimatedWaitMins,
      peopleAhead,
    });
  } catch (err: any) {
    console.error("Error fetching token:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch token" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cancelled = await cancelToken(id);

    return NextResponse.json({
      success: true,
      token: cancelled,
      message: "Token cancelled successfully",
    });
  } catch (err: any) {
    console.error("Error cancelling token:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to cancel token" },
      { status: 400 }
    );
  }
}
