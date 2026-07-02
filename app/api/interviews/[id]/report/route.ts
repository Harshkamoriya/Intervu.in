import { getDetailedReportService } from "@/modules/report/service";
import { success, failure } from "@/utils/response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await getDetailedReportService(id);
    return success(report);
  } catch (err: any) {
    return failure(err.message || "Failed to fetch report");
  }
}
