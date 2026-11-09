import { describe,it,expect } from "vitest";
import { passed,CONFIG } from "@/lib/config";
import { bestAttempts,aggregate } from "@/lib/analytics";
describe("pass threshold",()=>{it("uses the centralized threshold",()=>{expect(passed(CONFIG.passPercent)).toBe(true);expect(passed(CONFIG.passPercent-0.01)).toBe(false)})});
describe("best attempt analytics",()=>{it("counts each person once using their highest score",()=>{const rows=[{email:"a",overallPercent:55},{email:"a",overallPercent:82},{email:"b",overallPercent:61}];expect(bestAttempts(rows)).toHaveLength(2);expect(bestAttempts(rows).find(r=>r.email==="a")?.overallPercent).toBe(82)});it("builds score summaries",()=>{const data=aggregate([{year:2025,session:null,semester:1,purpose:"LEARNING",assignmentScore:20,examScore:50,overallPercent:70,hasNumericals:true,passed:true,tier:"GOLD"}]);expect(data.total).toBe(1);expect(data.passRate).toBe(100);expect(data.numericals).toBe(100)})});
