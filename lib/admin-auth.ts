import {NextRequest} from "next/server";import {timingSafeEqual,createHmac} from "node:crypto";
export function adminToken(){return createHmac("sha256",process.env.ADMIN_PASSWORD??"").update("nptelboard-admin").digest("hex")}
export function isAdmin(req:NextRequest){const a=Buffer.from(req.cookies.get("nb_admin")?.value??""),b=Buffer.from(adminToken());return !!process.env.ADMIN_PASSWORD&&a.length===b.length&&timingSafeEqual(a,b)}
