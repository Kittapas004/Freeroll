import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import ChemicalChart from "@/components/dashboard/ChemicalChart";
import HistoryTimeline from "@/components/dashboard/HistoryTimeline";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import NotificationPanel from "@/components/dashboard/NotificationPanel";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
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

        <NotificationPanel className="mt-6" />
      </div>
    </div>
  );
}
