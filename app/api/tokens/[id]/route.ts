import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cancelToken, getActiveCounterCount, approveEmergencyRequest } from "@/lib/queue/engine";
import { calculateEstimatedWaitTime } from "@/lib/eta/calculator";
import { getFallbackToken, cancelFallbackToken } from "@/lib/queue/fallbackStore";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let token: any = null;
    // Fast path: if token was created in fallback offline mode, retrieve instantly
    if (id.startsWith("tok_")) {
      token = getFallbackToken(id);
    }

    if (!token) {
      try {
        token = await prisma.token.findUnique({
          where: { id },
          include: {
            queue: true,
            counter: true,
            emergencyRequest: true,
          },
        });
      } catch (e: any) {
        console.warn("Prisma error in tokens/[id], checking fallback store:", e.message);
      }
    }

    if (!token) {
      token = getFallbackToken(id);
    }

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
        try {
          token = await prisma.token.findUnique({
            where: { id },
            include: {
              queue: true,
              counter: true,
              emergencyRequest: true,
            },
          });
        } catch (refreshErr) {}
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
    }

    // Dynamic ETA recalculation with offline fallback
    let activeCounters = 1;
    try {
      activeCounters = await getActiveCounterCount(token.queueId);
    } catch (e) {
      activeCounters = 1;
    }

    const estServiceTime = token.queue?.estimatedServiceTime || (token.priority === "EMERGENCY" ? 8 : 12);
    const estimatedWaitMins = calculateEstimatedWaitTime({
      position: token.position || 1,
      estimatedServiceTimeMins: estServiceTime,
      activeCounterCount: activeCounters,
      triageLevel: token.triageLevel,
      isDeteriorating: token.isDeteriorating || false,
    });

    const peopleAhead = Math.max(0, (token.position || 1) - 1);

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
    let cancelled: any = null;
    if (id.startsWith("tok_")) {
      cancelled = cancelFallbackToken(id);
    } else {
      try {
        cancelled = await cancelToken(id);
      } catch (dbErr: any) {
        console.warn("Prisma cancelToken failed, checking fallback store:", dbErr.message);
        cancelled = cancelFallbackToken(id);
      }
    }

    if (!cancelled) {
      throw new Error("Token not found");
    }

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
