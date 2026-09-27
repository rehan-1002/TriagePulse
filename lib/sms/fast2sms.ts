/**
 * Fast2SMS Gateway Integration for Indian Mobile Numbers
 * Provides real-time transactional SMS dispatch for non-smartphone / basic phone patients.
 */

export interface SendSmsParams {
  phone: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: "fast2sms" | "native_fallback" | "simulated";
  error?: string;
  smsUrl?: string; // sms: protocol deep link for native fallback
}

export async function sendRealSms(params: {
  phone: string;
  displayNumber: string;
  position: number;
  estimatedWaitMins: number;
  queueName: string;
  customMessage?: string;
}): Promise<SmsResult> {
  const { phone, displayNumber, position, estimatedWaitMins, queueName, customMessage } = params;

  // Clean phone number (strip +91, spaces, dashes)
  const cleanedPhone = phone.replace(/\D/g, "").slice(-10);

  if (cleanedPhone.length !== 10) {
    return {
      success: false,
      provider: "fast2sms",
      error: "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  const messageText =
    customMessage ||
    `TriagePulse OPD: Token #${displayNumber} is confirmed for ${queueName}. Position: #${position}. Est. Wait: ~${estimatedWaitMins}m. Please be near cabin when called.`;

  const smsUrl = `sms:${cleanedPhone}?body=${encodeURIComponent(messageText)}`;

  const apiKey = process.env.FAST2SMS_API_KEY?.trim();

  // If no API key configured, return native fallback with deep link
  if (!apiKey || apiKey === "your_fast2sms_api_key_here") {
    console.warn("Fast2SMS API Key not configured. Returning deep link fallback.");
    return {
      success: true,
      provider: "native_fallback",
      messageId: `sim_${Date.now()}`,
      smsUrl,
    };
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: messageText,
        language: "english",
        flash: 0,
        numbers: cleanedPhone,
      }),
    });

    const data = await res.json();

    if (data.return === true || data.status_code === 200 || data.message?.[0]?.includes("Success")) {
      return {
        success: true,
        provider: "fast2sms",
        messageId: data.request_id || `f2s_${Date.now()}`,
      };
    }

    // Fast2SMS returned an error (e.g. low balance or unverified DLT)
    console.warn("Fast2SMS gateway response:", data);
    return {
      success: false,
      provider: "fast2sms",
      error: data.message?.[0] || data.message || "Fast2SMS gateway returned error.",
      smsUrl,
    };
  } catch (err: any) {
    console.error("Fast2SMS dispatch error:", err);
    return {
      success: false,
      provider: "fast2sms",
      error: err.message || "Network error reaching SMS gateway.",
      smsUrl,
    };
  }
}
