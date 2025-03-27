import { CalendarDays, Search } from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="text-2xl font-semibold text-gray-800">
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

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          Sunday, 14 Nov 2023
        </div>
      </div>
    </div>
  );
}