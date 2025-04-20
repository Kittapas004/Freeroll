'use client'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useState } from "react";
import { Search, ChevronDown, Calendar, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

function FileDownload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// Sidebar Item Component
function SidebarItem({ icon, text, active }: { icon: React.ReactNode; text: string; active: boolean }) {
  return (
    <div className={`flex items-center px-4 py-3 ${active ? 'text-green-500 bg-green-50' : 'text-gray-700'}`}>
      <div className="w-5 h-5 mr-3">{icon}</div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Icon Components
function Grid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function Clock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Settings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function ReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState("All Farms");
  const [selectedTest, setSelectedTest] = useState("Curcuminoid Test");
  const [searchResults] = useState([
    {
      batchId: "T-Batch-001",
      farmName: "Little Farm",
      testType: "Curcumin/Moisture",
      qualityGrade: "A",
      yield: "250",
      dateOfResult: "Jan 15, 2025",
      status: "Passed"
    },
    {
      batchId: "T-Batch-021",
      farmName: "Vilad Farm",
      testType: "Curcumin",
      qualityGrade: "A",
      yield: "250",
      dateOfResult: "Jan 15, 2025",
      status: "Passed"
    }
  ]);

  const [exportHistory] = useState([
    {
      batchId: "T-Batch-001",
      farmName: "Little Farm",
      testType: "Curcumin/Moisture",
      qualityGrade: "A",
      yield: "250",
      dateOfResult: "Jan 15, 2025",
      status: "pass"
    },
    {
      batchId: "T-Batch-001",
      farmName: "Little Farm",
      testType: "Curcuminoid",
      qualityGrade: "A",
      yield: "250",
      dateOfResult: "Jan 15, 2025",
      status: "pass"
    }
  ]);

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
            <h1 className="text-2xl font-semibold text-gray-800">
              Reports & Data Export
            </h1>
          </div>
        </header>
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          {/* Search Form */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <input
                  type="text"
                  placeholder="Enter batch ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Result</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                <div className="relative">
                  <select
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedFarm}
                    onChange={(e) => setSelectedFarm(e.target.value)}
                  >
                    <option>All Farms</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                <div className="relative">
                  <select
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                  >
                    <option>Curcuminoid Test</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-md">Reset</button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center">
                <Search className="h-4 w-4 mr-1" />
                Search
              </button>
            </div>
          </div>

          {/* Data Export Section */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Data Export</h2>
              <button className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center">
                <FileDownload />
                <span className="ml-1">Export Data</span>
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-700 border-b">
                  <th className="pb-2 w-8">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="pb-2">Batch ID</th>
                  <th className="pb-2">Farm Name</th>
                  <th className="pb-2">Test Type</th>
                  <th className="pb-2">Quality Grade</th>
                  <th className="pb-2">Yield</th>
                  <th className="pb-2">Date of Result</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result, index) => (
                  <tr key={index} className="text-sm border-b">
                    <td className="py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="py-3">{result.batchId}</td>
                    <td className="py-3">{result.farmName}</td>
                    <td className="py-3">{result.testType}</td>
                    <td className="py-3">{result.qualityGrade}</td>
                    <td className="py-3">{result.yield}</td>
                    <td className="py-3">{result.dateOfResult}</td>
                    <td className="py-3">
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>{result.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Export History */}
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Export History</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search batches..."
                  className="px-3 py-1 pl-8 border border-gray-300 rounded-md text-sm"
                />
                <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-700 border-b">
                  <th className="pb-2">Batch ID</th>
                  <th className="pb-2">Farm Name</th>
                  <th className="pb-2">Test Type</th>
                  <th className="pb-2">Quality Grade</th>
                  <th className="pb-2">Yield</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {exportHistory.map((history, index) => (
                  <tr key={index} className="text-sm border-b">
                    <td className="py-3">{history.batchId}</td>
                    <td className="py-3">{history.farmName}</td>
                    <td className="py-3">{history.testType}</td>
                    <td className="py-3">{history.qualityGrade}</td>
                    <td className="py-3">{history.yield}</td>
                    <td className="py-3">{history.status}</td>
                    <td className="py-3">
                      <button className="text-gray-500">
                        <div className="h-4 w-4">
                          <FileText />
                        </div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-center space-x-2">
              <button className="p-1 rounded-full bg-green-500 text-white">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white">
                1
              </button>
              <button className="w-6 h-6 flex items-center justify-center rounded-full">
                2
              </button>
              <button className="w-6 h-6 flex items-center justify-center rounded-full">
                3
              </button>
              <button className="p-1 rounded-full">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}