import { MongoClient, type Collection, type Db, type Document } from "mongodb";
import {
  CourseCollection,
} from "../contracts/Course/Dtos/course";
import {
  CourseProgressCollection,
} from "../contracts/Progress/Dtos/progress";
import {
  CourseQuizCollection,
} from "../contracts/CourseQuiz/Dtos/quiz";
import { BookCollection } from "../contracts/Book/Dtos/book";
import {
  LiveAttendanceCollection,
  LiveMessageCollection,
  LiveParticipantCollection,
  LiveReactionCollection,
  LiveRoomCollection,
  LiveSessionCollection,
} from "../contracts/Live/Dtos/live";

let client: MongoClient | undefined;
let database: Db | undefined;

function safeEncodeComponent(value: string): string {
  if (value == null || value === "") {
    return "";
  }

  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch (error) {
    return encodeURIComponent(value);
  }
}

function maskSecret(value: string): string {
  if (!value) {
    return "";
  }

  const trimmed = String(value).trim();

  if (trimmed.length <= 4) {
    return "*".repeat(trimmed.length);
  }

  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
}

function buildFromTemplate(uri: string): string {
  const password = process.env.MONGODB_PASSWORD;
  const username = process.env.MONGODB_USER;

  let output = uri;

  if (output.includes("<db_password>")) {
    if (!password) {
      throw new Error(
        "MONGODB_PASSWORD is required when MONGODB_URI uses <db_password>"
      );
    }

    output = output.replace("<db_password>", safeEncodeComponent(password));
  }

  if (output.includes("<db_username>")) {
    if (!username) {
      throw new Error(
        "MONGODB_USER is required when MONGODB_URI uses <db_username>"
      );
    }

    output = output.replace("<db_username>", safeEncodeComponent(username));
  }

  return output;
}

function ensureAuthSourceAdmin(uri: string): string {
  const hasAuthSource = /[?&]authSource=/i.test(uri);

  if (hasAuthSource) {
    return uri;
  }

  return uri.includes("?") ? `${uri}&authSource=admin` : `${uri}?authSource=admin`;
}

function buildMaskedMongoSummary() {
  const username = process.env.MONGODB_USER || "";
  const password = process.env.MONGODB_PASSWORD || "";
  const host = process.env.MONGODB_HOST || "";
  const database = process.env.MONGODB_DATABASE || "";

  return {
    username: maskSecret(username),
    passwordLength: password ? String(password).length : 0,
    host,
    database,
    authSource: "admin",
  };
}

function buildMaskedMongoUri(uri: string): string {
  if (!uri) {
    return "";
  }

  return uri
    .replace(/\/\/([^:@/]+):([^@/]+)@/g, (match, user, pass) => {
      return `//${maskSecret(user)}:${"*".repeat(Math.max(8, pass.length))}@`;
    })
    .replace(/<db_password>/g, "********")
    .replace(/<db_username>/g, "********");
}

function buildMongoUri(): string {
  const username = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const database = process.env.MONGODB_DATABASE || "";
  const options = process.env.MONGODB_OPTIONS || "";

  if (username && password && host) {
    const encodedUser = safeEncodeComponent(username);
    const encodedPassword = safeEncodeComponent(password);
    const dbPath = database ? `/${database}` : "/";
    const queryString = options ? `?${options}` : "";

    return ensureAuthSourceAdmin(
      `mongodb+srv://${encodedUser}:${encodedPassword}@${host}${dbPath}${queryString}`
    );
  }

  const uri = process.env.MONGODB_URI;

  if (uri) {
    return ensureAuthSourceAdmin(buildFromTemplate(uri));
  }

  throw new Error(
    "Set MONGODB_USER, MONGODB_PASSWORD, and MONGODB_HOST in .env, or provide MONGODB_URI"
  );
}

function buildDatabaseName(uri: string): string {
  return process.env.MONGODB_DATABASE || extractDatabaseName(uri) || "edukari";
}

function extractDatabaseName(uri: string): string {
  if (!uri || typeof uri !== "string") {
    return "";
  }

  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/i);
  if (!match || !match[1]) {
    return "";
  }

  const candidate = match[1].replace(/^\/+/, "");
  return candidate;
}

async function connectDB(): Promise<void> {
  const uri = buildMongoUri();
  const summary = buildMaskedMongoSummary();
  const maskedUri = buildMaskedMongoUri(uri);

  console.log("MongoDB config:", summary);
  if (maskedUri) {
    console.log("MongoDB URI:", maskedUri);
  }

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  const dbName = buildDatabaseName(uri);
  database = client.db(dbName);

  await database.collection("users").createIndex({ email: 1 }, { unique: true });
  await database.collection(CourseCollection).createIndex({ slug: 1 }, { unique: true });
  await database.collection(BookCollection).createIndex({ slug: 1 }, { unique: true });
  await database.collection(CourseQuizCollection).createIndex({ courseSlug: 1 }, { unique: true });
  await database.collection(CourseQuizCollection).createIndex({ courseId: 1 }, { unique: true });
  await database
    .collection(CourseProgressCollection)
    .createIndex({ userId: 1, courseId: 1 }, { unique: true });
  await database.collection(LiveRoomCollection).createIndex({ slug: 1 }, { unique: true });
  await database.collection(LiveRoomCollection).createIndex({ status: 1 });
  await database.collection(LiveRoomCollection).createIndex({ hostUserId: 1 });
  await database.collection(LiveSessionCollection).createIndex({ roomId: 1, createdAt: -1 });
  await database.collection(LiveParticipantCollection).createIndex({ roomId: 1, userId: 1 }, { unique: true });
  await database.collection(LiveParticipantCollection).createIndex({ roomId: 1, isActive: 1 });
  await database.collection(LiveMessageCollection).createIndex({ roomId: 1, createdAt: -1 });
  await database.collection(LiveAttendanceCollection).createIndex({ roomId: 1, userId: 1 }, { unique: true });
  await database.collection(LiveAttendanceCollection).createIndex({ roomId: 1, lastHeartbeatAt: -1 });
  await database.collection(LiveReactionCollection).createIndex({ roomId: 1, createdAt: -1 });

  console.log(`MongoDB connected to database "${dbName}"`);
}

function getDb(): Db {
  if (!database) {
    throw new Error("Database is not connected yet");
  }

  return database;
}

function getCollection<TSchema extends Document = Document>(
  name: string
): Collection<TSchema> {
  return getDb().collection<TSchema>(name);
}

async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}

export {
  connectDB,
  closeDB,
  getDb,
  getCollection,
  buildMongoUri,
  buildDatabaseName,
  extractDatabaseName,
  buildMaskedMongoSummary,
  buildMaskedMongoUri,
};
