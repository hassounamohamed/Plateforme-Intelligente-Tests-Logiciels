"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    price: "9",
    period: "/ mois",
    description: "Idéal pour les petites équipes qui démarrent avec les tests automatisés.",
    color: "from-slate-400 to-slate-600",
    badge: null,
    features: [
      "3 projets actifs",
      "5 utilisateurs",
      "Génération IA de cas de tests",
      "Rapports QA basiques",
      "Support par email",
      "10 Go de stockage",
    ],
    cta: "Commencer",
    disabled: true,
  },
  {
    name: "Pro",
    price: "29",
    period: "/ mois",
    description: "Pour les équipes agiles en pleine croissance qui veulent aller plus vite.",
    color: "from-primary-500 to-purple-600",
    badge: "Populaire",
    features: [
      "Projets illimités",
      "25 utilisateurs",
      "Génération IA avancée",
      "Rapports QA complets (PDF & Word)",
      "Tableau de bord analytique",
      "Intégrations CI/CD",
      "Support prioritaire",
      "50 Go de stockage",
    ],
    cta: "Choisir Pro",
    disabled: true,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    period: "",
    description: "Solution sur mesure pour les grandes organisations avec des besoins avancés.",
    color: "from-amber-400 to-orange-600",
    badge: "Sur mesure",
    features: [
      "Utilisateurs illimités",
      "Projets illimités",
      "IA personnalisée & fine-tuning",
      "SSO / SAML",
      "Audit logs & conformité",
      "SLA garanti 99.9%",
      "Support dédié 24/7",
      "Stockage illimité",
    ],
    cta: "Nous contacter",
    disabled: true,
  },
];

export default function TarifsPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-primary-950 via-[#151219] to-[#0f0b13] text-white font-sans overflow-x-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none" />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-white">
            <Image src="/favicon-32x32.png" alt="FlowPilot" width={34} height={34} className="" priority />
            FlowPilot
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 pt-20 pb-12 px-6 text-center">
        {/* Coming Soon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          Bientôt disponible — Rejoignez la liste d&apos;attente
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Des tarifs{" "}
          <span className="bg-clip-text text-transparent bg-linear-to-r from-primary-400 to-purple-400">
            transparents
          </span>
          <br />
          pour chaque équipe
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto mb-4">
          Nos offres tarifaires arrivent très bientôt. Inscrivez-vous pour être notifié en avant-première et bénéficier d&apos;une réduction de lancement exclusive.
        </p>
      </div>

      {/* Plans */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border bg-white/3 backdrop-blur-sm flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
                ${i === 1
                  ? "border-primary-500/50 shadow-[0_0_40px_rgba(79,110,247,0.15)]"
                  : "border-white/8 hover:border-white/15"
                }`}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div className={`absolute top-0 right-6 -translate-y-1/2`}>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-linear-to-r ${plan.color} shadow-lg`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Gradient top bar */}
              <div className={`h-1 w-full bg-linear-to-r ${plan.color}`} />

              <div className="p-8 flex flex-col flex-1">
                {/* Plan name */}
                <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                <p className="text-sm text-slate-400 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  {plan.price === "Sur devis" ? (
                    <div className="text-3xl font-extrabold text-white">Sur devis</div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-slate-400 text-lg font-medium">€</span>
                      <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-slate-400 text-sm mb-2">{plan.period}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className={`mt-0.5 w-4 h-4 rounded-full bg-linear-to-br ${plan.color} flex items-center justify-center shrink-0`}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA — disabled (coming soon) */}
                <div className="relative">
                  <button
                    disabled
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all cursor-not-allowed
                      ${i === 1
                        ? "bg-primary-600/40 text-primary-300 border border-primary-500/30"
                        : "bg-white/5 text-slate-400 border border-white/10"
                      }`}
                  >
                    {plan.cta} — Bientôt disponible
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/3 border border-white/8">
            <svg className="w-5 h-5 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-300 text-sm">
              Des questions sur nos offres ?{" "}
              <Link href="/#contact" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Contactez-nous
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center">
        <span className="text-sm text-slate-600">© 2026 FlowPilot. Tous droits réservés.</span>
      </footer>
    </div>
  );
}
