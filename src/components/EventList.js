// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import headerImage from "../assets/header.jpg";
import placeholderImage from "../card_1.jpg";

export default function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("Mindenki");
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const fetchEvents = async () => {
    let query = supabase
      .from("events")
      .select("*, community:community_id(name)")
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (filter !== "Mindenki") {
      query = query.eq("target_group", filter);
    }

    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) console.error("Hiba az események lekérésekor:", error);
    else {
      setEvents(data);
      setSelectedEvent(null); // új filter esetén eltünteti a részleteket
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter, page]);

  const targetGroups = [
    "Mindenki",
    "Fiatalok",
    "Idősek",
    "Fiatal házasok",
    "Érett házasok",
    "Jegyesek",
    "Tinédzserek",
    "Családok"
  ];

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="text-center mb-4">
        <img src={headerImage} alt="Katolikus lelkigyakorlat" className="img-fluid rounded" />
        <h1 className="mt-3">Katolikus Lelkigyakorlat-kereső</h1>
        <h4>Találd meg azt a lelkigyakorlatot, ami neked szól!</h4>
      </div>

      <div className="row">
        {/* Bal oldali filterek */}
        <div className="col-md-3 mb-3">
          <strong>Célcsoport:</strong>
          <div className="d-flex flex-column mt-2">
            {targetGroups.map((group) => (
              <button
                key={group}
                className={`btn btn-outline-primary mb-2 ${filter === group ? "active" : ""}`}
                onClick={() => { setFilter(group); setPage(0); }}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Jobb oldali események */}
        <div className="col-md-9">
          <div className="row">
            {events.length === 0 && (
              <p className="mt-3">Nincs elérhető esemény a kiválasztott feltételhez.</p>
            )}
            {events.map((event) => (
              <div className="col-md-6 mb-4" key={event.id}>
                <div
                  className="card h-100 shadow-sm"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setSelectedEvent(selectedEvent?.id === event.id ? null : event)
                  }
                >
                  <img
                    src={placeholderImage}
                    className="card-img-top"
                    alt="Esemény"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{event.title}</h5>
                    <p className="card-text"><strong>Cím:</strong> {event.location}</p>
                    <p className="card-text"><strong>Szervező:</strong> {event.community?.name}</p>
                    <p className="card-text"><strong>Kezdés:</strong> {new Date(event.start_date).toLocaleString()}</p>

                    {selectedEvent?.id === event.id && (
                      <div className="mt-2">
                        <button className="btn btn-secondary mb-2" onClick={() => setSelectedEvent(null)}>
                          &larr; Vissza
                        </button>
                        <p><strong>Befejezés:</strong> {new Date(event.end_date).toLocaleString()}</p>
                        <p><strong>Leírás:</strong> {event.description}</p>
                        <p><strong>Célcsoport:</strong> {event.target_group}</p>
                        <p><strong>Kapcsolattartó:</strong> {event.contact}</p>
                        <p>
                          <strong>Jelentkezés link:</strong>{" "}
                          <a href={event.registration_link} target="_blank" rel="noreferrer">{event.registration_link}</a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lapozás */}
          {events.length === pageSize && (
            <button className="btn btn-primary mt-3" onClick={() => setPage(page + 1)}>
              Tovább
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

