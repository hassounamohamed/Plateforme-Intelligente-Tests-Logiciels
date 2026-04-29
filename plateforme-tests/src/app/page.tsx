"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { API_URL } from "@/lib/constants";

function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <form className="bg-white dark:bg-[#151219] p-8 rounded-3xl border border-slate-200 dark:border-primary-900/50 shadow-xl" onSubmit={handleSubmit}>
      <div className="space-y-5">
        {status === "success" && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium border border-green-200 dark:border-green-800">
            Votre message a été envoyé avec succès !
          </div>
        )}
        {status === "error" && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800">
            Une erreur s'est produite lors de l'envoi de votre message.
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom complet</label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-primary-900/50 bg-transparent focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white" 
            placeholder="Jean Dupont" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse email</label>
          <input 
            type="email" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-primary-900/50 bg-transparent focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white" 
            placeholder="jean@entreprise.com" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
          <textarea 
            rows={4} 
            required
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-primary-900/50 bg-transparent focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none dark:text-white" 
            placeholder="Votre message, feedback ou idée d'amélioration..."
          ></textarea>
        </div>
        <button 
          disabled={status === "loading"}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {status === "loading" ? "Envoi en cours..." : "Envoyer le message"}
        </button>
      </div>
    </form>
  );
}


export default function Home() {
  return (
    <div className="min-h-screen w-full bg-linear-to-b from-primary-50 via-white to-primary-100 dark:from-primary-950 dark:via-[#151219] dark:to-[#0f0b13] text-slate-900 dark:text-white font-sans overflow-x-hidden selection:bg-primary/30">
      
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-[#06060a]/80 border-b border-primary-100/70 dark:border-primary-900/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            <Image
              src="/favicon-32x32.png"
              alt="FlowPilot logo"
              width={34}
              height={34}
              className="rounded-xl shadow-sm"
              priority
            />
            FlowPilot
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Fonctionnalités</Link>
            <Link href="#how" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Comment ça marche</Link>
            <Link href="#contact" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Contact</Link>
            <Link href="/auth/login" className="ml-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 flex items-center min-h-screen">
        {/* Glow effects matching login page */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              IA intégrée · Nouvelle génération
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900 dark:text-white">
              Tests logiciels,<br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">réinventés par l&apos;IA</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-lg leading-relaxed">
              FlowPilot unifie la gestion, l&apos;automatisation et l&apos;analyse de vos tests dans une seule plateforme intelligente. Livrez plus vite, sans compromis sur la qualité.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/auth/register" className="bg-primary hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 text-center">
                Commencer gratuitement &rarr;
              </Link>
              <Link href="#features" className="px-8 py-4 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all text-center backdrop-blur-sm">
                Voir les fonctionnalités
              </Link>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-2xl bg-[#0f0f14] border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/10">
              {/* Topbar */}
              <div className="bg-[#16161d] border-b border-white/5 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 text-xs text-slate-400 font-medium">FlowPilot Dashboard</div>
              </div>
              {/* Body */}
              <div className="p-6">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Tests totaux", val: "1 284", sub: "↑ +12% ce mois", subColor: "text-green-400" },
                    { label: "Taux de succès", val: "96.4%", sub: "↑ +2.1%", subColor: "text-green-400" },
                    { label: "Couverture", val: "87%", sub: "→ stable", subColor: "text-yellow-400" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/5 rounded-xl p-4">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{s.label}</div>
                      <div className="text-2xl font-bold text-white mb-1">{s.val}</div>
                      <div className={`text-[10px] ${s.subColor}`}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Chart */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
                  <div className="text-xs text-slate-400 mb-4">Exécutions — 7 derniers jours</div>
                  <div className="flex items-end gap-2 h-20">
                    {[45, 65, 50, 80, 60, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ backgroundColor: i === 5 ? '#4f6ef7' : 'rgba(79,110,247,0.2)', height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                {/* Test list */}
                <div className="space-y-3">
                  {[
                    { dot: "bg-green-400", name: "Auth — Login flow", badge: "Passé", bg: "bg-green-400/10", color: "text-green-400" },
                    { dot: "bg-red-400", name: "API — Payment endpoint", badge: "Échoué", bg: "bg-red-400/10", color: "text-red-400" },
                    { dot: "bg-primary-400", name: "UI — Dashboard render", badge: "En cours", bg: "bg-primary-400/10", color: "text-primary-400" },
                  ].map((t) => (
                    <div key={t.name} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg p-3">
                      <span className={`w-2 h-2 rounded-full ${t.dot} shrink-0`} />
                      <span className="text-sm text-slate-200 flex-1">{t.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-md ${t.bg} ${t.color}`}>{t.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Decorative float elements */}
            <div className="absolute -bottom-6 -right-6 bg-[#16161d] border border-white/10 rounded-xl p-4 shadow-xl items-center gap-4 hidden lg:flex">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Pipeline Success</div>
                <div className="text-xs text-slate-400">Just now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <span className="text-primary-600 dark:text-primary-400 font-semibold tracking-wider uppercase text-sm mb-3 block">Fonctionnalités</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
              Tout ce qu&apos;il faut pour<br />tester sans friction
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Une suite complète conçue pour les équipes QA modernes qui veulent aller vite sans sacrifier la rigueur.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
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
              <div key={feat.title} className="bg-white/60 dark:bg-surface-dark border border-slate-200 dark:border-primary-900/50 p-8 rounded-3xl hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{feat.icon}</svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div className="py-20 border-y border-slate-200 dark:border-primary-900/50 bg-white/40 dark:bg-black/20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { num: "0", label: "Équipes actives" },
            { num: "0", label: "Tests exécutés" },
            { num: "0%", label: "Gain de temps moyen" },
            { num: "0%", label: "Disponibilité SLA" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-5xl font-black mb-2 bg-clip-text text-transparent bg-linear-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-500">{s.num}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary-600 dark:text-primary-400 font-semibold tracking-wider uppercase text-sm mb-3 block">Comment ça marche</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
              Opérationnel en<br />moins de 10 minutes
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mx-auto max-w-xl">
              Pas de configuration complexe. Connectez votre dépôt et FlowPilot s&apos;occupe du reste.
            </p>
          </div>
          
          <div className="space-y-12">
            {[
              { num: "01", title: "Connectez votre projet", text: "Intégrez FlowPilot à votre dépôt GitHub, GitLab ou Bitbucket en quelques clics. Nos connecteurs natifs synchronisent automatiquement vos branches et pull requests." },
              { num: "02", title: "L'IA analyse votre code", text: "Notre moteur analyse votre base de code et génère automatiquement des cas de tests pertinents, couvrant les chemins critiques et les régressions potentielles." },
              { num: "03", title: "Lancez et monitorez", text: "Exécutez vos campagnes de tests depuis le dashboard ou en CI/CD. Recevez des alertes en temps réel et des rapports détaillés à chaque build." },
              { num: "04", title: "Itérez et améliorez", text: "FlowPilot apprend de vos cycles de test pour affiner ses recommandations et maximiser votre couverture au fil du temps." },
            ].map((step, i) => (
              <div key={step.num} className="flex gap-6 md:gap-8 items-start">
                <div className="text-3xl font-black text-primary-200 dark:text-primary-900/50 mt-1">{step.num}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT FORM ─── */}
      <section id="contact" className="py-24 px-6 relative bg-white/40 dark:bg-surface-dark/40 border-y border-slate-200 dark:border-primary-900/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary-600 dark:text-primary-400 font-semibold tracking-wider uppercase text-sm mb-3 block">Contact</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
              Besoin d&apos;aide ou envie de donner votre avis ?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Nous sommes à l&apos;écoute de vos retours pour améliorer FlowPilot. N&apos;hésitez pas à nous contacter pour toute question, idée ou suggestion.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>contact.pilt1@gmail.com</span>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-primary/10 dark:bg-primary-900/20 rounded-[100%] blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
            Prêt à transformer votre QA ?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10">
            Rejoignez des milliers d&apos;équipes qui livrent plus vite et avec plus de confiance grâce à FlowPilot.
          </p>
          <Link href="/auth/register" className="inline-block bg-primary hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95">
            Commencer gratuitement &rarr;
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200 dark:border-primary-900/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
            <Image
              src="/favicon-32x32.png"
              alt="FlowPilot logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
            FlowPilot
          </Link>
          <div className="flex gap-6">
            {["Documentation", "Tarifs", "Blog", "Contact"].map((item) => (
              <Link key={item} href={item === "Contact" ? "#contact" : "#"} className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">{item}</Link>
            ))}
          </div>
          <span className="text-sm text-slate-500">© 2026 FlowPilot. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
}
