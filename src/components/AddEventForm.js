// src/components/AddEventForm.js
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import addEventImage from "../assets/addevent.jpg";
import "./AddEventForm.css";

export default function AddEventForm({ user, onEventAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contact, setContact] = useState("");
  const [community, setCommunity] = useState("");
  const [communitySuggestions, setCommunitySuggestions] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [registrationLink, setRegistrationLink] = useState("");
  const [location, setLocation] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const [error, setError] = useState(null);

  const targetGroups = [
    "Fiatalok",
    "Mindenki",
    "Idősek",
    "Fiatal házasok",
    "Érett házasok",
    "Jegyesek",
    "Tinédzserek",
    "Családok",
  ];

  // Közösségek lekérése
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase.from("communities").select("*");
      if (!error) setCommunities(data);
    };
    fetchCommunities();
  }, []);

  // Kattintás kívülről bezárja a javaslatlistát
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCommunityChange = (e) => {
    const value = e.target.value;
    setCommunity(value);

    if (!value) {
      setCommunitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const suggestions = communities
      .filter((c) => c.name.toLowerCase().includes(value.toLowerCase()))
      .map((c) => c.name);
    setCommunitySuggestions(suggestions);
    setShowSuggestions(true);
  };

  const handleCommunitySelect = (name) => {
    setCommunity(name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !targetGroup || !startDate || !contact || !registrationLink) {
      alert("Kérlek töltsd ki a kötelező mezőket!");
      return;
    }

    let communityId = null;
    const existing = communities.find(
      (c) => c.name.toLowerCase() === community.toLowerCase()
    );
    if (existing) {
      communityId = existing.id;
    } else if (community.trim() !== "") {
      const { data: newCommunity, error: insertError } = await supabase
        .from("communities")
        .insert([{ name: community }])
        .select();
      if (insertError) {
        alert("Hiba a közösség létrehozásakor: " + insertError.message);
        return;
      }
      communityId = newCommunity[0].id;
    }

    const { error } = await supabase.from("events").insert([
      {
        title,
        description,
		location,
        target_group: targetGroup,
        start_date: startDate,
        end_date: endDate,
        contact,
        community_id: communityId,
        registration_link: registrationLink,
        created_by: user?.id,
      },
    ]);

    if (error) {
    setError(error.message);
  } else {
    setError(null);
    alert("Esemény sikeresen hozzáadva!");
    if (onEventAdded) onEventAdded();  // <-- visszalépés a főoldalra
  }
  };

  return (
    <div className="container mt-4">
      <h2>Lelkigyakorlat hozzáadása</h2>
      <form onSubmit={handleSubmit} className="row g-3 mt-2">
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <img src={addEventImage} alt="Lelkigyakorlat" className="img-fluid rounded" />
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Megnevezés *</label>
            <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
            <small className="form-text text-muted fst-italic">Pl. Fiatalok lelkigyakorlata</small>
          </div>

          <div className="mb-3">
            <label className="form-label">Leírás</label>
            <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
		  
          <div className="mb-3">
            <label className="form-label">Helyszín *</label>
            <input type="text" className="form-control" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
		  
          <div className="mb-3">
            <label className="form-label">Célcsoport *</label>
            <select className="form-select" value={targetGroup} onChange={e => setTargetGroup(e.target.value)}>
              <option value="">Válassz célcsoportot</option>
              {targetGroups.map((tg) => (
                <option key={tg} value={tg}>{tg}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Kezdés *</label>
            <input type="datetime-local" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Befejezés</label>
            <input type="datetime-local" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Kapcsolattartó *</label>
            <input type="text" className="form-control" value={contact} onChange={e => setContact(e.target.value)} />
          </div>

          <div className="mb-3 position-relative" ref={wrapperRef}>
            <label className="form-label">Szervező közösség</label>
            <input
              type="text"
              className="form-control"
              placeholder="Kezd el írni a közösség nevét..."
              value={community}
              onChange={handleCommunityChange}
            />
            <ul className={`list-group position-absolute w-100 shadow-sm suggestions ${showSuggestions ? "show" : ""}`}>
              {communitySuggestions.map((name) => (
                <li key={name} className="list-group-item list-group-item-action" onClick={() => handleCommunitySelect(name)}>
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-3">
            <label className="form-label">Jelentkezési link *</label>
            <input type="url" className="form-control" value={registrationLink} onChange={e => setRegistrationLink(e.target.value)} />
            <small className="form-text text-muted fst-italic">Weboldal címe vagy e-mail cím</small>
          </div>

          <button type="submit" className="btn btn-primary">Hozzáadás</button>
          <p className="mt-2"><small className="text-muted">A *-al jelölt mezők kötelezőek</small></p>
        </div>
      </form>
    </div>
  );
}
