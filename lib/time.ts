// Interpret wall-clock fields in a named zone, independent of the browser zone.
function parts(ms: number, zone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(
    fmt.formatToParts(ms).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
}
export function instant(
  year: number,
  month: number,
  day: number,
  clock: string,
  zone: string,
) {
  const [h, m] = clock.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return NaN;
  const desired = Date.UTC(year, month - 1, day, h, m);
  let guess = desired;
  for (let i = 0; i < 4; i++) {
    const diff = desired - parts(guess, zone);
    if (!diff) return guess;
    guess += diff;
  }
  return NaN;
}
export function clockText(ms: number, lang: string, zone: string) {
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
    timeZone: zone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(ms);
}
