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
    <div className="container mt-3">
      {/* Oldalak */}
      {currentPage === "home" && (
        <EventList user={user} />
      )}

      {currentPage === "about" && (
        <AboutPage onBack={() => setCurrentPage("home")} />
      )}

      {currentPage === "contact" && (
        <ContactPage onBack={() => setCurrentPage("home")} />
      )}

      {currentPage === "auth" && (
        <AuthPage
          onLoginSuccess={(user) => {
            setUser(user);
            setCurrentPage("home");
          }}
        />
      )}

      {currentPage === "addEvent" && (
        <div>
          <h2>Lelkigyakorlat hozzáadása</h2>
          <p>(itt jöhet majd az AddEventForm komponens)</p>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage("home")}
          >
            Vissza
          </button>
        </div>
      )}
    </div>
  );
}


