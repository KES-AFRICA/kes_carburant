/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/layout.tsx (ou app/dashboard/layout.tsx)
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Fuel,
  UserCircle,
  LogOut,
  Menu,
  X,
  Gauge,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Éviter les boucles infinies avec un flag
    let isMounted = true;
    
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          if (isMounted) {
            router.replace('/login');
          }
          return;
        }

        const userData = JSON.parse(userStr);
        if (isMounted) {
          setUser(userData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.replace('/login');
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [router]); // Ne pas mettre d'autres dépendances

  const handleLogout = () => {
    // Nettoyer tout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // Redirection forcée
    window.location.href = '/login';
  };

  // Afficher loading pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne pas rendre le layout
  if (!user) {
    return null;
  }

  const navItems = user?.role === 'ADMIN' ? [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/users', label: 'Utilisateurs', icon: <Users size={20} /> },
    { href: '/admin/refuels', label: 'Recharges', icon: <Fuel size={20} /> },
    { href: '/admin/vehicles', label: 'Véhicules', icon: <Car size={20} /> },
    { href: '/admin/assignments', label: 'Assignations', icon: <ClipboardList size={20} /> },
    { href: '/admin/profile', label: 'Mon profil', icon: <UserCircle size={20} /> },
  ] : [
    { href: '/user/dashboard', label: 'Dashboard', icon: <Gauge size={20} /> },
    { href: '/user/refuels', label: 'Mes recharges', icon: <Fuel size={20} /> },
    { href: '/user/profile', label: 'Mon profil', icon: <UserCircle size={20} /> },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Reste du layout... */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } w-64 shrink-0`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-semibold text-gray-900">KES Carburant</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">K</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">KES Carburant</span>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}