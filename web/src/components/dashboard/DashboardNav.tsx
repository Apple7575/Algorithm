'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

interface DashboardNavProps {
  user: User;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/ai-coach', label: 'AI Coach' },
  { href: '/settings', label: 'Settings' },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Algo-PT
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
