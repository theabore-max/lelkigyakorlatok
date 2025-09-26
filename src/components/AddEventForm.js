// src/components/AddEventForm.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddEventForm({ onBack }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [community, setCommunity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("events").insert([
      {
        title,
        location,
        community,
        start_date: startDate,
        end_date: endDate,
        description,
        registration_link: registrationLink,
      },
    ]);

    if (error) {
      setMessage("Hiba történt: " + error.message);
    } else {
      setMessage("Sikeresen hozzáadva!");
      setTitle("");
      setLocation("");
      setCommunity("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setRegistrationLink("");
    }
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        &larr; Vissza
      </button>

      <div className="row">
        {/* Bal oldal: kép */}
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <img
            src={require("../assets/addevent.jpg")}
            alt="Lelkigyakorlat"
            className="img-fluid rounded shadow"
          />
        </div>

        {/* Jobb oldal: űrlap */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm">
            <h2 className="mb-4">Lelkigyakorlat hozzáadása</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Megnevezés</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Cím</label>
                <input
                  type="text"
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Szervező közösség</label>
                <input
                  type="text"
                  className="form-control"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  required
                />
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
                <label className="form-label">Befejezés dátuma</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Leírás</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
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

            {message && <div className="mt-3 alert alert-info">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
