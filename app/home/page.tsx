'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="w-full sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-screen-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/midea-logo.png"
              alt="Midea"
              width={120}
              height={36}
              priority
            />
            <span className="text-xs sm:text-sm text-slate-500">
              Evento | Trivia de Estaciones
            </span>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="hidden sm:inline-flex items-center rounded-lg bg-midea-blue hover:bg-midea-dark text-white px-3 py-2 text-sm font-medium transition-colors"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Hero & CTA */}
      <main className="flex-1">
        <section className="mx-auto max-w-screen-md px-4 pt-6 pb-2">
          <div className="rounded-2xl bg-white/80 border border-slate-200 shadow-card p-5 sm:p-6">
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-midea-dark">
              Bienvenido a <span className="text-midea-blue">Midea Experience</span>
            </h1>

            <p className="mt-3 text-slate-600">
              Escanea tu invitación, crea tu clave y empieza a sumar puntos en las
              trivias de cada estación. <span className="font-medium">¡Bonus si aciertas todas!</span>
            </p>

            <div className="mt-5 flex gap-3">
              <Link
                href="/auth"
                className="flex-1 rounded-xl bg-midea-blue hover:bg-midea-dark text-white py-3 text-center font-medium text-base shadow-card transition-colors"
              >
                Iniciar sesión / Registrarse
              </Link>
              <a
                href="#como-funciona"
                className="rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 px-4 text-center text-base font-medium transition-colors"
              >
                ¿Cómo?
              </a>
            </div>

            {/* Arte / banner */}
            <div className="mt-5 h-40 rounded-xl bg-gradient-to-br from-white to-midea-sky border border-slate-200 grid place-items-center text-slate-400">
              (Aquí puede ir un arte del evento)
            </div>
          </div>
        </section>

        {/* Steps (mobile-first) */}
        <section id="como-funciona" className="mx-auto max-w-screen-md px-4 pb-8">
          <h2 className="sr-only">Cómo funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <article className="rounded-xl bg-white border border-slate-200 p-4 shadow-card">
              <div className="text-midea-blue text-sm font-medium mb-1">Paso 1</div>
              <h3 className="font-semibold text-slate-800 mb-1">Escanea tu invitación</h3>
              <p className="text-slate-600 text-sm">
                Te pediremos el QR de invitado (ej. U001). Si existe, crea tu correo y clave.
              </p>
            </article>

            <article className="rounded-xl bg-white border border-slate-200 p-4 shadow-card">
              <div className="text-midea-blue text-sm font-medium mb-1">Paso 2</div>
              <h3 className="font-semibold text-slate-800 mb-1">Estaciones &amp; trivias</h3>
              <p className="text-slate-600 text-sm">
                En cada estación escanea su QR (ej. ST-01) y responde 5 preguntas. 100 pts por acierto,
                <span className="font-medium"> +200</span> si aciertas las 5.
              </p>
            </article>

            <article className="rounded-xl bg-white border border-slate-200 p-4 shadow-card">
              <div className="text-midea-blue text-sm font-medium mb-1">Paso 3</div>
              <h3 className="font-semibold text-slate-800 mb-1">Ranking en vivo</h3>
              <p className="text-slate-600 text-sm">
                Ve tu puntaje, qué estaciones hiciste y tu posición en el ranking general.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Sticky bottom CTA (móvil) */}
      <div className="md:hidden sticky bottom-0 z-30">
        <div className="mx-auto max-w-screen-md px-4 pb-4">
          <Link
            href="/auth"
            className="block w-full rounded-xl bg-midea-blue hover:bg-midea-dark text-white py-3 text-center font-medium shadow-card transition-colors"
          >
            Escanear mi invitación
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-slate-500 text-xs py-6">
        <small>
          Interfaz mobile-first en paleta Midea (azules + fondo claro).
        </small>
      </footer>
    </div>
  );
}
