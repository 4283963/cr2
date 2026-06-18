import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Monitor from "@/pages/Monitor";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Monitor />} />
      </Routes>
    </Router>
  );
}
