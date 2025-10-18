'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

type Props = {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'outline';
};

export default function PrimaryButton({ href, onClick, children, variant='primary' }: Props) {
  const className = `btn ${variant==='primary' ? 'btn-primary' : 'btn-outline'}`;
  if (href) {
    return <Link className={className} href={href}>{children}</Link>;
  }
  return <button className={className} onClick={onClick}>{children}</button>;
}
