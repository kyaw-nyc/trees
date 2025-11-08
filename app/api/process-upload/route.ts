import { NextRequest, NextResponse } from "next/server";
import { processData } from "@/lib/data-processor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const k = parseInt(formData.get("k") as string || "5");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read file content
    const csvText = await file.text();

    // Process data
    const data = processData(csvText, k);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
