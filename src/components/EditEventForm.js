// src/components/EditEventForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import editEventImage from "../assets/edit-event.jpg";

const STORAGE_BUCKET = "event-images"; // Storage → Buckets (public)

// fájlnév tisztítás (ékezetek nélkül, csak [a-z0-9._-])
const sanitizeFilename = (name) =>
  (name || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function EditEventForm({ event, onCancel, onSuccess }) {
  // ISO -> datetime-local
  const toLocalInput = (val) => {
    if (!val) return "";
    const d = new Date(val);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  // Állapotok
  const [title, setTitle] = useState(event.title || "");
  const [description, setDescription] = useState(event.description || "");
  const [targetGroup, setTargetGroup] = useState(event.target_group || "");
  const [startDate, setStartDate] = useState(toLocalInput(event.start_date));
  const [endDate, setEndDate] = useState(toLocalInput(event.end_date));
  const [contact, setContact] = useState(event.contact || "");
  const [communityId, setCommunityId] = useState("");
  const [registrationLink, setRegistrationLink] = useState(event.registration_link || "");

  // Poszter
  const [posterUrl, setPosterUrl] = useState(event.poster_url || "");
  const [posterFile, setPosterFile] = useState(null);
  const [posterUploading, setPosterUploading] = useState(false);

  const [communities, setCommunities] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Kezdeti közösség
  useEffect(() => {
    const initial = event?.community_id ?? event?.communities?.id ?? "";
    setCommunityId(initial ? String(initial) : "");
  }, [event]);

  // Közösségek lekérés
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("id,name")
        .order("name");
      if (!error && Array.isArray(data)) setCommunities(data);
    };
    fetchCommunities();
  }, []);

  // Fájl-validáció
  function validatePosterFile(file) {
    if (!file) return null;
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      return `A poszter túl nagy (${MAX_MB}MB a maximum).`;
    }
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      return "Csak JPG/PNG/WebP kép tölthető fel.";
    }
    return null;
  }

  // Feltöltés Storage-ba
  async function uploadPoster(file) {
    if (!file) return null;
    if (!event?.id) throw new Error("Hiányzik az esemény azonosítója (event.id).");

    const v = validatePosterFile(file);
    if (v) throw new Error(v);

    setPosterUploading(true);
    try {
      const cleanName = sanitizeFilename(file.name) || `poster-${Date.now()}.png`;
      const path = `posters/${event.id}/${Date.now()}_${cleanName}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          upsert: true,
          cacheControl: "31536000",
          contentType: file.type || "image/*",
        });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const url = pub?.publicUrl;
      if (!url) throw new Error("Nem sikerült publikus URL-t előállítani a poszterhez.");

      setPosterUrl(url);
      return url;
    } finally {
      setPosterUploading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (posterFile) {
        await uploadPoster(posterFile);
      }

      const payload = {
        title,
        description,
        target_group: targetGroup,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        contact,
        community_id: communityId ? Number(communityId) : null,
        registration_link: registrationLink || null,
        poster_url: posterUrl || null,
      };

      const { data, error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", event.id)
        .select("id")
        .single();

      if (error) {
        setError(error.message);
        return;
      }
      if (!data) {
        setError("A frissítés nem hajtódott végre (0 sor).");
        return;
      }

      onSuccess && onSuccess();
    } catch (err) {
      setError(err?.message || "Hiba mentés közben.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Bal oldal: illusztráció + poszter preview */}
        <div className="col-md-6 mb-3 mb-md-0">
          <img
            src={editEventImage}
            alt="Esemény szerkesztése"
            className="img-fluid rounded"
          />

          {posterUrl && (
            <div className="mt-3">
              <small className="text-muted d-block mb-1">Jelenlegi poszter:</small>
              <a href={posterUrl} target="_blank" rel="noreferrer">
                <img
                  src={posterUrl}
                  alt="Poszter előnézet"
                  style={{ maxWidth: "100%", height: "auto", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
                />
              </a>
            </div>
          )}
        </div>

        {/* Jobb oldal: űrlap */}
        <div className="col-md-6">
          <h2 className="h4 mb-3">Esemény szerkesztése</h2>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Megnevezés *</label>
              <input
                type="text"
                className="form-control"
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
              <label className="form-label">Célcsoport *</label>
              <select
                className="form-select"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                required
              >
                <option value="">Válassz célcsoportot</option>
                <option value="Mindenki">Mindenki</option>
                <option value="Fiatalok">Fiatalok</option>
                <option value="Idősek">Idősek</option>
                <option value="Fiatal házasok">Fiatal házasok</option>
                <option value="Érett házasok">Érett házasok</option>
                <option value="Jegyesek">Jegyesek</option>
                <option value="Tinédzserek">Tinédzserek</option>
                <option value="Családok">Családok</option>
              </select>
            </div>

            <div className="row">
              <div className="mb-3 col-md-6">
                <label className="form-label">Kezdés *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3 col-md-6">
                <label className="form-label">Befejezés</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Kapcsolattartó *</label>
              <input
                type="text"
                className="form-control"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Szervező közösség *</label>
              <select
                className="form-select"
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                required
              >
                <option value="">Válassz közösséget</option>
                {communities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Jelentkezési link *</label>
              <input
                type="url"
                className="form-control"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                required
              />
            </div>

            {/* Poszter feltöltés */}
            <div className="mb-3">
              <label className="form-label">Poszter (plakát) feltöltése</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="form-control"
                  onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={!posterFile || posterUploading}
                  onClick={async () => {
                    try {
                      await uploadPoster(posterFile);
                    } catch (e) {
                      setError(e?.message || "Hiba a poszter feltöltése közben.");
                    }
                  }}
                >
                  {posterUploading ? "Feltöltés…" : "Feltöltés"}
                </button>
                {posterUrl && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => {
                      setPosterUrl("");
                      setPosterFile(null);
                    }}
                    title="Poszter eltávolítása (mentés után lép életbe)"
                  >
                    Eltávolítás
                  </button>
                )}
              </div>
              <div className="form-text">
                Ajánlott: álló arány (pl. A4), &lt; 5 MB. Feltöltés után a kép nagyítható lesz.
              </div>
            </div>

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onCancel && onCancel()}
              >
                Mégsem
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || posterUploading}>
                {saving ? "Mentés folyamatban…" : "Mentés"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

