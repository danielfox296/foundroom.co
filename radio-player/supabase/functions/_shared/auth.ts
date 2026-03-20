import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

export interface AuthPayload {
  userId: string;
  username: string;
}

export async function getJwtKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(Deno.env.get("JWT_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function verifyToken(
  req: Request,
): Promise<AuthPayload | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const key = await getJwtKey();
    const payload = await verify(token, key);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}
