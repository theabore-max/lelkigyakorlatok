// src/components/PageContent.js
import React, { useState } from "react";
import EventList from "./EventList";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import AuthPage from "./AuthPage";
import AddEventForm from "./AddEventForm";

export default function PageContent() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);

  return (
    <div>
      {/* Navigation bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
        <div className="container d-flex justify-content-between">
          <span
            className="navbar-brand fw-bold"
            style={{ cursor: "pointer" }}
            onClick={() => setCurrentPage("home")}
          >
            Katolikus Lelkigyakorlat-kereső
          </span>
          <div>
            <button className="btn btn-link text-dark" onClick={() => setCurrentPage("home")}>
              Főoldal
            </button>
            <button className="btn btn-link text-dark" onClick={() => setCurrentPage("about")}>
              Az oldal célja
            </button>
            <button className="btn btn-link text-dark" onClick={() => setCurrentPage("contact")}>
              Kapcsolat
            </button>
            {!user && (
              <button className="btn btn-outline-primary ms-2" onClick={() => setCurrentPage("auth")}>
                Belépés
              </button>
            )}
            {user && (
              <button className="btn btn-success ms-2" onClick={() => setCurrentPage("addEvent")}>
                Lelkigyakorlat hozzáadása
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Oldalak */}
      <div className="container mt-4">
        {currentPage === "home" && <EventList user={user} />}
        {currentPage === "about" && <AboutPage onBack={() => setCurrentPage("home")} />}
        {currentPage === "contact" && <ContactPage onBack={() => setCurrentPage("home")} />}
        {currentPage === "auth" && (
          <AuthPage
            onLoginSuccess={(loggedInUser) => {
              setUser(loggedInUser);
              setCurrentPage("home");
            }}
          />
        )}
        {currentPage === "addEvent" && (
          <div>
            <h2>Lelkigyakorlat hozzáadása</h2>
            {currentPage === "addEvent" && (
				<AddEventForm onBack={() => setCurrentPage("home")} />
			)}
            <button className="btn btn-secondary" onClick={() => setCurrentPage("home")}>
              Vissza
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



