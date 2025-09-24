export default function EventList({ search, targetGroup, location }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      let query = supabase.from("events").select("*").order("start_date", { ascending: true });
      if (targetGroup) query = query.eq("target_group", targetGroup);
      if (location) query = query.eq("location", location);

      const { data, error } = await query;
      if (error) console.error(error);
      else setEvents(data);
    }
    fetchEvents();
  }, [targetGroup, location]);

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {filteredEvents.length === 0 ? (
        <p className="text-gray-500">Nincs találat</p>
      ) : (
        <ul>
          {filteredEvents.map(e => (
            <li key={e.id} className="event-card">
              <h3 className="text-xl font-semibold">{e.title}</h3>
              <p className="text-gray-600">{e.start_date} – {e.end_date || e.start_date}</p>
              {e.target_group && <p className="italic text-gray-500">{e.target_group}</p>}
              {e.location && <p className="text-gray-500">{e.location}</p>}
              {e.registration_link && (
                <a
                  href={e.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Jelentkezés
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
