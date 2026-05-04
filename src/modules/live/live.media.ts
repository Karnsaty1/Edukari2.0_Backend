import { AccessToken } from "livekit-server-sdk";
import type { LiveParticipantRole } from "../../contracts/Live/Dtos/live";

function getLiveKitApiKey(): string {
  return process.env.LIVEKIT_API_KEY || "";
}

function getLiveKitApiSecret(): string {
  return process.env.LIVEKIT_API_SECRET || "";
}

function getLiveKitUrl(): string {
  return process.env.LIVEKIT_WS_URL || process.env.LIVEKIT_URL || "";
}

function isLiveKitConfigured(): boolean {
  return Boolean(getLiveKitApiKey() && getLiveKitApiSecret() && getLiveKitUrl());
}

async function buildLiveKitToken(options: {
  roomName: string;
  userId: string;
  displayName: string;
  role: LiveParticipantRole;
}): Promise<string | null> {
  if (!isLiveKitConfigured()) {
    return null;
  }

  const token = new AccessToken(getLiveKitApiKey(), getLiveKitApiSecret(), {
    identity: options.userId,
    name: options.displayName,
  });

  token.addGrant({
    roomJoin: true,
    room: options.roomName,
    canSubscribe: true,
    canPublish: options.role === "host" || options.role === "teacher" || options.role === "moderator",
    canPublishData: true,
    roomAdmin: options.role === "host" || options.role === "teacher",
  });

  return await token.toJwt();
}

export {
  buildLiveKitToken,
  getLiveKitUrl,
  isLiveKitConfigured,
};
