import {design} from "@/lib/design";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = db()
    .prepare(
      "SELECT title, lang, due, design, CASE WHEN due<=? THEN body ELSE NULL END AS body FROM letters WHERE id=? AND kind='envelope'",
    )
    .get(Date.now(), id);
  return Response.json(
    row ? { ...row, design:design(JSON.parse(String(row.design))), serverNow: Date.now() } : { error: "missing" },
    {
      status: row ? 200 : 404,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
