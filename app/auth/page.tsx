'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabase';

// Import dinámico del componente correcto de la librería
const QrScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((m) => m.Scanner),
  { ssr: false }
);

type InvitadoInfo = {
  id_invitado: string;
  nombre: string;
  apellido: string;
  email: string | null;
  reclamado: boolean;
};

export default function AuthPage() {
  const router = useRouter();

  // UI / estado
  const [scannedText, setScannedText] = useState<string>('');
  const [invitado, setInvitado] = useState<InvitadoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // form registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- helpers ----------------------------------------------------------------

  // Normaliza el valor que devuelve el scanner (puede ser string, objeto o array)
  const extractTextFromScan = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();

    // algunos builds devuelven array de barcodes
    if (Array.isArray(value)) {
      const raw = value[0]?.rawValue ?? value[0] ?? '';
      return (typeof raw === 'string' ? raw : `${raw}`).trim();
    }

    // objeto con rawValue
    if (value?.rawValue) return String(value.rawValue).trim();

    return '';
  };

  // Si tu QR para invitado trae directamente "U001", esto lo deja igual.
  // Si algún día decides usar "type:inv;id:U001", igual lo pesca.
  const parseInviteId = (text: string): string | null => {
    const t = text.trim();

    // formato directo
    if (/^[A-Za-z0-9_-]+$/.test(t)) return t;

    // formato "type:inv;id:U001" o "type=inv|id=U001"
    const m = t.match(/id\s*[:=]\s*([A-Za-z0-9_-]+)/i);
    if (m?.[1]) return m[1];

    return null;
  };

  const fetchInvitado = async (id: string) => {
    setLoading(true);
    setAppError(null);
    try {
      const { data, error } = await supabase
        .from('invitados')
        .select('id_invitado, nombre, apellido, email, reclamado')
        .eq('id_invitado', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setInvitado(null);
        setAppError('Invitado no encontrado.');
        return;
      }

      setInvitado(data as InvitadoInfo);
    } catch (err: any) {
      setInvitado(null);
      setAppError(err?.message ?? 'Error consultando invitado.');
    } finally {
      setLoading(false);
    }
  };

  // --- handlers ---------------------------------------------------------------

  // Llamado por el componente del scanner
  const handleScan = async (value: any) => {
    const text = extractTextFromScan(value);
    if (!text || text === scannedText) return; // evita loops con el mismo valor

    setScannedText(text);

    const inviteId = parseInviteId(text);
    if (!inviteId) {
      setAppError('QR inválido. Debe contener un ID de invitado.');
      setInvitado(null);
      return;
    }

    await fetchInvitado(inviteId);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitado) {
      setAppError('Primero escanea tu código de invitación.');
      return;
    }
    if (!email || !password) {
      setAppError('Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    setAppError(null);

    try {
      // 1) Registrar usuario en Supabase Auth
      const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            invite_id: invitado.id_invitado,
            nombre: invitado.nombre,
            apellido: invitado.apellido,
          },
        },
      });
      if (signUpErr) throw signUpErr;

      // 2) Marcar invitado como reclamado y guardar su email
      const { error: updErr } = await supabase
        .from('invitados')
        .update({ reclamado: true, email })
        .eq('id_invitado', invitado.id_invitado);
      if (updErr) throw updErr;

      // 3) Redirigir a la home (ajusta la ruta si usas otra)
      router.replace('/home');
    } catch (err: any) {
      setAppError(err?.message ?? 'Error registrando usuario.');
    } finally {
      setLoading(false);
    }
  };

  const alreadyClaimed = useMemo(() => invitado?.reclamado === true, [invitado]);

  // --- UI ---------------------------------------------------------------------

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Registro — Midea Experience</h1>
          <p className="text-sm text-slate-600">
            Escaneá tu QR de invitación para comenzar.
          </p>
        </div>

        {/* Scanner */}
        <div className="rounded-xl overflow-hidden border bg-black">
          <QrScanner
            onScan={(value: any) => handleScan(value)}
            onError={(err: unknown) =>
              setCameraError((err as Error)?.message ?? 'Error de cámara')
            }
            constraints={{ facingMode: 'environment' }}
          />
        </div>

        {/* Mensajes */}
        {cameraError && (
          <p className="text-sm text-amber-600">
            {cameraError} — Probá dar permiso a la cámara o cambiar de navegador.
          </p>
        )}
        {appError && <p className="text-sm text-red-600">{appError}</p>}

        {/* Resultado del scan */}
        {invitado && (
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-slate-500">Código: {invitado.id_invitado}</p>
            <p className="text-base font-medium">
              {invitado.nombre} {invitado.apellido}
            </p>

            {alreadyClaimed ? (
              <div className="mt-3 text-sm text-amber-700">
                Este invitado ya fue registrado. Si sos vos, iniciá sesión; si no, consulta
                con el staff.
              </div>
            ) : (
              <form onSubmit={handleRegister} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Correo</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-sky-700 text-white py-2 font-medium hover:bg-sky-800 disabled:opacity-60"
                >
                  {loading ? 'Registrando…' : 'Registrarme'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Debug opcional del último texto escaneado */}
        {scannedText && (
          <p className="text-xs text-slate-500">
            Último QR leído: <span className="font-mono">{scannedText}</span>
          </p>
        )}
      </div>
    </div>
  );
}
