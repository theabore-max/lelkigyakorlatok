// src/components/AddEventForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; 
import placeholderImg from "../assets/addevent.jpg";

export default function AddEventForm({ onBack, user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contact, setContact] = useState("");
  const [community, setCommunity] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [communities, setCommunities] = useState([]);

  // Alap célcsoportok (nem az adatbázisból)
  const defaultTargetGroups = [
    "Fiatalok",
    "Mindenki",
    "Idősek",
    "Fiatal házasok",
    "Érett házasok",
    "Jegyesek",
    "Tinédzserek",
    "Családok",
    "Egyéb / Új célcsoport",
  ];

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase.from("communities").select("name");
      if (!error && data) setCommunities(data.map((c) => c.name));
    };
    fetchCommunities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("events").insert([
      {
        title,
        description,
        target_group: targetGroup,
        start_date: startDate,
        end_date: endDate,
        contact,
        community,
        registration_link: registrationLink,
        user_id: user?.id,
      },
    ]);

    if (error) {
      alert("Hiba az esemény mentésekor: " + error.message);
    } else {
      alert("Esemény sikeresen hozzáadva!");
      onBack();
    }
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        &larr; Vissza
      </button>

      <div className="row">
        {/* Bal oldali kép */}
        <div className="col-md-6 d-flex align-items-center">
          <img src={placeholderImg} alt="Esemény hozzáadása" className="img-fluid rounded" />
        </div>

        {/* Jobb oldali űrlap */}
        <div className="col-md-6">
          <h2>Új lelkigyakorlat hozzáadása</h2>
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
              <small className="text-muted fst-italic">Pl. Fiatalok lelkigyakorlata</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Leírás *</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
              <small className="text-muted fst-italic">Rövid összefoglaló a lelkigyakorlatról</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Célcsoport *</label>
              <select
                className="form-select"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                required
              >
                <option value="">-- Válassz célcsoportot --</option>
                {defaultTargetGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              <small className="text-muted fst-italic">Válaszd ki, kiknek szól elsősorban</small>
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
              <small className="text-muted fst-italic">Pl. 2025-10-09 18:00</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Befejezés</label>
              <input
                type="datetime-local"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <small className="text-muted fst-italic">Pl. 2025-10-10 12:00</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Kapcsolattartó *</label>
              <input
                type="email"
                className="form-control"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
              <small className="text-muted fst-italic">Email cím a kérdésekhez</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Szervező közösség *</label>
              <input
                type="text"
                className="form-control"
                list="communities"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                required
              />
              <datalist id="communities">
                {communities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <small className="text-muted fst-italic">Kezdj el gépelni, a meglévő közösségeket felajánlja</small>
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
              <small className="text-muted fst-italic">Weboldal címe vagy e-mail cím</small>
            </div>

            <button type="submit" className="btn btn-primary">Hozzáadás</button>
          </form>

          <p className="mt-3 text-muted fst-italic">
            A *-al jelölt mezők kitöltése kötelező
          </p>
        </div>
      </div>
    </div>
  );
}
