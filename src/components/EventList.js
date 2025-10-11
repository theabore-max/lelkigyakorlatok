// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import headerImage from "../assets/header.jpg";
import placeholderImage from "../assets/card_1.jpg";
import { Modal, Button, Pagination } from "react-bootstrap";
import EditEventForm from "./EditEventForm";

export default function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("Mindenki");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [editEvent, setEditEvent] = useState(null);

  const [targetGroups] = useState([
    "Fiatalok",
    "Mindenki",
    "Idősek",
    "Fiatal házasok",
    "Érett házasok",
    "Jegyesek",
    "Tinédzserek",
    "Családok",
  ]);

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
        created_by
      `)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) console.log("Hiba az események lekérdezésénél:", error);
    else setEvents(data);
  }

  const filteredEvents = events.filter((event) => {
    if (filter === "sajat") {
      return user && event.created_by === user.id;
    }
    if (filter !== "Mindenki" && event.target_group !== filter) return false;
    return true;
  });

  // Lapozás számítások
  const total = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Lapozó oldalszámok ellipszisekkel
  function getVisiblePages() {
    const max = totalPages - 1;
    const win = 2; // ennyi oldal látszik a current körül
    let start = Math.max(0, page - win);
    let end = Math.min(max, page + win);
    const items = [];
    const addPage = (n) => items.push({ type: "page", n });
    const addDots = (key) => items.push({ type: "dots", key });

    if (start > 0) {
      addPage(0);
      if (start > 1) addDots("l");
    }
    for (let n = start; n <= end; n++) addPage(n);
    if (end < max) {
      if (end < max - 1) addDots("r");
      addPage(max);
    }
    return items;
  }

  // Lapozó komponens (felül és alul is használjuk)
  function renderPager() {
    return (
      <div className="d-flex align-items-center justify-content-between gap-3 mt-3">
        <div className="text-muted small">
          Eredmények: {total === 0 ? 0 : startIndex + 1}–{endIndex} / {total}
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm w-auto"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            <option value={9}>9 / oldal</option>
            <option value={12}>12 / oldal</option>
            <option value={24}>24 / oldal</option>
          </select>

          <Pagination className="mb-0">
            <Pagination.First disabled={page === 0} onClick={() => setPage(0)} />
            <Pagination.Prev
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            />
            {getVisiblePages().map((it, i) =>
              it.type === "dots" ? (
                <Pagination.Ellipsis disabled key={`dots-${it.key}-${i}`} />
              ) : (
                <Pagination.Item
                  key={it.n}
                  active={it.n === page}
                  onClick={() => setPage(it.n)}
                >
                  {it.n + 1}
                </Pagination.Item>
              )
            )}
            <Pagination.Next
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            />
            <Pagination.Last
              disabled={page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            />
          </Pagination>
        </div>
      </div>
    );
  }

  // Lapváltáskor gördüljünk fel
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, pageSize, filter]);

  return (
    <div className="container mt-4">
      {!user && (
        <div className="alert alert-info text-center">
          Lelkigyakorlatok létrehozásához be kell lépned, ezután tudod a saját
          eseményeidet törölni vagy módosítani. A lelkigyakorlatok böngészése
          belépés nélkül is működik. Jó böngészést!
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <img src={headerImage} alt="Katolikus lelkigyakorlat" className="img-fluid rounded" />
        <h1 className="mt-3">Katolikus Lelkigyakorlat-kereső</h1>
        <h4>Találd meg azt a lelkigyakorlatot, ami neked szól!</h4>
      </div>

      <div className="row">
        {/* Bal oldali filterek (ragadós) */}
        <div
          className="col-md-3 mb-3"
          style={{ position: "sticky", top: "1rem", height: "fit-content" }}
        >
          <strong>Célcsoport:</strong>
          <div className="d-flex flex-column mt-2">
            {targetGroups.map((group) => (
              <button
                key={group}
                className={`btn btn-outline-primary mb-2 ${filter === group ? "active" : ""}`}
                onClick={() => {
                  setFilter(group);
                  setPage(0);
                  setSelectedEvent(null);
                }}
              >
                {group}
              </button>
            ))}

            {/* Saját események (csak bejelentkezve) */}
            {user && (
              <button
                className={`btn btn-outline-success mt-3 ${filter === "sajat" ? "active" : ""}`}
                onClick={() => {
                  setFilter("sajat");
                  setPage(0);
                  setSelectedEvent(null);
                }}
              >
                Saját eseményeim
              </button>
            )}
          </div>
        </div>

        {/* Jobb oldali események */}
        <div className="col-md-9">
          {/* Lapozó felül */}
          {renderPager()}

          {paginatedEvents.length === 0 && (
            <p className="mt-3">Nincs elérhető esemény ehhez a célcsoporthoz.</p>
          )}

          <div className="row mt-3">
            {paginatedEvents.map((event) => (
              <div key={event.id} className="col-md-4 mb-3">
                <div
                  className="card h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <img
                    src={placeholderImage}
                    className="card-img-top"
                    alt="Esemény"
                    style={{ height: "20px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{event.title}</h5>
                    <p className="card-text">
                      {event.location} – {new Date(event.start_date).toLocaleString()}
                    </p>

                    {/* Szerkesztés (csak saját) */}
                    {user && event.created_by === user.id && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditEvent(event);
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

          {/* Lapozó alul */}
          {renderPager()}
        </div>
      </div>

      {/* Részletek modal */}
      {selectedEvent && (
        <Modal show centered size="lg" onHide={() => setSelectedEvent(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Leírás:</strong> {selectedEvent.description}</p>
            <p><strong>Célcsoport:</strong> {selectedEvent.target_group}</p>
            <p><strong>Helyszín:</strong> {selectedEvent.location}</p>
            <p><strong>Kezdés:</strong> {new Date(selectedEvent.start_date).toLocaleString()}</p>
            {selectedEvent.end_date && (
              <p><strong>Befejezés:</strong> {new Date(selectedEvent.end_date).toLocaleString()}</p>
            )}
            <p><strong>Kapcsolattartó:</strong> {selectedEvent.contact}</p>
            <p><strong>Szervező közösség:</strong> {selectedEvent.communities?.name || "Nincs megadva"}</p>
            <p>
              <strong>Jelentkezés link:</strong>{" "}
              <a href={selectedEvent.registration_link} target="_blank" rel="noreferrer">
                {selectedEvent.registration_link}
              </a>
            </p>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            {user && selectedEvent.created_by === user.id && (
              <Button
                variant="warning"
                onClick={() => {
                  setEditEvent(selectedEvent);
                  setSelectedEvent(null);
                }}
              >
                ✏️ Szerkesztés
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Vissza
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Szerkesztő modal */}
      {editEvent && (
        <Modal show centered size="lg" onHide={() => setEditEvent(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Esemény szerkesztése</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <EditEventForm
              event={editEvent}
              onCancel={() => setEditEvent(null)}
              onSuccess={async () => {
                setEditEvent(null);
                await fetchEvents();
              }}
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
