import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        start_date,
        end_date,
        target_audience,
        contact,
        registration_link,
        communities ( name )
      `
      )
      .gt("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setEvents(data);
    }
    setLoading(false);
  }

  if (loading) return <p>Betöltés...</p>;

  return (
    <div>
      <h2>Lelkigyakorlatok</h2>
      {events.length === 0 ? (
        <p>Nincs közelgő lelkigyakorlat.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: "20px" }}>
              <h3>{event.title}</h3>
              <p>
                <b>Időpont:</b>{" "}
                {new Date(event.start_date).toLocaleDateString()} –{" "}
                {event.end_date
                  ? new Date(event.end_date).toLocaleDateString()
                  : "—"}
              </p>
              <p>
                <b>Célcsoport:</b> {event.target_audience || "N/A"}
              </p>
              <p>
                <b>Szervező közösség:</b>{" "}
                {event.communities ? event.communities.name : "—"}
              </p>
              <p>
                <b>Kapcsolattartó:</b> {event.contact || "—"}
              </p>
              <p>{event.description}</p>
              {event.registration_link && (
                <a href={event.registration_link} target="_blank" rel="noreferrer">
                  <button>Jelentkezem</button>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}