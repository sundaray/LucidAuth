import React from "react";
import Link from "next/link";
import { NavItem } from "@/components/nav-item";
import { UserAccountNav } from "@/components/user-account-nav";

type NavItemType = {
  title: string;
  href: string;
};

type MainNavProps = {
  items: NavItemType[];
};

export function MainNav({ items }: MainNavProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 mx-auto flex h-20 max-w-7xl items-center bg-white/50 px-4 backdrop-blur-xl">
      <Link
        href="/"
        aria-label="Go to homepage"
        className="mr-10 flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
      >
        <span className="text-lg font-bold tracking-tight text-gray-900">
          SUPERAUTH
        </span>
      </Link>
      <nav className="hidden md:block">
        <ul className="flex space-x-3">
          {items.map((item) => (
            <li key={item.title}>
              <NavItem title={item.title} href={item.href} />
            </li>
          ))}
        </ul>
      </nav>
      <UserAccountNav />
    </div>
  );
}
