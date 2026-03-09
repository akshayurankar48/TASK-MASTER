import {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  handleApiError,
} from "@/lib/errors";

describe("Error factories", () => {
  it("badRequest creates 400 error", () => {
    const err = badRequest("Invalid input");
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Invalid input");
  });

  it("unauthorized creates 401 error with default message", () => {
    const err = unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Authentication required");
  });

  it("unauthorized accepts custom message", () => {
    const err = unauthorized("Token expired");
    expect(err.message).toBe("Token expired");
  });

  it("forbidden creates 403 error", () => {
    const err = forbidden("Not allowed");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("notFound creates 404 error with resource name", () => {
    const err = notFound("Project");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Project not found");
  });

  it("conflict creates 409 error", () => {
    const err = conflict("Already exists");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});

describe("handleApiError", () => {
  function parseResponse(response: Response) {
    return response.json();
  }

  it("handles AppError correctly", async () => {
    const error = unauthorized("Bad token");
    const response = handleApiError(error);
    expect(response.status).toBe(401);
    const body = await parseResponse(response);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("Bad token");
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("handles unknown errors as 500", async () => {
    const error = new Error("Something went wrong");
    const response = handleApiError(error);
    expect(response.status).toBe(500);
    const body = await parseResponse(response);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("handles MongoDB duplicate key error as 409", async () => {
    const error = new Error("duplicate key") as Error & { code: number };
    error.code = 11000;
    const response = handleApiError(error);
    expect(response.status).toBe(409);
    const body = await parseResponse(response);
    expect(body.error.code).toBe("CONFLICT");
  });
});
