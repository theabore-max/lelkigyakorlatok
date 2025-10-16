import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import addEventImage from "../assets/addevent.jpg"; // alap illusztráció

const STORAGE_BUCKET = "event-images";

/** ékezetek és speciális karakterek eltávolítása, csak [a-z0-9._-] marad */
const sanitizeFilename = (name) =>
  (name || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** fix fallback mapping */
const FALLBACK_MAP = {
  "mindenki": "general.jpg",
  "fiatalok": "fiatalok.jpg",
  "idősek": "idosek.jpg",
  "fiatal házasok": "fiatal_hazasok.jpg",
  "érett házasok": "erett_hazasok.jpg",
  "jegyesek": "jegyesek.jpg",
  "tinédzserek": "tinedzserek.jpg",
  "családok": "csaladok.jpg",
};

function getFallbackImage(group) {
  const key = (group || "").toLowerCase();
  const file = FALLBACK_MAP[key] || "general.jpg";
  return `https://kibgskyyevsighwtkqcf.supabase.co/storage/v1/object/public/event-images/fallback/${file}`;
}

export default function AddEventForm({ currentUser, onCancel, onSuccess }) {
  // űrlapmezők
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contact, setContact] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");

  const [communities, setCommunities] = useState([]);

  // poszter
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);

  // egyéb
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // auth user – ha a szülő nem adta át, lekérjük
  const [authUser, setAuthUser] = useState(currentUser || null);
  useEffect(() => {
    let alive = true;
    if (!currentUser) {
      supabase.auth.getUser().then(({ data }) => {
        if (alive) setAuthUser(data?.user || null);
      });
    }
    return () => { alive = false; };
  }, [currentUser]);

  // közösségek
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("communities").select("id,name").order("name");
      if (!error && Array.isArray(data)) setCommunities(data);
    })();
  }, []);

  // poszter validáció
  const validatePosterFile = (file) => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) return "A poszter túl nagy (max. 5 MB).";
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) return "Csak JPG, PNG vagy WEBP engedélyezett.";
    return null;
  };

  // poszter feltöltés Storage-ba
  async function uploadPoster(file) {
    if (!file) return null;
    const v = validatePosterFile(file);
    if (v) throw new Error(v);

    setPosterUploading(true);
    try {
      const clean = sanitizeFilename(file.name) || `poster-${Date.now()}.png`;
      const path = `posters/${Date.now()}_${clean}`; // nincs vezető perjel!

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          upsert: true,
          cacheControl: "31536000",
          contentType: file.type || "image/*",
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const url = pub?.publicUrl || null;
      if (!url) throw new Error("Nem sikerült publikus URL-t előállítani a poszterhez.");
      setPosterUrl(url);
      return url;
    } finally {
      setPosterUploading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;      // ← dupla küldés ellen
    setError(null);
    setSaving(true);

    try {
      let finalPosterUrl = posterUrl;
      if (posterFile && !posterUrl) {
        finalPosterUrl = await uploadPoster(posterFile);
      }

      const payload = {
        title,
        description,
        location,
        target_group: targetGroup || "Mindenki",
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        contact,
        community_id: communityId ? Number(communityId) : null,
        registration_link: registrationLink || null,
        poster_url: finalPosterUrl || null,

        // LÉNYEG:
        source: "manual",
        created_by: authUser?.id || currentUser?.id || null,
      };

      const { data, error } = await supabase.from("events").insert(payload).select("id").single();
      if (error) throw error;

      // siker → szülő zárja a modalt és frissít
      onSuccess && onSuccess(data?.id);
    } catch (err) {
      setError(err?.message || "Hiba a mentés közben.");
    } finally {
      setSaving(false);
    }
  };

  const onPosterChange = (e) => {
    const f = e.target.files?.[0] || null;
    setPosterFile(f);
    setPosterPreview(f ? URL.createObjectURL(f) : "");
  };

  return (
    <form onSubmit={handleSubmit} className="w-100" noValidate autoComplete="off">
      <div className="row g-4 align-items-start">
        {/* BAL OSZLOP – Kép előnézet */}
        <div className="col-12 col-md-5" style={{ position: "sticky", top: 16 }}>
          <div className="border rounded-3 bg-light overflow-hidden w-100" style={{ height: 260 }}>
            <img
              src={
                posterPreview ||
                posterUrl ||
                (targetGroup ? getFallbackImage(targetGroup) : addEventImage)
              }
              alt="Illusztráció / poszter"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = addEventImage; // végső visszaesés
              }}
            />
          </div>
          <small className="text-muted d-block mt-2">Illusztráció / poszter előnézet</small>
        </div>

        {/* JOBB OSZLOP – Mezők + poszter feltöltés */}
        <div className="col-12 col-md-7">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="mb-3">
            <label className="form-label">Megnevezés *</label>
            <input
              className="form-control"
              placeholder="Pl. Fiatalok lelkigyakorlata"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Leírás *</label>
            <textarea
              className="form-control"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Helyszín *</label>
            <input
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Célcsoport *</label>
            <select
              className="form-select"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              required
            >
              <option value="">Válassz célcsoportot</option>
              <option>Mindenki</option>
              <option>Fiatalok</option>
              <option>Idősek</option>
              <option>Fiatal házasok</option>
              <option>Érett házasok</option>
              <option>Jegyesek</option>
              <option>Tinédzserek</option>
              <option>Családok</option>
            </select>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Kezdés *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Befejezés</label>
              <input
                type="datetime-local"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3 mt-3">
            <label className="form-label">Kapcsolattartó *</label>
            <input
              className="form-control"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Szervező közösség</label>
            <select
              className="form-select"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
            >
              <option value="">Kezdd el írni a közösség nevét…</option>
              {communities.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Jelentkezési link *</label>
            <input
              type="url"
              className="form-control"
              placeholder="Weboldal címe vagy e-mail cím"
              value={registrationLink}
              onChange={(e) => setRegistrationLink(e.target.value)}
              required
            />
          </div>

          {/* Poszter feltöltés */}
          <div className="mb-3 border rounded p-3 bg-light">
            <label className="form-label">Poszter feltöltése (opcionális)</label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPosterChange}
                className="form-control"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!posterFile || posterUploading}
                onClick={async () => {
                  try { await uploadPoster(posterFile); }
                  catch (e) { setError(e?.message || "Hiba a poszter feltöltésekor."); }
                }}
              >
                {posterUploading ? "Feltöltés…" : "Feltöltés"}
              </button>
              {posterUrl && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => { setPosterUrl(""); setPosterPreview(""); setPosterFile(null); }}
                  title="Poszter eltávolítása"
                >
                  Eltávolítás
                </button>
              )}
            </div>
            <small className="text-muted d-block mt-2">
              Ajánlott: 1200×630 (megosztáshoz), &lt; 5 MB, JPG/PNG/WebP.
            </small>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Mégsem</button>
            <button type="submit" className="btn btn-primary" disabled={saving || posterUploading}>
              {saving ? "Hozzáadás…" : "Hozzáadás"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

