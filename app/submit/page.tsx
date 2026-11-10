"use client";

import Link from "next/link";
import { useState } from "react";
import { CourseCombobox } from "@/components/course-combobox";
import { CONFIG } from "@/lib/config";

const label = "mb-2 block text-sm font-semibold";
const field = "field";

export default function SubmitPage() {
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");
    setBusy(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body: Record<string, unknown> = Object.fromEntries(formData.entries());
    body.courseId = courseId;
    body.semester = body.semester || null;
    body.session = body.session || null;
    body.tier = body.tier || null;
    body.purpose = body.purpose || null;
    body.hasNumericals = body.hasNumericals === "true";

    try {
      const response = await fetch("/api/submissions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        const message = typeof result.error === "string"
          ? result.error
          : Object.values(result.error || {}).flat().join(" ") || "Could not submit your result.";
        throw new Error(message);
      }

      form.reset();
      setCourseId("");
      setCourseName("");
      setNotice("Your result was submitted. Thank you for contributing!");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-8 md:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold">
          NPTEL<span className="text-lime-700">Board</span>
          <span className="ml-2 rounded bg-ink px-2 py-1 font-mono text-[10px] text-white">BETA</span>
        </Link>
        <Link href="/" className="text-sm">← Home</Link>
      </header>

      <section className="mx-auto max-w-2xl py-12">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Add your result · 3 min</span>
        <h1 className="mt-3 font-display text-4xl font-bold">Every result adds<br />to the picture.</h1>
        <p className="mt-3 mb-4 text-neutral-600">Only anonymous course statistics are shared publicly.</p>
        <p className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-neutral-700">
          Email addresses are not verified. Your email is kept private and used to group your attempts; please enter your own address accurately.
        </p>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border-2 border-ink bg-white p-6 shadow-card md:p-8">
          <div>
            <label className={label}>Course name <b className="text-red-600">*</b></label>
            <CourseCombobox value={courseId} onChange={(id, name) => { setCourseId(id); setCourseName(name); }} />
            <input type="hidden" value={courseName} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Year taken *</label>
              <select name="year" required className={field}>
                {Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => new Date().getFullYear() - i)
                  .map(year => <option key={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Session</label>
              <select name="session" className={field}>
                <option value="">Choose later / unknown</option>
                <option value="JAN_APR">Jan–Apr (first half)</option>
                <option value="JUL_OCT">Jul–Oct (second half)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Which semester of college were you in?</label>
            <select name="semester" className={field}>
              <option value="">Choose later / not applicable</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(semester => (
                <option key={semester} value={semester}>{semester}{["st", "nd", "rd"][semester - 1] || "th"} semester</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Your name *</label>
            <input name="name" required minLength={2} className={field} placeholder="Not shown publicly" />
          </div>
          <div>
            <label className={label}>Email address (not verified) *</label>
            <input type="email" name="email" required className={field} placeholder="you@example.com" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {([ ["assignmentScore", "Assignment score (0–25)"], ["examScore", "Final exam score (0–75)"], ["overallPercent", "Overall score % (certificate)"] ] as const)
              .map(([name, text]) => (
                <div key={name}>
                  <label className={label}>{text} *</label>
                  <input name={name} type="number" required min="0"
                    max={name === "assignmentScore" ? CONFIG.assignmentMax : name === "examScore" ? CONFIG.examMax : CONFIG.overallMax}
                    step="0.01" className={field} />
                </div>
              ))}
          </div>

          <fieldset>
            <legend className={label}>Did this course contain numericals / calculations? *</legend>
            <div className="flex gap-5">
              <label><input required type="radio" name="hasNumericals" value="true" /> Yes</label>
              <label><input type="radio" name="hasNumericals" value="false" /> No</label>
            </div>
          </fieldset>

          <div>
            <label className={label}>Certificate tier</label>
            <select name="tier" className={field}>
              <option value="">No tier / not applicable</option>
              {CONFIG.tiers.map(tier => <option key={tier} value={tier}>{tier[0] + tier.slice(1).toLowerCase()} ({CONFIG.tierRanges[tier]})</option>)}
            </select>
            <p className="mt-2 text-xs text-neutral-500">NPTEL’s topper stamp is rank-based; the percentage is the rank band, not a fixed score tier.</p>
          </div>

          <fieldset>
            <legend className={label}>Why did you take this course? <span className="font-normal text-neutral-500">(optional)</span></legend>
            <div className="space-y-2">
              <label className="block"><input type="radio" name="purpose" value="LEARNING" /> For learning / educational purposes</label>
              <label className="block"><input type="radio" name="purpose" value="CREDITS" /> Purely for credits</label>
            </div>
          </fieldset>

          <div className="hidden" aria-hidden="true">
            <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <button disabled={busy || !courseId} className="primary w-full">
            {busy ? "Submitting…" : "Submit result →"}
          </button>
        </form>

        {notice && <p role="status" className="mt-4 rounded-lg bg-white p-3 text-sm">{notice}</p>}
      </section>
    </main>
  );
}
