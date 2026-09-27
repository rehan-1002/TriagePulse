import { NextRequest, NextResponse } from "next/server";
import { sendRealSms } from "@/lib/sms/fast2sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, displayNumber, position, estimatedWaitMins, queueName, customMessage } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Mobile number is required" },
        { status: 400 }
      );
    }

    const result = await sendRealSms({
      phone,
      displayNumber: displayNumber || "PT-101",
      position: position || 1,
      estimatedWaitMins: estimatedWaitMins || 10,
      queueName: queueName || "General OPD",
      customMessage,
    });

    if (!result.success && !result.smsUrl) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to dispatch SMS" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      messageId: result.messageId,
      smsUrl: result.smsUrl,
      message:
        result.provider === "fast2sms"
          ? "Real SMS dispatched successfully to your mobile phone!"
          : "SMS link generated. Tap to send directly via phone messaging app.",
    });
  } catch (error: any) {
    console.error("SMS API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
