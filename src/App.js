// src/App.js
import React, { useState } from "react";
import PageContent from "./components/PageContent";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <PageContent page={page} setPage={setPage} />
    </div>
  );
}

export default App;