import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
export const directory = resolve(process.env.DEARLATER_DATA || "data");
let connection: DatabaseSync;
export function db() {
  if (connection) return connection;
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  connection = new DatabaseSync(resolve(directory, "letters.sqlite"));
  connection.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS letters(
    id TEXT PRIMARY KEY, request TEXT UNIQUE NOT NULL, kind TEXT NOT NULL, target TEXT NOT NULL,
    title TEXT NOT NULL, body TEXT NOT NULL, due INTEGER NOT NULL, lang TEXT NOT NULL,
    status TEXT NOT NULL, live INTEGER NOT NULL, created INTEGER NOT NULL)`);
  const columns=connection.prepare("PRAGMA table_info(letters)").all();
  if(!columns.some(c=>c.name==="design")) connection.exec("ALTER TABLE letters ADD COLUMN design TEXT NOT NULL DEFAULT '{}'");
  return connection;
}
