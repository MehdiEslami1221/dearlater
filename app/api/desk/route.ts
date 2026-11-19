import {design} from "@/lib/design";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import {
  accountInfo,
  begin,
  password,
  logout,
  recipient,
  deliver,
} from "@/lib/account";
export const dynamic = "force-dynamic";
function publicOrigin() {
  const origin=process.env.DEARLATER_PUBLIC_ORIGIN || "";
  return /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin)?origin:null;
}
function origin(req: Request) {
  const host = req.headers.get("host") || "";
  if (!/^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(host)) throw Error("local");
  return "http://" + host;
}
const err = (code: string, status = 400) =>
  Response.json({ error: code }, { status });
export async function GET(req: Request) {
  try {
    origin(req);
  } catch {
    return err("local", 403);
  }
  return Response.json(
    {
      account: accountInfo(),
      publicOrigin: publicOrigin(),
      rows: db()
        .prepare(
          "SELECT id,kind,target,title,due,status,live FROM letters ORDER BY created DESC LIMIT 60",
        )
        .all(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: Request) {
  try {
    const site = origin(req);
    if (
      req.headers.get("origin") !== site ||
      req.headers.get("x-dearlater") !== "local"
    )
      return err("local", 403);
    const a = await req.json();
    if (a.action === "connect") {
      await begin();
      return Response.json({ ok: true });
    }
    if (a.action === "password") {
      password(a.password);
      return Response.json({ ok: true });
    }
    if (a.action === "logout") {
      await logout();
      return Response.json({ ok: true });
    }
    const handle = a.kind === "self" ? "me" : String(a.target || "").trim();
    if (handle !== "me" && !/^@[a-z][\w]{3,31}$/i.test(handle))
      return err("recipient");
    if (a.action === "resolve") {
      const u = await recipient(handle);
      return Response.json({ id: u.id, name: u.name });
    }
    if (
      a.action !== "save" ||
      !["self", "envelope", "message"].includes(a.kind) ||
      !["fa", "en"].includes(a.lang) ||
      typeof a.body !== "string" ||
      !a.body.trim() ||
      a.body.length > 3500 ||
      typeof a.title !== "string" ||
      a.title.length > 140 ||
      !Number.isSafeInteger(a.due) ||
      a.due < Date.now() + 10000 ||
      a.due > 4102444800000 ||
      typeof a.live !== "boolean" ||
      !/^[a-f0-9-]{36}$/.test(a.request)
    )
      return err("invalid");
    const previous = db()
      .prepare("SELECT status FROM letters WHERE request=?")
      .get(a.request);
    if (previous) return err("duplicate", 409);
    const u = a.live ? await recipient(handle) : undefined;
    if (u && u.id !== a.confirmedId) return err("recipient");
    const envelopeOrigin = publicOrigin() || site;
    const id = randomBytes(24).toString("base64url");
    const inserted = db()
      .prepare("INSERT OR IGNORE INTO letters (id,request,kind,target,title,body,due,lang,status,live,created,design) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(
        id,
        a.request,
        a.kind,
        handle,
        a.title,
        a.body,
        a.due,
        a.lang,
        a.live ? "pending" : "demo",
        +a.live,
        Date.now(), JSON.stringify(design(a.design)),
      );
    if (!inserted.changes) return err("duplicate", 409);
    if (u) {
      let status = "unconfirmed";
      try {
        if (a.kind === "envelope") {
          await deliver(u.entity, a.title + "\n" + envelopeOrigin + "/e/" + id);
          status = "sent";
          if (a.remind) {
            status = "partial";
            await deliver(
              u.entity,
              (a.lang === "fa"
                ? "زمان باز کردن نامه‌ات رسیده"
                : "Your letter is ready to open") +
                "\n" +
                envelopeOrigin +
                "/e/" +
                id,
              a.due,
            );
            status = "sentReminder";
          }
        } else {
          await deliver(u.entity, a.body, a.due);
          status = "scheduled";
        }
      } finally {
        db().prepare("UPDATE letters SET status=? WHERE id=?").run(status, id);
      }
    }
    return Response.json({ ok: true, id });
  } catch (e) {
    const code = e instanceof Error ? e.message : "error";
    return err(
      ["config", "account", "recipient", "password", "local"].includes(code)
        ? code
        : "unconfirmed",
    );
  }
}
