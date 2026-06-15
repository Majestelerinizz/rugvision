import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

type TokenPayload = {
  sub: string;
  role: string;
  merchantId?: string;
  type: "access" | "refresh";
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET tanimli degil.");
  }
  return encoder.encode(secret);
}

function getExpiryByType(type: TokenPayload["type"]) {
  return type === "access" ? "15m" : "7d";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload) {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(getExpiryByType(payload.type))
    .sign(secret);
}

export async function verifyToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as TokenPayload;
}
