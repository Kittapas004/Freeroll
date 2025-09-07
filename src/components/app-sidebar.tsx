"use client"

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Search,
  FileText,
  Settings2,
  SquareTerminal,
  Factory,
  Shovel,
  History,
  Cog,
  Database,
  BarChart3,
} from "lucide-react";

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

  // ฟังก์ชันสำหรับสร้าง URL รูปภาพ
  const getAvatarUrl = (avatar: any) => {
    if (!avatar) return "";
    
    // Debug avatar structure
    console.log("🖼️ Sidebar Avatar data:", avatar);
    
    // ลองหลายรูปแบบของ Strapi structure
    const possibleUrls = [
      avatar.url,                                    // Direct URL
      avatar.data?.attributes?.url,                  // Strapi v4 structure  
      avatar.data?.attributes?.formats?.thumbnail?.url, // Thumbnail format
      avatar.data?.attributes?.formats?.small?.url,     // Small format
    ];
    
    const validUrl = possibleUrls.find(url => url);
    console.log("🔗 Found avatar URL:", validUrl);
    
    if (validUrl) {
      // ตรวจสอบว่าเป็น full URL หรือไม่
      if (validUrl.startsWith('http')) {
        return validUrl;
      } else {
        return `https://api-freeroll-production.up.railway.app${validUrl}`;
      }
    }
    
    return "";
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("https://api-freeroll-production.up.railway.app/api/users/me?populate=*", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      console.log("✅ Sidebar user data:", userData);
      console.log("🖼️ Sidebar avatar structure:", userData.avatar);
      
      setUser({
        name: userData.username || "",
        email: userData.email || "",
        avatar: getAvatarUrl(userData.avatar),
        role: userData.user_role || "",
      });
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
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
    Factory: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
      { title: "Processing Details", url: "/processing-details", icon: Cog },
      { title: "Processing History", url: "/processing-history", icon: History },
      { title: "Processing Reports", url: "/processing-reports", icon: Database },
      { title: "Setting", url: "/settings", icon: Settings2 },
    ],
    Admin: [
      { title: "Dashboard", url: "/dashboard", icon: SquareTerminal },
      { title: "User Management", url: "/users", icon: FileText },
      { title: "System Settings", url: "/admin/settings", icon: Settings2 },
    ],
    "Quality Inspection": [
      { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
      { title: "Inspection Details", url: "/inspection-details", icon: Search },
      { title: "Inspection History", url: "/inspection-history", icon: History },
      { title: "Reports & Data Export", url: "/reports", icon: FileText },
      { title: "Settings", url: "/settings", icon: Settings2 },
    ],
  };
  
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