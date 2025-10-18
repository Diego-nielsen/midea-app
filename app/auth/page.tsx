'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../../lib/supabase';

export default function AuthQR() {
  const router = useRouter();
  const [scannedId, setScannedId] = useState('');
  const [invitado, setInvitado] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar invitado por código QR
  const fetchInvitado = useCallback(async (id: string) => {
    setError(null);
    const { data, error } = await supabase
      .from('invitados')
      .select('*')
      .eq('id_invitado', id)
      .maybeSingle();
    if (error) {
      console.error(error);
      setError('Error al buscar invitado');
      return;
    }
    setInvitado(data);
  }, []);

  // Cuando escanea QR
  const handleScan = useCallback(async (value: any) => {
    if (!value) return;
    const id = typeof value === 'string'
      ? value.trim().toUpperCase()
      : String(value?.rawValue ?? '').trim().toUpperCase();

    if (!id || id === scannedId) return;
    setScannedId(id);
    await fetchInvitado(id);
  }, [scannedId, fetchInvitado]);

  // Registrar invitado nuevo
  const handleRegister = async () => {
    if (!invitado) return;
    if (!password || password.length < 4) {
      setError('Contraseña mínima de 4 caracteres');
      return;
    }

    setLoading(true);
    try {
      const fakeEmail = `${invitado.id_invitado.toLowerCase()}@midea.local`;

      // Crear usuario interno en Auth (sin confirmación)
      const { data: signup, error: signupErr } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
      });
      if (signupErr) throw signupErr;

      // Guardar contraseña y marcar como reclamado
      await supabase
        .from('invitados')
        .update({
          password,
          reclamado: true,
          user_id: signup.user?.id,
        })
        .eq('id_invitado', invitado.id_invitado);

      router.push('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión si ya estaba registrado
  const handleLogin = async () => {
    if (!invitado) return;
    if (!password) {
      setError('Escribe tu contraseña');
      return;
    }

    if (password !== invitado.password) {
      setError('Contraseña incorrecta');
      return;
    }

    const fakeEmail = `${invitado.id_invitado.toLowerCase()}@midea.local`;
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });
    if (loginErr) {
      console.error(loginErr);
      setError('Error al iniciar sesión');
      return;
    }

    router.push('/home');
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 style={{ fontWeight: 800, fontSize: 28 }}>Midea Experience — Acceso QR</h1>
      <p>Escaneá tu código QR para comenzar.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <Scanner
          onScan={handleScan}
          onError={() => setError('Error con la cámara')}
          constraints={{ facingMode: 'environment' }}
        />
        {scannedId && <p>Último QR leído: <strong>{scannedId}</strong></p>}
      </div>

      {invitado && !invitado.reclamado && (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <p>Bienvenido {invitado.nombre} {invitado.apellido}</p>
          <input
            type="password"
            placeholder="Crea tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}
          />
          <button onClick={handleRegister} disabled={loading} className="btn btn-primary">
            {loading ? 'Creando cuenta...' : 'Registrar y continuar'}
          </button>
        </div>
      )}

      {invitado && invitado.reclamado && (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <p>Hola {invitado.nombre}, ingresá tu contraseña para continuar:</p>
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}
          />
          <button onClick={handleLogin} disabled={loading} className="btn btn-primary">
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
    </div>
  );
}
