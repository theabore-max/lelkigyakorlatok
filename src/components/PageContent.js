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
      {/* Navigációs sáv */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="#" onClick={() => setCurrentPage("home")}>
          Katolikus Lelkigyakorlat-kereső
        </a>
        <div className="ml-auto">
          <button className="btn btn-link" onClick={() => setCurrentPage("about")}>Az oldal célja</button>
          <button className="btn btn-link" onClick={() => setCurrentPage("contact")}>Kapcsolat</button>
          {!user && (
            <button className="btn btn-primary" onClick={() => setCurrentPage("auth")}>Belépés</button>
          )}
          {user && (
            <button className="btn btn-success" onClick={() => setCurrentPage("addEvent")}>
              Lelkigyakorlat hozzáadása
            </button>
          )}
        </div>
      </nav>

      {/* Oldalak */}
      {currentPage === "home" && <EventList user={user} />}
      {currentPage === "about" && (
        <div className="container mt-4">
          <button className="btn btn-secondary mb-3" onClick={() => setCurrentPage("home")}>
            &larr; Vissza
          </button>
          <AboutPage />
        </div>
      )}
      {currentPage === "contact" && (
        <div className="container mt-4">
          <button className="btn btn-secondary mb-3" onClick={() => setCurrentPage("home")}>
            &larr; Vissza
          </button>
          <ContactPage />
        </div>
      )}
      {currentPage === "auth" && (
        <div className="container mt-4">
          <button className="btn btn-secondary mb-3" onClick={() => setCurrentPage("home")}>
            &larr; Vissza
          </button>
          <AuthPage onLoginSuccess={(user) => { setUser(user); setCurrentPage("home"); }} />
        </div>
      )}
      {currentPage === "addEvent" && (
        <div className="container mt-4">
          <button className="btn btn-secondary mb-3" onClick={() => setCurrentPage("home")}>
            &larr; Vissza
          </button>
          <AddEventForm user={user} />
        </div>
      )}
    </div>
  );
}
