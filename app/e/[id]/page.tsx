"use client";
import { use, useEffect, useState, type CSSProperties } from "react";
import { Celebration } from "../../Celebration";
import { Brand, Envelope } from "../../Stationery";
import { type Design } from "@/lib/design";
type Letter = {
  design:Design;
  lang: "en" | "fa";
  due: number;
  title: string;
  body: string | null;
  serverNow: number;
};
export default function Sealed({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [letter, L] = useState<Letter>(),
    [error, E] = useState(""),
    [paused,setPaused]=useState(false),
    [size,resize]=useState(18),
    [opened, O] = useState(false),
    [left, S] = useState(0);
  useEffect(() => {
    let waited=false;
    let stopped = false,
      timer: ReturnType<typeof setTimeout>,
      ticker: ReturnType<typeof setInterval>;
    async function refresh() {
      try {
        const res = await fetch("/api/envelope/" + encodeURIComponent(id), {
          cache: "no-store",
        });
        if (stopped) return;
        if (res.status === 404) {
          E("پاکت پیدا نشد · Letter not found");
          return;
        }
        if (!res.ok) throw Error();
        const row: Letter = await res.json();
        if (stopped) return;
        E("");
        L(row);
        document.documentElement.lang = row.lang;
        document.documentElement.dir = row.lang === "fa" ? "rtl" : "ltr";
        const wait = Math.max(0, row.due - row.serverNow),
          start = performance.now();
        clearInterval(ticker);
        S(Math.ceil(wait / 1000));
        if(row.body!==null && waited) O(true);
        if (row.body === null) {
          waited=true;
          ticker = setInterval(
            () =>
              S(
                Math.max(
                  0,
                  Math.ceil((wait - performance.now() + start) / 1000),
                ),
              ),
            1000,
          );
          timer = setTimeout(refresh, Math.min(wait + 150, 3600000));
        }
      } catch {
        if (!stopped) {
          E("اتصال قطع شد · Reconnecting…");
          timer = setTimeout(refresh, 4000);
        }
      }
    }
    refresh();
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, [id]);
  const fa = letter?.lang === "fa";
  const countdown = [
    Math.floor(left / 86400),
    Math.floor(left / 3600) % 24,
    Math.floor(left / 60) % 60,
    left % 60,
  ];
  const labels=fa?["روز","ساعت","دقیقه","ثانیه"]:["Days","Hours","Minutes","Seconds"];
  const digits=new Intl.NumberFormat(fa?"fa-IR":"en",{minimumIntegerDigits:2,useGrouping:false});
  return (
    <main className={`letterpage ${letter?.design.effects===false?"simple-letter":""}`}>
      {letter && <div className="reader-wall" style={{"--wall-left":letter.design.leftColor,"--wall-right":letter.design.rightColor} as CSSProperties} aria-hidden="true"/>}
      {opened && letter?.design.effects && !paused && <Celebration occasion={letter.design.occasion}/>}
      <Brand />
      <section className="preview">
        <Envelope
          design={letter?.design} opened={opened}
          caption={fa ? "برای" : "TO"}
          name={letter?.design.addressee || letter?.title || "DearLater"}
          cover={letter?.design.addressee?letter.title:""}
        />
        <div className="reading">
          {error ? (
            <p>{error}</p>
          ) : !letter ? (
            <p>…</p>
          ) : opened ? (
            <><div className="readtools">{letter.design.effects && <button aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?(fa?"ادامه جلوه‌ها":"Resume effects"):(fa?"توقف جلوه‌ها":"Pause effects")}</button>}<button aria-label={fa?"کوچک‌تر":"Smaller text"} onClick={()=>resize(v=>Math.max(14,v-2))}>A−</button><button aria-label={fa?"بزرگ‌تر":"Larger text"} onClick={()=>resize(v=>Math.min(30,v+2))}>A+</button></div><article className={"note note-"+letter.design.occasion} style={{fontSize:size}} dir="auto">{letter.body}</article></>
          ) : letter.body === null ? (
            <>
              <h2>
                {fa ? "این نامه هنوز سربسته‌ست" : "This letter is still sealed"}
              </h2>
              <div className="time-units" role="timer" dir={fa?"rtl":"ltr"}>{countdown.map((number,index)=><div key={labels[index]}><strong dir="ltr">{digits.format(number)}</strong><small>{labels[index]}</small></div>)}</div>
            </>
          ) : (
            <button className="primary" onClick={() => O(true)}>
              {fa ? "پاکتت رو باز کن" : "Open your letter"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
