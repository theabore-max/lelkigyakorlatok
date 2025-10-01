// src/components/PageContent.js
import React, { useState } from "react";
import EventList from "./EventList";
import AddEventForm from "./AddEventForm";
import EditEventForm from "./EditEventForm";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import AuthPage from "./AuthPage";

export default function PageContent() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div>
      {/* Navigation bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="#" onClick={() => setCurrentPage("home")}>Katolikus lelkigyakorlat-kereső</a>
        <div className="ml-auto">
          <button className="btn btn-link" onClick={() => setCurrentPage("about")}>Az oldal célja</button>
          <button className="btn btn-link" onClick={() => setCurrentPage("contact")}>Kapcsolat</button>
          {!user && (
            <button className="btn btn-primary" onClick={() => setCurrentPage("auth")}>Belépés</button>
          )}
          {user && (
            <button className="btn btn-success" onClick={() => setCurrentPage("addEvent")}>Lelkigyakorlat hozzáadása</button>
          )}
        </div>
      </nav>

      {/* Render current page */}
      {currentPage === "home" && (
        <EventList
          user={user}
          onEdit={(event) => {
            setSelectedEvent(event);
            setCurrentPage("editEvent");
          }}
        />
      )}
	  {currentPage === "editEvent" && selectedEvent && (
		<EditEventForm
			event={selectedEvent}
			onCancel={() => setCurrentPage("home")}
			onSuccess={() => setCurrentPage("home")}
		/>
)}
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
          <AuthPage onLoginSuccess={(user) => {
            setUser(user);
            setCurrentPage("home");
          }} />
        </div>
      )}
      {currentPage === "addEvent" && (
        <div className="container mt-4">
          <button className="btn btn-secondary mb-3" onClick={() => setCurrentPage("home")}>
            &larr; Vissza
          </button>
          <AddEventForm
            user={user}
            onEventAdded={() => setCurrentPage("home")}
          />
        </div>
      )}
      {currentPage === "editEvent" && selectedEvent && (
        <div className="container mt-4">
          <button className="btn btn-secondary mb-3" onClick={() => setCurrentPage("home")}>
            &larr; Vissza
          </button>
          <EditEventForm
            event={selectedEvent}
            onCancel={() => setCurrentPage("home")}
            onSuccess={() => setCurrentPage("home")}
          />
        </div>
      )}
    </div>
  );
}
