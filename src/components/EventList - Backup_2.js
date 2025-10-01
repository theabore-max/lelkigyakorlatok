// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import headerImage from "../assets/header.jpg";
import placeholderImage from "../assets/card_1.jpg"; // placeholder kép
import { Modal, Button } from "react-bootstrap";

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
    "Családok",
	"Saját eseményeim",
  ]);
  const pageSize = 9;

  useEffect(() => {
    fetchEvents();
  }, []);

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
    contact,
	registration_link,    
    target_group,
    communities (id, name),
	location
  `)
  .gte("start_date", new Date().toISOString()) // csak jövőbeli események
  .order("start_date", { ascending: true });



    if (error) console.log("Hiba az események lekérdezésénél:", error);
    else setEvents(data);
  }

 // const filteredEvents = events.filter((event) => {
    //if (filter !== "Mindenki" && event.target_group !== filter) return false;
   // return true;
   
  //});
  const filteredEvents = events.filter((event) => {
  const matchesFilter =
    filter === '' ||
    event.name?.toLowerCase().includes(filter.toLowerCase()) ||
    event.description?.toLowerCase().includes(filter.toLowerCase());

  // ha a "Saját eseményeim" a célcsoport, csak a saját eseményeket hozza
  const matchesAudience =
    targetGroup === 'Saját eseményeim'
      ? user && event.created_by === user.id
      : targetGroup === '' || event.target_group === targetGroup;

  return matchesFilter && matchesAudience;
});

  const paginatedEvents = filteredEvents.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  return (
    <div className="container mt-4">
      {/* Figyelmeztetés csak nem belépett usernek */}
      {!user && (
        <div className="alert alert-info text-center">
          Lelkigyakorlatok létrehozásához be kell lépned, ezután tudod a saját eseményeidet törölni vagy módosítani. A lelkigyakorlatok böngészése belépés nélkül is működik. Jó böngészést!
        </div>
      )}
	  {/* Header */}
      <div className="text-center mb-4">
        <img
          src={headerImage}
          alt="Katolikus lelkigyakorlat"
          className="img-fluid rounded"
        />
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
                className={`btn btn-outline-primary mb-2 ${
                  filter === group ? "active" : ""
                }`}
                onClick={() => {
                  setFilter(group);
                  setPage(0);
                  setSelectedEvent(null);
                }}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Jobb oldali események */}
        <div className="col-md-9">
          {paginatedEvents.length === 0 && (
            <p>Nincs elérhető esemény ehhez a célcsoporthoz.</p>
          )}

          <div className="row">
            {paginatedEvents.map((event) => (
              <div key={event.id} className="col-md-4 mb-3">
                <div
                  className="card h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* Placeholder kép a kártya tetején, fix magasság */}
                  <img
                    src={placeholderImage}
                    className="card-img-top"
                    alt="Esemény"
                    style={{ height: "20px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{event.title}</h5>
                    <p className="card-text">
                      {event.location} –{" "}
                      {new Date(event.start_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tovább gomb */}
          {filteredEvents.length > pageSize * (page + 1) && (
            <button
              className="btn btn-primary mt-3"
              onClick={() => setPage(page + 1)}
            >
              Tovább
            </button>
          )}
        </div>
      </div>

      {/* Modal az esemény részletekhez */}
      {selectedEvent && (
        <Modal
          show={true}
          onHide={() => setSelectedEvent(null)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Leírás:</strong> {selectedEvent.description}
            </p>
            <p>
              <strong>Célcsoport:</strong> {selectedEvent.target_group}
            </p>
			<p>
              <strong>Helyszín:</strong> {selectedEvent.location}
            </p>
            <p>
              <strong>Kezdés:</strong>{" "}
              {new Date(selectedEvent.start_date).toLocaleString()}
            </p>
            <p>
              <strong>Befejezés:</strong>{" "}
              {new Date(selectedEvent.end_date).toLocaleString()}
            </p>
            <p>
              <strong>Kapcsolattartó:</strong> {selectedEvent.contact}
            </p>
            <p>
              <p><strong>Szervező közösség:</strong> {selectedEvent.communities?.name || "Nincs megadva"}</p>
            </p>
            <p>
              <strong>Jelentkezés link:</strong>{" "}
              <a
                href={selectedEvent.registration_link}
                target="_blank"
                rel="noreferrer"
              >
                {selectedEvent.registration_link}
              </a>
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Vissza
            </Button>
			{user && user.id === event.created_by && (
			<button
			className="btn btn-warning btn-sm"
			onClick={() => onEdit(event)}  // a PageContent.js-ből kapott callback
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

