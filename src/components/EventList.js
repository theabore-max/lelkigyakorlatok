// src/components/EventList.js
import React, { useEffect, useState, useCallback } from "react";
import { Card, Button, Row, Col, Form, Modal, InputGroup, FormControl } from "react-bootstrap";
import { supabase } from "../supabaseClient";
import headerImage from "../assets/header.jpg"; // placeholder kép
import cardImage from "../assets/card_1.jpg"; // placeholder kép

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("Mindenki");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchText, setSearchText] = useState("");

  const filters = [
    "Mindenki",
    "Fiatalok",
    "Idősek",
    "Fiatal házasok",
    "Érett házasok",
    "Jegyesek",
    "Tinédzserek",
    "Családok",
  ];

  // Lekérjük a jövőbeli eseményeket
  const fetchEvents = async () => {
    const today = new Date().toISOString().split("T")[0];
    let { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("start_date", today)
      .order("start_date", { ascending: true });

    if (error) console.error(error);
    else setEvents(data);
  };

  // Szűrési logika useCallback-kel, hogy a linter ne jelezzen
  const applyFilter = useCallback(() => {
    let filtered = events;

    if (selectedFilter !== "Mindenki") {
      filtered = filtered.filter((event) => event.target_group === selectedFilter);
    }

    if (searchText.trim() !== "") {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
  (event) =>
    (event.title?.toLowerCase() || "").includes(lowerSearch) ||
    (event.community?.toLowerCase() || "").includes(lowerSearch) ||
    (event.location?.toLowerCase() || "").includes(lowerSearch)
);
    }

    setFilteredEvents(filtered);
    setSelectedEvent(null); // új filter vagy keresés esetén a részletek eltűnnek
  }, [events, selectedFilter, searchText]);

  // Fetch és szűrés useEffect-ek
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  return (
    <>
      {/* Header kép és főcím legfelül */}
      <div
        style={{
          backgroundImage: `url(${headerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "300px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start", // legfelülre
          alignItems: "center",
          color: "black",
          textAlign: "center",
          paddingTop: "20px",
          paddingBottom: "10px",
        }}
      >
        <h1 style={{ fontWeight: "bold" }}>Katolikus Lelkigyakorlat-kereső</h1>
        <p style={{ marginTop: "10px" }}>Találd meg azt a lelkigyakorlatot, ami neked szól!</p>
      </div>

      <Row className="mt-4">
        {/* Bal oldali filter és kereső */}
        <Col md={3} className="mb-4">
          <h5>Célcsoport:</h5>
          <Form>
            {filters.map((filter) => (
              <Form.Check
                key={filter}
                type="radio"
                label={filter}
                name="targetGroup"
                checked={selectedFilter === filter}
                onChange={() => setSelectedFilter(filter)}
                className="mb-2"
              />
            ))}
          </Form>

          <h5>Keresés:</h5>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Szabadszavas keresés..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </InputGroup>
        </Col>

        {/* Jobb oldali kártyák */}
        <Col md={9}>
          {filteredEvents.length === 0 ? (
            <p className="text-center fs-5 mt-5">
              Nincs elérhető esemény ehhez a célcsoporthoz vagy kereséshez.
            </p>
          ) : (
            <Row>
              {filteredEvents.map((event) => (
                <Col md={6} lg={4} key={event.id} className="mb-4">
                  <Card
                    className="shadow-sm card-hover"
                    style={{ borderRadius: "12px", overflow: "hidden" }}
                  >
                    <Card.Img variant="top" src={cardImage} alt={event.title} />
                    <Card.Body style={{ backgroundColor: "white" }}>
                      <Card.Title className="fw-bold">{event.title}</Card.Title>
                      <Card.Text>
                        <strong>Közösség:</strong> {event.community} <br />
                        <strong>Kezdés:</strong> {event.start_date}
                      </Card.Text>
                      <Button
                        variant="primary"
                        className="text-white"
                        onClick={() => setSelectedEvent(event)}
                      >
                        Részletek
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* Modal a részletekhez */}
        {selectedEvent && (
          <Modal show={true} onHide={() => setSelectedEvent(null)}>
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
                <strong>Kezdés:</strong> {selectedEvent.start_date}
              </p>
              <p>
                <strong>Befejezés:</strong> {selectedEvent.end_date}
              </p>
              <p>
                <strong>Kapcsolattartó:</strong> {selectedEvent.contact}
              </p>
              <p>
                <strong>Szervező közösség:</strong> {selectedEvent.community}
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
                Bezárás
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </Row>
    </>
  );
}
