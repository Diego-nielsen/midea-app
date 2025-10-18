// app/home/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Inicio</h1>
      <p className="text-gray-700">Bienvenido{email ? `, ${email}` : ''}.</p>

      <div className="rounded-lg border p-4 bg-white space-y-2">
        <p className="text-sm text-gray-600">Aquí mostraremos:</p>
        <ul className="list-disc pl-6 text-sm text-gray-700">
          <li>Nombre y apellido</li>
          <li>Puntaje acumulado</li>
          <li>Estaciones completadas / pendientes</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Link href="/trivia-scan" className="rounded-md bg-blue-600 text-white px-4 py-2">
          Ir a trivias
        </Link>
        <button
          className="rounded-md border px-4 py-2"
          onClick={async () => { await supabase.auth.signOut(); location.href = '/auth'; }}
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
