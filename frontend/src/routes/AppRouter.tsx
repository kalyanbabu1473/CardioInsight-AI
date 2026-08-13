import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "../components/layout/AppShell";

import { routes } from "./routeConfig";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}