import { describe, expect, it } from "vitest";
import { searchCourses } from "@/lib/course-catalog";

const courses = [
  { id: "1", name: "Python for Data Science", slug: "python-for-data-science", discipline: "Data Science" },
  { id: "2", name: "The Joy of Computing using Python", slug: "joy-of-computing-python", discipline: "Computer Science" },
  { id: "3", name: "Database Management Systems", slug: "database-management-systems", discipline: "Computer Science" },
];

describe("course autocomplete matching", () => {
  it("matches the full phrase without case sensitivity", () => {
    expect(searchCourses(courses, "python for data science")[0]?.id).toBe("1");
    expect(searchCourses(courses, "PYTHON FOR DATA SCIENCE")[0]?.id).toBe("1");
  });

  it("matches relevant partial terms and caps the result list", () => {
    expect(searchCourses(courses, "python data")[0]?.id).toBe("1");
    expect(searchCourses(courses, "")).toHaveLength(3);
  });
});
