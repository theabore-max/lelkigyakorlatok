// src/components/EventList.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import placeholderImage from "../assets/card_1.jpg";
import { Modal, Button } from "react-bootstrap";

export default function EventList({ user, onEdit }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Jövőbeli események lekérése a kapcsolt közösség adataival
  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
		  location,
          description,
          start_date,
          end_date,
          registration_link,
          contact,
          target_audience,
          created_by,
          communities (id, name)
        `)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Hiba az események lekérdezésekor:", error.message);
      } else {
        setEvents(data || []);
      }
    }
    fetchEvents();
  }, []);

  // Szűrés név/leírás és célcsoport alapján
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      filter === "" ||
      ev.name?.toLowerCase().includes(filter.toLowerCase()) ||
      ev.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesAudience =
      targetAudience === ""
        ? true
        : targetAudience === "myEvents"
        ? user && ev.created_by === user.id
        : ev.target_group === targetAudience;
    return matchesSearch && matchesAudience;
  });

  return (
    <div className="container mt-4">
      {!user && (
        <div className="alert alert-info text-center mb-3">
          Lelkigyakorlatok létrehozásához be kell lépned. Csak a saját
          eseményeidet tudod törölni vagy módosítani. A böngészés belépés
          nélkül is működik. Jó böngészést!
        </div>
      )}

      <div className="row">
        {/* Bal oldali szűrők */}
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
              <option value="myEvents">Saját eseményeim</option>
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

        {/* Jobb oldali kártyák */}
        <div className="col-md-9">
          <div className="row">
            {filteredEvents.length === 0 && (
              <p className="text-center">Nincs elérhető esemény</p>
            )}
            {filteredEvents.map((ev) => (
              <div className="col-md-4 mb-4" key={ev.id}>
                <div
                  className="card h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <img
                    src={placeholderImage}
                    alt="Esemény"
                    className="card-img-top"
                    style={{ height: "20px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{ev.title}</h5>
                    <p className="card-text text-truncate">
                      {ev.description}
                    </p>
                    <p className="card-text">
                      <strong>Szervező:</strong>{" "}
                      {ev.communities?.title || "Nincs megadva"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Részletek modál */}
      {selectedEvent && (
        <Modal show onHide={() => setSelectedEvent(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Leírás:</strong> {selectedEvent.description}</p>
            <p><strong>Célcsoport:</strong> {selectedEvent.target_audience}</p>
            <p><strong>Kezdés:</strong> {new Date(selectedEvent.start_date).toLocaleString("hu-HU")}</p>
            <p><strong>Befejezés:</strong> {new Date(selectedEvent.end_date).toLocaleString("hu-HU")}</p>
            <p><strong>Kapcsolattartó:</strong> {selectedEvent.contact}</p>
            <p><strong>Szervező közösség:</strong> {selectedEvent.communities?.name || "Nincs megadva"}</p>
            <p>
              <strong>Jelentkezési link:</strong>{" "}
              <a href={selectedEvent.registration_link} target="_blank" rel="noreferrer">
                {selectedEvent.registration_link}
              </a>
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Vissza
            </Button>
            {/* Szerkesztés gomb csak a saját eseményekhez */}
            {user && selectedEvent && user.id === selectedEvent.created_by && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => onEdit(selectedEvent)}
              >
                ✏️ Szerkesztés
              </button>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}


