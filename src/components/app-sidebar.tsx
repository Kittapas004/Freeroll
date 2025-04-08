"use client"


import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter()

  const handleLogoClick = () => {
    router.push("/dashboard")
  }

  const [user, setUser] = React.useState({
    name: "",
    email: "",
    avatar: "",
    role: "",
  });

  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:1337/api/users/me?populate=*", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      setUser({
        name: userData.username || "",
        email: userData.email || "",
        avatar: userData.avatar?.url
          ? `http://localhost:1337${userData.avatar.url}`
          : "",
        role: userData.user_role || "",
      });
      // console.log("User data fetched successfully:", userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  React.useEffect(() => {
    fetchUserData();
  }, []);

  const navMain: Record<string, any[]> = {
    Farmer: [
      { title: "Dashboard", url: "/dashboard", icon: SquareTerminal },
      { title: "Farm Information", url: "/farminformation", icon: FileText },
      { title: "Planting Batches", url: "/plantingbatches", icon: Shovel },
      { title: "Factory Submission", url: "/factorysubmission", icon: Factory },
      { title: "Settings", url: "/settings", icon: Settings2 },
    ],
    Admin: [
      { title: "Dashboard", url: "/dashboard", icon: SquareTerminal },
      { title: "User Management", url: "/users", icon: FileText },
      { title: "System Settings", url: "/admin/settings", icon: Settings2 },
    ],
  };
  // console.log("User role:", user.role);
  const navItems = navMain[user.role] || [];
  const updatedNavMain = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-center h-16 pt-4 mt-1">
        <button onClick={handleLogoClick}>
          <img src="/TurmeRic-logo.png" alt="TurmeRic Logo" className="" />
        </button>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={updatedNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
