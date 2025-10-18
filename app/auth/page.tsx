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

  // 1) Cuando escaneamos, buscamos ese invitado
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
      } else {
        setInvitado(data as InvitadoInfo);
        // si ya tenía email, precompletamos
        if (data.email) setEmail(data.email);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'No se pudo consultar el invitado');
    }
  }, []);

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

  // 2) Handler del formulario (REGISTRO)
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

    setSaving(true);
    try {
      // Asegúrate de tener "Confirm email" DESACTIVADO en Auth → Providers → Email
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signErr) throw signErr;

      // Marcar invitado como reclamado + guardar email
      const { error: upErr } = await supabase
        .from('invitados')
        .update({
          email,
          reclamado: true,
        })
        .eq('id_invitado', scannedId);

      if (upErr) throw upErr;

      // Redirige a home (o a la página que quieras)
      router.push('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'No se pudo completar el registro');
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
            onScan={(val) => handleScan(String(val))}
            onError={(err) => setError(err?.message ?? 'Error de cámara')}
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

      {/* Formulario de registro (solo si existe el invitado) */}
      {invitado && (
        <form onSubmit={handleRegister} className="card" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <label htmlFor="email" style={{ fontWeight: 600 }}>
              Correo
            </label>
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
            <label htmlFor="password" style={{ fontWeight: 600 }}>
              Contraseña
            </label>
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

      {/* Si escaneaste un QR válido pero no existe en la DB */}
      {scannedId && !invitado && !error && (
        <div className="card" style={{ marginTop: 12 }}>
          <p>Buscando invitado…</p>
        </div>
      )}
    </div>
  );
}
