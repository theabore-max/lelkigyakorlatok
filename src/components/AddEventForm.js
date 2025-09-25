// src/components/AddEventForm.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddEventForm({ setPage, user }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    target_group: "",
    organizer: "",
    contact: "",
    registration_link: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!form.title || !form.start_date) {
      setMessage("Kérlek töltsd ki a kötelező mezőket (név, kezdés).");
      return;
    }

    try {
      const { error } = await supabase.from("events").insert([
        {
          ...form,
          created_by: user?.id ?? null,
        },
      ]);

      if (error) throw error;
      setMessage("Esemény sikeresen létrehozva.");
      setTimeout(() => setPage("home"), 900);
    } catch (err) {
      setMessage("Hiba: " + err.message);
    }
  };

  return (
    <div className="container mt-4">
      <button
        className="btn btn-secondary mb-3"
        onClick={() => setPage("home")}
      >
        Vissza
      </button>
      <h2>Új lelkigyakorlat hozzáadása</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input
            name="title"
            className="form-control"
            placeholder="Megnevezés *"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <textarea
            name="description"
            className="form-control"
            placeholder="Leírás"
            value={form.description}
            onChange={handleChange}
          />
        </div>
        <div className="row">
          <div className="col mb-2">
            <input
              name="start_date"
              className="form-control"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col mb-2">
            <input
              name="end_date"
              className="form-control"
              type="date"
              value={form.end_date}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="mb-2">
          <input
            name="location"
            className="form-control"
            placeholder="Helyszín"
            value={form.location}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <input
            name="target_group"
            className="form-control"
            placeholder="Célcsoport"
            value={form.target_group}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <input
            name="organizer"
            className="form-control"
            placeholder="Szervező közösség"
            value={form.organizer}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <input
            name="contact"
            className="form-control"
            placeholder="Kapcsolattartó"
            value={form.contact}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <input
            name="registration_link"
            className="form-control"
            placeholder="Jelentkezési link"
            value={form.registration_link}
            onChange={handleChange}
          />
        </div>
        <button className="btn btn-success" type="submit">
          Mentés
        </button>
      </form>
      {message && <div className="alert alert-info mt-2">{message}</div>}
    </div>
  );
}
