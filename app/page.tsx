'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import BrandHeader from '@/components/BrandHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase'; // usamos el mismo client que en /auth
import Link from 'next/link';

type Perfil = {
  id_invitado: string;
  nombre: string | null;
  apellido: string | null;
  puntaje_total: number | null;
  completadas?: number; // si luego guardas estaciones completadas
};

export default function HomePage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Si en tu auth guardas algo en localStorage (ej: id_invitado) o usas supabase.auth:
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPerfil(null);
        setLoading(false);
        return;
      }

      // Busca un perfil básico (cámbialo a tu tabla si usas otra)
      const { data, error } = await supabase
        .from('perfiles')
        .select('id_invitado, nombre, apellido, puntaje_total')
        .eq('id_usuario', user.id)
        .maybeSingle();

      if (!error && data) setPerfil(data as Perfil);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <BrandHeader />

      <main className="container" style={{display:'grid', gap:24}}>
        {/* Card de estado del usuario */}
        <section className="card" style={{textAlign:'center'}}>
          {!loading && !perfil && (
            <>
              <p className="subtitle">
                Para empezar, inicia sesión o regístrate escaneando tu QR de invitado.
              </p>
              <div className="actions">
                <PrimaryButton href="/auth">Iniciar sesión / Registrarse</PrimaryButton>
              </div>
            </>
          )}

          {!loading && perfil && (
            <>
              <p className="subtitle">
                ¡Hola {perfil.nombre ?? ''} {perfil.apellido ?? ''}!
              </p>

              <div className="kpi">
                <div className="kpi-item">
                  <div className="kpi-value">{perfil.puntaje_total ?? 0}</div>
                  <div className="kpi-label">Puntaje total</div>
                </div>
                <div className="kpi-item">
                  <div className="kpi-value">{perfil.completadas ?? 0}/5</div>
                  <div className="kpi-label">Estaciones respondidas</div>
                </div>
              </div>

              <div className="actions" style={{marginTop:16}}>
                <PrimaryButton href="/station">Ir a trivias</PrimaryButton>
                <PrimaryButton variant="outline" onClick={async ()=>{
                  await supabase.auth.signOut();
                  location.reload();
                }}>
                  Cerrar sesión
                </PrimaryButton>
              </div>
            </>
          )}

          {loading && <p className="subtitle">Cargando estado...</p>}
        </section>

        {/* Footer simple */}
        <footer style={{textAlign:'center', color:'var(--text-secondary)'}}>
          <small>Branding siguiendo la guía de marca Midea (paleta primaria, Gotham). :contentReference[oaicite:1]{index=1}</small>
        </footer>
      </main>
    </>
  );
}
