import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SimulationProvider } from "./hooks/useSimulation.js";
import { Navbar } from "./components/Navbar.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { EditorPage } from "./pages/EditorPage.js";
import { SimulationPage } from "./pages/SimulationPage.js";
import { MappingPage } from "./pages/MappingPage.js";
import { TelemetryPage } from "./pages/TelemetryPage.js";
import { HistoryPage } from "./pages/HistoryPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";

export const App: React.FC = () => {
  return (
    <SimulationProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
          <Navbar />
          <main className="flex-1 pb-12">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/maze-editor" element={<EditorPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/mapping" element={<MappingPage />} />
              <Route path="/telemetry" element={<TelemetryPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SimulationProvider>
  );
};

export default App;

