import React from "react";

const EventList = ({ events }) => {
  return (
    <div className="container mt-4">
      <h2 className="mb-4">Lelkigyakorlatok</h2>
      <div className="row">
        {events.map((event) => (
          <div key={event.id} className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{event.title}</h5>
                <h6 className="card-subtitle mb-2 text-muted">
                  {event.start_date} – {event.end_date}
                </h6>
                <p className="card-text">{event.description}</p>
                <p className="card-text">
                  <strong>Célcsoport:</strong> {event.target_group}
                </p>
                <a
                  href={event.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Jelentkezés
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventList;