import { describe, expect, it } from "vitest";

import { filterArchivedItems } from "@/lib/projects/archive";

describe("archive filters", () => {
  it("hides archived items by default", () => {
    const items = [
      { id: "a", archivedAt: null },
      { id: "b", archivedAt: 171 },
    ];
    expect(filterArchivedItems(items, false)).toEqual([{ id: "a", archivedAt: null }]);
  });

  it("includes archived items when enabled", () => {
    const items = [
      { id: "a", archivedAt: null },
      { id: "b", archivedAt: 171 },
    ];
    expect(filterArchivedItems(items, true)).toEqual(items);
  });
});
