import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import QRCode from "qrcode";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { directory, db } from "./db";
type State = {
  client?: TelegramClient;
  qr?: string;
  phase: string;
  name?: string;
  busy?: boolean;
  answer?: (s: string) => void;
  fail?: (e: Error) => void;
};
const holder = globalThis as typeof globalThis & { dlAccount?: State };
const state = (holder.dlAccount ??= { phase: "idle" });
const file = join(directory, "session");
const keys = () => ({
  apiId: Number(process.env.TELEGRAM_API_ID),
  apiHash: process.env.TELEGRAM_API_HASH || "",
});
export function accountInfo() {
  return {
    phase: state.phase,
    qr: state.qr,
    name: state.name,
    configured: !!(keys().apiId && keys().apiHash),
  };
}
export async function begin() {
  if (state.busy || state.phase === "ready") return;
  if (!accountInfo().configured) throw Error("config");
  state.busy = true;
  state.phase = "connecting";
  db();
  const { apiId, apiHash } = keys();
  const session = new StringSession(
    existsSync(file) ? readFileSync(file, "utf8") : "",
  );
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 2,
    autoReconnect: true,
  });
  state.client = client;
  void (async () => {
    try {
      await client.connect();
      if (!(await client.checkAuthorization())) {
        await client.signInUserWithQrCode(
          { apiId, apiHash },
          {
            qrCode: async ({ token }) => {
              state.qr = await QRCode.toDataURL(
                "tg://login?token=" + token.toString("base64url"),
              );
              state.phase = "qr";
            },
            password: async () => {
              state.qr = undefined;
              state.phase = "password";
              return new Promise<string>((ok, fail) => {
                state.answer = ok;
                state.fail = fail;
              });
            },
            onError: async () => true,
          },
        );
      }
      const me = await client.getMe();
      writeFileSync(file, session.save(), { mode: 0o600 });
      state.name = [
        me.firstName,
        me.lastName,
        me.username ? "@" + me.username : "",
      ]
        .filter(Boolean)
        .join(" ");
      state.phase = "ready";
    } catch {
      state.phase = "failed";
      await client.disconnect().catch(() => {});
    } finally {
      state.busy = false;
      state.qr = undefined;
      state.answer = undefined;
      state.fail = undefined;
    }
  })();
}
export function password(value: string) {
  if (!state.answer || !value) throw Error("password");
  const send = state.answer;
  state.answer = undefined;
  state.phase = "connecting";
  send(value);
}
export async function logout() {
  const client = state.client;
  if (state.busy || !client || state.phase !== "ready") throw Error("account");
  await client.invoke(new Api.auth.LogOut());
  state.phase = "idle";
  state.name = undefined;
  rmSync(file, { force: true });
  await client.disconnect();
}
export async function recipient(handle: string) {
  if (state.phase !== "ready" || !state.client) throw Error("account");
  const user = await state.client.getEntity(handle);
  if (!(user instanceof Api.User) || user.bot || user.deleted)
    throw Error("recipient");
  return {
    id: user.id.toString(),
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    entity: user,
  };
}
export async function deliver(user: Api.User, message: string, due?: number) {
  if (!state.client || state.phase !== "ready") throw Error("account");
  await state.client.sendMessage(user, {
    message,
    parseMode: false,
    linkPreview: false,
    schedule: due ? Math.floor(due / 1000) : undefined,
  });
}
