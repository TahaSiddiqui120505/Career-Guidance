import { Routes, Route } from "react-router-dom"

import Landing             from "./pages/Landing"
import Login               from "./pages/Login"
import Register            from "./pages/Register"
import Dashboard           from "./pages/Dashboard"
import ResumeBuilder       from "./pages/ResumeBuilder"
import CoverLetter         from "./pages/CoverLetter"
import InterviewPrep       from "./pages/InterviewPrep"
import InterviewScheduler  from "./pages/InterviewScheduler"
import IndustryInsights    from "./pages/IndustryInsights"

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Routes>
        <Route path="/"             element={<Landing />}             />
        <Route path="/login"        element={<Login />}               />
        <Route path="/register"     element={<Register />}            />
        <Route path="/dashboard"    element={<Dashboard />}           />
        <Route path="/resume"       element={<ResumeBuilder />}       />
        <Route path="/cover-letter" element={<CoverLetter />}         />
        <Route path="/interview"    element={<InterviewPrep />}       />
        <Route path="/scheduler"    element={<InterviewScheduler />}  />
        <Route path="/insights"     element={<IndustryInsights />}    />
      </Routes>
    </div>
  )
}