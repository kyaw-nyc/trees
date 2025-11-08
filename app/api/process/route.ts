import { NextRequest, NextResponse } from "next/server";
import { processData } from "@/lib/data-processor";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const k = parseInt(searchParams.get("k") || "5");
    const weightsParam = searchParams.get("weights");
    const weights = weightsParam ? JSON.parse(weightsParam) : undefined;

    // Read CSV file
    const csvPath = join(process.cwd(), "public", "mealup_mock_profiles.csv");
    const csvText = await readFile(csvPath, "utf-8");

    // Process data
    const data = processData(csvText, k, weights);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing data:", error);
    return NextResponse.json(
      { error: "Failed to process data" },
      { status: 500 }
    );
  }
}
