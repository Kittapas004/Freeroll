import { CalendarDays, Search } from "lucide-react";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardHeader() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      localStorage.setItem('sidebarOpen', String(!prev));
      return !prev;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="text-2xl font-semibold text-gray-800">
        <SidebarTrigger onClick={toggleSidebar} />
        Welcome Kittapas!
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search batches..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <span className="text-sm bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full">
          T-Batch-001
        </span>

      </div>
    </div>
  );
}