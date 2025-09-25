import React from "react";

const Navbar = ({ setPage, user }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <span className="navbar-brand" style={{ cursor: "pointer" }} onClick={() => setPage("home")}>
          Lelkigyakorlatok
        </span>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <span className="nav-link" onClick={() => setPage("about")}>Az oldal célja</span>
            </li>
            <li className="nav-item">
              <span className="nav-link" onClick={() => setPage("contact")}>Kapcsolat</span>
            </li>
            {!user && (
              <li className="nav-item">
                <span className="nav-link" onClick={() => setPage("login")}>Belépés</span>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <span className="nav-link" onClick={() => setPage("add")}>Lelkigyakorlat hozzáadása</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
