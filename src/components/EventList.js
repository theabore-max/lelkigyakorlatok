// src/components/EventList.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import placeholderImage from "../assets/card_1.jpg";

export default function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch events and join with communities
  async function fetchEvents() {
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true });

    if (eventsError) {
      console.error("Hiba az események lekérdezésekor:", eventsError.message);
      return;
    }

    // Lekérdezzük a közösségeket és párosítjuk
    const { data: communitiesData, error: communitiesError } = await supabase
      .from("communities")
      .select("*");

    if (communitiesError) {
      console.error("Hiba a közösségek lekérdezésekor:", communitiesError.message);
      return;
    }

    // Összekapcsoljuk az eseményeket a közösségek nevével
    const eventsWithCommunities = eventsData.map((event) => {
      const community = communitiesData.find(c => c.id === event.community_id);
      return { ...event, communityName: community ? community.name : "Nincs megadva" };
    });

    setEvents(eventsWithCommunities);
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
            {filteredEvents.length === 0 && (
              <p className="text-center">Nincs elérhető esemény</p>
            )}
            {filteredEvents.map((event) => (
              <div className="col-md-4 mb-4" key={event.id}>
                <div
                  className="card h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedEvent(event)}
                >
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
                      <strong>Szervező közösség:</strong> {event.communityName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="mt-4">
          <h3>{selectedEvent.name}</h3>
          <p>{selectedEvent.description}</p>
          <p><strong>Célcsoport:</strong> {selectedEvent.target_audience}</p>
          <p><strong>Kezdés:</strong> {new Date(selectedEvent.start_date).toLocaleString("hu-HU")}</p>
          <p><strong>Befejezés:</strong> {new Date(selectedEvent.end_date).toLocaleString("hu-HU")}</p>
          <p><strong>Kapcsolattartó:</strong> {selectedEvent.contact}</p>
          <p><strong>Szervező közösség:</strong> {selectedEvent.communityName}</p>
          <p><strong>Jelentkezési link:</strong> <a href={selectedEvent.registration_link} target="_blank" rel="noopener noreferrer">{selectedEvent.registration_link}</a></p>
          <button className="btn btn-secondary mt-3" onClick={() => setSelectedEvent(null)}>Vissza</button>
        </div>
      )}
    </div>
  );
}
