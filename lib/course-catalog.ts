import { db } from "@/lib/db";

type CatalogCourse = { id: string; name: string; slug: string; discipline: string };
type CatalogState = { value: CatalogCourse[]; expiresAt: number; pending?: Promise<CatalogCourse[]> };
const globalCatalog = globalThis as typeof globalThis & { __nptelCourseCatalog?: CatalogState };
const state = globalCatalog.__nptelCourseCatalog ??= { value: [], expiresAt: 0 };

export async function approvedCourseCatalog() {
  if (Date.now() < state.expiresAt) return state.value;
  if (!state.pending) {
    state.pending = db.course.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, slug: true, discipline: true },
      orderBy: { name: "asc" },
    }).then((courses) => {
      state.value = courses;
      state.expiresAt = Date.now() + 60_000;
      return courses;
    }).finally(() => { state.pending = undefined; });
  }
  return state.pending;
}

export function primeApprovedCourseCatalog(courses: CatalogCourse[]) {
  state.value = courses;
  state.expiresAt = Date.now() + 60_000;
}

export function invalidateApprovedCourseCatalog() {
  state.expiresAt = 0;
}

export function searchCourses(courses: CatalogCourse[], query: string) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return courses.slice(0, 12);
  const words = q.split(/\s+/).filter(Boolean);
  return courses.map((course) => {
    const name = course.name.toLocaleLowerCase();
    const discipline = course.discipline.toLocaleLowerCase();
    const nameMatches = words.filter((word) => name.includes(word)).length;
    const fieldMatches = words.filter((word) => discipline.includes(word)).length;
    const score = (name === q ? 100 : 0) + (name.startsWith(q) ? 50 : 0) + nameMatches * 10 + fieldMatches * 2;
    return { course, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.course.name.localeCompare(b.course.name))
    .slice(0, 12).map(({ course }) => course);
}
