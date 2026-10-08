"use client";

import { useState } from "react";
import { readEvents } from "./read-events";

export default function HomePage() {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");

  async function investigate() {
    setRunning(true);
    setEvents([]);
    setReport("");
    setError("");

    try {
      const response = await fetch("/api/investigation", { method: "POST" });

      await readEvents(response, (event) => {
        if (event.type === "report") setReport(event.report);
        else if (event.type === "error") setError(event.message);
        else setEvents((prev) => [...prev, event]);
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="ops-agent">
      <header className="ops-header">
        <h1>Ops Agent</h1>
        <p>AI Agent for investigating bugs!</p>
      </header>

      <button
        className="investigate-button"
        onClick={investigate}
        disabled={running}
      >
        {running ? "Investigating..." : "Investigate The Service"}
      </button>

      <section className="agent-activity">
        <h2>What the agent is doing?</h2>

        <div className="events-list">
          {events.map((event, i) => (
            <div className="event-card" key={i}>
              <div className="event-status">
                {event.type === "tool_called"
                  ? `${event.tool} tool started 🔧`
                  : `${event.tool} tool returned ✅`}
              </div>

              {event.output && (
                <pre className="event-output">
                  {JSON.stringify(event.output, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Report</h2>

        {error && <p className="error-message">{error}</p>}

        {report && <p className="report-content">{report}</p>}
      </section>
    </main>
  );
}
