// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import headerImage from "../assets/header.jpg";

export default function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("Mindenki");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(0);
  const [targetGroups, setTargetGroups] = useState([
    "Fiatalok",
    "Mindenki",
    "Idősek",
    "Fiatal házasok",
    "Érett házasok",
    "Jegyesek",
    "Tinédzserek",
    "Családok"
  ]);
  const pageSize = 9;

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const today = new Date().toISOString();
    let { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("start_date", today)
      .order("start_date", { ascending: true });

    if (error) console.log("Hiba az események lekérdezésénél:", error);
    else setEvents(data);
  }

  const filteredEvents = events.filter((event) => {
    // Filter célcsoportra
    if (filter !== "Mindenki" && event.target_group !== filter) return false;
    return true;
  });

  const paginatedEvents = filteredEvents.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="text-center mb-4">
        <img src={headerImage} alt="Katolikus lelkigyakorlat" className="img-fluid rounded" />
        <h1 className="mt-3">Katolikus Lelkigyakorlat-kereső</h1>
        <h4>Találd meg azt a lelkigyakorlatot, ami neked szól!</h4>
      </div>

      {/* Figyelmeztetés csak nem belépett usernek */}
      {!user && (
        <div className="alert alert-info text-center">
          Lelkigyakorlat létrehozásához be kell lépned, majd belépés után tudod a saját eseményeidet törölni vagy módosítani.
		  A lelkigyakorlatok böngészése belépés nélkül is működik.
        </div>
      )}

      <div className="row">
        {/* Bal oldali filterek */}
        <div className="col-md-3 mb-3">
          <strong>Célcsoport:</strong>
          <div className="d-flex flex-column mt-2">
            {targetGroups.map((group) => (
              <button
                key={group}
                className={`btn btn-outline-primary mb-2 ${filter === group ? "active" : ""}`}
                onClick={() => { setFilter(group); setPage(0); setSelectedEvent(null); }}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Jobb oldali események */}
        <div className="col-md-9">
          {paginatedEvents.length === 0 && <p>Nincs elérhető esemény ehhez a célcsoporthoz.</p>}

          {paginatedEvents.map((event) => (
            <div key={event.id} className="card mb-3" onClick={() => setSelectedEvent(event)}>
              <div className="card-body">
                <h5 className="card-title">{event.title}</h5>
                <p className="card-text">{event.location} – {new Date(event.start_date).toLocaleString()}</p>
                {selectedEvent && selectedEvent.id === event.id && (
                  <div className="mt-2">
                    <p><strong>Leírás:</strong> {event.description}</p>
                    <p><strong>Célcsoport:</strong> {event.target_group}</p>
                    <p><strong>Befejezés:</strong> {new Date(event.end_date).toLocaleString()}</p>
                    <p><strong>Kapcsolattartó:</strong> {event.contact}</p>
                    <p><strong>Szervező közösség:</strong> {event.community}</p>
                    <p><strong>Jelentkezés link:</strong> <a href={event.registration_link}>{event.registration_link}</a></p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Tovább gomb */}
          {filteredEvents.length > pageSize * (page + 1) && (
            <button className="btn btn-primary" onClick={() => setPage(page + 1)}>Tovább</button>
          )}
        </div>
      </div>
    </div>
  );
}
