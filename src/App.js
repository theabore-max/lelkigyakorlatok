import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import EventList from "./components/EventList";
import AddEventPage from "./pages/AddEventPage";
import useAuth from "./hooks/useAuth";

function App() {
  const user = useAuth();

  return (
    <Router>
      <div style={{ padding: "20px" }}>
        <h1>Lelkigyakorlat kereső</h1>
        <nav>
          <Link to="/">Események</Link> |{" "}
          {user && <Link to="/add-event">Új esemény</Link>}
        </nav>
        <AuthForm />
        <Routes>
          <Route path="/" element={<EventList />} />
          <Route path="/add-event" element={<AddEventPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
