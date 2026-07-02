import { getJobAnalyticsService } from "@/modules/jobs/analytics.service";
import { success, failure } from "@/utils/response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const analytics = await getJobAnalyticsService(jobId);
    return success(analytics);
  } catch (err: any) {
    return failure(err.message || "Failed to fetch analytics");
  }
}
