// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function EventList({ user, onEdit }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("Mindenki");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_date", today)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Hiba az események lekérésekor:", error);
        setEvents([]);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const filteredEvents = events
    .filter(e => filter === "Mindenki" || e.target_group === filter)
    .filter(
      e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="row mt-4">
      <div className="col-md-3">
        <h5>Filter célcsoportra:</h5>
        <ul className="list-group mb-3">
          {[
            "Mindenki",
            "Fiatalok",
            "Idősek",
            "Fiatal házasok",
            "Érett házasok",
            "Jegyesek",
            "Tinédzserek",
            "Családok"
          ].map(group => (
            <li
              key={group}
              className={`list-group-item ${filter === group ? "active" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setFilter(group)}
            >
              {group}
            </li>
          ))}
        </ul>

        <h5>Keresés:</h5>
        <input
          type="text"
          className="form-control"
          placeholder="Kulcsszó..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="col-md-9">
        <h5>Események:</h5>
        {loading ? (
          <p>Betöltés...</p>
        ) : filteredEvents.length === 0 ? (
          <p>Nincs elérhető esemény ehhez a szűréshez.</p>
        ) : (
          filteredEvents.map(e => (
            <div key={e.id} className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">{e.title}</h5>
                <p className="card-text">
                  Szervező: {e.organizer} <br />
                  Kezdés: {e.start_date} <br />
                  Célcsoport: {e.target_group}
                </p>

                {expandedId === e.id && (
                  <div className="mt-2">
                    <p>
                      Helyszín: {e.location || "-"} <br />
                      Leírás: {e.description || "-"} <br />
                      Kapcsolattartó: {e.contact || "-"}
                    </p>
                    {e.registration_link && (
                      <a
                        href={e.registration_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                      >
                        Jelentkezés
                      </a>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-link mt-2"
                  onClick={() =>
                    setExpandedId(expandedId === e.id ? null : e.id)
                  }
                >
                  {expandedId === e.id ? "Bezár" : "Részletek"}
                </button>

                {user && e.user_id === user.id && (
                  <button
                    className="btn btn-warning mt-2 ms-2"
                    onClick={() => onEdit(e.id)}
                  >
                    Szerkesztés
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



