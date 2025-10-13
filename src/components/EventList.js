// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import headerImage from "../assets/header.jpg";
import placeholderImage from "../assets/card_1.jpg";
import { Modal, Button, Pagination, Badge } from "react-bootstrap";
import EditEventForm from "./EditEventForm";
import Seo from "./Seo";
import "./EventList.css";

export default function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("Mindenki");        // célcsoport vagy "sajat"
  const [sourceFilter, setSourceFilter] = useState("mind"); // mind | kezi | auto
  const [q, setQ] = useState("");
  const [month, setMonth] = useState("osszes");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [editEvent, setEditEvent] = useState(null);

  const [targetGroups] = useState([
    "Fiatalok", "Mindenki", "Idősek", "Fiatal házasok",
    "Érett házasok", "Jegyesek", "Tinédzserek", "Családok",
  ]);

  useEffect(() => { fetchEvents(); }, []);

  // ---- LEKÉRDEZÉS (fallback image_url nélkül is) ----
  async function fetchEvents() {
    const base = supabase.from("events");

    let { data, error } = await base
      .select(`
        id, title, location, description, start_date, end_date,
        contact, registration_link, target_group, source, created_by, image_url,
        communities (id, name)
      `)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) {
      console.warn("Lekérdezés image_url-lel hibázott, fallback indul:", error?.message || error);
      ({ data, error } = await base
        .select(`
          id, title, location, description, start_date, end_date,
          contact, registration_link, target_group, source, created_by,
          communities (id, name)
        `)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
      );
    }

    if (error) {
      console.error("Hiba az események lekérdezésénél:", error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
  }

  // ---- SEGÉDEK ----
  const isOwn = (e) => user && e.created_by === user.id;
  const isManual = (e) => !!e.created_by;
  const isAuto = (e) => !!e.source && !e.created_by;

  function cardStyle(e) {
    if (isOwn(e))    return { border: "border-success",   badge: "Saját",       badgeVariant: "success" };
    if (isAuto(e))   return { border: "border-secondary", badge: "Automatikus", badgeVariant: "secondary" };
    if (isManual(e)) return { border: "border-primary",   badge: "Kézi",        badgeVariant: "primary" };
    return { border: "border-light", badge: null };
  }

  function formatDateRange(startISO, endISO) {
    if (!startISO) return "—";
    const opts = { year: "numeric", month: "long", day: "numeric" };
    const start = new Date(startISO).toLocaleDateString("hu-HU", opts);
    if (!endISO) return start;
    const end = new Date(endISO).toLocaleDateString("hu-HU", opts);
    return `${start} – ${end}`;
  }

  // --- Megosztási URL-ek + ikonok ---
  const CANONICAL_BASE = "https://lelkigyakorlatok.vercel.app"; // ha lesz saját domain, ide írd át
  const shareUrl = (id) => `${CANONICAL_BASE}/share/${id}`;     // ha még nincs /share/:id, ideiglenesen lehet: `${CANONICAL_BASE}?event=${id}`

  const IconFacebook = (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.48-3.9 3.75-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.77l-.44 2.9h-2.33V22c4.78-.8 8.44-4.94 8.44-9.94Z"/>
    </svg>
  );
  const IconMail = (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/>
    </svg>
  );
  const IconWhatsApp = (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.45 0 .14 5.3.14 11.92c0 2.1.55 4.15 1.61 5.96L0 24l6.28-1.64a12 12 0 0 0 5.76 1.47h.01c6.6 0 11.92-5.31 11.92-11.92 0-3.19-1.24-6.19-3.45-8.43ZM12.05 22a9.99 9.99 0 0 1-5.1-1.4l-.37-.22-3.73.97.99-3.64-.24-.37a10.02 10.02 0 1 1 8.45 4.66Zm5.48-7.43c-.3-.15-1.77-.87-2.05-.96-.27-.1-.47-.15-.67.15-.2.3-.77.95-.94 1.14-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.03-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.18-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.48 0 1.46 1.08 2.87 1.22 3.07.15.2 2.12 3.23 5.15 4.53.72.31 1.28.49 1.72.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"/>
    </svg>
  );

  // --- Célcsoport-ikon azonos stílusban (badge-re) ---
  function iconSvgForGroup(group = "") {
    const g = (group || "").toLowerCase();
    const stroke = "#0f172a";
    const sw = 3.5;
    const fillSoft = "#0f172a";

    if (g.includes("jegyes")) {
      return `
        <circle cx="26" cy="32" r="10" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="38" cy="32" r="10" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    }
    if (g.includes("házas")) {
      return `
        <path d="M32 48 C18 36, 20 24, 32 28 C44 24, 46 36, 32 48 Z"
              fill="${fillSoft}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    }
    if (g.includes("család")) {
      return `
        <circle cx="22" cy="28" r="7" fill="${fillSoft}"/>
        <circle cx="42" cy="28" r="7" fill="${fillSoft}"/>
        <circle cx="32" cy="36" r="5" fill="${fillSoft}"/>
      `;
    }
    if (g.includes("idős")) {
      return `
        <path d="M20 44 C20 28, 44 28, 44 44 C44 50, 20 50, 20 44 Z"
              fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 44 C26 40, 34 40, 44 44"
              fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    }
    if (g.includes("tinédzs")) {
      return `<path d="M32 16 L24 34 H32 L28 52 L44 28 H36 L40 16 Z" fill="${fillSoft}" />`;
    }
    if (g.includes("fiatal")) {
      return `
        <path d="M32 18 L36 28 L46 32 L36 36 L32 46 L28 36 L18 32 L28 28 Z"
              fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    }
    // Mindenki – templom
    return `
      <path d="M20 32 L32 22 L44 32" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="22" y="32" width="20" height="18" rx="3" fill="none" stroke="${stroke}" stroke-width="${sw}" />
      <line x1="32" y1="16" x2="32" y2="22" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>
      <line x1="29" y1="19" x2="35" y2="19" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>
    `;
  }

  // --- SZŰRÉS ---
  const filteredEvents = events.filter((event) => {
    if (filter === "sajat") {
      if (!isOwn(event)) return false;
    } else {
      if (filter !== "Mindenki" && event.target_group !== filter) return false;
    }
    if (sourceFilter === "kezi" && !isManual(event)) return false;
    if (sourceFilter === "auto" && !isAuto(event)) return false;

    if (q) {
      const t = (event.title || "").toLowerCase();
      const l = (event.location || "").toLowerCase();
      const needle = q.toLowerCase();
      if (!t.includes(needle) && !l.includes(needle)) return false;
    }
    if (month !== "osszes") {
      const m = new Date(event.start_date).getMonth() + 1;
      if (String(m) !== month) return false;
    }
    return true;
  });

  // --- LAPOZÁS ---
  const total = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  function getVisiblePages() {
    const max = totalPages - 1;
    const win = 2;
    let start = Math.max(0, page - win);
    let end = Math.min(max, page + win);
    const items = [];
    const addPage = (n) => items.push({ type: "page", n });
    const addDots = (key) => items.push({ type: "dots", key });
    if (start > 0) { addPage(0); if (start > 1) addDots("l"); }
    for (let n = start; n <= end; n++) addPage(n);
    if (end < max) { if (end < max - 1) addDots("r"); addPage(max); }
    return items;
  }

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
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
          >
            <option value={9}>9 / oldal</option>
            <option value={12}>12 / oldal</option>
            <option value={24}>24 / oldal</option>
          </select>
          <Pagination className="mb-0">
            <Pagination.First disabled={page === 0} onClick={() => setPage(0)} />
            <Pagination.Prev disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
            {getVisiblePages().map((it, i) =>
              it.type === "dots" ? (
                <Pagination.Ellipsis disabled key={`dots-${it.key}-${i}`} />
              ) : (
                <Pagination.Item key={it.n} active={it.n === page} onClick={() => setPage(it.n)}>
                  {it.n + 1}
                </Pagination.Item>
              )
            )}
            <Pagination.Next disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} />
            <Pagination.Last disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} />
          </Pagination>
        </div>
      </div>
    );
  }

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page, pageSize, filter, sourceFilter, q, month]);

  // --- SEO ---
  const pageTitle =
    filter === "Mindenki"
      ? "Katolikus lelkigyakorlat-kereső – friss események"
      : `Lelkigyakorlatok – ${filter.toLowerCase()} célcsoport`;
  const pageDesc =
    "Friss katolikus lelkigyakorlatok egy helyen. Szűrés célcsoport, hónap, forrás szerint – jelentkezési linkekkel.";
  const url =
    typeof window !== "undefined"
      ? window.location.href.split("#")[0]
      : "https://lelkigyakorlatok.vercel.app/";
  const first = paginatedEvents?.[0];
  const ogTitle = first?.title || "Lelkigyakorlatok";
  const ogDate  = first ? formatDateRange(first.start_date, first.end_date) : "";
  const ogPlace = first?.location || "";
  const ogImage = first
    ? `/api/og?title=${encodeURIComponent(ogTitle)}&date=${encodeURIComponent(ogDate)}&place=${encodeURIComponent(ogPlace)}`
    : "/og.jpg";

  return (
    <div className="container mt-4">
      <Seo title={pageTitle} description={pageDesc} url={url} image={ogImage} />

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
        {/* Bal oldali filterek */}
        <div className="col-md-3 mb-3 sidebar-sticky">
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
            {user && (
              <button
                className={`btn btn-outline-success mt-3 ${filter === "sajat" ? "active" : ""}`}
                onClick={() => { setFilter("sajat"); setPage(0); setSelectedEvent(null); }}
              >
                Saját eseményeim
              </button>
            )}
          </div>

          {/* Forrás szűrő */}
          <hr />
          <strong>Forrás:</strong>
          <div className="d-flex flex-column mt-2">
            <button
              className={`btn btn-outline-secondary mb-2 ${sourceFilter === "mind" ? "active" : ""}`}
              onClick={() => { setSourceFilter("mind"); setPage(0); }}
            >
              Mind
            </button>
            <button
              className={`btn btn-outline-primary mb-2 ${sourceFilter === "kezi" ? "active" : ""}`}
              onClick={() => { setSourceFilter("kezi"); setPage(0); }}
            >
              Kézi (appban felvitt)
            </button>
            <button
              className={`btn btn-outline-dark ${sourceFilter === "auto" ? "active" : ""}`}
              onClick={() => { setSourceFilter("auto"); setPage(0); }}
            >
              Automatikus (RSS/scraper)
            </button>
          </div>

          {/* Jelmagyarázat */}
          <div className="mt-3 small text-muted">
            <div className="mb-1"><Badge bg="success">Saját</Badge> – általad felvitt esemény</div>
            <div className="mb-1"><Badge bg="primary">Kézi</Badge> – más által kézzel felvitt</div>
            <div className="mb-1"><Badge bg="secondary">Automatikus</Badge> – RSS / gyűjtőoldal</div>
          </div>
        </div>

        {/* Jobb oldali lista */}
        <div className="col-md-9">
          {/* Kereső + hónap-chipek */}
          <div className="d-flex flex-column gap-2">
            <div className="d-flex gap-2">
              <input
                className="form-control"
                placeholder="Keresés cím vagy helyszín szerint…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
              />
            </div>

            <div className="d-flex flex-wrap gap-2">
              {["osszes","1","2","3","4","5","6","7","8","9","10","11","12"].map(m => (
                <button
                  key={m}
                  className={`btn btn-sm ${month===m ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => { setMonth(m); setPage(0); }}
                >
                  {m==="osszes" ? "Összes hónap" : `${m}. hónap`}
                </button>
              ))}
            </div>
          </div>

          {/* Lapozó felül */}
          {renderPager()}

          {paginatedEvents.length === 0 && (
            <div className="alert alert-secondary mt-3">
              Nincs találat a megadott szűrőkkel. Próbáld:
              <ul className="mb-0">
                <li>töröld a keresőkifejezést</li>
                <li>állítsd „Összes hónap”-ra</li>
                <li>kapcsold ki a „Forrás” szűrőt</li>
              </ul>
            </div>
          )}

          <div className="row mt-3">
            {paginatedEvents.map((event) => {
              const style = cardStyle(event);
              const imgSrc = event.image_url || placeholderImage;
              const iconSvg = iconSvgForGroup(event.target_group);

              return (
                <div key={event.id} className="col-md-4 mb-3">
                  <div
                    className={`card h-100 shadow-sm ${style.border}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Fejléckép + célcsoport ikon badge */}
                    <div className="position-relative">
                      <img
                        src={imgSrc}
                        className="card-img-top"
                        alt={`${event.title} – illusztráció`}
                        style={{
                          height: "230px",
                          width: "100%",
                          display: "block",
                          objectFit: "cover",
                          objectPosition: "center top",
                          borderTopLeftRadius: "0.375rem",
                          borderTopRightRadius: "0.375rem",
                        }}
                        loading="lazy"
                      />
                      <div
                        className="position-absolute"
                        style={{
                          top: "10px",
                          left: "10px",
                          background: "rgba(255,255,255,0.95)",
                          borderRadius: "12px",
                          padding: "6px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                          width: "44px",
                          height: "44px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-hidden="true"
                      >
                        <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
                          <g dangerouslySetInnerHTML={{ __html: iconSvg }} />
                        </svg>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <h5 className="card-title me-2">{event.title}</h5>
                        {style.badge && <Badge bg={style.badgeVariant}>{style.badge}</Badge>}
                      </div>

                      <p className="card-text mb-2">
                        {event.location || "—"} — {formatDateRange(event.start_date, event.end_date)}
                      </p>

                      {/* --- Gombsor + megosztás ikonok egy sorban --- */}
                      <div className="d-flex align-items-center justify-content-between mt-2 flex-wrap gap-2">
                        {/* BAL: Jelentkezés + (opcionális) Szerkesztés */}
                        <div className="d-flex align-items-center gap-2">
                          {event.registration_link && (
                            <a
                              className="btn btn-sm btn-outline-primary"
                              href={event.registration_link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Jelentkezés
                            </a>
                          )}

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

                        {/* JOBB: Megosztás ikonok */}
                        <div className="d-flex align-items-center gap-2 ms-auto">
                          {/* Facebook */}
						<a
						  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(event.id))}`}
						  target="_blank"
						  rel="noreferrer"
						  onClick={(e) => e.stopPropagation()}
						  className="btn btn-light border rounded-circle p-2 share-btn share-fb"
						  title="Megosztás Facebookon"
						  aria-label="Megosztás Facebookon"
						  style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
						>
						  <IconFacebook />
						</a>

						{/* E-mail */}
						<a
						  href={`mailto:?subject=${encodeURIComponent("Ajánlott lelkigyakorlat")}&body=${encodeURIComponent(`${event.title}\n\n${shareUrl(event.id)}`)}`}
						  onClick={(e) => e.stopPropagation()}
						  className="btn btn-light border rounded-circle p-2 share-btn share-mail"
						  title="Megosztás e-mailben"
						  aria-label="Megosztás e-mailben"
						  style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
						>
						  <IconMail />
						</a>

						{/* WhatsApp */}
						<a
						  href={`https://wa.me/?text=${encodeURIComponent(`${event.title} ${shareUrl(event.id)}`)}`}
						  target="_blank"
						  rel="noreferrer"
						  onClick={(e) => e.stopPropagation()}
						  className="btn btn-light border rounded-circle p-2 share-btn share-wa"
						  title="Megosztás WhatsAppon"
						  aria-label="Megosztás WhatsAppon"
						  style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
						>
						  <IconWhatsApp />
						</a>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
            <p><strong>Kezdés:</strong> {formatDateRange(selectedEvent.start_date, null)}</p>
            {selectedEvent.end_date && (
              <p><strong>Befejezés:</strong> {formatDateRange(selectedEvent.end_date, null)}</p>
            )}
            <p><strong>Kapcsolattartó:</strong> {selectedEvent.contact}</p>
            <p><strong>Szervező közösség:</strong> {selectedEvent.communities?.name || "Nincs megadva"}</p>
            <p>
              <strong>Jelentkezés link:</strong>{" "}
              <a href={selectedEvent.registration_link} target="_blank" rel="noreferrer">
                {selectedEvent.registration_link}
              </a>
            </p>
            {selectedEvent.source && (
              <p className="text-muted small"><strong>Forrás:</strong> {selectedEvent.source}</p>
            )}
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
  /* Megosztás ikonok stílusai */
.share-btn {
  transition: transform .12s ease, background-color .12s ease, color .12s ease, border-color .12s ease, box-shadow .12s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
}
.share-btn:hover { transform: translateY(-1px); }
.share-btn:active { transform: translateY(0); }

.share-btn:focus-visible {
  outline: 2px solid rgba(24,119,242,.6); /* kék fókuszgyűrű */
  outline-offset: 2px;
}

/* Facebook kék */
.share-fb:hover {
  background-color: #1877F2 !important;
  border-color: #1877F2 !important;
  color: #fff !important;
}

/* E-mail (Google vörös) – ha semlegeset szeretnél, cseréld #ea4335 → #6b7280 */
.share-mail:hover {
  background-color: #EA4335 !important;
  border-color: #EA4335 !important;
  color: #fff !important;
}

/* WhatsApp zöld */
.share-wa:hover {
  background-color: #25D366 !important;
  border-color: #25D366 !important;
  color: #fff !important;
}

/* Preferált kisebb mozgás esetén ne animáljunk */
@media (prefers-reduced-motion: reduce) {
  .share-btn { transition: none; }
  .share-btn:hover, .share-btn:active { transform: none; }
}

}
