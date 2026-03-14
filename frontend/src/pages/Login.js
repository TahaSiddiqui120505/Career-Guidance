import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

const FEATURES = [
  { icon: "🧠", title: "AI Mock Interviews",   sub: "Practice with adaptive questions tailored to your role" },
  { icon: "📄", title: "Cover Letter Studio",  sub: "Generate and customise letters in seconds" },
  { icon: "🎤", title: "Voice & Video Mode",   sub: "Practise speaking and track filler words live" },
  { icon: "📈", title: "Progress Tracking",    sub: "See your score trends improve session by session" },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes auth-orb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.08)} }
  @keyframes auth-orb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
  @keyframes auth-orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,20px) scale(1.12)} }
  @keyframes auth-spin  { to { transform:rotate(360deg) } }
  @keyframes auth-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

  .auth-page {
    min-height: 100vh;
    background: #080a12;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
    position: relative;
  }

  .auth-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }

  .auth-left {
    width: 52%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 70px;
    position: relative;
    z-index: 1;
  }

  .auth-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 50px;
    position: relative;
    z-index: 1;
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: rgba(13,15,28,0.85);
    border: 1px solid rgba(124,111,250,0.18);
    border-radius: 24px;
    padding: 44px 40px;
    backdrop-filter: blur(24px);
    box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
  }

  .auth-inp-wrap {
    position: relative;
    margin-bottom: 16px;
  }

  .auth-inp {
    width: 100%;
    padding: 15px 18px 15px 50px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 15.5px;
    outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .auth-inp:focus {
    border-color: #7c6ffa;
    background: rgba(124,111,250,0.06);
    box-shadow: 0 0 0 3px rgba(124,111,250,0.14);
  }
  .auth-inp::placeholder { color: #4a5070; }
  .auth-inp:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #0d0f1c inset !important;
    -webkit-text-fill-color: #fff !important;
  }

  .auth-ico {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    pointer-events: none;
    opacity: 0.55;
  }

  .auth-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #5b4fd4, #7c6ffa);
    border: none;
    border-radius: 13px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 16.5px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity .2s, transform .15s;
    box-shadow: 0 4px 28px rgba(124,111,250,0.38);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .auth-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 22px 0;
    color: #3a3f5c;
    font-size: 13px;
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }

  .auth-err {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(240,82,82,0.08);
    border: 1px solid rgba(240,82,82,0.25);
    border-radius: 10px;
    color: #fca5a5;
    font-size: 14px;
    margin-bottom: 18px;
    animation: auth-shake .4s ease;
  }

  .feat-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 18px 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    margin-bottom: 12px;
    transition: border-color .2s, background .2s;
  }
  .feat-card:hover {
    border-color: rgba(124,111,250,0.2);
    background: rgba(124,111,250,0.04);
  }

  .pw-toggle {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    opacity: 0.4;
    transition: opacity .2s;
    padding: 4px;
    color: #fff;
  }
  .pw-toggle:hover { opacity: 0.8; }

  @media (max-width: 820px) {
    .auth-left { display: none; }
    .auth-right { padding: 24px 20px; }
  }
`

export default function Login() {
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [featIdx,  setFeatIdx]  = useState(0)

  useEffect(() => {
    const id = "auth-css"
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id
      el.textContent = CSS; document.head.appendChild(el)
    }
    const t = setInterval(() => setFeatIdx(i => (i + 1) % FEATURES.length), 3200)
    return () => clearInterval(t)
  }, [])

  const login = async () => {
    if (!email.trim() || !password) { setError("Please fill in both fields."); return }
    setLoading(true); setError("")
    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/login", { email, password })
      localStorage.setItem("token",     res.data.token)
      localStorage.setItem("userName",  res.data.user?.name || email.split("@")[0])
      localStorage.setItem("userEmail", email)
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect email or password. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const onKey = e => { if (e.key === "Enter") login() }

  return (
    <div className="auth-page">
      {/* Ambient orbs */}
      <div className="auth-orb" style={{ width:520, height:520, top:-120, left:-140, background:"rgba(124,111,250,0.12)", animation:"auth-orb1 9s ease-in-out infinite" }} />
      <div className="auth-orb" style={{ width:380, height:380, bottom:-80, left:"30%", background:"rgba(52,213,200,0.08)", animation:"auth-orb2 12s ease-in-out infinite" }} />
      <div className="auth-orb" style={{ width:280, height:280, top:"30%", right:-60, background:"rgba(124,111,250,0.07)", animation:"auth-orb3 10s ease-in-out infinite" }} />

      {/* Left panel */}
      <div className="auth-left">
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:64 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:"#fff", fontFamily:"'Playfair Display',serif" }}>S</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#fff" }}>SensAI</span>
        </div>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(36px,3.5vw,52px)", color:"#fff", lineHeight:1.2, marginBottom:18 }}>
          Your AI-powered<br />
          <span style={{ background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>career coach</span>
        </h1>
        <p style={{ fontSize:17, color:"#5a6488", lineHeight:1.75, marginBottom:48, maxWidth:440 }}>
          Prepare smarter, interview better, and land the role you want — with AI that adapts to you.
        </p>

        {/* Animated feature cards */}
        <div style={{ position:"relative" }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feat-card"
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity: i === featIdx ? 1 : i === (featIdx+1)%FEATURES.length ? 0.45 : 0.2, x:0, scale: i === featIdx ? 1 : 0.97 }}
              transition={{ duration:0.5 }}>
              <div style={{ fontSize:26, flexShrink:0, marginTop:2 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize:15.5, fontWeight:700, color: i === featIdx ? "#dde1f0" : "#6b7280", marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:13.5, color: i === featIdx ? "#5a6488" : "#3a3f5c", lineHeight:1.6 }}>{f.sub}</div>
              </div>
              {i === featIdx && (
                <div style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:"#7c6ffa", flexShrink:0, marginTop:6 }} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Dot indicators */}
        <div style={{ display:"flex", gap:8, marginTop:20 }}>
          {FEATURES.map((_,i) => (
            <div key={i} onClick={() => setFeatIdx(i)} style={{ width: i===featIdx?22:7, height:7, borderRadius:4, background: i===featIdx?"#7c6ffa":"#2a2d42", transition:"all .3s", cursor:"pointer" }} />
          ))}
        </div>
      </div>

      {/* Right panel — card */}
      <div className="auth-right">
        <motion.div className="auth-card" initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>

          {/* Card header */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,rgba(124,111,250,0.15),rgba(52,213,200,0.08))", border:"1px solid rgba(124,111,250,0.22)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>👋</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:7 }}>Welcome back</h2>
            <p style={{ fontSize:14.5, color:"#5a6488" }}>Sign in to continue your prep</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div className="auth-err" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fields */}
          <div className="auth-inp-wrap">
            <span className="auth-ico">✉️</span>
            <input className="auth-inp" type="email" placeholder="Email address"
              value={email} onChange={e => { setEmail(e.target.value); setError("") }}
              onKeyDown={onKey} autoComplete="email" />
          </div>

          <div className="auth-inp-wrap">
            <span className="auth-ico">🔒</span>
            <input className="auth-inp" type={showPw ? "text" : "password"} placeholder="Password"
              value={password} onChange={e => { setPassword(e.target.value); setError("") }}
              onKeyDown={onKey} autoComplete="current-password"
              style={{ paddingRight:48 }} />
            <button className="pw-toggle" onClick={() => setShowPw(v => !v)} type="button">
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Submit */}
          <motion.button className="auth-btn" onClick={login} disabled={loading}
            whileTap={{ scale:0.97 }} style={{ marginTop:8 }}>
            {loading
              ? <><span style={{ width:17, height:17, border:"2.5px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"auth-spin .7s linear infinite", display:"inline-block" }} /> Signing in…</>
              : "Sign in →"}
          </motion.button>

          <div className="auth-divider">or</div>

          {/* Register CTA */}
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:14.5, color:"#5a6488" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color:"#a99dfc", fontWeight:700, textDecoration:"none" }}>
                Create one free →
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <p style={{ textAlign:"center", fontSize:12, color:"#3a3f5c", marginTop:24, lineHeight:1.7 }}>
            By continuing you agree to SensAI's terms of service.<br/>Your data is never sold.
          </p>
        </motion.div>
      </div>
    </div>
  )
}