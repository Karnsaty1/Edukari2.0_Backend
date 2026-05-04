import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  loginWithEmail,
  loginWithGoogle,
  registerLocalUser,
  refreshAuthTokens,
  getCurrentUserDetails,
} from "./auth.service";

async function login(
  req: Request<{}, {}, { email?: string; password?: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const result = await loginWithEmail(email, password);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function googleLogin(
  req: Request<{}, {}, { credential?: string; idToken?: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { credential, idToken } = req.body;
    const token = credential || idToken;

    if (!token) {
      return res.status(400).json({
        message: "credential is required",
      });
    }

    const result = await loginWithGoogle(token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function register(
  req: Request<{}, {}, { name?: string; email?: string; password?: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email and password are required",
      });
    }

    const result = await registerLocalUser({ name, email, password });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function refresh(
  req: Request<{}, {}, { refreshToken?: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "refreshToken is required",
      });
    }

    const result = await refreshAuthTokens(refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as Request & {
      user?: { sub?: string };
    }).user;

    if (!user?.sub) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    const result = await getCurrentUserDetails(new ObjectId(user.sub));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export { login, googleLogin, register, refresh, me };
