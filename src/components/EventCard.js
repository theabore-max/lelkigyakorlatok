import React, { useState } from "react";

const EventCard = ({ event, user }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{event.title}</h5>
        <p>{event.start_date} – {event.end_date || "?"}</p>
        <p>{event.location}</p>
        <p>{event.organizer}</p>
        {expanded && (
          <>
            <p>{event.description}</p>
            <p><strong>Célcsoport:</strong> {event.target_group}</p>
            <p><a href={event.registration_link} target="_blank" rel="noopener noreferrer">Jelentkezés</a></p>
          </>
        )}
        <button className="btn btn-sm btn-link" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Bezár" : "Részletek"}
        </button>
        {user && user.id === event.user_id && (
          <button className="btn btn-sm btn-primary ml-2">Szerkesztés</button>
        )}
      </div>
    </div>
  );
};

export default EventCard;
