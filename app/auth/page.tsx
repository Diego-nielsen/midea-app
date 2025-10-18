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
  user_id?: string | null;
};

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

  const [scannedId, setScannedId] = useState('');
  const [invitado, setInvitado] = useState<InvitadoInfo | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Buscar invitado por QR
  const fetchInvitado = useCallback(async (id: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('invitados')
        .select('*')
        .eq('id_invitado', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setInvitado(null);
        setError('Invitado no encontrado.');
      } else {
        setInvitado(data as InvitadoInfo);
        if (data.email) setEmail(data.email);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Error al buscar invitado');
    }
  }, []);

  const handleScan = useCallback(
    async (result: string) => {
      if (!result) return;
      const id = result.trim().toUpperCase();
      if (id === scannedId) return;

      setScannedId(id);
      await fetchInvitado(id);
    },
    [fetchInvitado, scannedId]
  );

  // Registro o login
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!scannedId) return setError('Escanea tu QR primero.');
    if (!invitado) return setError('Invitado no encontrado.');
    if (!password) return setError('Ingresá una contraseña.');

    setSaving(true);
    try {
      // Si ya tiene cuenta → LOGIN
      if (invitado.reclamado && invitado.email) {
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email: invitado.email,
          password,
        });
        if (signErr) throw new Error('Contraseña incorrecta');
        router.push('/home');
        return;
      }

      // Si es nuevo → REGISTRO
      if (!email) return setError('Ingresá un correo para registrarte.');

      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signErr) throw signErr;

      const userId = signData.user?.id;

      const { error: upErr } = await supabase
        .from('invitados')
        .update({
          email,
          reclamado: true,
          user_id: userId,
        })
        .eq('id_invitado', scannedId);

      if (upErr) throw upErr;

      router.push('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Error al procesar el registro/login');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <header style={{ margin: '24px 0 16px' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
          Midea Experience
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

      {/* Formulario */}
      {invitado && (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 12 }}>
          <p>
            Bienvenido <strong>{invitado.nombre} {invitado.apellido}</strong>
          </p>

          {!invitado.reclamado && (
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
                }}
              />
            </div>
          )}

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
              placeholder={
                invitado.reclamado
                  ? 'Ingresá tu contraseña'
                  : 'Crea una contraseña'
              }
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ justifyContent: 'center' }}
          >
            {saving
              ? 'Procesando...'
              : invitado.reclamado
              ? 'Iniciar sesión'
              : 'Crear cuenta y continuar'}
          </button>
        </form>
      )}
    </div>
  );
}
