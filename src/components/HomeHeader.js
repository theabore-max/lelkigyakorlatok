// src/components/HomeHeader.js
import React from "react";
import headerImage from "../assets/header.jpg"; // a saját header képed

export default function HomeHeader() {
  return (
    <header
      className="bg-image d-flex justify-content-center align-items-start text-center"
      style={{
        backgroundImage: `url(${headerImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "35vh",
      }}
    >
      <div className="container mt-5">
        <h1 className="display-4 fw-bold" style={{ color: "#4169E1" }}>
          Katolikus Lelkigyakorlat-kereső
        </h1>
        <p className="lead" style={{ color: "#4169E1" }}>
          Találd meg azt a lelkigyakorlatot, ami neked szól!
        </p>
      </div>
    </header>
  );
}


