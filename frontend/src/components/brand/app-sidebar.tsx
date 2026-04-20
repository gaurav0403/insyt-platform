"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { InsytWordmark } from "./wordmark";

const navItems = [
  { title: "Brief", href: "/", icon: "◉" },
  { title: "Narratives", href: "/narratives", icon: "◈" },
  { title: "Competitive", href: "/competitive", icon: "⊞" },
  { title: "Mentions", href: "/mentions", icon: "▤" },
  { title: "Actions", href: "/actions", icon: "◆" },
  { title: "Regional", href: "/regional", icon: "◐" },
  { title: "Stores", href: "/stores", icon: "◎" },
  { title: "Ambassadors", href: "/ambassadors", icon: "★" },
];

const secondaryItems = [
  { title: "Alerts", href: "/alerts", icon: "▲" },
  { title: "Settings", href: "/settings", icon: "⚙" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <InsytWordmark className="text-2xl" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-label text-stone">
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                    render={<Link href={item.href} />}
                  >
                    <span className="text-sm w-5 text-center">{item.icon}</span>
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-label text-stone">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    render={<Link href={item.href} />}
                  >
                    <span className="text-sm w-5 text-center">{item.icon}</span>
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-border">
        <div className="text-label text-stone">Client</div>
        <div className="text-sm font-medium text-ink mt-0.5">
          Kalyan Jewellers
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
