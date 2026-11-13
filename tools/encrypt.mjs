// Cifra los episodios: node tools/encrypt.mjs . <contraseña>
// episodes/NN.md -> episodes/NN.enc y cover.webp -> cover.enc (base64 de iv(12) + AES-GCM), clave PBKDF2-SHA256. Genera sal nueva y actualiza "lock" en book.json.
import fs from "fs"; import path from "path";
const [repo, password] = process.argv.slice(2);
const ITER = 250000, enc = new TextEncoder();
const b64 = u => Buffer.from(u).toString("base64");
const salt = crypto.getRandomValues(new Uint8Array(16));
const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256"}, base, {name: "AES-GCM", length: 256}, false, ["encrypt"]);
const seal = async data => { const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv}, key, typeof data === "string" ? enc.encode(data) : data));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64(out); };
const dir = path.join(repo, "episodes");
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".md")).sort()) {
  fs.writeFileSync(path.join(dir, f.replace(/\.md$/, ".enc")), await seal(fs.readFileSync(path.join(dir, f), "utf8")));
  fs.unlinkSync(path.join(dir, f));
}
const cover = path.join(repo, "cover.webp");
if (fs.existsSync(cover)) { fs.writeFileSync(path.join(repo, "cover.enc"), await seal(new Uint8Array(fs.readFileSync(cover)))); fs.unlinkSync(cover); }
const bp = path.join(repo, "book.json"), book = JSON.parse(fs.readFileSync(bp, "utf8"));
book.lock = {salt: b64(salt), iter: ITER, check: await seal("most-ok")};
fs.writeFileSync(bp, JSON.stringify(book, null, 1) + "\n");
console.log("ok", fs.readdirSync(dir).length, "files");
