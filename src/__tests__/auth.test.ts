import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// Set env BEFORE importing auth module (JWT_SECRET is captured at module level)
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { signToken, verifyToken, getTokenFromRequest, getAuthUser } = require("@/lib/auth");

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/test", {
    headers,
  });
  return req;
}

describe("signToken", () => {
  it("returns a valid JWT string", () => {
    const token = signToken({ userId: "abc123", email: "test@test.com" });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("encodes the correct payload", () => {
    const payload = { userId: "user1", email: "a@b.com" };
    const token = signToken(payload);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as Record<string, unknown>;
    expect(decoded.userId).toBe("user1");
    expect(decoded.email).toBe("a@b.com");
  });
});

describe("verifyToken", () => {
  it("returns the decoded payload for a valid token", () => {
    const token = signToken({ userId: "u1", email: "u@e.com" });
    const result = verifyToken(token);
    expect(result.userId).toBe("u1");
    expect(result.email).toBe("u@e.com");
  });

  it("throws for an expired token", () => {
    const token = jwt.sign(
      { userId: "u1", email: "u@e.com" },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" }
    );
    expect(() => verifyToken(token)).toThrow();
  });

  it("throws for a token signed with wrong secret", () => {
    const token = jwt.sign({ userId: "u1", email: "u@e.com" }, "wrong-secret");
    expect(() => verifyToken(token)).toThrow();
  });

  it("throws for a malformed token", () => {
    expect(() => verifyToken("not.a.token")).toThrow();
  });
});

describe("getTokenFromRequest", () => {
  it("extracts token from Bearer authorization header", () => {
    const req = makeRequest({ authorization: "Bearer mytoken123" });
    expect(getTokenFromRequest(req)).toBe("mytoken123");
  });

  it("returns null when no authorization header", () => {
    const req = makeRequest();
    expect(getTokenFromRequest(req)).toBeNull();
  });

  it("returns null for non-Bearer auth scheme", () => {
    const req = makeRequest({ authorization: "Basic abc123" });
    expect(getTokenFromRequest(req)).toBeNull();
  });

  it("returns null for empty Bearer value", () => {
    const req = makeRequest({ authorization: "Bearer " });
    // "Bearer " substring(7) = "" — empty string, treated as null by the implementation
    expect(getTokenFromRequest(req)).toBeNull();
  });
});

describe("getAuthUser", () => {
  it("returns the decoded user for a valid token", () => {
    const token = signToken({ userId: "u1", email: "test@test.com" });
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const result = getAuthUser(req);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("u1");
    expect(result!.email).toBe("test@test.com");
  });

  it("returns null when no token present", () => {
    const req = makeRequest();
    expect(getAuthUser(req)).toBeNull();
  });

  it("returns null for an invalid token", () => {
    const req = makeRequest({ authorization: "Bearer invalid-token" });
    expect(getAuthUser(req)).toBeNull();
  });

  it("returns null for an expired token", () => {
    const token = jwt.sign(
      { userId: "u1", email: "u@e.com" },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" }
    );
    const req = makeRequest({ authorization: `Bearer ${token}` });
    expect(getAuthUser(req)).toBeNull();
  });
});
