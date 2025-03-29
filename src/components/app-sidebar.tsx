"use client"


import * as React from "react";
import { usePathname } from "next/navigation";
import {
  FileText,
  Settings2,
  SquareTerminal,
  Factory,
  Shovel
} from "lucide-react"

import { NavMain } from "@/components/nav-main"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const data = {
    user: {
      name: "Mr. Kittapas",
      email: "Kittapas@turmeric.com",
      avatar: "/kittapas.jpg",
    },
    navMain: [
      {
        title: ("Dashboard"),
        url: "/dashboard",
        icon: SquareTerminal,
      },
      {
        title: ("Farm Information"),
        url: "/farminformation",
        icon: FileText,
      },
      {
        title: ("Planting Batches"),
        url: "/plantingbatches",
        icon: Shovel,
      },
      {
        title: ("Factory Submission"),
        url: "/factorysubmission",
        icon: Factory,
      },
      {
        title: ("Setting"),
        url: "/settings",
        icon: Settings2,
      },
    ],
  };

  const updatedNavMain = data.navMain.map((item) => ({
    ...item,
    isActive: pathname === `${item.url}`,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-center h-16 pt-4 mt-1">
          <img src="/TurmeRic-logo.png" className=""/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={updatedNavMain} />
      </SidebarContent>
      <SidebarFooter>
      <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
