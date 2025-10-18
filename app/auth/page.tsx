'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../../lib/supabase';

type InvitadoInfo = {
  id_invitado: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  reclamado: boolean | null;
};

/** Extrae texto del valor que entrega el Scanner (array/obj/string). */
function getTextFromScan(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    const raw = value[0]?.rawValue ?? value[0];
    return typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
  }
  if (value?.rawValue) return String(value.rawValue).trim();
  return '';
}

export default function AuthPage() {
  const router = useRouter();

  // QR + invitado
  const [scannedId, setScannedId] = useState<string>(''); // U001, U002…
  const [invitado, setInvitado] = useState<InvitadoInfo | null>(null);

  // Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Consulta un invitado por ID */
  const fetchInvitado = useCallback(async (id: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('invitados')
        .select('id_invitado,nombre,apellido,email,reclamado')
        .eq('id_invitado', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setInvitado(null);
        setError('Invitado no encontrado.');
        return;
      }

      // Si ya fue reclamado, avisamos (puedes permitir “iniciar sesión” en vez de registro)
      if (data.reclamado) {
        setInvitado(null);
        setError('Este invitado ya fue registrado.');
        return;
      }

      setInvitado(data as InvitadoInfo);
      if (data.email) setEmail(data.email);
    } catch (err: any) {
      console.error(err);
      setInvitado(null);
      setError(err?.message ?? 'No se pudo consultar el invitado');
    }
  }, []);

  /** Procesa el texto leído por el scanner */
  const handleScan = useCallback(
    async (result: string) => {
      if (!result) return;
      const id = result.trim().toUpperCase();
      if (id === scannedId) return; // evita repetir la misma lectura
      setScannedId(id);
      await fetchInvitado(id);
    },
    [fetchInvitado, scannedId]
  );

  /** Envío del formulario: crea cuenta y actualiza la fila del invitado */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!scannedId) {
      setError('Primero escanea tu QR de invitación.');
      return;
    }
    if (!email || !password) {
      setError('Completa email y contraseña.');
      return;
    }
    if (!invitado) {
      setError('Invitado no encontrado o ya reclamado.');
      return;
    }

    setSaving(true);
    try {
      // 1) Crear cuenta (sin confirmación de email)
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signErr) throw signErr;

      // 2) (Opcional) guardar metadata con el ID del invitado
      await supabase.auth.updateUser({ data: { invite_id: scannedId } });

      // 3) Marcar invitado como reclamado + guardar email
      const { error: upErr } = await supabase
        .from('invitados')
        .update({ email, reclamado: true })
        .eq('id_invitado', scannedId);
      if (upErr) throw upErr;

      // 4) Redirigir a home
      router.push('/home');
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'No se pudo completar el registro');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <header style={{ margin: '24px 0 16px' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
          Registro — Midea Experience
        </h1>
        <p style={{ margin: '8px 0', color: 'var(--text-secondary)' }}>
          Escaneá tu QR de invitación para comenzar.
        </p>
      </header>

      {/* Lector QR */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
          <Scanner
            onScan={(value: any) => {
              const text = getTextFromScan(value);
              if (!text) return;
              handleScan(text);
            }}
            onError={(err: unknown) =>
              setError((err as Error)?.message ?? 'Error de cámara')
            }
            constraints={{ facingMode: 'environment' }}
          />
        </div>

        {scannedId && (
          <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
            Último QR leído: <strong>{scannedId}</strong>
          </p>
        )}

        {error && (
          <p style={{ marginTop: 8, color: '#dc2626', fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>

      {/* Formulario (solo si el invitado existe y no está reclamado) */}
      {invitado && (
        <form onSubmit={handleRegister} className="card" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <label htmlFor="email" style={{ fontWeight: 600 }}>Correo</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 4 }}>
            <label htmlFor="password" style={{ fontWeight: 600 }}>Contraseña</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ justifyContent: 'center' }}
          >
            {saving ? 'Guardando…' : 'Crear cuenta y continuar'}
          </button>
        </form>
      )}

      {/* Si hay QR pero no hay invitado (o ya reclamado) */}
      {scannedId && !invitado && !error && (
        <div className="card" style={{ marginTop: 12 }}>
          <p>Buscando invitado…</p>
        </div>
      )}
    </div>
  );
}
