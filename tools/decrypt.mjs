// Descifra los episodios para editarlos: node tools/decrypt.mjs . <contraseña>
// episodes/NN.enc -> episodes/NN.md y cover.enc -> cover.webp (están en .gitignore: no subirlos nunca).
import fs from "fs"; import path from "path";
const [repo, password] = process.argv.slice(2);
const book = JSON.parse(fs.readFileSync(path.join(repo, "book.json"), "utf8"));
const unb64 = s => Uint8Array.from(Buffer.from(s.trim(), "base64"));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({name: "PBKDF2", salt: unb64(book.lock.salt), iterations: book.lock.iter, hash: "SHA-256"}, base, {name: "AES-GCM", length: 256}, false, ["decrypt"]);
const raw = async d => { const u = unb64(d); return new Uint8Array(await crypto.subtle.decrypt({name: "AES-GCM", iv: u.slice(0, 12)}, key, u.slice(12))); };
const open = async d => new TextDecoder().decode(await raw(d));
if (await open(book.lock.check).catch(() => "") !== "most-ok") { console.error("Contraseña incorrecta"); process.exit(1); }
const dir = path.join(repo, "episodes");
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".enc")))
  fs.writeFileSync(path.join(dir, f.replace(/\.enc$/, ".md")), await open(fs.readFileSync(path.join(dir, f), "utf8")));
const ce = path.join(repo, "cover.enc");
if (fs.existsSync(ce)) fs.writeFileSync(path.join(repo, "cover.webp"), await raw(fs.readFileSync(ce, "utf8")));
console.log("ok");
