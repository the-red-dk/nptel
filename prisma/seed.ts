import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
const prisma = new PrismaClient();
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
async function main() {
  const rows = (await readFile(join(process.cwd(), "data/nptel_courses.csv"), "utf8")).trim().split(/\r?\n/).slice(1);
  for (const row of rows) {
    const [id, name, discipline, institute] = row.split(",");
    if (!name) continue;
    await prisma.course.upsert({ where: { slug: slugify(name) }, update: { name, discipline, institute }, create: { slug: slugify(name), name, discipline, institute } });
  }
}
main().finally(() => prisma.$disconnect());
