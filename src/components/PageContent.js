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
      {/* Menüsor szürke háttérrel */}
      <div className="bg-light border-bottom py-2">
        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-link text-dark fw-bold" onClick={() => setCurrentPage("home")}>
            Főoldal
          </button>
          <button className="btn btn-link text-dark fw-bold" onClick={() => setCurrentPage("about")}>
            Az oldal célja
          </button>
          <button className="btn btn-link text-dark fw-bold" onClick={() => setCurrentPage("contact")}>
            Kapcsolat
          </button>
          {!user && (
            <button className="btn btn-outline-primary" onClick={() => setCurrentPage("auth")}>
              Belépés
            </button>
          )}
          {user && (
            <button className="btn btn-success" onClick={() => setCurrentPage("addEvent")}>
              Lelkigyakorlat hozzáadása
            </button>
          )}
        </div>
      </div>

      {/* Oldalak renderelése */}
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
            <p>(itt jöhet majd az AddEventForm komponens)</p>
            <button className="btn btn-secondary" onClick={() => setCurrentPage("home")}>
              Vissza
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


