import { taskQuerySchema } from "@/lib/validations/task";
import { commentQuerySchema } from "@/lib/validations/comment";

describe("Task Pagination (taskQuerySchema)", () => {
  it("uses default limit of 20 when not provided", () => {
    const result = taskQuerySchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.cursor).toBeUndefined();
    expect(result.status).toBeUndefined();
    expect(result.assignee).toBeUndefined();
  });

  it("accepts a valid limit", () => {
    const result = taskQuerySchema.parse({ limit: "50" });
    expect(result.limit).toBe(50);
  });

  it("coerces string limit to number", () => {
    const result = taskQuerySchema.parse({ limit: "10" });
    expect(result.limit).toBe(10);
    expect(typeof result.limit).toBe("number");
  });

  it("rejects limit below 1", () => {
    expect(() => taskQuerySchema.parse({ limit: "0" })).toThrow();
  });

  it("rejects limit above 100", () => {
    expect(() => taskQuerySchema.parse({ limit: "101" })).toThrow();
  });

  it("accepts a cursor string", () => {
    const cursor = "2024-01-15T10:00:00.000Z";
    const result = taskQuerySchema.parse({ cursor });
    expect(result.cursor).toBe(cursor);
  });

  it("accepts valid status filter", () => {
    const result = taskQuerySchema.parse({ status: "todo" });
    expect(result.status).toBe("todo");
  });

  it("accepts all valid status values", () => {
    for (const status of ["todo", "in_progress", "in_review", "done"]) {
      const result = taskQuerySchema.parse({ status });
      expect(result.status).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    expect(() => taskQuerySchema.parse({ status: "invalid" })).toThrow();
  });

  it("accepts assignee filter", () => {
    const result = taskQuerySchema.parse({ assignee: "user123" });
    expect(result.assignee).toBe("user123");
  });

  it("accepts all parameters together", () => {
    const result = taskQuerySchema.parse({
      status: "in_progress",
      assignee: "user1",
      cursor: "2024-01-01T00:00:00.000Z",
      limit: "25",
    });
    expect(result.status).toBe("in_progress");
    expect(result.assignee).toBe("user1");
    expect(result.cursor).toBe("2024-01-01T00:00:00.000Z");
    expect(result.limit).toBe(25);
  });
});

describe("Comment Pagination (commentQuerySchema)", () => {
  it("uses default limit of 20 when not provided", () => {
    const result = commentQuerySchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.cursor).toBeUndefined();
  });

  it("accepts a valid limit", () => {
    const result = commentQuerySchema.parse({ limit: "30" });
    expect(result.limit).toBe(30);
  });

  it("coerces string limit to number", () => {
    const result = commentQuerySchema.parse({ limit: "5" });
    expect(typeof result.limit).toBe("number");
  });

  it("rejects limit below 1", () => {
    expect(() => commentQuerySchema.parse({ limit: "0" })).toThrow();
  });

  it("rejects limit above 100", () => {
    expect(() => commentQuerySchema.parse({ limit: "200" })).toThrow();
  });

  it("accepts a cursor string", () => {
    const cursor = "2024-06-15T12:30:00.000Z";
    const result = commentQuerySchema.parse({ cursor });
    expect(result.cursor).toBe(cursor);
  });
});

describe("Cursor-based pagination logic", () => {
  // Unit tests for the pagination algorithm used in task/comment routes
  // This tests the pure logic extracted from the route handlers

  function paginateItems<T extends { createdAt: Date }>(
    items: T[],
    limit: number,
    cursor?: string,
    direction: "desc" | "asc" = "desc"
  ) {
    let filtered = [...items];

    // Apply cursor filter
    if (cursor) {
      const cursorDate = new Date(cursor);
      filtered = filtered.filter((item) =>
        direction === "desc"
          ? item.createdAt < cursorDate
          : item.createdAt > cursorDate
      );
    }

    // Sort
    filtered.sort((a, b) =>
      direction === "desc"
        ? b.createdAt.getTime() - a.createdAt.getTime()
        : a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Apply limit + 1 trick
    const fetched = filtered.slice(0, limit + 1);
    const hasMore = fetched.length > limit;
    const data = hasMore ? fetched.slice(0, limit) : fetched;
    const nextCursor = hasMore
      ? data[data.length - 1].createdAt.toISOString()
      : null;

    return { data, pagination: { nextCursor, hasMore } };
  }

  // Create 50 items with 1-hour intervals to avoid month overflow
  const items = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    createdAt: new Date(Date.UTC(2024, 0, 1, i, 0, 0)),
  }));

  it("returns first page with correct limit", () => {
    const result = paginateItems(items, 10);
    expect(result.data).toHaveLength(10);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).not.toBeNull();
  });

  it("first page contains the most recent items (desc)", () => {
    const result = paginateItems(items, 5);
    // Items are sorted desc so first item should have highest date
    expect(result.data[0].id).toBe(49); // Jan 50
    expect(result.data[4].id).toBe(45); // Jan 46
  });

  it("second page starts after the cursor", () => {
    const page1 = paginateItems(items, 5);
    const page2 = paginateItems(items, 5, page1.pagination.nextCursor!);
    expect(page2.data).toHaveLength(5);
    // Second page should contain the next 5 items
    expect(page2.data[0].id).toBe(44);
    expect(page2.data[4].id).toBe(40);
  });

  it("last page has hasMore = false", () => {
    // Get the last few items
    const result = paginateItems(items, 50);
    expect(result.data).toHaveLength(50);
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });

  it("returns empty when cursor is before all items", () => {
    const result = paginateItems(items, 10, "2023-01-01T00:00:00Z");
    expect(result.data).toHaveLength(0);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("ascending pagination works for comments", () => {
    const result = paginateItems(items, 5, undefined, "asc");
    expect(result.data[0].id).toBe(0); // Jan 1 (oldest first)
    expect(result.data[4].id).toBe(4); // Jan 5
    expect(result.pagination.hasMore).toBe(true);
  });

  it("ascending pagination respects cursor", () => {
    const page1 = paginateItems(items, 5, undefined, "asc");
    const page2 = paginateItems(items, 5, page1.pagination.nextCursor!, "asc");
    expect(page2.data[0].id).toBe(5); // Jan 6
    expect(page2.data[4].id).toBe(9); // Jan 10
  });

  it("handles limit of 1", () => {
    const result = paginateItems(items, 1);
    expect(result.data).toHaveLength(1);
    expect(result.pagination.hasMore).toBe(true);
  });

  it("handles empty data set", () => {
    const result = paginateItems([], 10);
    expect(result.data).toHaveLength(0);
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });
});
