// src/components/EventList.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import headerImage from "../assets/header.jpg";
// import placeholderImage from "../assets/card_1.jpg"; // már nem kell
import { Modal, Button, Pagination, Badge } from "react-bootstrap";
import EditEventForm from "./EditEventForm";
import Seo from "./Seo";
import "./EventList.css";

export default function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("Mindenki");        // célcsoport vagy "sajat"
  const [sourceFilter, setSourceFilter] = useState("mind"); // mind | kezi | auto
  const [q, setQ] = useState("");                           // kereső (cím/helyszín)
  const [month, setMonth] = useState("osszes");             // "osszes" | "1".."12"
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [editEvent, setEditEvent] = useState(null);

  const [targetGroups] = useState([
    "Fiatalok", "Mindenki", "Idősek", "Fiatal házasok",
    "Érett házasok", "Jegyesek", "Tinédzserek", "Családok",
  ]);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select(`
        id, title, location, description, start_date, end_date,
        contact, registration_link, target_group, source, created_by,
        communities (id, name)
      `)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) console.log("Hiba az események lekérdezésénél:", error);
    else setEvents(data);
  }

  // --- segédek (kártyastílus, dátum, placeholder SVG) ---
  const isOwn = (e) => user && e.created_by === user.id;
  const isManual = (e) => !!e.created_by;            // kézzel felvitt (app)
  const isAuto = (e) => !!e.source && !e.created_by; // RSS/scraper

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

  // --- Placeholder SVG helper-ek ---
  const TG_COLORS = {
    "Mindenki": ["#e8f0fe", "#f1f5ff"],
    "Fiatalok": ["#e6f7f2", "#eafdf7"],
    "Idősek": ["#f9f2e8", "#fff7ec"],
    "Fiatal házasok": ["#fbe8ef", "#fff0f6"],
    "Érett házasok": ["#f1effb", "#f7f4ff"],
    "Jegyesek": ["#e8f9ff", "#f0fcff"],
    "Tinédzserek": ["#eefbe8", "#f6fff0"],
    "Családok": ["#fff1e8", "#fff6ef"],
  };

  function shortTitle(t, max = 24) {
    const s = (t || "").trim();
    return s.length > max ? s.slice(0, max - 1) + "…" : s || "Lelkigyakorlat";
  }

  function shortDateRange(startISO, endISO) {
    if (!startISO) return "";
    const opts = { year: "numeric", month: "short", day: "numeric" };
    const s = new Date(startISO).toLocaleDateString("hu-HU", opts);
    if (!endISO) return s;
    const e = new Date(endISO).toLocaleDateString("hu-HU", opts);
    return `${s} – ${e}`;
  }

  function tgEmoji(group = "") {
    const g = group.toLowerCase();
    if (g.includes("jegyes")) return "💍";
    if (g.includes("tinédzs")) return "🎒";
    if (g.includes("fiatal házas")) return "💑";
    if (g.includes("érett házas")) return "👨‍👩‍👧";
    if (g.includes("család")) return "🧑‍🤝‍🧑";
    if (g.includes("idős")) return "🕊️";
    if (g.includes("fiatal")) return "✨";
    return "⛪";
  }

  function escapeXml(s = "") {
    return s.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
  }

  function placeholderDataUrl(event) {
    const g = event?.target_group || "Mindenki";
    const [c1, c2] = TG_COLORS[g] || TG_COLORS["Mindenki"];
    const title = shortTitle(event?.title);
    const date = shortDateRange(event?.start_date, event?.end_date);
    const icon = tgEmoji(g);

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <text x="60" y="140" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="72" fill="#1f2937">${icon}</text>
      <text x="60" y="240" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="44" font-weight="700" fill="#111827">
        ${escapeXml(title)}
      </text>
      <text x="60" y="300" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="28" fill="#374151">
        ${escapeXml(date)}
      </text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  // --- szűrés ---
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

  // --- lapozás ---
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

  // SEO dinamikus meta + OG image (az aktuális oldal első eseményéből)
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
              return (
                <div key={event.id} className="col-md-4 mb-3">
                  <div
                    className={`card h-100 shadow-sm ${style.border}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <img
                      src={placeholderDataUrl(event)}
                      className="card-img-top"
                      alt={`${event.title} – vizuális jelző`}
                      style={{ height: "180px", objectFit: "cover" }}
                      loading="lazy"
                    />
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <h5 className="card-title me-2">{event.title}</h5>
                        {style.badge && <Badge bg={style.badgeVariant}>{style.badge}</Badge>}
                      </div>

                      <p className="card-text mb-2">
                        {event.location || "—"} — {formatDateRange(event.start_date, event.end_date)}
                      </p>

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
                          className="btn btn-sm btn-warning ms-2"
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
}


