// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import placeholderImage from "../assets/placeholder.jpg";
import { Modal, Button } from "react-bootstrap";

export default function EventList({ user, onEdit }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch events along with community name; filter only future events
  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select(
        `id, name, description, start_date, end_date, registration_link, contact, target_audience, created_by, communities (id, name)`
      )
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });
    if (error) {
      console.error("Hiba az események lekérdezésekor:", error.message);
    } else {
      setEvents(data || []);
    }
  }

  // Apply free‑text and target audience filters
  const filteredEvents = events.filter((event) => {
    const matchesFilter =
      filter === "" ||
      event.name?.toLowerCase().includes(filter.toLowerCase()) ||
      event.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesAudience =
      targetAudience === "" || event.target_audience === targetAudience;
    return matchesFilter && matchesAudience;
  });

  // Optional: My events filter (user's own events)
  const myEvents = filter === "myEvents";
  const displayedEvents = myEvents
    ? events.filter((event) => event.created_by === user?.id)
    : filteredEvents.slice(0, visibleCount);

  // Format date/time nicely
  const formatDateTime = (dt) => {
    if (!dt) return "";
    const date = new Date(dt);
    return date.toLocaleString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mt-4">
      {/* Info for anonymous users */}
      {!user && (
        <div className="alert alert-info text-center mb-3">
          Lelkigyakorlatok létrehozásához be kell lépned, ezután tudod a saját
          eseményeidet törölni vagy módosítani. A lelkigyakorlatok böngészése
          belépés nélkül is működik. Jó böngészést!
        </div>
      )}

      <div className="row">
        {/* Filter column */}
        <div className="col-md-3">
          <h5>Szűrés</h5>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Keresés név vagy leírás alapján..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <select
              className="form-select"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            >
              <option value="">Válassz célcsoportot</option>
              <option value="Fiatalok">Fiatalok</option>
              <option value="Mindenki">Mindenki</option>
              <option value="Idősek">Idősek</option>
              <option value="Fiatal házasok">Fiatal házasok</option>
              <option value="Érett házasok">Érett házasok</option>
              <option value="Jegyesek">Jegyesek</option>
              <option value="Tinédzserek">Tinédzserek</option>
              <option value="Családok">Családok</option>
            </select>
          </div>
          {user && (
            <button
              className={`btn btn-outline-secondary w-100 ${filter === "myEvents" ? "active" : ""}`}
              onClick={() => setFilter(filter === "myEvents" ? "" : "myEvents")}
            >
              Saját eseményeim
            </button>
          )}
        </div>

        {/* Cards column */}
        <div className="col-md-9">
          <div className="row">
            {displayedEvents.length === 0 && (
              <p className="text-center">Nincs elérhető esemény</p>
            )}
            {displayedEvents.map((event) => (
              <div className="col-md-4 mb-4" key={event.id}>
                <div
                  className="card h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* image placeholder */}
                  <img
                    src={placeholderImage}
                    alt="Esemény"
                    className="card-img-top"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{event.name}</h5>
                    <p className="card-text text-truncate">{event.description}</p>
                    <p className="card-text">
                      <strong>Szervező közösség:</strong>{" "}
                      {event.communities?.name || "Nincs megadva"}
                    </p>
                    {/* Edit button only for creator */}
                    {user && event.created_by === user.id && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEdit) onEdit(event);
                        }}
                      >
                        ✏️ Szerkesztés
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Load more / less buttons */}
          {!myEvents && displayedEvents.length < filteredEvents.length && (
            <div className="text-center mt-3">
              <button
                className="btn btn-primary"
                onClick={() => setVisibleCount(visibleCount + 9)}
              >
                Tovább
              </button>
            </div>
          )}
          {!myEvents && visibleCount > 9 && (
            <div className="text-center mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => setVisibleCount(9)}
              >
                Vissza
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details modal for selected event */}
      {selectedEvent && (
        <Modal show onHide={() => setSelectedEvent(null)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Leírás:</strong> {selectedEvent.description}</p>
            <p><strong>Célcsoport:</strong> {selectedEvent.target_audience}</p>
            <p><strong>Kezdés:</strong> {formatDateTime(selectedEvent.start_date)}</p>
            <p><strong>Befejezés:</strong> {formatDateTime(selectedEvent.end_date)}</p>
            <p><strong>Kapcsolattartó:</strong> {selectedEvent.contact}</p>
            <p>
              <strong>Szervező közösség:</strong> {selectedEvent.communities?.name || "Nincs megadva"}
            </p>
            <p>
              <strong>Jelentkezési link:</strong> {" "}
              <a href={selectedEvent.registration_link} target="_blank" rel="noopener noreferrer">
                {selectedEvent.registration_link}
              </a>
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Bezárás
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

