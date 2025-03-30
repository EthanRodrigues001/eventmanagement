"use client";

import * as React from "react";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Logo } from "../logo";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-4 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Eventmate</span>
            <span className="truncate text-xs">event manage</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
