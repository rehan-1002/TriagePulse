import { NextRequest, NextResponse } from "next/server";
import { markTokenDeteriorating } from "@/lib/queue/engine";
import { sanitizeText } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let reason = "Patient reported acute distress / clinical deterioration";
    let vitals = null;

    try {
      const body = await request.json();
      if (body.reason) {
        reason = sanitizeText(body.reason) || reason;
      }
      if (body.vitals || body.vitalSigns) {
        vitals = body.vitals || body.vitalSigns;
      }
    } catch {
      // Body is optional
    }

    const updatedToken = await markTokenDeteriorating(id, reason, vitals);

    return NextResponse.json({
      success: true,
      token: updatedToken,
      message: "Patient deterioration status logged and prioritized atomically",
    });
  } catch (err: any) {
    console.error("Error logging deterioration:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to log patient deterioration" },
      { status: 400 }
    );
  }
}
