import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600"></div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">PILT</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              Fonctionnalités
            </Link>
            <Link href="#about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              À propos
            </Link>
            <Link href="/auth/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
              Plateforme Intelligente de
              <span className="text-blue-600"> Tests Logiciels</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Optimisez vos processus de tests avec l'intelligence artificielle. 
              Gérez, automatisez et analysez vos tests logiciels en toute simplicité.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="#features"
                className="rounded-lg border border-zinc-300 px-6 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-zinc-50 dark:bg-zinc-900 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                Fonctionnalités principales
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                Tout ce dont vous avez besoin pour gérer vos tests efficacement
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Gestion de projets</h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Organisez vos projets de tests et suivez leur progression en temps réel.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Tests automatisés</h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Automatisez vos tests et gagnez du temps avec notre moteur intelligent.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Analyses détaillées</h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Obtenez des rapports détaillés et des insights sur vos tests.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            © 2026 PILT - Plateforme Intelligente de Tests Logiciels. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
