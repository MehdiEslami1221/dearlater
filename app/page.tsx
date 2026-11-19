"use client";
import {design,standard} from "@/lib/design";
import {Appearance} from "./Appearance";
import {Designer} from "./Designer";
import { useEffect, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import persianFa from "react-date-object/locales/persian_fa";
import english from "react-date-object/locales/gregorian_en";
import {
  Archive,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  Feather,
  Globe2,
  Inbox,
  LockKeyhole,
  Mail,
  PenLine,
  Send,
  Settings2,
  X,
} from "lucide-react";
import { Brand, Envelope } from "./Stationery";
import { clockText, instant } from "@/lib/time";
type Lang = "fa" | "en";
type Kind = "envelope" | "message" | "self";
type Account = {
  phase: string;
  qr?: string;
  name?: string;
  configured: boolean;
};
type Row = {
  id: string;
  kind: Kind;
  target: string;
  title: string;
  due: number;
  status: string;
  live: number;
};
const templates = [
  ["یک نامه برای تو", "A letter for you", ""],
  [
    "تولد",
    "Birthday",
    "تولدت مبارک! خوشحالم که توی زندگی منی.",
    "Happy birthday! I’m so glad you’re in my life.",
  ],
  [
    "سالگرد",
    "Anniversary",
    "سالگردمون مبارک. هنوز اولین دیدارمون یادمه.",
    "Happy anniversary. I still remember the day we met.",
  ],
  [
    "یادآوری",
    "Reminder",
    "یادت باشه برای قرار فردا آماده بشی.",
    "Remember to get ready for tomorrow’s appointment.",
  ],
];
const statuses: Record<string, string[]> = {
  demo: ["تست محلی", "Local test"],
  pending: ["در انتظار تأیید", "Pending confirmation"],
  unconfirmed: ["نیاز به بررسی در تلگرام", "Check in Telegram"],
  partial: [
    "لینک ارسال شد؛ یادآور تأیید نشد",
    "Link sent · reminder unconfirmed",
  ],
  sent: ["لینک ارسال شد", "Link sent"],
  scheduled: ["زمان‌بندی شد", "Scheduled"],
  sentReminder: ["لینک ارسال و یادآور ثبت شد", "Sent with reminder"],
};
async function post(data: object) {
  const r = await fetch("/api/desk", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-DearLater": "local" },
    body: JSON.stringify(data),
  });
  const j = await r.json();
  if (!r.ok) throw Error(j.error);
  return j;
}
export default function Desk() {
  const [lang, L] = useState<Lang>("en"),
    [letterLang, LL] = useState<Lang>("en"),
    [kind, K] = useState<Kind>("envelope"),
    [tab, T] = useState("write"),
    [live, V] = useState(false);
  const [target, U] = useState(""),
    [title, H] = useState(""),
    [body, B] = useState(""),
    [clock, C] = useState("09:00"),
    [zone, Z] = useState("Asia/Tehran"),
    [device, DZ] = useState("UTC"),
    [date, D] = useState<DateObject | null>(null),
    [remind, M] = useState(false);
  const [acct, A] = useState<Account>({ phase: "idle", configured: false }),
    [rows, R] = useState<Row[]>([]),
    [pw, P] = useState(""),
    [dialog, G] = useState(""),
    [notice, N] = useState(""),
    [busy, Y] = useState(false),
    [who, W] = useState({ id: "", name: "" });
  const [appearance,paint]=useState(standard), [restored,setRestored]=useState(false);
  const [readerOrigin,setReaderOrigin]=useState<string|null>(null);
  const rid = useRef(""),
    locked = useRef(false);
  const fa = lang === "fa",
    t = (a: string, b: string) => (fa ? a : b),
    idx = fa ? 0 : 1;
  const cover =
    title.trim() ||
    (letterLang === "fa" ? "یک نامه برای تو" : "A letter for you");
  const kinds = {
    envelope: t("پاکت زمان‌دار", "Sealed letter"),
    message: t("پیام سرِ وقت", "Scheduled message"),
    self: t("یادآوری شخصی", "Note to self"),
  };
  const g = date ? new DateObject(date).convert(gregorian) : null;
  const due = g ? instant(g.year, g.month.number, g.day, clock, zone) : NaN;
  const when = Number.isFinite(due) ? clockText(due, lang, zone) : "—";
  async function sync() {
    const r = await fetch("/api/desk", { cache: "no-store" });
    if (!r.ok) throw Error();
    const j = await r.json();
    A(j.account);setReaderOrigin(j.publicOrigin||null);
    R(j.rows);
  }
  useEffect(() => {
    const l = localStorage.getItem("dl-language") === "fa" ? "fa" : "en";
    L(l);
    LL(l);
    DZ(Intl.DateTimeFormat().resolvedOptions().timeZone);
    D(new DateObject().add(1, "day"));
    try {
      const draft=JSON.parse(localStorage.getItem("dl-draft") || "null");
      if(draft){
        U(draft.target||"");H(draft.title||"");B(draft.body||"");C(draft.clock||"09:00");
        if (["fa","en"].includes(draft.letterLang))LL(draft.letterLang);
        if (["envelope","self","message"].includes(draft.kind))K(draft.kind);
        if(draft.date)D(new DateObject(draft.date));if(draft.zone)Z(draft.zone);M(!!draft.remind);paint(design(draft.appearance));
      }
    } catch { /* Use a fresh workspace if browser storage is unavailable. */ }
    setRestored(true);
    sync().catch(() => N("offline"));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = fa ? "rtl" : "ltr";
  }, [lang, fa]);
  useEffect(() => {
    if (dialog !== "settings" || !live || !["connecting","qr","password"].includes(acct.phase)) return;
    const id = setInterval(() => sync().catch(() => {}), 1700);
    return () => clearInterval(id);
  }, [dialog,live,acct.phase]);
  useEffect(()=>{
    if(!restored)return;
    try { localStorage.setItem("dl-draft",JSON.stringify({kind,target,title,body,clock,zone,date:date?.toDate().getTime(),remind,letterLang,appearance})); } catch { /* Private browsing can restrict storage. */ }
  },[restored,kind,target,title,body,clock,zone,date,remind,letterLang,appearance]);
  const errors: Record<string, string> = {
    offline: t("ارتباط با برنامه قطع شد.", "Cannot reach the local app."),
    config: t(
      "شناسه و هش برنامه را در .env.local تنظیم کن و برنامه را دوباره اجرا کن.",
      "Set API credentials in .env.local and restart.",
    ),
    account: t(
      "ابتدا حساب تلگرام را متصل کن.",
      "Connect your Telegram account first.",
    ),
    recipient: t(
      "آیدی یک مخاطب شخصی معتبر وارد کن.",
      "Enter a valid personal Telegram username.",
    ),
    invalid: t(
      "متن و زمانی حداقل یک دقیقه در آینده انتخاب کن.",
      "Enter a message and choose a time at least a minute ahead.",
    ),
    unconfirmed: t(
      "پاسخ قطعی دریافت نشد. قبل از تکرار، چت و صف تلگرام را بررسی کن.",
      "No confirmation. Check Telegram before retrying.",
    ),
    duplicate: t(
      "این درخواست قبلاً ثبت شده. صندوق را بررسی کن.",
      "Already recorded. Check your outbox.",
    ),
    saved: t("در صندوق ثبت شد.", "Saved to your outbox."),
  };
  async function run(fn: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    Y(true);
    N("");
    try {
      await fn();
    } catch (e) {
      N(e instanceof Error && errors[e.message] ? e.message : "unconfirmed");
    } finally {
      locked.current = false;
      Y(false);
    }
  }
  async function review() {
    await run(async () => {
      if (!body.trim() || !Number.isFinite(due) || due < Date.now() + 60000)
        throw Error("invalid");
      if (kind !== "self" && !/^@[a-z][\w]{3,31}$/i.test(target.trim()))
        throw Error("recipient");
      if (live && acct.phase !== "ready") throw Error("account");
      W(
        live
          ? await post({ action: "resolve", target, kind })
          : { id: "", name: kind === "self" ? "Saved Messages" : target },
      );
      if (!rid.current) rid.current = crypto.randomUUID();
      G("review");
    });
  }
  async function save() {
    await run(async () => {
      try {
        await post({
          action: "save",
          request: rid.current,
          kind,
          target,
          title: cover,
          body,
          due,
          lang: letterLang,
          live,
          design:appearance,confirmedId: who.id,
          remind,
        });
      } finally {
        G("");
        await sync();
      }
      rid.current = "";
      B("");
      H("");
      U("");
      T("archive");
      N("saved");
    });
  }
  function edit() {
    rid.current = "";
    N("");
  }
  function go(tab: string) {
    T(tab);
    N("");
  }
  const msg = notice && (
    <p role="status" className="notice">
      {errors[notice] || notice}
    </p>
  );
  return (
    <>
      <header className="top">
        <div className="wrap flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-3">
            <button
              className="lang"
              onClick={() => {
                const l = fa ? "en" : "fa";
                L(l);
                localStorage.setItem("dl-language", l);
              }}
            >
              <Globe2 size={16} />
              {fa ? "English" : "فارسی"}
            </button>
            <button
              className="iconbtn"
              aria-label={t("تنظیمات", "Settings")}
              onClick={() => G("settings")}
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="wrap main">
        <div className="intro">
          <div>
            <h1>{t("میز نامه‌ها", "Writing desk")}</h1>
            <p>
              {t(
                "برای کسی که دوستش داری، یا برای خودِ آینده‌ات بنویس.",
                "Write to someone you love, or leave a note for your future self.",
              )}
            </p>
          </div>
          <button className="mode" onClick={() => G("settings")}>
            <i />
            {live
              ? t("تلگرام زنده", "Live Telegram")
              : t("حالت آزمایشی", "Local demo")}
          </button>
        </div>
        <nav className="tabs">
          <button
            className={tab === "write" ? "sel" : ""}
            onClick={() => go("write")}
          >
            <PenLine />
            {t("نامه‌ی جدید", "Compose")}
          </button>
          <button
            className={tab === "archive" ? "sel" : ""}
            onClick={() => {
              go("archive");
              sync().catch(() => N("offline"));
            }}
          >
            <Archive />
            {t("صندوق ارسال", "Outbox")} <span>{rows.length}</span>
          </button>
        </nav>
        {tab === "write" ? (
          <div className="gridbox">
            <section className="panel form" onChange={edit}>
              <h2>{t("چه چیزی می‌فرستی؟", "What are you sending?")}</h2>
              <div className="types">
                {(
                  [
                    ["envelope", Mail],
                    ["message", Send],
                    ["self", Bell],
                  ] as const
                ).map(([k, I]) => (
                  <button
                    key={k}
                    className={kind === k ? "chosen" : ""}
                    aria-pressed={kind === k}
                    onClick={() => {
                      K(k);
                      edit();
                    }}
                  >
                    <I size={19} />
                    {kinds[k]}
                  </button>
                ))}
              </div>
              {kind !== "self" && (
                <label>
                  {t("آیدی تلگرام مخاطب", "Recipient username")}
                  <input
                    dir="ltr"
                    value={target}
                    placeholder="@username"
                    onChange={(e) => U(e.target.value)}
                  />
                </label>
              )}
              {kind==="envelope" && <Designer fa={fa} value={appearance} change={v=>{paint(v);edit();}}/>}
              <div className="pair">
                <label>
                  {t("قالب پیام", "Message template")}
                  <select
                    defaultValue="0"
                    onChange={(e) => {
                      const index=Number(e.target.value);
                      const v = templates[index];
                      paint(current=>({...current,occasion:(["personal","birthday","anniversary","reminder"] as const)[index]}));
                      if (v[2]) B(v[letterLang === "fa" ? 2 : 3]);
                    }}
                  >
                    {templates.map((a, i) => (
                      <option key={i} value={i}>
                        {i ? a[idx] : t("متن شخصی", "Personal note")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("زبان نامه", "Letter language")}
                  <select
                    value={letterLang}
                    onChange={(e) => LL(e.target.value as Lang)}
                  >
                    <option value="fa">فارسی</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>
              {kind === "envelope" && (
                <label>
                  {t("نوشته‌ی روی پاکت", "Envelope inscription")}
                  <input
                    dir="auto"
                    value={title}
                    placeholder={cover}
                    maxLength={140}
                    onChange={(e) => H(e.target.value)}
                  />
                </label>
              )}
              <label>
                {t("متن نامه", "Your message")}
                <textarea
                  dir="auto"
                  rows={4}
                  value={body}
                  maxLength={3500}
                  placeholder={t("از اینجا بنویس…", "Start writing here…")}
                  onChange={(e) => B(e.target.value)}
                />
              </label>
              <div className="pair">
                <label>
                  {t("تاریخ", "Date")}
                  <DatePicker
                    value={date}
                    onChange={(v) => {
                      D(v as DateObject);
                      edit();
                    }}
                    calendar={fa ? persian : gregorian}
                    locale={fa ? persianFa : english}
                    editable={false}
                    format="YYYY/MM/DD"
                    calendarPosition="bottom-center"
                  />
                </label>
                <label>
                  {t("ساعت", "Time")}
                  <input
                    type="time"
                    value={clock}
                    onChange={(e) => C(e.target.value)}
                  />
                </label>
              </div>
              <label>
                {t("منطقه‌ی زمانی", "Time zone")}
                <select value={zone} onChange={(e) => Z(e.target.value)}>
                  {Array.from(new Set(["Asia/Tehran", device, "UTC"])).map(
                    (z) => (
                      <option key={z}>{z}</option>
                    ),
                  )}
                </select>
              </label>
              {kind === "envelope" && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={remind}
                    onChange={(e) => M(e.target.checked)}
                  />
                  {t(
                    "موقع باز شدن، یک یادآور هم بفرست",
                    "Send a reminder when the letter unlocks",
                  )}
                </label>
              )}
              {msg}
              <button disabled={busy} className="primary" onClick={review}>
                {t("مرور و تأیید", "Review letter")}
                <ArrowUpRight size={17} />
              </button>
            </section>
            <aside>
              <section className="preview">
                <div className="previewhead">
                  <Feather size={18} />
                  {t("پیش‌نمایش نامه", "Letter preview")}
                </div>
                <Envelope design={appearance}
                  caption={letterLang === "fa" ? "برای" : "TO"}
                  name={
                    kind === "self"
                      ? t("خودِ آینده‌ام", "My future self")
                      : appearance.addressee || target || t("مخاطب تو", "Your recipient")
                  }
                  cover={kind === "envelope" ? cover : body.slice(0, 90)}
                />
                <div className="details">
                  <span>
                    <Clock3 />
                    {when}
                  </span>
                  <span>
                    <LockKeyhole />
                    {kind === "envelope"
                      ? t(
                          "متن تا موعد نامه محفوظ می‌مونه.",
                          "The message stays sealed until its time.",
                        )
                      : kinds[kind]}
                  </span>
                </div>
              </section>
              <p className="footnote">
                <CircleHelp size={17} />
                {kind === "envelope"
                  ? readerOrigin ? t("لینک این پاکت با روشن ماندن سیستم از اینترنت باز می‌شود.","This envelope can be opened online while your PC and tunnel are running.") : t(
                      "در تست لوکال، لینک پاکت روی همین کامپیوتر باز می‌شه.",
                      "Local envelope links open on this computer.",
                    )
                  : t(
                      "در حالت آزمایشی، ارسال تلگرامی شبیه‌سازی می‌شه.",
                      "Demo mode records messages locally.",
                    )}
              </p>
            </aside>
          </div>
        ) : (
          <section className="panel">
            {msg}
            <h2>{t("صندوق ارسال", "Outbox")}</h2>
            {rows.length === 0 ? (
              <div className="empty">
                <Inbox />
                <p>
                  {t(
                    "اولین نامه‌ات اینجا ثبت می‌شه.",
                    "Your first letter will appear here.",
                  )}
                </p>
              </div>
            ) : (
              rows.map((r) => (
                <div className="row" key={r.id}>
                  <div>
                    <b>{kinds[r.kind]}</b> · <bdi>{r.target}</bdi>
                    <small>
                      {clockText(r.due, lang, zone)} ·{" "}
                      {statuses[r.status]?.[idx] || r.status}
                    </small>
                  </div>
                  {r.kind === "envelope" && (
                    <a href={(readerOrigin || "") + "/e/" + r.id}>{t("دیدن پاکت", "View letter")} ↗</a>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      <footer><a href="/about">{t("درباره‌ی DearLater","About DearLater")}</a></footer>
      </main>
      {dialog && (
        <div className="scrim">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              dialog === "review"
                ? t("مرور", "Review")
                : t("تنظیمات", "Settings")
            }
          >
            <button
              className="close"
              aria-label={t("بستن", "Close")}
              onClick={() => G("")}
            >
              <X size={20} />
            </button>
            {dialog === "review" ? (
              <>
                <h2>{t("مرور نهایی", "Final review")}</h2>
                <p>
                  {kinds[kind]} ·{" "}
                  {live ? acct.name : t("تست محلی", "Local demo")}
                </p>
                <b dir="auto">
                  {who.name} {live && kind !== "self" ? target : ""}
                </b>
                <p>
                  {kind === "envelope"
                    ? t(
                        "ارسال لینک اکنون؛ زمان باز شدن",
                        "Send link now · unlock at",
                      )
                    : t("زمان ارسال", "Delivery time")}{" "}
                  · {when} ({zone})
                </p>
                <blockquote dir="auto">{body}</blockquote>
                <button disabled={busy} className="primary" onClick={save}>
                  <Check size={16} />
                  {t("تأیید و ثبت", "Confirm and save")}
                </button>
              </>
            ) : (
              <>
                <h2>{t("تنظیمات", "Settings")}</h2><Appearance fa={fa}/><h3>{t("اتصال تلگرام","Telegram connection")}</h3>
                <p>
                  {t(
                    "در حالت آزمایشی همه‌چیز روی همین دستگاه ذخیره می‌شه.",
                    "Demo mode stores your letters on this device.",
                  )}
                </p>
                <div className="types">
                  <button
                    className={!live ? "chosen" : ""}
                    onClick={() => {
                      V(false);
                      edit();
                    }}
                  >
                    {t("آزمایشی", "Demo")}
                  </button>
                  <button
                    className={live ? "chosen" : ""}
                    onClick={() => {
                      V(true);
                      edit();
                    }}
                  >
                    {t("واقعی", "Live")}
                  </button>
                </div>
                {live && (
                  <>
                    {!acct.configured && <p>{errors.config}</p>}
                    {["idle", "failed"].includes(acct.phase) && (
                      <>
                        <p>
                          {acct.phase === "failed"
                            ? t(
                                "اتصال انجام نشد. تنظیمات و VPN سیستم را بررسی کن.",
                                "Connection failed. Check credentials and VPN.",
                              )
                            : ""}
                        </p>
                        <button
                          disabled={!acct.configured || busy}
                          className="primary"
                          onClick={() =>
                            run(async () => {
                              await post({ action: "connect" });
                              await sync();
                            })
                          }
                        >
                          {t("وصل کردن حساب من", "Connect my account")}
                        </button>
                      </>
                    )}
                    {acct.phase === "qr" && acct.qr && (
                      <>
                        <img
                          src={acct.qr}
                          alt="Telegram QR"
                          width={190}
                          height={190}
                        />
                        <p>
                          {t(
                            "تلگرام ← تنظیمات ← دستگاه‌ها ← اتصال دستگاه",
                            "Telegram → Settings → Devices → Link desktop device",
                          )}
                        </p>
                      </>
                    )}
                    {acct.phase === "connecting" && (
                      <p>{t("در حال اتصال…", "Connecting…")}</p>
                    )}
                    {acct.phase === "password" && (
                      <>
                        <label>
                          {t(
                            "رمز دومرحله‌ای تلگرام",
                            "Telegram two-step password",
                          )}
                          <input
                            type="password"
                            value={pw}
                            onChange={(e) => P(e.target.value)}
                          />
                        </label>
                        <button
                          className="primary"
                          onClick={() =>
                            run(async () => {
                              await post({ action: "password", password: pw });
                              P("");
                              await sync();
                            })
                          }
                        >
                          {t("تأیید", "Confirm")}
                        </button>
                      </>
                    )}
                    {acct.phase === "ready" && (
                      <>
                        <p>{acct.name}</p>
                        <button
                          className="lang"
                          onClick={() =>
                            run(async () => {
                              await post({ action: "logout" });
                              V(false);
                              await sync();
                            })
                          }
                        >
                          {t("قطع نشست تلگرام", "Revoke session")}
                        </button>
                      </>
                    )}
                  </>
                )}
                {msg}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
