"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Trophy, ScanLine, User } from "lucide-react";
import clsx from "clsx";

const ITEMS = [
  { href: "/album", icon: BookOpen, label: "Álbum" },
  { href: "/comunidad", icon: Users, label: "Comunidad" },
  { href: "/scan", icon: ScanLine, label: "Escanear" },
  { href: "/leaderboard", icon: Trophy, label: "Top" },
  { href: "/perfil", icon: User, label: "Yo" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/album"
            ? pathname.startsWith("/album")
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(active && "active")}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
