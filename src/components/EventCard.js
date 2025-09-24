export default function EventCard({ event }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px" }}>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <p><b>Időpont:</b> {event.start_date} - {event.end_date || "—"}</p>
      <p><b>Helyszín:</b> {event.location || "—"}</p>
      {event.signup_link && (
        <a href={event.signup_link} target="_blank" rel="noreferrer">
          <button>Jelentkezem</button>
        </a>
      )}
    </div>
  );
}