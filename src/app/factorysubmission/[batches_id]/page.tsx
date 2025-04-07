'use client';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { useParams } from "next/navigation";

export default function FactoryFeedbackDetailPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const params = useParams();
const batchId = params?.batches_id as string;

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      localStorage.setItem("sidebarOpen", String(!prev));
      return !prev;
    });
  };

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger onClick={toggleSidebar} />
            <h1 className="text-xl font-semibold">
              Factory Feedback Details ({batchId})
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6 space-y-2">
              <h2 className="font-semibold mb-2">Batch Overview</h2>
              <p><strong>Batch ID</strong>: {batchId}</p>
              <p><strong>Farm Name</strong>: Little Farm</p>
              <p><strong>Grade</strong>: A</p>
              <p><strong>Yield</strong>: 250 kg</p>
              <p><strong>Date Received</strong>: Jan 16, 2025</p>
              <p><strong>Destination Factory</strong>: Factory A – Chiang Mai Plant</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-2">
              <h2 className="font-semibold mb-2">Processing Outcome</h2>
              <p>
                <strong>Processing Status</strong>: <span className="text-green-600">Completed</span>
              </p>
              <p><strong>Date Processed</strong>: Jan 17, 2025</p>
              <p><strong>Processed By</strong>: Somchai P. (Factory Supervisor)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">Output Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-blue-700 font-semibold">Capsules</p>
                  <p className="text-xl font-bold">1,200</p>
                  <p className="text-sm">packs</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-green-700 font-semibold">Essential Oil</p>
                  <p className="text-xl font-bold">3</p>
                  <p className="text-sm">liters</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold mb-4">Turmeric Utilization</h2>
              <div className="space-y-2">
                <p className="text-sm font-medium">Used (80%)</p>
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div className="bg-purple-600 h-2 rounded w-[80%]"></div>
                </div>
                <p className="text-sm text-right">200 kg</p>

                <p className="text-sm font-medium">Remaining (20%)</p>
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div className="bg-green-600 h-2 rounded w-[20%]"></div>
                </div>
                <p className="text-sm text-right">50 kg</p>

                <p className="text-sm font-medium">Waste/Loss (0%)</p>
                <div className="w-full bg-gray-200 h-2 rounded"></div>
                <p className="text-sm text-right">0 kg</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-4">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Factory Processing Report</p>
                  <p className="text-xs text-muted-foreground">PDF Document</p>
                </div>
                <Download className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Processing Photos</p>
                  <p className="text-xs text-muted-foreground">Image Gallery</p>
                </div>
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
