"use client";

import type * as React from "react";
import {
  DollarSign,
  Folder,
  Mic2,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "./team-switcher";

import { NavUser } from "./nav-user";
import { NavProjects } from "./nav-projects";

const data = {
  projects: [
    {
      name: "Details",
      url: "#",
      icon: Settings,
    },
    {
      name: "Media",
      url: "#",
      icon: Folder,
    },
    {
      name: "Team",
      url: "#",
      icon: Users,
    },
    {
      name: "Speakers",
      url: "#",
      icon: Mic2,
    },
    {
      name: "Sponsors",
      url: "#",
      icon: DollarSign,
    },
    {
      name: "Winners",
      url: "#",
      icon: Trophy,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
