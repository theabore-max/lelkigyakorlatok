// src/components/EventList.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import placeholderImage from "../assets/card_1.jpg";
import { Modal, Button } from "react-bootstrap";

export default function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        registration_link,
        contact,
        target_audience,
        communities (id, name)
      `)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Hiba a lekérdezéskor:", error.message);
    } else {
      setEvents(data || []);
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesFilter =
      filter === "" ||
      event.name?.toLowerCase().includes(filter.toLowerCase()) ||
      event.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesAudience =
      targetAudience === "" || event.target_audience === targetAudience;
    return matchesFilter && matchesAudience;
  });

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  const formatDateTime = (datetime) => {
    if (!datetime) return "";
    const date = new Date(datetime);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString("hu-HU", options);
  };

  return (
    <div className="container mt-4">
      {!user && (
        <div className="alert alert-info text-center mb-3">
          Lelkigyakorlatok létrehozásához be kell lépned, ezután tudod a saját
          eseményeidet törölni vagy módosítani. A lelkigyakorlatok böngészése
          belépés nélkül is működik. Jó böngészést!
        </div>
      )}

      <div className="row">
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
        </div>

        <div className="col-md-9">
          <div className="row">
            {visibleEvents.map((event) => (
              <div className="col-md-4 mb-4" key={event.id}>
                <div
                  className="card h-100"
                  onClick={() => setSelectedEvent(event)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={placeholderImage}
                    alt="Esemény"
                    className="card-img-top"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{event.name}</h5>
                    <p className="card-text text-truncate">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {visibleCount < filteredEvents.length && (
            <div className="text-center mt-3">
              <button
                className="btn btn-primary"
                onClick={() => setVisibleCount(visibleCount + 9)}
              >
                Tovább
              </button>
            </div>
          )}

          {visibleCount > 9 && (
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

      {selectedEvent && (
        <Modal show onHide={() => setSelectedEvent(null)}>
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
              <strong>Szervező közösség:</strong>{" "}
              {selectedEvent.communities?.name || "Nincs megadva"}
            </p>
            <p>
              <strong>Jelentkezési link:</strong>{" "}
              <a
                href={selectedEvent.registration_link}
                target="_blank"
                rel="noopener noreferrer"
              >
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
