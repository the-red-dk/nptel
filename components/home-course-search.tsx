"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseCombobox } from "@/components/course-combobox";

export function HomeCourseSearch() {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [slug, setSlug] = useState("");
  return <div className="mt-7 max-w-lg">
    <div className="flex gap-2">
      <CourseCombobox value={courseId} onChange={(id, name, courseSlug) => { setCourseId(id); setCourseName(name); setSlug(courseSlug); }} />
      <button type="button" disabled={!slug} onClick={() => slug && router.push(`/course/${slug}`)} className="primary shrink-0">Search ↗</button>
    </div>
    <div aria-live="polite" className="sr-only">{courseName ? `Selected ${courseName}` : "Select a course to search"}</div>
  </div>;
}
