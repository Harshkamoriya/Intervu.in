import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: `user-${crypto.randomUUID()}`,
        name: "Interview Candidate",
      }
    );

    at.addGrant({
      roomJoin: true,
      room: "mock-interview",
      canPublish: true,
      canSubscribe: true,
      // ADD THIS LINE RIGHT HERE:
      agent: true, 
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: process.env.LIVEKIT_URL,
      room: "mock-interview",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}