import React, { useState } from "react";
import EventCard from "./EventCard";
import FilterBar from "./FilterBar";

const EventList = ({ events, user }) => {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const filteredEvents = events.filter(e => 
    (filter === "" || e.target_group === filter) &&
    (search === "" || e.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3">
          <FilterBar filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
        </div>
        <div className="col-md-9">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventList;