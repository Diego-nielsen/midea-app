'use client';

import Image from 'next/image';

export default function BrandHeader() {
  return (
    <header className="hero">
      <div className="brand-lockup">
        <Image
          src="/midea-logo.png"
          alt="Midea"
          width={240}
          height={72}
          priority
        />
        <h1 className="brand-title">Midea Experience</h1>
        <p className="subtitle">
          Juega las trivias en cada estación, suma puntos y entra al ranking.
        </p>
      </div>
    </header>
  );
}
