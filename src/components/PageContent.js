// src/components/PageContent.js
import React, { useState } from "react";
import EventList from "./EventList";
import LoginForm from "./LoginForm";
import AddEventForm from "./AddEventForm";
import EditEventForm from "./EditEventForm";

export default function PageContent({ user }) {
  const [currentPage, setCurrentPage] = useState("home");
  const [editEventId, setEditEventId] = useState(null);

  return (
    <div>
      {/* Navigációs sáv */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <span className="navbar-brand" style={{ cursor: "pointer" }} onClick={() => setCurrentPage("home")}>
            Katolikus Lelkigyakorlat-kereső
          </span>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <button className="btn btn-link nav-link" onClick={() => setCurrentPage("about")}>
                Az oldal célja
              </button>
            </li>
            <li className="nav-item">
              <button className="btn btn-link nav-link" onClick={() => setCurrentPage("contact")}>
                Kapcsolat
              </button>
            </li>
            {!user && (
              <li className="nav-item">
                <button className="btn btn-link nav-link" onClick={() => setCurrentPage("login")}>
                  Belépés
                </button>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <button className="btn btn-link nav-link" onClick={() => setCurrentPage("addEvent")}>
                  Lelkigyakorlat hozzáadása
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Oldalak */}
      <div className="container mt-4">
        {currentPage === "home" && <EventList />}
        
        {currentPage === "login" && <LoginForm onLoginSuccess={() => setCurrentPage("home")} />}
        
        {currentPage === "addEvent" && user && <AddEventForm user={user} />}
        
        {currentPage === "editEvent" && user && editEventId && (
          <EditEventForm user={user} eventId={editEventId} />
        )}

        {currentPage === "about" && (
          <div>
            <h2>Az oldal célja</h2>
            <p>
              Az oldal célja, hogy összegyűjtse és bemutassa a különféle katolikus lelkigyakorlatokat. 
              A látogatók könnyen kereshetnek és jelentkezhetnek a számukra megfelelő programokra, 
              a szervezők pedig új lelkigyakorlatokat vihetnek fel, hogy minél több emberhez eljuthasson a meghívás.
            </p>
            <blockquote>
              <em>„Amit ember nem látott és fül nem hallott, amit elmébe sem jutott az Istennek készítette azoknak, akik szeretik Őt.” – 1 Kor 2,9-10</em>
            </blockquote>
            <button className="btn btn-secondary mt-3" onClick={() => setCurrentPage("home")}>
              Vissza
            </button>
          </div>
        )}

        {currentPage === "contact" && (
          <div>
            <h2>Kapcsolat</h2>
            <p>
              Ha technikai problémát tapasztalsz az oldalon, vagy új lelkigyakorlatot szeretnél felvinni, írj nekünk bátran a
              <br />
              <strong>lgykereso@gmail.com</strong>
              <br />
              címre – örömmel segítünk! Szívesen fogadjuk a visszajelzéseidet és ötleteidet is, hogyan tehetnénk még jobbá az oldalt.
              Igyekszünk minden üzenetre néhány napon belül válaszolni.
            </p>
            <button className="btn btn-secondary mt-3" onClick={() => setCurrentPage("home")}>
              Vissza
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

