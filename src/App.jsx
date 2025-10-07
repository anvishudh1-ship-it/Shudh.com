import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import ScrollToTop from "./Hooks/ScrollToTop";
import Header from "./Components/Header";

import Dashboard from "./Pages/Dashboard";
import Robots from "./Pages/Robots";
import Reports from "./Pages/Reports"
import Highlights from "./Pages/Highlights";
import NotFound from "./Pages/NotFound";
import Robots1 from "./Pages/Robots1";

function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* Header */}
      <Header />

      {/* Routes */}
      <main className="bg-[#fff] max-w-[1400px] m-auto min-h-screen pt-[100px] font-[inter] place-items-center">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/robots" element={<Robots />} />
          <Route path="/robots1" element={<Robots1 />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/highlights" element={<Highlights />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
