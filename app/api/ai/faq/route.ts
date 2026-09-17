import { NextRequest, NextResponse } from "next/server";
import { answerPatientFAQ } from "@/lib/ai/rag";
import { sanitizeText } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawQuery = body.query;
    const language = body.language === "hi" ? "hi" : "en";

    const cleanQuery = sanitizeText(rawQuery);
    if (!cleanQuery) {
      return NextResponse.json(
        {
          success: false,
          error: language === "hi" ? "कृपया अपना प्रश्न दर्ज करें" : "Query is required",
        },
        { status: 400 }
      );
    }

    const faqResult = await answerPatientFAQ(cleanQuery, language);

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      language,
      ...faqResult,
    });
  } catch (err: any) {
    console.error("Patient FAQ API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process FAQ" },
      { status: 500 }
    );
  }
}
