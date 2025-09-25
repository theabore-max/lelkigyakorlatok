// src/components/EditEventForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function EditEventForm({ setPage, user, eventId }) {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) {
        setMessage("Nem sikerült betölteni az eseményt: " + error.message);
      } else {
        setForm(data);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatDateForInput = (val) => {
    if (!val) return "";
    // ha ISO datetime van (2025-03-01T...), vágjuk le a dátum részre
    return typeof val === "string" && val.includes("T") ? val.split("T")[0] : val;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form) {
      setMessage("Nincs szerkeszthető adat.");
      return;
    }

    try {
      const updatePayload = {
        title: form.title,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        location: form.location,
        target_group: form.target_group,
        organizer: form.organizer,
        contact: form.contact,
        registration_link: form.registration_link,
      };

      // Frissítés: csak a saját eseményét frissítheti a user
      const { error } = await supabase
        .from("events")
        .update(updatePayload)
        .eq("id", eventId)
        .eq("created_by", user?.id ?? null);

      if (error) throw error;
      setMessage("Esemény frissítve.");
      setTimeout(() => setPage("home"), 900);
    } catch (err) {
      setMessage("Hiba: " + err.message);
    }
  };

  if (!form) return <div className="container mt-4">Betöltés...</div>;

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-3" onClick={() => setPage("home")}>
        Vissza
      </button>

      <h2>Esemény szerkesztése</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input
            name="title"
            className="form-control"
            placeholder="Megnevezés"
            value={form.title || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2">
          <textarea
            name="description"
            className="form-control"
            placeholder="Leírás"
            value={form.description || ""}
            onChange={handleChange}
          />
        </div>

        <div className="row">
          <div className="col mb-2">
            <input
              name="start_date"
              className="form-control"
              type="date"
              value={formatDateForInput(form.start_date)}
              onChange={handleChange}
            />
          </div>

          <div className="col mb-2">
            <input
              name="end_date"
              className="form-control"
              type="date"
              value={formatDateForInput(form.end_date)}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-2">
          <input
            name="location"
            className="form-control"
            placeholder="Helyszín"
            value={form.location || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2">
          <input
            name="target_group"
            className="form-control"
            placeholder="Célcsoport"
            value={form.target_group || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2">
          <input
            name="organizer"
            className="form-control"
            placeholder="Szervező közösség"
            value={form.organizer || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2">
          <input
            name="contact"
            className="form-control"
            placeholder="Kapcsolattartó"
            value={form.contact || ""}
            onChange={handleChange}
          />
        </div>

        <div className="mb-2">
          <input
            name="registration_link"
            className="form-control"
            placeholder="Jelentkezési link"
            value={form.registration_link || ""}
            onChange={handleChange}
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Mentés
        </button>
      </form>

      {message && <div className="alert alert-info mt-2">{message}</div>}
    </div>
  );
}
