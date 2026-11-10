import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissionSchema } from "@/lib/schemas";
import { passed } from "@/lib/config";
import { hit } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  if (!(await hit(`ip:${ip}`, 8, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const parsed = submissionSchema.safeParse(await readJson(req, 16 * 1024));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ error: "Submission rejected." }, { status: 400 });

  const { website: _website, ...input } = parsed.data;
  const email = input.email.toLowerCase();
  if (!(await hit(`email:${email}`, 3, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many submissions for this email. Please try again later." }, { status: 429 });
  }

  const course = await db.course.findFirst({
    where: { id: input.courseId, status: "APPROVED" },
    select: { id: true },
  });
  if (!course) return NextResponse.json({ error: { courseId: ["Choose an approved course"] } }, { status: 400 });

  const submission = await db.$transaction(async tx => {
    const previous = await tx.submission.findFirst({
      where: { email, courseId: input.courseId },
      orderBy: { attemptNumber: "desc" },
      select: { attemptNumber: true },
    });

    return tx.submission.create({
      data: {
        ...input,
        email,
        session: input.session ?? null,
        semester: input.semester ?? null,
        purpose: input.purpose ?? null,
        tier: input.tier ?? null,
        passed: passed(input.assignmentScore, input.examScore),
        attemptNumber: (previous?.attemptNumber ?? 0) + 1,
      },
      select: { id: true },
    });
  });

  return NextResponse.json({ saved: true, id: submission.id }, { status: 201 });
}
