import type { ObjectId } from "mongodb";

export interface UserDetail {
  id?: string | null;
  userId?: ObjectId | null;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google";
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface CreateUserDetailInput {
  userId?: ObjectId | null;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google";
}

export const UserDetailCollection = "userDetails" as const;

export const UserDetailFields = {
  id: "id",
  userId: "userId",
  firstname: "firstname",
  lastname: "lastname",
  email: "email",
  phone: "phone",
  avatarUrl: "avatarUrl",
  authProvider: "authProvider",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export function buildUserDetail(
  input: CreateUserDetailInput & {
    id?: string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  } = {}
): UserDetail {
  return {
    id: input.id || null,
    userId: input.userId || null,
    firstname: input.firstname || "",
    lastname: input.lastname || "",
    email: input.email || "",
    phone: input.phone || "",
    avatarUrl: input.avatarUrl || "",
    authProvider: input.authProvider || "local",
    createdAt: input.createdAt || null,
    updatedAt: input.updatedAt || null,
  };
}
