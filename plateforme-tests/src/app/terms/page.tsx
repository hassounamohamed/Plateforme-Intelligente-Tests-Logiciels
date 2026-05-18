import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
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
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Conditions Générales</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Conditions d'utilisation de FlowPilot. En utilisant nos services, vous acceptez ces termes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Acceptation</h3>
                <p className="text-slate-300 text-sm leading-relaxed">En utilisant FlowPilot, vous acceptez pleinement ces conditions générales. Si vous n'acceptez pas, veuillez cesser l'utilisation immédiatement.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Limitations</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Nous fournissons le service « tel quel » sans garanties implicites. FlowPilot ne peut être tenu responsable des pertes de données.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7-4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Responsabilité</h3>
                <p className="text-slate-300 text-sm leading-relaxed">L'utilisateur est responsable de l'utilisation appropriée de la plateforme et du respect de toutes les lois applicables.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 p-6 hover:border-primary-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" /></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Modifications</h3>
                <p className="text-slate-300 text-sm leading-relaxed">FlowPilot se réserve le droit de modifier ces conditions à tout moment. Les modifications seront communiquées par email.</p>
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
