'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface TeamNavigationProps {
  teamId: string;
  isAuthorized?: boolean;
}

export default function TeamNavigation({ teamId, isAuthorized = false }: TeamNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      label: 'Genel Bakış',
      path: `/teams/${teamId}`,
      icon: '🏠'
    },
    {
      label: 'Oyuncular',
      path: `/teams/${teamId}/players`,
      icon: '👥'
    },
    {
      label: 'Maçlar',
      path: `/teams/${teamId}/matches`,
      icon: '⚽'
    },
    {
      label: 'Diziliş',
      path: `/teams/${teamId}/formation`,
      icon: '🧩'
    },
    {
      label: 'İstatistikler',
      path: `/teams/${teamId}/stats`,
      icon: '📊'
    }
  ];

  // Add settings for authorized users
  if (isAuthorized) {
    navigationItems.push({
      label: 'Ayarlar',
      path: `/teams/${teamId}/settings`,
      icon: '⚙️'
    });
  }

  const isActivePage = (path: string) => {
    if (path === `/teams/${teamId}`) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-lg border">
        {navigationItems.map((item) => (
          <Button
            key={item.path}
            variant={isActivePage(item.path) ? "default" : "ghost"}
            size="sm"
            onClick={() => router.push(item.path)}
            className={
              isActivePage(item.path)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-primary/10"
            }
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
