// src/components/AddEventForm.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddEventForm({ user }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [targetGroup, setTargetGroup] = useState("Mindenki");
  const [contact, setContact] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [organizerOptions, setOrganizerOptions] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOrganizers = async () => {
      const { data } = await supabase.from("events").select("organizer");
      const uniqueOrganizers = [...new Set(data.map(e => e.organizer).filter(Boolean))];
      setOrganizerOptions(uniqueOrganizers);
    };
    fetchOrganizers();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title || !startDate) {
      setMessage("A cím és a kezdés dátuma kötelező!");
      return;
    }

    const { error } = await supabase.from("events").insert([
      {
        title,
        start_date: startDate,
        end_date: endDate || null,
        location,
        description,
        target_group: targetGroup,
        contact,
        organizer,
        registration_link: registrationLink,
        user_id: user.id
      }
    ]);

    if (error) {
      setMessage("Hiba az esemény hozzáadásakor: " + error.message);
    } else {
      setMessage("Sikeresen hozzáadva!");
      // opcionálisan törölhetjük a mezőket
      setTitle(""); setStartDate(""); setEndDate(""); setLocation("");
      setDescription(""); setTargetGroup("Mindenki"); setContact("");
      setOrganizer(""); setRegistrationLink("");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Új lelkigyakorlat hozzáadása</h3>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Megnevezés</label>
          <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Kezdés dátuma</label>
          <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Befejezés dátuma</label>
          <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Helyszín</label>
          <input type="text" className="form-control" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Leírás</label>
          <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Célcsoport</label>
          <select className="form-select" value={targetGroup} onChange={e => setTargetGroup(e.target.value)}>
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
        <div className="mb-3">
          <label className="form-label">Kapcsolattartó</label>
          <input type="text" className="form-control" value={contact} onChange={e => setContact(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Szervező közösség</label>
          <input list="organizers" className="form-control" value={organizer} onChange={e => setOrganizer(e.target.value)} />
          <datalist id="organizers">
            {organizerOptions.map((o, idx) => <option key={idx} value={o} />)}
          </datalist>
        </div>
        <div className="mb-3">
          <label className="form-label">Jelentkezési link</label>
          <input type="url" className="form-control" value={registrationLink} onChange={e => setRegistrationLink(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">Hozzáadás</button>
      </form>
    </div>
  );
}

