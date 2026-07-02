import { getNextRoundId, startRound } from "@/modules/rounds/execution.service";


export async function POST(
  _: Request,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const { session_id: sessionId } = await params;
  
  // derivation logic
  const nextRoundId = await getNextRoundId(sessionId);

  if (!nextRoundId) {
    return Response.json({ success: false, message: "No more rounds to start" }, { status: 400 });
  }

  const roundSession = await startRound(
    sessionId,
    nextRoundId
  );

  return Response.json({ success: true, roundSession });
}
