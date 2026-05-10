import {
  sign,
  verify,
  type Secret,
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { ObjectId } from "mongodb";

interface TokenUserLike {
  _id: { toString(): string } | string;
  email: string;
  role?: string;
}

export interface JwtUser {
  sub: string;
  email: string;
  firstname: string;
  role: string;
  tokenType?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSec: number;
  refreshTokenExpiresInSec: number;
}

function getAccessSecret(): string | undefined {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

function getRefreshSecret(): string | undefined {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

function getEmailFirstname(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  return email.split("@")[0] || "";
}

function parseDurationToMs(duration: string): number {
  if (!duration || typeof duration !== "string") {
    return 0;
  }

  const match = duration.trim().match(/^(\d+)\s*([smhdw])$/i);

  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 0);
}

function parseDurationToSeconds(duration: string): number {
  const ms = parseDurationToMs(duration);
  return ms ? Math.floor(ms / 1000) : 0;
}

function buildTokenClaims(user: TokenUserLike) {
  const email = user.email;
  const firstname = getEmailFirstname(email);

  return {
    sub: user._id.toString(),
    email,
    firstname,
    role: user.role || "user",
  };
}

function buildTokenPair(user: TokenUserLike): TokenPair {
  const accessSecret = getAccessSecret();
  const refreshSecret = getRefreshSecret();

  if (!accessSecret) {
    throw new Error("JWT_ACCESS_SECRET or JWT_SECRET is not defined in .env");
  }

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET or JWT_SECRET is not defined in .env");
  }

  const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "2h";
  const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "2d";
  const accessTokenExpiresInSec = parseDurationToSeconds(accessTokenExpiresIn);
  const refreshTokenExpiresInSec = parseDurationToSeconds(refreshTokenExpiresIn);

  const claims = buildTokenClaims(user);
  const accessOptions: SignOptions = {
    expiresIn: accessTokenExpiresIn as SignOptions["expiresIn"],
  };
  const refreshOptions: SignOptions = {
    expiresIn: refreshTokenExpiresIn as SignOptions["expiresIn"],
  };

  const accessToken = sign(
    {
      ...claims,
      tokenType: "access",
    },
    accessSecret as Secret,
    accessOptions
  );

  const refreshToken = sign(
    {
      ...claims,
      tokenType: "refresh",
    },
    refreshSecret as Secret,
    refreshOptions
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresInSec,
    refreshTokenExpiresInSec,
  };
}

function verifyRefreshToken(token: string) {
  const refreshSecret = getRefreshSecret();

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET or JWT_SECRET is not defined in .env");
  }

  try {
    const payload = verify(token, refreshSecret as Secret) as JwtPayload & {
      tokenType?: string;
    };

    if (payload.tokenType !== "refresh") {
      const error = new Error("Invalid token type");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    return payload;
  } catch (error) {
    const authError = new Error("Invalid or expired refresh token");
    (authError as Error & { statusCode?: number }).statusCode = 401;
    throw authError;
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePassword(
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, hashedPassword);
}

export {
  buildTokenPair,
  buildTokenClaims,
  getEmailFirstname,
  parseDurationToMs,
  parseDurationToSeconds,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
};

export function createTokens(userId: ObjectId) {
  return buildTokenPair({
    _id: userId,
    email: "",
    role: "user",
  });
}
