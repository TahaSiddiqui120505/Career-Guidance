import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { TypeAnimation } from "react-type-animation"
import { Link } from "react-router-dom"
import { ArrowRight, ArrowUpRight } from "lucide-react"

// ── Global styles injected once ──────────────────────────────
const GCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #04050d;
    --surface:  #080a14;
    --s2:       #0d0f1d;
    --border:   rgba(255,255,255,0.07);
    --border2:  rgba(255,255,255,0.13);
    --text:     #eaecf5;
    --muted:    #565b78;
    --muted2:   #383d56;
    --accent:   #7c6ffa;
    --teal:     #34d5c8;
    --amber:    #f59e0b;
    --green:    #22c55e;
    --serif:    'Instrument Serif', serif;
    --sans:     'Syne', sans-serif;
    --body:     'DM Sans', sans-serif;
  }

  html { scroll-behavior: smooth; }

  .lp-page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--body);
    overflow-x: hidden;
  }

  /* ── Grain overlay ── */
  .lp-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.032;
    pointer-events: none;
    z-index: 999;
  }

  /* ── Cursor dot ── */
  .cursor-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent);
    position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999;
    transform: translate(-50%,-50%);
    transition: width .2s, height .2s, background .2s;
    mix-blend-mode: difference;
  }
  .cursor-ring {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid rgba(124,111,250,0.4);
    position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9998;
    transform: translate(-50%,-50%);
    transition: transform .12s ease, width .25s, height .25s, border-color .25s;
  }

  /* ── Animated underline ── */
  .lp-link {
    position: relative; color: var(--text); text-decoration: none; cursor: pointer;
  }
  .lp-link::after {
    content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px;
    background: var(--accent); transition: width .3s ease;
  }
  .lp-link:hover::after { width: 100%; }

  /* ── Marquee ── */
  @keyframes lp-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .marquee-track { display: flex; width: max-content; animation: lp-marquee 28s linear infinite; }
  .marquee-track:hover { animation-play-state: paused; }

  /* ── Floating orbs ── */
  @keyframes lp-orb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(80px,-60px) scale(1.12)} }
  @keyframes lp-orb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-70px,80px) scale(1.08)} }
  @keyframes lp-orb3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,30px) scale(1.05)} 66%{transform:translate(-30px,-40px) scale(0.95)} }

  /* ── Grid line bg ── */
  .lp-grid-bg {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%);
  }

  /* ── Horizontal rule ── */
  .lp-hr { height: 1px; background: var(--border); }

  /* ── Scroll fade ── */
  @keyframes lp-fadein { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  .lp-reveal { opacity: 0; animation: lp-fadein .7s ease forwards; }

  /* ── Feature card ── */
  .lp-feat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 32px; position: relative;
    overflow: hidden; transition: border-color .25s, transform .25s;
    cursor: default;
  }
  .lp-feat-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(124,111,250,0.04) 0%, transparent 60%);
    opacity: 0; transition: opacity .3s;
  }
  .lp-feat-card:hover { border-color: rgba(124,111,250,0.25); transform: translateY(-4px); }
  .lp-feat-card:hover::before { opacity: 1; }

  /* ── Stat number ── */
  .lp-stat-num {
    font-family: var(--serif); font-size: clamp(42px,6vw,72px);
    font-weight: 400; line-height: 1; letter-spacing: -2px;
  }

  /* ── CTA gradient border ── */
  .lp-cta-border {
    background: linear-gradient(135deg, rgba(124,111,250,0.15), rgba(52,213,200,0.08));
    border: 1px solid rgba(124,111,250,0.2);
    border-radius: 28px;
    position: relative; overflow: hidden;
  }
  .lp-cta-border::before {
    content: ''; position: absolute; inset: 0; border-radius: 28px;
    background: linear-gradient(135deg, rgba(124,111,250,0.08), transparent 50%, rgba(52,213,200,0.05));
    pointer-events: none;
  }

  /* ── Testimonial card ── */
  .lp-testi {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 24px 26px; flex-shrink: 0;
    width: 320px;
  }

  /* ── Process step ── */
  .lp-step-line {
    position: absolute; left: 21px; top: 44px;
    width: 1px; height: calc(100% + 24px);
    background: linear-gradient(to bottom, var(--border2), transparent);
  }
`

const TOOLS = [
  { n:"01", title:"Resume Builder",       sub:"10 templates, AI bullet enhancement, one-click PDF",  color:"#7c6ffa", tag:"Most used"    },
  { n:"02", title:"Cover Letter Studio",  sub:"JD-matched letters generated in under 10 seconds",    color:"#34d5c8", tag:null           },
  { n:"03", title:"Interview Prep",       sub:"Voice mode, devil's advocate AI, real-time STAR coach",color:"#f59e0b", tag:"Fan favourite"},
  { n:"04", title:"Interview Scheduler",  sub:"Set your date, get a day-by-day prep plan",            color:"#30c97e", tag:null           },
  { n:"05", title:"Resume Gap Detector",  sub:"Upload your CV, get the questions they'll ambush you with",color:"#a78bfa",tag:"New"       },
  { n:"06", title:"Industry Insights",    sub:"Salaries, hot skills, top employers — any role, any market", color:"#34d5c8", tag:null     },
]

const STATS = [
  { val:"10+",  label:"tools in one platform"    },
  { val:"6",    label:"global job markets"        },
  { val:"∞",    label:"mock sessions per month"   },
  { val:"0₹",   label:"to start — completely free"},
]

const STEPS = [
  { n:"1", title:"Sign up free",           sub:"No credit card. Takes 20 seconds."                                              },
  { n:"2", title:"Set your target role",   sub:"Tell SensAI where you want to go. It personalises everything."                  },
  { n:"3", title:"Practise every day",     sub:"Interview sessions, resume gaps, cold emails. All from one dashboard."          },
  { n:"4", title:"Walk in ready",          sub:"Your scheduler tracks the countdown. Your report shows you're prepared."        },
]

const TESTIMONIALS = [
  { text:"The devil's advocate mode is brutal in the best way. I walked into my Goldman interview actually prepared for the hard questions.", name:"Aditya R.", role:"IB Analyst · Goldman Sachs" },
  { text:"I uploaded my CV and SensAI immediately found the three gaps that my interviewer hammered me on in a previous round. Uncanny.", name:"Priya M.", role:"Consultant · McKinsey & Co" },
  { text:"The live word heatmap while I type my answers changed how I write. I stopped hedging without even noticing.", name:"James L.", role:"SWE · Stripe" },
  { text:"Built my whole Goldman prep plan in 20 minutes. Scheduler, mock sessions, the gap detector — all in one place.", name:"Sara K.", role:"Equity Research · Morgan Stanley" },
]

const MARQUEE_ROLES = [
  "Investment Banking Analyst", "Software Engineer", "Management Consultant",
  "Product Manager", "Data Scientist", "Private Equity Associate",
  "UX Designer", "Venture Capital Analyst", "Risk Analyst",
  "DevOps Engineer", "Chartered Accountant", "Strategy Consultant",
]


// ── Tech background: particle network + floating code ────────
function TechCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let raf, w, h

    const resize = () => {
      w = canvas.width  = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // ── Particles ──
    const PARTICLE_COUNT = 72
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:   Math.random() * w,
      y:   Math.random() * h,
      vx:  (Math.random() - 0.5) * 0.38,
      vy:  (Math.random() - 0.5) * 0.38,
      r:   Math.random() * 1.6 + 0.4,
      pulse: Math.random() * Math.PI * 2,
      type: Math.random() > 0.75 ? "bright" : "dim",
    }))

    // ── Floating code tokens ──
    const TOKENS = [
      "AI", "ML", "NLP", ".py", "API",
      "{ }", "=>", "//", "async", "fetch",
      "LLM", "GPT", "0x", "200", "POST",
      "PDF", "CV", "JD", "HR", "GS",
    ]
    const floaters = Array.from({ length: 18 }, (_, i) => ({
      x:      Math.random() * w,
      y:      Math.random() * h,
      vy:     -(Math.random() * 0.25 + 0.08),
      vx:     (Math.random() - 0.5) * 0.12,
      alpha:  Math.random() * 0.18 + 0.04,
      token:  TOKENS[i % TOKENS.length],
      size:   Math.random() * 4 + 9,
      life:   Math.random(),
      speed:  Math.random() * 0.003 + 0.001,
    }))

    // ── Mouse interaction ──
    let mx = -999, my = -999
    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect()
      mx = e.clientX - rect.left
      my = e.clientY - rect.top
    }
    canvas.addEventListener("mousemove", onMouse)
    canvas.addEventListener("mouseleave", () => { mx = -999; my = -999 })

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)

      // ── Connections ──
      const CONNECT_DIST = 130
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.18
            // Purple-teal gradient line
            const grad = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y)
            grad.addColorStop(0, `rgba(124,111,250,${alpha})`)
            grad.addColorStop(1, `rgba(52,213,200,${alpha * 0.6})`)
            ctx.beginPath()
            ctx.strokeStyle = grad
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // ── Mouse ripple connections ──
      particles.forEach(p => {
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 160) {
          const alpha = (1 - dist / 160) * 0.35
          ctx.beginPath()
          ctx.strokeStyle = `rgba(124,111,250,${alpha})`
          ctx.lineWidth = 0.8
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mx, my)
          ctx.stroke()
        }
      })

      // ── Particles ──
      particles.forEach(p => {
        p.pulse += 0.022
        const pulseFactor = 0.85 + Math.sin(p.pulse) * 0.15

        // Mouse repel
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 90 && dist > 0) {
          const force = (90 - dist) / 90 * 0.6
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }
        // Dampen velocity
        p.vx *= 0.994
        p.vy *= 0.994

        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0

        const r = p.r * pulseFactor
        const alpha = p.type === "bright" ? 0.75 : 0.35

        ctx.beginPath()
        if (p.type === "bright") {
          // Glowing dot
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3)
          grd.addColorStop(0, `rgba(124,111,250,${alpha})`)
          grd.addColorStop(0.5, `rgba(124,111,250,${alpha * 0.3})`)
          grd.addColorStop(1, `rgba(124,111,250,0)`)
          ctx.fillStyle = grd
          ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = p.type === "bright"
          ? `rgba(167,139,250,${alpha})`
          : `rgba(100,110,160,${alpha * 0.7})`
        ctx.fill()
      })

      // ── Floating code tokens ──
      floaters.forEach(f => {
        f.life += f.speed
        if (f.life > 1) {
          f.life = 0
          f.x = Math.random() * w
          f.y = h + 20
          f.token = TOKENS[Math.floor(Math.random() * TOKENS.length)]
          f.alpha = Math.random() * 0.18 + 0.04
        }
        const fadeIn  = Math.min(f.life / 0.15, 1)
        const fadeOut = 1 - Math.max((f.life - 0.8) / 0.2, 0)
        const a = f.alpha * fadeIn * fadeOut

        f.x += f.vx
        f.y -= f.vy * 60

        ctx.font = `${f.size}px 'SF Mono', 'Courier New', monospace`
        ctx.fillStyle = `rgba(124,111,250,${a})`
        ctx.fillText(f.token, f.x, f.y)
      })

      // ── Horizontal scan line ──
      const scanY = ((t * 0.025) % h)
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      scanGrad.addColorStop(0, "rgba(52,213,200,0)")
      scanGrad.addColorStop(0.5, "rgba(52,213,200,0.025)")
      scanGrad.addColorStop(1, "rgba(52,213,200,0)")
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 40, w, 80)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("mousemove", onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", display:"block", zIndex:1, opacity:0.85 }}
    />
  )
}

export default function Landing() {
  const cursorDotRef  = useRef(null)
  const cursorRingRef = useRef(null)
  const heroRef       = useRef(null)
  const [mounted, setMounted] = useState(false)

  const { scrollYProgress } = useScroll()
  const heroY   = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const heroOp  = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  useEffect(() => {
    const id = "lp-css"
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id
      el.textContent = GCSS; document.head.appendChild(el)
    }
    setMounted(true)

    const onMove = (e) => {
      if (cursorDotRef.current)  { cursorDotRef.current.style.left  = e.clientX + "px"; cursorDotRef.current.style.top  = e.clientY + "px" }
      if (cursorRingRef.current) { cursorRingRef.current.style.left = e.clientX + "px"; cursorRingRef.current.style.top = e.clientY + "px" }
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  if (!mounted) return null

  return (
    <div className="lp-page">
      {/* Custom cursor */}
      <div ref={cursorDotRef}  className="cursor-dot"  />
      <div ref={cursorRingRef} className="cursor-ring" />

      {/* ── NAV ── */}
      <motion.nav style={{ position:"relative", zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 48px", borderBottom:"1px solid var(--border)" }}
        initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--serif)", fontSize:16, fontWeight:400, color:"#fff", letterSpacing:-0.5 }}>S</div>
          <span style={{ fontFamily:"var(--serif)", fontSize:19, color:"#fff", letterSpacing:-0.3 }}>SensAI</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:32 }}>
          {[["Features","#features"],["How it works","#how-it-works"],["Insights","#insights"]].map(([l,id]) => (
            <a key={l} href={id} className="lp-link"
              style={{ fontSize:14, color:"var(--muted)", fontFamily:"var(--sans)", fontWeight:500, textDecoration:"none" }}
              onClick={e => { e.preventDefault(); document.querySelector(id)?.scrollIntoView({ behavior:"smooth", block:"start" }) }}>
              {l}
            </a>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <Link to="/login" style={{ textDecoration:"none" }}>
            <button style={{ padding:"8px 20px", background:"transparent", border:"1px solid var(--border2)", borderRadius:8, color:"var(--muted)", cursor:"pointer", fontSize:13.5, fontFamily:"var(--sans)", fontWeight:500, transition:"all .2s" }}
              onMouseEnter={e=>{e.target.style.borderColor="var(--accent)";e.target.style.color="var(--text)"}}
              onMouseLeave={e=>{e.target.style.borderColor="var(--border2)";e.target.style.color="var(--muted)"}}>
              Sign in
            </button>
          </Link>
          <Link to="/register" style={{ textDecoration:"none" }}>
            <motion.button style={{ padding:"8px 20px", background:"var(--accent)", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:13.5, fontFamily:"var(--sans)", fontWeight:600, letterSpacing:0.2 }}
              whileHover={{ opacity:0.88 }} whileTap={{ scale:0.97 }}>
              Get started free
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section style={{ position:"relative", minHeight:"92vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px 60px", overflow:"hidden" }}>

        {/* Tech canvas background */}
        <TechCanvas />

        {/* Soft radial vignette over canvas */}
        <div style={{ position:"absolute", inset:0, zIndex:1, background:"radial-gradient(ellipse 70% 65% at 50% 45%, transparent 30%, var(--bg) 100%)", pointerEvents:"none" }} />

        {/* Bottom fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:180, zIndex:1, background:"linear-gradient(to top, var(--bg), transparent)", pointerEvents:"none" }} />

        {/* Content */}
        <motion.div style={{ position:"relative", zIndex:3, textAlign:"center", maxWidth:860, y:heroY, opacity:heroOp }}>

          {/* Badge */}
          <motion.div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 16px 5px 8px", background:"rgba(124,111,250,0.07)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:30, marginBottom:32 }}
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
            <div style={{ padding:"3px 10px", background:"rgba(124,111,250,0.2)", borderRadius:20 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#a99dfc", fontFamily:"var(--sans)", letterSpacing:1, textTransform:"uppercase" }}>New</span>
            </div>
            <span style={{ fontSize:13, color:"#8a86c8", fontFamily:"var(--body)" }}>Resume Gap Detector just launched</span>
            <ArrowRight size={13} color="#8a86c8" />
          </motion.div>

          {/* H1 */}
          <motion.h1 style={{ fontFamily:"var(--serif)", fontSize:"clamp(44px,7.5vw,90px)", fontWeight:400, lineHeight:1.1, letterSpacing:"-2px", color:"#fff", marginBottom:28 }}
            initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25, duration:0.7 }}>
            Land your{" "}
            <span style={{ background:"linear-gradient(90deg,#a99dfc,#34d5c8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontStyle:"italic" }}>
              <TypeAnimation
                sequence={["dream job.", 2000, "next role.", 2000, "promotion.", 2000, "Goldman offer.", 2000, "McKinsey seat.", 2000]}
                wrapper="span" speed={48} repeat={Infinity}
              />
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p style={{ fontSize:18, color:"var(--muted)", lineHeight:1.75, maxWidth:560, margin:"0 auto 40px", fontWeight:300 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }}>
            Mock interviews, resume analysis, cold outreach, salary benchmarks,
            and a day-by-day prep plan — all in one place, powered by AI.
          </motion.p>

          {/* CTAs */}
          <motion.div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}>
            <Link to="/register" style={{ textDecoration:"none" }}>
              <motion.button
                style={{ display:"flex", alignItems:"center", gap:8, padding:"15px 32px", background:"linear-gradient(135deg,#5b4fd4,#7c6ffa)", border:"none", borderRadius:12, color:"#fff", fontSize:15.5, fontWeight:600, cursor:"pointer", fontFamily:"var(--sans)", letterSpacing:0.2, boxShadow:"0 0 40px rgba(124,111,250,0.3)" }}
                whileHover={{ scale:1.03, boxShadow:"0 0 60px rgba(124,111,250,0.45)" }} whileTap={{ scale:0.97 }}>
                Start for free <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link to="/login" style={{ textDecoration:"none" }}>
              <button style={{ padding:"15px 28px", background:"rgba(255,255,255,0.04)", border:"1px solid var(--border2)", borderRadius:12, color:"var(--muted)", fontSize:15, cursor:"pointer", fontFamily:"var(--body)", transition:"all .2s" }}
                onMouseEnter={e=>{e.target.style.color="var(--text)";e.target.style.borderColor="rgba(255,255,255,0.22)"}}
                onMouseLeave={e=>{e.target.style.color="var(--muted)";e.target.style.borderColor="var(--border2)"}}>
                Sign in
              </button>
            </Link>
          </motion.div>

          {/* Trust pills */}
          <motion.div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap", marginTop:32 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.75 }}>
            {["No credit card required","Free forever plan","6 global job markets","Built for Indian & global students"].map((t,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, color:"var(--muted)" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--teal)" }} />
                {t}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"18px 0", overflow:"hidden", background:"var(--surface)", position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", maskImage:"linear-gradient(90deg,transparent,black 10%,black 90%,transparent)" }}>
          <div className="marquee-track">
            {[...MARQUEE_ROLES, ...MARQUEE_ROLES].map((r,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"0 28px", whiteSpace:"nowrap" }}>
                <span style={{ fontSize:13.5, color:"var(--muted)", fontFamily:"var(--sans)", fontWeight:500 }}>{r}</span>
                <div style={{ width:4, height:4, borderRadius:"50%", background:"var(--muted2)", flexShrink:0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section id="insights" style={{ position:"relative", zIndex:2, padding:"90px 48px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, borderBottom:"1px solid var(--border)" }}>
        {STATS.map((s,i) => (
          <motion.div key={i} style={{ padding:"40px 32px", borderRight: i<3?"1px solid var(--border)":"none", textAlign:"center" }}
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}>
            <div className="lp-stat-num" style={{ color: i===0?"#a99dfc":i===1?"#34d5c8":i===2?"#f59e0b":"#30c97e", marginBottom:10 }}>{s.val}</div>
            <div style={{ fontSize:14, color:"var(--muted)", fontFamily:"var(--sans)", fontWeight:500, letterSpacing:0.2 }}>{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* ── TOOLS GRID ── */}
      <section id="features" style={{ position:"relative", zIndex:2, padding:"100px 48px" }}>
        <motion.div style={{ marginBottom:60 }}
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:2, marginBottom:16, fontFamily:"var(--sans)" }}>The Platform</div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:"clamp(32px,5vw,58px)", fontWeight:400, letterSpacing:-1.5, lineHeight:1.1, maxWidth:640 }}>
            Six tools.<br /><span style={{ fontStyle:"italic", color:"var(--muted)" }}>One destination.</span>
          </h2>
        </motion.div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, border:"1px solid var(--border)", borderRadius:20, overflow:"hidden" }}>
          {TOOLS.map((t,i) => (
            <motion.div key={i} className="lp-feat-card" style={{ borderRadius:0, border:"none", borderRight:i%3!==2?"1px solid var(--border)":"none", borderBottom:i<3?"1px solid var(--border)":"none" }}
              initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <span style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--muted2)", letterSpacing:1 }}>{t.n}</span>
                {t.tag && (
                  <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${t.color}14`, color:t.color, border:`1px solid ${t.color}28`, fontFamily:"var(--sans)", letterSpacing:0.5 }}>{t.tag}</span>
                )}
              </div>
              <div style={{ width:36, height:36, borderRadius:10, background:`${t.color}12`, border:`1px solid ${t.color}22`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <div style={{ width:14, height:14, borderRadius:4, background:t.color }} />
              </div>
              <h3 style={{ fontFamily:"var(--sans)", fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:8, letterSpacing:-0.3 }}>{t.title}</h3>
              <p style={{ fontSize:13.5, color:"var(--muted)", lineHeight:1.7 }}>{t.sub}</p>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:18, color:t.color, fontSize:13, fontFamily:"var(--sans)", fontWeight:600, opacity:0 }} className="tool-arrow">
                Open <ArrowUpRight size={13} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ position:"relative", zIndex:2, padding:"100px 48px", borderTop:"1px solid var(--border)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start", maxWidth:1100, margin:"0 auto" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--teal)", textTransform:"uppercase", letterSpacing:2, marginBottom:16, fontFamily:"var(--sans)" }}>How it works</div>
            <h2 style={{ fontFamily:"var(--serif)", fontSize:"clamp(30px,4.5vw,52px)", fontWeight:400, letterSpacing:-1.5, lineHeight:1.15, marginBottom:20 }}>
              From zero to<br /><span style={{ fontStyle:"italic" }}>offer-ready.</span>
            </h2>
            <p style={{ fontSize:15.5, color:"var(--muted)", lineHeight:1.8, maxWidth:360, fontWeight:300 }}>
              Most candidates prepare in isolation. SensAI gives you a structured path — from knowing your gaps to walking in confident.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {STEPS.map((s,i) => (
              <motion.div key={i} style={{ display:"flex", gap:20, paddingBottom:32, position:"relative" }}
                initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.12 }}>
                {i < STEPS.length-1 && <div className="lp-step-line" />}
                <div style={{ width:42, height:42, borderRadius:"50%", background:"var(--surface)", border:"1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"var(--accent)", flexShrink:0, zIndex:1 }}>{s.n}</div>
                <div style={{ paddingTop:10 }}>
                  <div style={{ fontFamily:"var(--sans)", fontSize:15.5, fontWeight:700, color:"var(--text)", marginBottom:6, letterSpacing:-0.2 }}>{s.title}</div>
                  <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7 }}>{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position:"relative", zIndex:2, padding:"80px 0 100px", borderTop:"1px solid var(--border)", overflow:"hidden" }}>
        <div style={{ padding:"0 48px", marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--amber)", textTransform:"uppercase", letterSpacing:2, marginBottom:14, fontFamily:"var(--sans)" }}>What people say</div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:"clamp(28px,4vw,48px)", fontWeight:400, letterSpacing:-1.2 }}>
            Real results. <span style={{ fontStyle:"italic", color:"var(--muted)" }}>Real roles.</span>
          </h2>
        </div>

        {/* Scrolling testimonials */}
        <div style={{ display:"flex", gap:16, overflowX:"auto", padding:"4px 48px 20px", scrollbarWidth:"none" }}>
          {TESTIMONIALS.map((t,i) => (
            <motion.div key={i} className="lp-testi"
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}>
              <div style={{ display:"flex", gap:2, marginBottom:16 }}>
                {[1,2,3,4,5].map(s => <div key={s} style={{ width:12, height:12, borderRadius:"50%", background:"#f59e0b", opacity:0.9 }} />)}
              </div>
              <p style={{ fontSize:14, color:"#c0c8e0", lineHeight:1.75, marginBottom:20, fontStyle:"italic", fontFamily:"var(--body)" }}>"{t.text}"</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,var(--accent),var(--teal))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", fontFamily:"var(--sans)" }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text)", fontFamily:"var(--sans)" }}>{t.name}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position:"relative", zIndex:2, padding:"80px 48px 100px" }}>
        <motion.div className="lp-cta-border" style={{ maxWidth:860, margin:"0 auto", padding:"72px 60px", textAlign:"center" }}
          initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>

          {/* Interior orb */}
          <div style={{ position:"absolute", top:-60, left:"50%", transform:"translateX(-50%)", width:300, height:300, borderRadius:"50%", background:"rgba(124,111,250,0.07)", filter:"blur(60px)", pointerEvents:"none" }} />

          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:2, marginBottom:20, fontFamily:"var(--sans)" }}>Get started today</div>
            <h2 style={{ fontFamily:"var(--serif)", fontSize:"clamp(30px,5vw,60px)", fontWeight:400, letterSpacing:-1.5, lineHeight:1.1, marginBottom:20, color:"#fff" }}>
              Your next interview<br /><span style={{ fontStyle:"italic", color:"var(--muted)" }}>starts here.</span>
            </h2>
            <p style={{ fontSize:16, color:"var(--muted)", lineHeight:1.75, maxWidth:480, margin:"0 auto 36px", fontWeight:300 }}>
              Thousands of candidates have used SensAI to land roles at Goldman, McKinsey, Google, and beyond. Your turn.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <Link to="/register" style={{ textDecoration:"none" }}>
                <motion.button
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 36px", background:"linear-gradient(135deg,#5b4fd4,#7c6ffa)", border:"none", borderRadius:12, color:"#fff", fontSize:16, fontWeight:600, cursor:"pointer", fontFamily:"var(--sans)", letterSpacing:0.2, boxShadow:"0 0 40px rgba(124,111,250,0.35)" }}
                  whileHover={{ scale:1.04, boxShadow:"0 0 60px rgba(124,111,250,0.5)" }} whileTap={{ scale:0.97 }}>
                  Start free — no card needed <ArrowRight size={17} />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:"relative", zIndex:2, borderTop:"1px solid var(--border)", padding:"32px 48px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--serif)", fontSize:13, color:"#fff" }}>S</div>
            <span style={{ fontFamily:"var(--serif)", fontSize:16, color:"var(--text)" }}>SensAI</span>
          </div>
          <div style={{ display:"flex", gap:28, alignItems:"center" }}>
            {["Privacy","Terms","Contact"].map(l => (
              <a key={l} className="lp-link" style={{ fontSize:13, color:"var(--muted)", fontFamily:"var(--body)" }}>{l}</a>
            ))}
          </div>
          <p style={{ fontSize:13, color:"var(--muted2)" }}>© 2026 SensAI · All rights reserved</p>
        </div>
      </footer>

    </div>
  )
}