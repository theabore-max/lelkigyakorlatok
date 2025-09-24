import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function EventList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setEvents(data);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div>
      <h2>Események</h2>
      {events.length === 0 ? (
        <p>Nincs esemény</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.title}</strong> – {event.start_date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}