import { OAuth2Client } from "google-auth-library";
import type { ObjectId } from "mongodb";
import { getCollection } from "../../config/db";
import {
  UserDetailCollection,
  buildUserDetail,
} from "../../contracts/User/Dtos/detail";
import {
  buildTokenPair,
  hashPassword,
  comparePassword,
  verifyRefreshToken,
  getEmailFirstname,
} from "./auth.utils";

interface UserDocument {
  _id?: ObjectId;
  name?: string;
  firstname?: string;
  lastname?: string;
  email: string;
  password?: string;
  authProvider?: "local" | "google";
  googleId?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserRecord = UserDocument & { _id: ObjectId };

interface UserDetailDocument {
  _id?: ObjectId;
  userId: ObjectId;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google";
  createdAt?: Date;
  updatedAt?: Date;
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function loginWithEmail(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = getCollection<UserDocument>("users");
  const user = await users.findOne(
    { email: normalizedEmail },
    {
      projection: {
        password: 1,
        email: 1,
        authProvider: 1,
        name: 1,
        firstname: 1,
        lastname: 1,
        role: 1,
      },
    }
  );

  if (!user || user.authProvider !== "local") {
    const error = new Error("Invalid email or password");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }

  const isMatch = await comparePassword(password, user.password || "");

  if (!isMatch) {
    const error = new Error("Invalid email or password");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }

  return buildAuthResponse(user as UserRecord);
}

async function loginWithGoogle(token: string) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not defined in .env");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email) {
    const error = new Error("Google token did not contain an email address");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const users = getCollection<UserDocument>("users");
  const normalizedEmail = normalizeEmail(payload.email);
  let user = await users.findOne({ email: normalizedEmail });
  const firstName = payload.given_name || getEmailFirstname(normalizedEmail);

  if (!user) {
    const insertResult = await users.insertOne({
      name: payload.name || firstName || "Google User",
      firstname: firstName,
      email: normalizedEmail,
      authProvider: "google",
      googleId: payload.sub,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Omit<UserDocument, "_id">);

    user = (await users.findOne({
      _id: insertResult.insertedId,
    })) as UserRecord | null;
  } else {
    const update: Partial<UserDocument> = {
      authProvider: user.authProvider || "google",
      googleId: user.googleId || payload.sub,
      updatedAt: new Date(),
    };

    if (!user.name && payload.name) {
      update.name = payload.name;
    }

    if (!user.firstname) {
      update.firstname = firstName;
    }

    await users.updateOne({ _id: user._id }, { $set: update });
    user = (await users.findOne({ _id: user._id })) as UserRecord | null;
  }

  if (!user) {
    const error = new Error("Unable to load Google user");
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  await upsertUserDetail({
    ...user,
    firstname: user.firstname || firstName,
    lastname: user.lastname || "",
  });

  return buildAuthResponse(user as UserRecord);
}

async function registerLocalUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const users = getCollection<UserDocument>("users");
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await users.findOne({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error("User already exists");
    (error as Error & { statusCode?: number }).statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);
  const firstname = normalizeFirstname(name || getEmailFirstname(normalizedEmail));
  const userDocument: Omit<UserDocument, "_id"> = {
    name,
    firstname,
    email: normalizedEmail,
    password: hashedPassword,
    authProvider: "local",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const insertResult = await users.insertOne(userDocument);
  const user = await users.findOne({ _id: insertResult.insertedId });

  if (!user) {
    const error = new Error("Unable to load newly created user");
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  await upsertUserDetail({
    ...user,
    firstname,
    lastname: "",
  });

  return buildAuthResponse(user as UserRecord);
}

async function refreshAuthTokens(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken) as { email: string };

  const users = getCollection<UserDocument>("users");
  const user = await users.findOne({ email: normalizeEmail(payload.email) });

  if (!user) {
    const error = new Error("User not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return buildAuthResponse(user as UserRecord);
}

async function getCurrentUserDetails(userId: ObjectId) {
  const details = getCollection<UserDetailDocument>("userDetails");
  const detail = await details.findOne({ userId });

  if (!detail) {
    const error = new Error("User details not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return {
    id: detail._id?.toString() || null,
    userId: detail.userId,
    firstname: detail.firstname,
    lastname: detail.lastname,
    email: detail.email,
    phone: detail.phone || "",
    avatarUrl: detail.avatarUrl || "",
    authProvider: detail.authProvider || "local",
    createdAt: detail.createdAt || null,
    updatedAt: detail.updatedAt || null,
  };
}

async function upsertUserDetail(user: UserRecord) {
  const details = getCollection(UserDetailCollection);
  const now = new Date();
  const detailDocument = buildUserDetail({
    userId: user._id,
    firstname: normalizeFirstname(user.firstname || getEmailFirstname(user.email)),
    lastname: normalizeFirstname(user.lastname || ""),
    email: normalizeEmail(user.email),
    authProvider: user.authProvider || "local",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
    createdAt: user.createdAt || now,
    updatedAt: now,
  });

  await details.updateOne(
    { userId: user._id },
    {
      $set: detailDocument,
    },
    { upsert: true }
  );
}

function buildAuthResponse(user: UserRecord) {
  const tokens = buildTokenPair(user);

  return {
    ...tokens,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiresInSec: tokens.accessTokenExpiresInSec,
    expires_in: tokens.accessTokenExpiresInSec,
    refresh_expires_in: tokens.refreshTokenExpiresInSec,
  };
}

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function normalizeFirstname(firstname: string) {
  return String(firstname || "").trim();
}

export {
  loginWithEmail,
  loginWithGoogle,
  registerLocalUser,
  refreshAuthTokens,
  getCurrentUserDetails,
};
