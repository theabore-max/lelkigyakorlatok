import React, { useEffect, useState } from "react";
import EventList from "./components/EventList";
import { supabase } from "./supabaseClient";

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      let { data, error } = await supabase.from("events").select("*");
      if (error) console.error(error);
      else setEvents(data);
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <EventList events={events} />
    </div>
  );
}

export default App;