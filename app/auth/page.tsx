// app/auth/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabase';

// Cargar el componente del scanner solo en cliente
const QrScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then(m => m.Scanner),
  { ssr: false }
);

type InvitadoInfo = {
  id_invitado: string;
  nombre: string;
  apellido: string;
  reclamado: boolean;
};

export default function AuthPage() {
  const router = useRouter();

  const [step, setStep] = useState<'scan' | 'form' | 'done'>('scan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invitado, setInvitado] = useState<InvitadoInfo | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleScan = async (value?: string | null) => {
    if (!value || loading || step !== 'scan') return;
    const code = String(value).trim();

    setError(null);
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('validar_invitacion', {
        p_id: code,
      });

      if (rpcError) throw rpcError;

      if (!data || !data.id_invitado) {
        throw new Error('Invitación no válida.');
      }
      if (data.reclamado) {
        throw new Error('Esta invitación ya fue registrada.');
      }

      setInvitado({
        id_invitado: data.id_invitado,
        nombre: data.nombre,
        apellido: data.apellido,
        reclamado: data.reclamado,
      });
      setStep('form');
    } catch (e: any) {
      setError(e.message ?? 'Error validando invitación.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitado) return;

    setLoading(true);
    setError(null);
    try {
      const { data: signUp, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      const userId = signUp.user?.id;
      if (!userId) throw new Error('No se pudo crear el usuario.');

      const { error: claimError } = await supabase.rpc('reclamar_invitacion', {
        p_id: invitado.id_invitado,
        p_user_id: userId,
        p_email: email,
      });
      if (claimError) throw claimError;

      setStep('done');
      router.push('/home');
    } catch (e: any) {
      setError(e.message ?? 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Midea Experience</h1>
      <p className="text-gray-600 mb-6">
        Escaneá tu QR de invitación para registrarte.
      </p>

      {step === 'scan' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border bg-black">
            <QrScanner
              onDecode={(result) => handleScan(result)}
              onError={(err) => setError(err?.message ?? 'Error de cámara')}
              constraints={{ facingMode: 'environment' }}
            />
          </div>

          {loading && <p className="text-sm text-gray-500">Validando invitación…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <ManualInput onSubmit={handleScan} />
        </div>
      )}

      {step === 'form' && invitado && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="rounded-lg border p-4 bg-white">
            <p className="text-sm text-gray-700">
              Invitado: <strong>{invitado.nombre} {invitado.apellido}</strong> ({invitado.id_invitado})
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Correo</label>
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2"
              placeholder="********"
              value={password}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 text-white py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Creando cuenta…' : 'Registrar'}
          </button>

          <button
            type="button"
            onClick={() => { setStep('scan'); setInvitado(null); setError(null); }}
            className="w-full rounded-md border py-2"
          >
            Escanear otro QR
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="rounded-lg border p-4 bg-white">
          <p>¡Registro completo! Redirigiendo…</p>
        </div>
      )}
    </main>
  );
}

function ManualInput({ onSubmit }: { onSubmit: (val: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <input
        className="flex-1 rounded-md border px-3 py-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribe un código (ej: U001)"
      />
      <button className="rounded-md border px-3 py-2">Probar</button>
    </form>
  );
}
