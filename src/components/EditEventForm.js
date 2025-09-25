// src/components/EditEventForm.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function EditEventForm({ user, eventId, onFinish }) {
  const [eventData, setEventData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) {
        setMessage("Hiba az esemény lekérésekor: " + error.message);
      } else if (data.user_id !== user.id) {
        setMessage("Nem szerkesztheted ezt az eseményt.");
      } else {
        setEventData(data);
      }
    };
    fetchEvent();
  }, [eventId, user.id]);

  const handleChange = (field, value) => {
    setEventData({ ...eventData, [field]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { error } = await supabase
      .from("events")
      .update(eventData)
      .eq("id", eventId);

    if (error) {
      setMessage("Hiba a mentéskor: " + error.message);
    } else {
      setMessage("Sikeresen frissítve!");
      if (onFinish) onFinish();
    }
  };

  if (!eventData) return <p>{message || "Betöltés..."}</p>;

  return (
    <div className="container mt-4">
      <h3>Esemény szerkesztése</h3>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        {[
          "title",
          "start_date",
          "end_date",
          "location",
          "description",
          "target_group",
          "contact",
          "organizer",
          "registration_link"
        ].map(field => (
          <div className="mb-3" key={field}>
            <label className="form-label">{field.replace("_", " ")}</label>
            <input
              type={field.includes("date") ? "date" : "text"}
              className="form-control"
              value={eventData[field] || ""}
              onChange={e => handleChange(field, e.target.value)}
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary">Mentés</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={onFinish}>
          Mégsem
        </button>
      </form>
    </div>
  );
}

