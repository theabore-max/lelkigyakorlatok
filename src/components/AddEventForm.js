import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import addEventImage from "../assets/addevent.jpg"; // az eredeti kép elérési útja

const STORAGE_BUCKET = "event-images";

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

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("communities").select("id,name").order("name");
      if (!error && Array.isArray(data)) setCommunities(data);
    })();
  }, []);

  // fallback illusztráció kategória szerint
  const getFallbackImage = (group) => {
    const safe = (group || "general").toLowerCase().replace(/\s+/g, "_");
    return `https://kibgskyyevsighwtkqcf.supabase.co/storage/v1/object/public/event-images/fallback/${safe}.jpg`;
  };

  // poszter validáció
  const validatePosterFile = (file) => {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) return "A poszter túl nagy (max. 5 MB).";
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) return "Csak JPG, PNG vagy WEBP engedélyezett.";
    return null;
  };

  async function uploadPoster(file) {
    if (!file) return null;
    const v = validatePosterFile(file);
    if (v) throw new Error(v);

    setPosterUploading(true);
    try {
      const clean = file.name.replace(/\s+/g, "-").toLowerCase();
      const path = `posters/${Date.now()}_${clean}`;
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
        source: "manual",
        created_by: currentUser?.id || null,
      };

      const { data, error } = await supabase.from("events").insert(payload).select("id").single();
      if (error) throw error;

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

  // --- RENDER ---

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
		 {/* BAL OLDALI KÉP – fix magasságú előnézet */}
		<div className="md:w-1/3 w-full flex flex-col items-center justify-start">
		  <div
			className="border rounded-md overflow-hidden shadow-sm bg-gray-50 w-full"
			style={{ height: 260 }}  // <- fix előnézet magasság
		  >
			<img
			  src={posterPreview || posterUrl || (targetGroup ? getFallbackImage(targetGroup) : addEventImage)}
			  alt="Esemény képe"
			  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
			/>
		  </div>
		  <p className="text-sm text-gray-500 mt-2">Illusztráció / poszter előnézet</p>
		</div>

      {/* JOBB OLDALI ŰRLAP */}
      <div className="md:w-2/3 w-full space-y-4">
        {error && <div className="alert alert-danger">{error}</div>}

        <div>
          <label className="block font-medium mb-1">Megnevezés *</label>
          <input
            className="border rounded w-full p-2"
            placeholder="Pl. Fiatalok lelkigyakorlata"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Leírás *</label>
          <textarea
            className="border rounded w-full p-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Helyszín *</label>
          <input
            className="border rounded w-full p-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Célcsoport *</label>
          <select
            className="border rounded w-full p-2"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium mb-1">Kezdés *</label>
            <input
              type="datetime-local"
              className="border rounded w-full p-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Befejezés</label>
            <input
              type="datetime-local"
              className="border rounded w-full p-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Kapcsolattartó *</label>
          <input
            className="border rounded w-full p-2"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Szervező közösség</label>
          <select
            className="border rounded w-full p-2"
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
          >
            <option value="">Kezdd el írni a közösség nevét…</option>
            {communities.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Jelentkezési link *</label>
          <input
            type="url"
            className="border rounded w-full p-2"
            placeholder="Weboldal címe vagy e-mail cím"
            value={registrationLink}
            onChange={(e) => setRegistrationLink(e.target.value)}
            required
          />
        </div>

        {/* POSZTER FELTÖLTÉS JOBB OLDALON */}
       <div className="border rounded p-3 bg-gray-50">
  <label className="block font-medium mb-2">Poszter feltöltése</label>
  <div className="flex items-center gap-2">
    <input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={onPosterChange}
    />
    <button
      type="button"
      className="px-3 py-2 rounded border"
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
        className="px-3 py-2 rounded border"
        onClick={() => { setPosterUrl(""); setPosterPreview(""); setPosterFile(null); }}
        title="Poszter eltávolítása"
      >
        Eltávolítás
      </button>
    )}
  </div>
  <p className="text-sm text-gray-500 mt-2">
    Ajánlott: 1200×630 (megosztáshoz), &lt; 5 MB, JPG/PNG/WebP.
  </p>
</div>


        <div className="flex justify-end gap-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={onCancel}>
            Mégsem
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white"
            disabled={saving || posterUploading}
          >
            {saving ? "Hozzáadás…" : "Hozzáadás"}
          </button>
        </div>
      </div>
    </form>
  );
}
