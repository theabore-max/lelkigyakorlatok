// src/utils/uploadPoster.js
import { supabase } from "./supabaseClient"; // nálad: ahonnan a kliens jön

// Egyszerű fájlnév-normalizálás
const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function uploadPoster(file, { eventTitle = "", eventId = "", userId = "" } = {}) {
  if (!file) return null;
  const MAX_MB = 5;
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`A poszter túl nagy (${MAX_MB}MB max).`);
  }
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
    throw new Error("Csak JPG/PNG/WebP engedélyezett.");
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const ts  = Date.now();
  const safeTitle = slugify(eventTitle) || "esemeny";
  const safeUser  = userId ? slugify(userId) : "anon";
  const fname = `posters/${safeTitle}-${eventId || ts}-${safeUser}.${ext}`;

  // Feltöltés
  const { error: upErr } = await supabase
    .storage
    .from("event-images")
    .upload(fname, file, {
      upsert: true,
      cacheControl: "31536000",
      contentType: file.type || "image/*"
    });
  if (upErr) throw upErr;

  // Public URL
  const { data: pub } = supabase
    .storage
    .from("event-images")
    .getPublicUrl(fname);

  return pub?.publicUrl || null;
}
