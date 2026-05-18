import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
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
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Politique de Confidentialité</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Votre confidentialité est importante pour nous. Découvrez comment nous protégeons vos données.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Données Collectées</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Nous collectons uniquement les informations nécessaires : email, nom, et données de compte pour assurer le fonctionnement du service.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Utilisation</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Les données servent à l'authentification, la récupération de mot de passe et les notifications liées au produit.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.172l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Partage des Données</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Nous ne partageons vos données avec des tiers que si requis par la loi ou pour fournir un service.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Vos Droits</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Vous avez le droit d'accéder, de rectifier ou de supprimer vos données personnelles à tout moment.</p>
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
