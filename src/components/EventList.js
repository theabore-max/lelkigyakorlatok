// src/components/EventList.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import placeholderImage from "../assets/placeholder.jpg";
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

  return (
    <div className="container mt-4">
      {/* Figyelmeztetés csak nem belépett usernek */}
      {!user && (
        <div className="alert alert-info text-center">
          Lelkigyakorlatok létrehozásához be kell lépned, ezután tudod a saját
          eseményeidet törölni vagy módosítani. A lelkigyakorlatok böngészése
          belépés nélkül is működik. Jó böngészést!
        </div>
      )}

      {/* Kép és cím */}
      <div className="text-center mb-4">
        <img
          src={placeholderImage}
          alt="Lelkigyakorlat"
          className="img-fluid rounded mb-3"
          style={{ maxHeight: "200px" }}
        />
        <h1>Katolikus Lelkigyakorlat-kereső</h1>
      </div>

      {/* Szűrők */}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Keresés név vagy leírás alapján..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          >
            <option value="">Válassz célcsoportot</option>
            <option value="Fiatalok">Fiatalok</option>
            <option value="Családok">Családok</option>
            <option value="Papok">Papok</option>
            <option value="Szerzetesek">Szerzetesek</option>
          </select>
        </div>
      </div>

      {/* Esemény kártyák */}
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
                <p className="card-text">{event.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tovább gomb */}
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

      {/* Vissza gomb */}
      {visibleCount > 9 && (
        <div className="text-center mt-3">
          <button className="btn btn-secondary" onClick={() => setVisibleCount(9)}>
            Vissza
          </button>
        </div>
      )}

      {/* Modal az esemény részleteihez */}
      {selectedEvent && (
        <Modal show onHide={() => setSelectedEvent(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Leírás:</strong> {selectedEvent.description}</p>
            <p><strong>Célcsoport:</strong> {selectedEvent.target_audience}</p>
            <p><strong>Kezdés:</strong> {selectedEvent.start_date}</p>
            <p><strong>Befejezés:</strong> {selectedEvent.end_date}</p>
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
