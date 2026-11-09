import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { invalidateApprovedCourseCatalog } from "@/lib/course-catalog";
import { readJson } from "@/lib/http";
import { z } from "zod";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [courses, requests, submissions] = await Promise.all([
    db.course.findMany({ orderBy: { createdAt: "desc" } }),
    db.courseRequest.findMany({ orderBy: { createdAt: "desc" } }),
    db.submission.findMany({ select: { id: true, name: true, course: { select: { name: true } }, year: true, overallPercent: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return NextResponse.json({ courses, requests, submissions });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const courseInput = z.object({ name: z.string().trim().min(2).max(160), discipline: z.string().trim().min(2).max(80), institute: z.string().trim().max(120).optional() });
  const schema = z.object({ action: z.enum(["approve", "deleteSubmission", "deleteCourse", "import"]), id: z.string().max(64).optional(), data: z.array(courseInput).max(5000).optional() });
  const parsed = schema.safeParse(await readJson(req, 2 * 1024 * 1024));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { action, id } = parsed.data;
  if ((action === "approve" || action === "deleteSubmission" || action === "deleteCourse") && !id) return NextResponse.json({ error: "An item ID is required." }, { status: 400 });
  if (action === "approve") await db.course.update({ where: { id }, data: { status: "APPROVED" } });
  if (action === "deleteSubmission") await db.submission.delete({ where: { id } });
  if (action === "deleteCourse") await db.course.delete({ where: { id } });
  if (action === "import") for (const course of parsed.data.data ?? []) {
    const slug = course.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await db.course.upsert({ where: { slug }, create: { ...course, slug }, update: course });
  }
  if (action !== "deleteSubmission") invalidateApprovedCourseCatalog();
  return NextResponse.json({ ok: true });
}
