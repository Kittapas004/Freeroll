'use client';

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import ChemicalChart from "@/components/ChemicalChart";
import HistoryTimeline from "@/components/HistoryTimeline";
import RecentActivity from "@/components/RecentActivity";
import QuickActions from "@/components/QuickActions";
import NotificationPanel from "@/components/NotificationPanel";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import WeatherCard from "@/components/WeatherCard";

export default function DashboardPage() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <AppSidebar />
      <SidebarInset>

        <main className="flex flex-row h-full">
          <div className="flex-1 p-4 overflow-auto">
            <DashboardHeader />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-4">
              <StatCard type="harvest" />
              <StatCard type="quality" />
              <StatCard type="status" />
              <StatCard type="task" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              <div className="lg:col-span-2">
                <ChemicalChart />
              </div>
              <HistoryTimeline />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              <RecentActivity className="lg:col-span-2" />
              <QuickActions />
            </div>

          </div>
          <div className="hidden lg:block w-1/4 p-4 border-l">
            <Card>
              <div className="p-4 flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                  <p className="text-2xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <h2 className="text-2xl font-bold">Weather Average</h2>
                </div>
                <WeatherCard />
              </div>
            </Card>
            <NotificationPanel className="mt-6" />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
