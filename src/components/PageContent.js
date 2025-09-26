// src/components/PageContent.js
import React, { useState } from "react";
import EventList from "./EventList";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import AuthPage from "./AuthPage";

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
      {currentPage === "about" && <AboutPage onBack={() => setCurrentPage("home")} />}
      {currentPage === "contact" && <ContactPage onBack={() => setCurrentPage("home")} />}
      {currentPage === "auth" && <AuthPage onLoginSuccess={(user) => { setUser(user); setCurrentPage("home"); }} />}
      {currentPage === "addEvent" && (
        <div>
          <h2>Lelkigyakorlat hozzáadása</h2>
          <p>(itt jöhet majd az AddEventForm komponens)</p>
          <button className="btn btn-secondary" onClick={() => setCurrentPage("home")}>Vissza</button>
        </div>
      )}
    </div>
  );
}

