// src/components/AddEventForm.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddEventForm({ onBack }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [audience, setAudience] = useState("");
  const [description, setDescription] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [status, setStatus] = useState(null);
  const [communitySuggestions, setCommunitySuggestions] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !location || !organizer || !startDate || !audience) {
      setStatus({ success: false, message: "Kérlek, tölts ki minden kötelező mezőt!" });
      return;
    }

    try {
      // 🔹 Ellenőrizzük, hogy a közösség már létezik
      const { data: existing, error: checkError } = await supabase
        .from("communities")
        .select("*")
        .eq("name", organizer)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (!existing) {
        // új közösség beszúrása
        const { error: insertCommError } = await supabase
          .from("communities")
          .insert([{ name: organizer }]);
        if (insertCommError) throw insertCommError;
      }

      // 🔹 Beszúrjuk az eseményt
      const { error: insertEventError } = await supabase.from("events").insert([
        {
          title: name,
          location,
          organizer,
          start_date: startDate,
          audience,
          description,
          registration_link: registrationLink,
        },
      ]);
      if (insertEventError) throw insertEventError;

      setStatus({ success: true, message: "Lelkigyakorlat sikeresen hozzáadva!" });

      // mezők ürítése
      setName("");
      setLocation("");
      setOrganizer("");
      setStartDate("");
      setAudience("");
      setDescription("");
      setRegistrationLink("");
      setCommunitySuggestions([]);

    } catch (err) {
      console.error(err);
      setStatus({ success: false, message: "Hiba történt: " + err.message });
    }
  };

  // 🔹 Közösség keresés gépelés közben
  const handleOrganizerChange = async (e) => {
    const val = e.target.value;
    setOrganizer(val);

    if (val.length > 0) {
      const { data, error } = await supabase
        .from("communities")
        .select("name")
        .ilike("name", `${val}%`)
        .limit(5);
      if (!error) setCommunitySuggestions(data.map(d => d.name));
    } else {
      setCommunitySuggestions([]);
    }
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        &larr; Vissza
      </button>

      <h2>Lelkigyakorlat hozzáadása</h2>

      {status && (
        <div
          className={`alert ${status.success ? "alert-success" : "alert-danger"}`}
          role="alert"
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Megnevezés</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Helyszín</label>
          <input
            type="text"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="mb-3 position-relative">
          <label className="form-label">Szervező közösség</label>
          <input
            type="text"
            className="form-control"
            value={organizer}
            onChange={handleOrganizerChange}
            required
            autoComplete="off"
          />
          {communitySuggestions.length > 0 && (
            <ul className="list-group position-absolute w-100 z-index-10">
              {communitySuggestions.map((c, idx) => (
                <li
                  key={idx}
                  className="list-group-item list-group-item-action"
                  onClick={() => {
                    setOrganizer(c);
                    setCommunitySuggestions([]);
                  }}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Kezdés dátuma</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Célcsoport</label>
          <select
            className="form-control"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            required
          >
            <option value="">-- Válassz --</option>
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
          <label className="form-label">Leírás</label>
          <textarea
            className="form-control"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Jelentkezési link</label>
          <input
            type="url"
            className="form-control"
            value={registrationLink}
            onChange={(e) => setRegistrationLink(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Hozzáadás
        </button>
      </form>
    </div>
  );
}

