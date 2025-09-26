// src/components/PageContent.js
import React from "react";
import EventList from "./EventList";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import LoginForm from "./LoginForm";

export default function PageContent({ currentPage }) {
  const [currentPage, setCurrentPage] = useState("home");
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <EventList />;
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "login":
        return <LoginForm />;
      default:
        return <EventList />;
    }
  };

  return <div>{renderPage()}</div>;
}

