"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#06060a",
        color: "#f0f0f5",
        overflowX: "hidden",
        lineHeight: 1.6,
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .nav-link { font-size: 14px; color: #6b6b80; text-decoration: none; padding: 7px 14px; border-radius: 8px; transition: color .2s, background .2s; }
        .nav-link:hover { color: #f0f0f5; background: rgba(255,255,255,0.05); }

        .btn-primary {
          background: #4f6ef7; color: #fff; border: none; cursor: pointer;
          padding: 13px 28px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          transition: transform .2s, box-shadow .2s, background .2s;
          text-decoration: none; display: inline-block;
        }
        .btn-primary:hover { background: #3d5ce0; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(79,110,247,0.35); }

        .btn-secondary {
          background: transparent; color: #f0f0f5;
          border: 1px solid rgba(255,255,255,0.07); cursor: pointer;
          padding: 13px 28px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          transition: background .2s, border-color .2s;
          text-decoration: none; display: inline-block;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.15); }

        .badge-dot { animation: pulse 2s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        .gradient-text {
          background: linear-gradient(135deg, #4f6ef7, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .feat-card { background: #0f0f16; padding: 36px; transition: background .3s; }
        .feat-card:hover { background: #16161d; }

        .bar { animation: grow .8s ease-out both; }
        @keyframes grow { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); } }

        .stat-number-gradient {
          background: linear-gradient(135deg, #f0f0f5, #6b6b80);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-link { font-size: 13px; color: #6b6b80; text-decoration: none; transition: color .2s; }
        .footer-link:hover { color: #f0f0f5; }
      `}</style>

      {/* ─── HEADER ─── */}
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          backdropFilter: "blur(20px)",
          background: "rgba(6,6,10,0.8)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#f0f0f5", textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #4f6ef7, #7c3aed)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>P</div>
            FlowPilot
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="#features" className="nav-link">Fonctionnalités</Link>
            <Link href="#how" className="nav-link">Comment ça marche</Link>
            <Link href="/auth/login" style={{ background: "#4f6ef7", color: "#fff", fontSize: 14, fontWeight: 500, padding: "7px 18px", borderRadius: 8, textDecoration: "none" }}>Connexion</Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          position: "relative", overflow: "hidden",
          padding: "120px 32px 80px",
        }}
      >
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(79,110,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,110,247,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }} />
        {/* Glow effects */}
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,110,247,0.12) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", top: "30%", right: "10%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* Left */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,110,247,0.1)", border: "1px solid rgba(79,110,247,0.25)", borderRadius: 100, padding: "5px 14px 5px 8px", fontSize: 12.5, color: "#8fa8f9", marginBottom: 24 }}>
              <span className="badge-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f6ef7" }} />
              IA intégrée · Nouvelle génération
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(38px, 4.5vw, 58px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#f0f0f5", marginBottom: 20 }}>
              Tests logiciels,<br />
              <span className="gradient-text">réinventés par l&apos;IA</span>
            </h1>
            <p style={{ fontSize: 17, color: "#6b6b80", lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              FlowPilot unifie la gestion, l&apos;automatisation et l&apos;analyse de vos tests dans une seule plateforme intelligente. Livrez plus vite, sans compromis sur la qualité.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/auth/register" className="btn-primary">Commencer gratuitement →</Link>
              <Link href="#features" className="btn-secondary">Voir les fonctionnalités</Link>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div>
            <div style={{ background: "#0f0f14", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
              {/* Topbar */}
              <div style={{ background: "#16161d", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "#6b6b80", marginLeft: 8 }}>FlowPilot Dashboard</span>
              </div>
              {/* Body */}
              <div style={{ padding: 20 }}>
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Tests totaux", val: "1 284", sub: "↑ +12% ce mois", subColor: "#4ade80" },
                    { label: "Taux de succès", val: "96.4%", sub: "↑ +2.1%", subColor: "#4ade80" },
                    { label: "Couverture", val: "87%", sub: "→ stable", subColor: "#f59e0b" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, color: "#6b6b80", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#f0f0f5" }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: s.subColor, marginTop: 2 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Chart */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 10 }}>Exécutions — 7 derniers jours</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
                    {[45, 65, 50, 80, 60, 90, 75].map((h, i) => (
                      <div key={i} className="bar" style={{ flex: 1, borderRadius: "4px 4px 0 0", background: i === 5 ? "#4f6ef7" : "rgba(79,110,247,0.2)", height: `${h}%`, animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                </div>
                {/* Test list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { dot: "#4ade80", name: "Auth — Login flow", badge: "Passé", bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
                    { dot: "#f87171", name: "API — Payment endpoint", badge: "Échoué", bg: "rgba(248,113,113,0.12)", color: "#f87171" },
                    { dot: "#8fa8f9", name: "UI — Dashboard render", badge: "En cours", bg: "rgba(79,110,247,0.15)", color: "#8fa8f9" },
                  ].map((t) => (
                    <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "9px 12px" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.dot, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontSize: 12, color: "#f0f0f5", flex: 1 }}>{t.name}</span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: t.bg, color: t.color }}>{t.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGOS ─── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "28px 32px" }}>
        <p style={{ textAlign: "center", fontSize: 12, color: "#6b6b80", marginBottom: 20, letterSpacing: 0.5, textTransform: "uppercase" }}>Intégrations disponibles</p>
        <div style={{ display: "flex", gap: 48, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          {["JIRA", "GITHUB", "GITLAB", "JENKINS", "SLACK", "SELENIUM", "CYPRESS"].map((name) => (
            <span key={name} style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: 1 }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section id="features">
        <div style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <span style={{ display: "inline-block", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#4f6ef7", fontWeight: 500, marginBottom: 14 }}>Fonctionnalités</span>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: -1, marginBottom: 16, lineHeight: 1.15 }}>
            Tout ce qu&apos;il faut pour<br />tester sans friction
          </h2>
          <p style={{ fontSize: 17, color: "#6b6b80", maxWidth: 500, marginBottom: 60 }}>
            Une suite complète conçue pour les équipes QA modernes qui veulent aller vite sans sacrifier la rigueur.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
            {[
              {
                title: "Gestion de projets",
                desc: "Organisez vos suites de tests par projet, sprint ou fonctionnalité. Suivez la progression en temps réel avec des tableaux de bord intuitifs.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
              },
              {
                title: "Automatisation intelligente",
                desc: "Notre moteur IA génère, optimise et exécute vos tests automatiquement. Réduisez le temps de configuration de 70%.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
              },
              {
                title: "Rapports & analyses",
                desc: "Des rapports détaillés générés automatiquement. Identifiez les régressions et les zones à risque avant même la mise en production.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
              },
              {
                title: "Collaboration d'équipe",
                desc: "Travaillez en temps réel avec votre équipe. Assignez des tests, laissez des commentaires, et gardez tout le monde aligné sur les objectifs qualité.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
              },
            ].map((feat) => (
              <div key={feat.title} className="feat-card">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(79,110,247,0.1)", border: "1px solid rgba(79,110,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#4f6ef7" strokeWidth={1.8}>{feat.icon}</svg>
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{feat.title}</h3>
                <p style={{ fontSize: 14.5, color: "#6b6b80", lineHeight: 1.65 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div style={{ background: "#0f0f14", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "60px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32, textAlign: "center" }}>
          {[
            { num: "10K+", label: "Équipes actives" },
            { num: "98M", label: "Tests exécutés" },
            { num: "70%", label: "Gain de temps moyen" },
            { num: "99.9%", label: "Disponibilité SLA" },
          ].map((s) => (
            <div key={s.label}>
              <div className="stat-number-gradient" style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontSize: 14, color: "#6b6b80" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how">
        <div style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <span style={{ display: "inline-block", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#4f6ef7", fontWeight: 500, marginBottom: 14 }}>Comment ça marche</span>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: -1, marginBottom: 16, lineHeight: 1.15 }}>
            Opérationnel en<br />moins de 10 minutes
          </h2>
          <p style={{ fontSize: 17, color: "#6b6b80", maxWidth: 500, marginBottom: 60 }}>
            Pas de configuration complexe. Connectez votre dépôt et FlowPilot s&apos;occupe du reste.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { num: "01", title: "Connectez votre projet", text: "Intégrez FlowPilot à votre dépôt GitHub, GitLab ou Bitbucket en quelques clics. Nos connecteurs natifs synchronisent automatiquement vos branches et pull requests." },
              { num: "02", title: "L'IA analyse votre code", text: "Notre moteur analyse votre base de code et génère automatiquement des cas de tests pertinents, couvrant les chemins critiques et les régressions potentielles." },
              { num: "03", title: "Lancez et monitorez", text: "Exécutez vos campagnes de tests depuis le dashboard ou en CI/CD. Recevez des alertes en temps réel et des rapports détaillés à chaque build." },
              { num: "04", title: "Itérez et améliorez", text: "FlowPilot apprend de vos cycles de test pour affiner ses recommandations et maximiser votre couverture au fil du temps." },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 24, padding: "32px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none", alignItems: "start" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#4f6ef7", paddingTop: 4 }}>{step.num}</div>
                <div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: 15, color: "#6b6b80", lineHeight: 1.65 }}>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: "80px 32px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(79,110,247,0.1) 0%, transparent 70%)", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: -1, lineHeight: 1.15, marginBottom: 16 }}>
            Prêt à transformer votre QA ?
          </h2>
          <p style={{ fontSize: 17, color: "#6b6b80", marginBottom: 36 }}>
            Rejoignez des milliers d&apos;équipes qui livrent plus vite et avec plus de confiance grâce à FlowPilot.
          </p>
          <Link href="/auth/register" className="btn-primary" style={{ fontSize: 16, padding: "15px 36px" }}>
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: 32 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#f0f0f5", textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #4f6ef7, #7c3aed)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>P</div>
            FlowPilot
          </Link>
          <div style={{ display: "flex", gap: 24 }}>
            {["Documentation", "Tarifs", "Blog", "Contact"].map((item) => (
              <Link key={item} href="#" className="footer-link">{item}</Link>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "#6b6b80" }}>© 2026 FlowPilot. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
}