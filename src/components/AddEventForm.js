// src/components/AddEventForm.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function AddEventForm({ onBack }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [customTargetGroup, setCustomTargetGroup] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contact, setContact] = useState("");
  const [community, setCommunity] = useState("");
  const [customCommunity, setCustomCommunity] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [message, setMessage] = useState("");

  const [targetGroups, setTargetGroups] = useState([]);
  const [communities, setCommunities] = useState([]);

  // Célcsoportok betöltése
  useEffect(() => {
    const fetchTargetGroups = async () => {
      const { data, error } = await supabase.from("target_groups").select("name");
      if (!error && data) {
        setTargetGroups([
          ...data.map((item) => item.name),
          "Egyéb / Új célcsoport",
        ]);
      }
    };
    fetchTargetGroups();
  }, []);

  // Közösségek betöltése
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase.from("communities").select("name");
      if (!error && data) {
        setCommunities([
          ...data.map((item) => item.name),
          "Egyéb / Új közösség",
        ]);
      }
    };
    fetchCommunities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalTargetGroup =
      targetGroup === "Egyéb / Új célcsoport" ? customTargetGroup : targetGroup;

    const finalCommunity =
      community === "Egyéb / Új közösség" ? customCommunity : community;

    // beszúrjuk az eseményt
    const { error } = await supabase.from("events").insert([
      {
        title,
        description,
        target_group: finalTargetGroup,
        start_date: startDate,
        end_date: endDate,
        contact,
        community: finalCommunity,
        registration_link: registrationLink,
      },
    ]);

    if (error) {
      setMessage("Hiba történt: " + error.message);
      return;
    }

    // ha új célcsoportot adott meg → mentjük
    if (targetGroup === "Egyéb / Új célcsoport" && customTargetGroup) {
      await supabase.from("target_groups").insert([{ name: customTargetGroup }]);
    }

    // ha új közösséget adott meg → mentjük
    if (community === "Egyéb / Új közösség" && customCommunity) {
      await supabase.from("communities").insert([{ name: customCommunity }]);
    }

    setMessage("Sikeresen hozzáadva!");

    // űrlap ürítése
    setTitle("");
    setDescription("");
    setTargetGroup("");
    setCustomTargetGroup("");
    setStartDate("");
    setEndDate("");
    setContact("");
    setCommunity("");
    setCustomCommunity("");
    setRegistrationLink("");
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        &larr; Vissza
      </button>

      <div className="row">
        {/* Bal oldali kép */}
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <img
            src={require("../assets/addevent.jpg")}
            alt="Lelkigyakorlat"
            className="img-fluid rounded shadow"
          />
        </div>

        {/* Jobb oldali űrlap */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm">
            <h2 className="mb-4">Lelkigyakorlat hozzáadása</h2>

            <form onSubmit={handleSubmit}>
              {/* Megnevezés */}
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

              {/* Leírás */}
              <div className="mb-3">
                <label className="form-label">Leírás</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Célcsoport */}
              <div className="mb-3">
                <label className="form-label">Célcsoport</label>
                <select
                  className="form-select"
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  required
                >
                  <option value="">-- Válassz célcsoportot --</option>
                  {targetGroups.map((group, index) => (
                    <option key={index} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {targetGroup === "Egyéb / Új célcsoport" && (
                <div className="mb-3">
                  <label className="form-label">Új célcsoport</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pl. Egyetemisták"
                    value={customTargetGroup}
                    onChange={(e) => setCustomTargetGroup(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Kezdés */}
              <div className="mb-3">
                <label className="form-label">Kezdés</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              {/* Befejezés */}
              <div className="mb-3">
                <label className="form-label">Befejezés</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              {/* Kapcsolattartó */}
              <div className="mb-3">
                <label className="form-label">Kapcsolattartó</label>
                <input
                  type="email"
                  className="form-control"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>

              {/* Szervező közösség */}
              <div className="mb-3">
                <label className="form-label">Szervező közösség</label>
                <select
                  className="form-select"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  required
                >
                  <option value="">-- Válassz közösséget --</option>
                  {communities.map((comm, index) => (
                    <option key={index} value={comm}>
                      {comm}
                    </option>
                  ))}
                </select>
              </div>

              {community === "Egyéb / Új közösség" && (
                <div className="mb-3">
                  <label className="form-label">Új közösség</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pl. Piarista közösség"
                    value={customCommunity}
                    onChange={(e) => setCustomCommunity(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Jelentkezési link */}
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
