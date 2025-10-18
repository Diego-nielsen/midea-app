'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const goToAuth = () => router.push('/auth');

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          'linear-gradient(180deg, #E6F3FB 0%, #FFFFFF 60%, #F7FBFE 100%)',
      }}
    >
      <main className="w-full max-w-5xl px-6 py-10 flex flex-col items-center gap-10">
        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/midea-logo.png" // sube el logo a /public/midea-logo.png
              alt="Midea"
              width={160}
              height={48}
              priority
            />
          </div>

          {/* Si más adelante agregas sesión, aquí puedes mostrar el nombre del usuario */}
          <div className="text-sm text-slate-500">
            Evento | Trivia de Estaciones
          </div>
        </header>

        {/* Hero */}
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-[#008ACB]">
              Bienvenido a <span className="text-[#00A0E9]">Midea Experience</span>
            </h1>
            <p className="text-slate-600 text-lg">
              Escanea tu invitación, crea tu clave y comienza a sumar puntos
              respondiendo las trivias en cada estación. ¡Hay bonus si aciertas
              todas!
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={goToAuth}
                className="rounded-lg bg-[#00A0E9] hover:bg-[#008ACB] text-white px-6 py-3 font-medium transition-colors"
              >
                Iniciar sesión o registrarse
              </button>
              <a
                href="#como-funciona"
                className="rounded-lg border border-slate-300 hover:bg-slate-50 px-6 py-3 text-slate-700 transition-colors"
              >
                ¿Cómo funciona?
              </a>
            </div>
          </div>

          {/* Imagen hero (opcional; puedes cambiar por una foto del evento) */}
          <div className="w-full h-56 md:h-72 rounded-2xl bg-white/70 border border-slate-200 shadow-sm flex items-center justify-center">
            <span className="text-slate-400">
              (Aquí puede ir un arte del evento)
            </span>
          </div>
        </section>

        {/* ¿Cómo funciona? */}
        <section
          id="como-funciona"
          className="w-full mt-4 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">
              1) Escanea tu invitación
            </h3>
            <p className="text-slate-600">
              En “Iniciar sesión o registrarse” te pediremos escanear tu QR de
              invitado (ej. U001). Si ya existe, solo crea tu correo y clave.
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">
              2) Estaciones &amp; trivias
            </h3>
            <p className="text-slate-600">
              En cada estación escanea su QR (ej. ST-01) y responde 5 preguntas
              de opción única. Cada acierto suma 100 pts; todas correctas dan
              +200 bonus.
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">
              3) Ranking en vivo
            </h3>
            <p className="text-slate-600">
              Ve tu puntaje acumulado, qué estaciones hiciste y tu posición en
              el ranking general del evento.
            </p>
          </div>
        </section>

        {/* Footer simple */}
        <footer className="w-full pt-8 text-center text-slate-500 text-sm">
          <small>
            Branding siguiendo la guía de marca Midea (paleta primaria y
            tipografía corporativa).
          </small>
        </footer>
      </main>
    </div>
  );
}
