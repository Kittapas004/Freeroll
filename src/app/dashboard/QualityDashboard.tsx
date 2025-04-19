'use client';

import { Card } from "@/components/ui/card";
import NotificationPanel from "@/components/NotificationPanel";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React, { useEffect, useState } from "react";

export default function QualityDashboard() {
  const toggleSidebar = () => {
    console.log("Sidebar toggled");
  };

  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    role: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:1337/api/users/me?populate=*", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");
        const userData = await response.json();

        setUser({
          name: userData.username || "",
          email: userData.email || "",
          avatar: userData.avatar?.url
            ? `http://localhost:1337${userData.avatar.url}`
            : "",
          role: userData.user_role || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <main key="quality-dashboard" className="flex flex-row h-full">
      <div className="flex-1 p-4 overflow-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="text-2xl font-semibold text-gray-800">
            <SidebarTrigger onClick={toggleSidebar} />
            Welcome {user.name}!
          </div>
        </div>

        {/* KPIs Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Inspected Batches</div>
            <div className="text-2xl font-bold">120</div>
            <div className="text-xs text-gray-400">Last updated: March 2025</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Pass Rate</div>
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs text-gray-400">8% need retesting</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Pending Inspections</div>
            <div className="text-2xl font-bold">10</div>
            <div className="text-xs text-gray-400">Awaiting Review and Testing</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Rejected Batches</div>
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-gray-400">Failed Quality Check</div>
          </Card>
        </div>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Curcumin % Trend</div>
            <div className="text-xs text-gray-400 mb-2">Last 7 days</div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Moisture % Trend</div>
            <div className="text-xs text-gray-400 mb-2">Last 7 days</div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </Card>
        </div>

        {/* Recent Activity and Quick Action placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-green-700">Recent Activity</div>
            </div>
            {/* Add actual content here later */}
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold text-gray-700 mb-2">Quick Action</div>
            {/* Add buttons here later */}
          </Card>
        </div>
      </div>

      {/* Notification Panel */}
      <div className="hidden lg:block w-1/4 p-4 border-l">
        <NotificationPanel />
      </div>
    </main>
  );
}
