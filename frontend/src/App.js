import { Routes, Route } from "react-router-dom"

import Landing             from "./pages/Landing/Landing"
import Login               from "./pages/Login/Login"
import Register            from "./pages/Register/Register"
import Dashboard           from "./pages/Dashboard/Dashboard"
import ResumeBuilder       from "./pages/ResumeBuilder/ResumeBuilder"
import CoverLetter         from "./pages/CoverLetter/CoverLetter"
import InterviewPrep       from "./pages/InterviewPrep/InterviewPrep"
import InterviewScheduler  from "./pages/InterviewScheduler/InterviewScheduler"
import IndustryInsights    from "./pages/IndustryInsights/IndustryInsights"

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
