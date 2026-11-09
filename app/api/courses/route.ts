import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { approvedCourseCatalog, searchCourses } from "@/lib/course-catalog";
const requestSchema = z.object({ name: z.string().trim().min(3).max(120), discipline: z.string().trim().min(2).max(80), institute: z.string().trim().max(120).optional() });
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  try {
    const courses = await approvedCourseCatalog();
    return NextResponse.json(searchCourses(courses, q), { headers: { "Cache-Control": "private, max-age=10" } });
  } catch {
    return NextResponse.json({ error: "Course search is temporarily unavailable. Check the database connection." }, { status: 503 });
  }
}
export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the course name and discipline." }, { status: 400 });
  const course = await db.course.create({ data: { ...parsed.data, slug: `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, status: "PENDING" } });
  return NextResponse.json({ message: "Course request sent for review.", id: course.id }, { status: 201 });
}
