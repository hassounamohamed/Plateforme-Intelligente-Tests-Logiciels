import Link from "next/link";
import Image from "next/image";

export default function SupportPage() {
  return (
    <div className="min-h-screen w-full bg-linear-to-b from-primary-950 via-[#151219] to-[#0f0b13] text-white font-sans overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none" />

      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-white">
            <Image src="/favicon-32x32.png" alt="FlowPilot" width={34} height={34} priority />
            FlowPilot
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Support & Contact</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Notre équipe est disponible pour répondre à vos questions et vous aider.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Email</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">Écrivez-nous directement pour toute question ou demande :</p>
                <a href="mailto:contact@flowpilot.tn" className="inline-block px-3 py-1 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-300 hover:text-primary-200 text-sm font-semibold transition-colors">
                  contact@flowpilot.tn
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Horaires</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Support disponible du <strong>lundi au vendredi</strong>, <strong>9h–18h</strong> (UTC+1). Réponse garantie en 24h.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Formulaire</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">Utilisez le formulaire de contact sur la page d'accueil pour nous envoyer votre message directement.</p>
                <Link href="/#contact" className="inline-block px-3 py-1 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-300 hover:text-primary-200 text-sm font-semibold transition-colors">
                  Formulaire de contact
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">FAQ</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Consultez notre section FAQ sur la page d'accueil pour des réponses rapides aux questions courantes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500/20 border border-primary-500/30 text-sm font-semibold text-primary-300 hover:text-primary-200 hover:border-primary-500/50 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Retour à l'accueil
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center">
        <span className="text-sm text-slate-600">© 2026 FlowPilot. Tous droits réservés.</span>
      </footer>
    </div>
  );
}
