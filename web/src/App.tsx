import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Board from "./pages/Board";
import Projects from "./pages/Projects";
import Teams from "./pages/Teams";
import Tickets from "./pages/Tickets";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Board />} />
          <Route path="projects" element={<Projects />} />
          <Route path="teams" element={<Teams />} />
          <Route path="tickets" element={<Tickets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
