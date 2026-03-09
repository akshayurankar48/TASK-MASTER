import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { ZodError, ZodIssue } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string, details?: unknown[]) {
  return new AppError(400, "BAD_REQUEST", message, details);
}

export function unauthorized(message = "Authentication required") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Access denied") {
  return new AppError(403, "FORBIDDEN", message);
}

export function notFound(resource = "Resource") {
  return new AppError(404, "NOT_FOUND", `${resource} not found`);
}

export function conflict(message: string) {
  return new AppError(409, "CONFLICT", message);
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: (error as ZodError & { errors: ZodIssue[] }).errors.map((e: ZodIssue) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      },
      { status: 422 }
    );
  }

  // Known application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Mongoose duplicate key error
  if (
    error instanceof Error &&
    "code" in error &&
    (error as { code: number }).code === 11000
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Duplicate value. This resource already exists.",
          code: "CONFLICT",
        },
      },
      { status: 409 }
    );
  }

  // Unknown errors
  console.error("Unhandled error:", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    },
    { status: 500 }
  );
}
