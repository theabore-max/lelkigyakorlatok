// src/components/AddEventForm.js
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import addEventImage from "../assets/addevent.jpg";
import "./AddEventForm.css"; // Ide kerüljön a CSS animáció

export default function AddEventForm({ user, onBack }) {
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
  const [showSuggestions, setShowSuggestions] = useState(false); // Új állapot
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase.from("communities").select("*");
      if (!error) setCommunities(data);
    };
    fetchCommunities();
  }, []);

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
      .filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      )
      .map((c) => c.name);
    setCommunitySuggestions(suggestions);
    setShowSuggestions(true); // Animáció indítása
  };

  const handleCommunitySelect = (name) => {
    setCommunity(name);
    setShowSuggestions(false); // Animáció a listára
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
        target_group: targetGroup,
        start_date: startDate,
        end_date: endDate,
        contact,
        community_id: communityId,
        registration_link: registrationLink,
        user_id: user?.id,
      },
    ]);

    if (error) alert("Hiba az esemény mentésekor: " + error.message);
    else onBack();
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        &larr; Vissza
      </button>
      <h2>Lelkigyakorlat hozzáadása</h2>
      <form onSubmit={handleSubmit} className="row g-3 mt-2">
        <div className="col-md-6">
          {/* ... többi mező ugyanaz ... */}

          <div className="mb-3 position-relative" ref={wrapperRef}>
            <label className="form-label">Szervező közösség</label>
            <input
              type="text"
              className="form-control"
              placeholder="Közösség neve vagy új"
              value={community}
              onChange={handleCommunityChange}
            />
            <ul
              className={`list-group position-absolute w-100 shadow-sm suggestions ${
                showSuggestions ? "show" : ""
              }`}
            >
              {communitySuggestions.map((name) => (
                <li
                  key={name}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleCommunitySelect(name)}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          {/* ... többi mező, submit gomb ... */}
        </div>

        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <img
            src={addEventImage}
            alt="Lelkigyakorlat"
            className="img-fluid rounded"
          />
        </div>
      </form>
    </div>
  );
}
