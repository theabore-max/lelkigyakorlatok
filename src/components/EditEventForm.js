// src/components/EditEventForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import editEventImage from "./assets/edit-event.jpg";

export default function EditEventForm({ event, onCancel, onSuccess }) {
  // Helper: ISO -> datetime-local
  const toLocalInput = (val) => {
    if (!val) return "";
    const d = new Date(val);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  // Alap állapotok
  const [title, setTitle] = useState(event.title || "");
  const [description, setDescription] = useState(event.description || "");
  const [targetGroup, setTargetGroup] = useState(event.target_group || "");
  const [startDate, setStartDate] = useState(toLocalInput(event.start_date));
  const [endDate, setEndDate] = useState(toLocalInput(event.end_date));
  const [contact, setContact] = useState(event.contact || "");
  const [communityId, setCommunityId] = useState(""); // mindig string
  const [registrationLink, setRegistrationLink] = useState(
    event.registration_link || ""
  );

  const [communities, setCommunities] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // A közösség előválasztása: community_id vagy a join-olt communities.id
  useEffect(() => {
    const initial = event?.community_id ?? event?.communities?.id ?? "";
    setCommunityId(initial ? String(initial) : "");
  }, [event]);

  // Közösségek betöltése
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase.from("communities").select("*");
      if (!error && Array.isArray(data)) setCommunities(data);
    };
    fetchCommunities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        title,
        description,
        target_group: targetGroup,
        // datetime-local -> ISO
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        contact,
        community_id: communityId ? Number(communityId) : null,
        registration_link: registrationLink,
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
        setError(
          "A frissítés nem hajtódott végre (0 sor). Lehet, hogy nincs jogosultságod."
        );
        return;
      }

      // Siker: a szülő bezárja a modalt és frissíti a listát
      onSuccess && onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Bal oldali kép */}
        <div className="col-md-6">
          <img
            src={editEventImage}
            alt="Esemény szerkesztése"
            className="img-fluid rounded"
          />
        </div>

        {/* Jobb oldali űrlap */}
        <div className="col-md-6">
          <h2>Esemény szerkesztése</h2>
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
                <option value="Fiatalok">Fiatalok</option>
                <option value="Mindenki">Mindenki</option>
                <option value="Idősek">Idősek</option>
                <option value="Fiatal házasok">Fiatal házasok</option>
                <option value="Érett házasok">Érett házasok</option>
                <option value="Jegyesek">Jegyesek</option>
                <option value="Tinédzserek">Tinédzserek</option>
                <option value="Családok">Családok</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Kezdés *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Befejezés</label>
              <input
                type="datetime-local"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onCancel && onCancel()}
              >
                Mégsem
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Mentés folyamatban..." : "Mentés"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
