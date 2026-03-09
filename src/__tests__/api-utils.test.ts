import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

// Set env BEFORE importing modules that use JWT_SECRET at module level
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { requireAuth, requireProjectMember, requireProjectOwner } = require("@/lib/api-utils");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { signToken } = require("@/lib/auth");

// --- Mocks ---

jest.mock("@/lib/db/connect", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockFindById = jest.fn();
jest.mock("@/lib/db/models", () => ({
  Project: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
}));

function makeAuthRequest(payload?: { userId: string; email: string }): NextRequest {
  const headers: Record<string, string> = {};
  if (payload) {
    const token = signToken(payload);
    headers.authorization = `Bearer ${token}`;
  }
  return new NextRequest("http://localhost:3000/api/test", { headers });
}

// --- Tests ---

describe("requireAuth", () => {
  it("returns user payload for a valid token", async () => {
    const req = makeAuthRequest({ userId: "user1", email: "a@b.com" });
    const result = await requireAuth(req);
    expect(result.userId).toBe("user1");
    expect(result.email).toBe("a@b.com");
  });

  it("throws 401 when no token provided", async () => {
    const req = makeAuthRequest();
    await expect(requireAuth(req)).rejects.toThrow(AppError);
    await expect(requireAuth(req)).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("throws 401 for invalid token", async () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { authorization: "Bearer bad-token" },
    });
    await expect(requireAuth(req)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe("requireProjectMember", () => {
  afterEach(() => {
    mockFindById.mockReset();
  });

  it("returns user and project when user is the owner", async () => {
    const req = makeAuthRequest({ userId: "owner1", email: "o@b.com" });
    const mockProject = {
      _id: "proj1",
      owner: { toString: () => "owner1" },
      members: [],
    };
    mockFindById.mockResolvedValue(mockProject);

    const result = await requireProjectMember(req, "proj1");
    expect(result.user.userId).toBe("owner1");
    expect(result.project).toBe(mockProject);
  });

  it("returns user and project when user is a member", async () => {
    const req = makeAuthRequest({ userId: "member1", email: "m@b.com" });
    const mockProject = {
      _id: "proj1",
      owner: { toString: () => "owner1" },
      members: [{ toString: () => "member1" }],
    };
    mockFindById.mockResolvedValue(mockProject);

    const result = await requireProjectMember(req, "proj1");
    expect(result.user.userId).toBe("member1");
  });

  it("throws 404 when project not found", async () => {
    const req = makeAuthRequest({ userId: "user1", email: "a@b.com" });
    mockFindById.mockResolvedValue(null);

    await expect(requireProjectMember(req, "nonexistent")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });

  it("throws 403 when user is not owner or member", async () => {
    const req = makeAuthRequest({ userId: "outsider", email: "o@b.com" });
    const mockProject = {
      _id: "proj1",
      owner: { toString: () => "owner1" },
      members: [{ toString: () => "member1" }],
    };
    mockFindById.mockResolvedValue(mockProject);

    await expect(requireProjectMember(req, "proj1")).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("throws 401 when no auth token", async () => {
    const req = makeAuthRequest();
    await expect(requireProjectMember(req, "proj1")).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe("requireProjectOwner", () => {
  afterEach(() => {
    mockFindById.mockReset();
  });

  it("returns user and project when user is the owner", async () => {
    const req = makeAuthRequest({ userId: "owner1", email: "o@b.com" });
    const mockProject = {
      _id: "proj1",
      owner: { toString: () => "owner1" },
    };
    mockFindById.mockResolvedValue(mockProject);

    const result = await requireProjectOwner(req, "proj1");
    expect(result.user.userId).toBe("owner1");
    expect(result.project).toBe(mockProject);
  });

  it("throws 403 when user is a member but not owner", async () => {
    const req = makeAuthRequest({ userId: "member1", email: "m@b.com" });
    const mockProject = {
      _id: "proj1",
      owner: { toString: () => "owner1" },
    };
    mockFindById.mockResolvedValue(mockProject);

    await expect(requireProjectOwner(req, "proj1")).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("throws 404 when project not found", async () => {
    const req = makeAuthRequest({ userId: "user1", email: "a@b.com" });
    mockFindById.mockResolvedValue(null);

    await expect(requireProjectOwner(req, "nonexistent")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
