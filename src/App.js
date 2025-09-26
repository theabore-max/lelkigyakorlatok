// App.js
import React, { useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import PageContent from "./components/PageContent";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <>
      {/* Navigációs sáv */}
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand
            onClick={() => setCurrentPage("home")}
            style={{ cursor: "pointer" }}
          >
            Katolikus Lelkigyakorlat-kereső
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link onClick={() => setCurrentPage("about")}>
              Az oldal célja
            </Nav.Link>
            <Nav.Link onClick={() => setCurrentPage("contact")}>
              Kapcsolat
            </Nav.Link>
            <Nav.Link onClick={() => setCurrentPage("login")}>Belépés</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {/* PageContent megjeleníti az aktuális oldalt */}
      <Container className="mt-4">
        <PageContent currentPage={currentPage} />
      </Container>
    </>
  );
}

export default App;
