'use client';

import { Card } from "@/components/ui/card";
import NotificationPanel from "@/components/NotificationPanel";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, XCircle, AlertCircle, ChevronRight, FileText, Activity, Database } from "lucide-react";

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

  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for charts
  const curcuminData = [
    { day: 'MON', value: 5.8 },
    { day: 'TUE', value: 6.2 },
    { day: 'WED', value: 7.8 },
    { day: 'THU', value: 6.5 },
    { day: 'FRI', value: 5.9 },
    { day: 'SAT', value: 7.2 },
    { day: 'SUN', value: 7.5 },
  ];

  const moistureData = [
    { day: 'MON', value: 1.2 },
    { day: 'TUE', value: 1.3 },
    { day: 'WED', value: 1.6 },
    { day: 'THU', value: 1.3 },
    { day: 'FRI', value: 1.5 },
    { day: 'SAT', value: 1.4 },
    { day: 'SUN', value: 1.3 },
  ];

  const recentBatches = [
    { id: 'T-batch-002', farm: 'Sitta Farm', harvestDate: 'Sep 5, 2023', grade: 'Grade A', status: 'Passed' },
    { id: 'T-batch-001', farm: 'Sitta Farm', harvestDate: 'Sep 3, 2023', grade: 'Grade B', status: 'Failed' },
  ];

  const latestResults = [
    { id: 'T-batch-001', moisture: '12.5%', curcumin: '6.8', status: 'Passed' },
    { id: 'T-batch-002', moisture: '11.8%', curcumin: '7.1', status: 'Failed' },
  ];

  const recentActivities = [
    {
      type: 'Reports & Data Export',
      details: {
        batch: 'Batch-01',
        date: 'January 8, 2023',
        testType: 'Curcumin/Moisture',
        status: 'Pass'
      },
      icon: <FileText size={18} className="text-green-500" />
    },
    {
      type: 'Quality Inspection',
      details: {
        test: 'Curcumin/Moisture',
        method: 'NIR Spectroscopy',
        date: 'January 15, 2023'
      },
      icon: <Activity size={18} className="text-blue-500" />
    },
    {
      type: 'Inspection Details',
      details: {
        batch: 'T-batch-002',
        date: 'January 10, 2023',
        grade: 'Grade A',
        yield: '1.473 kg',
        status: 'Pass'
      },
      icon: <Database size={18} className="text-green-500" />
    }
  ];

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

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    if (status === 'Passed') {
      return (
        <div className="flex items-center rounded-full text-xs px-3 py-1 bg-green-100 text-green-600">
          <CheckCircle size={12} className="mr-1" /> Passed
        </div>
      );
    } else {
      return (
        <div className="flex items-center rounded-full text-xs px-3 py-1 bg-red-100 text-red-600">
          <XCircle size={12} className="mr-1" /> Failed
        </div>
      );
    }
  };

  return (
    <main key="quality-dashboard" className="flex flex-row h-full bg-gray-50">
      <div className="flex-1 p-5 overflow-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="text-2xl font-semibold text-gray-800">
            <SidebarTrigger onClick={toggleSidebar} className="mr-3" />
            Welcome {user.name || 'Kittapas'}!
          </div>
        </div>

        {/* KPIs Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-500">Total Inspected Batches</div>
            <div className="text-2xl font-bold">120</div>
            <div className="text-xs text-gray-400">Last updated: March 2025</div>
          </Card>
          <Card className="p-4 border-l-4 border-yellow-400">
            <div className="text-sm text-gray-500">Pass Rate</div>
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs text-gray-400">8% need retesting</div>
          </Card>
          <Card className="p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500">Pending Inspections</div>
            <div className="text-2xl font-bold">10</div>
            <div className="text-xs text-gray-400">Awaiting Review and Testing</div>
          </Card>
          <Card className="p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-500">Rejected Batches</div>
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-gray-400">Failed Quality Check</div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Curcumin % Trend</div>
              <div className="text-xs text-gray-400 flex items-center">
                Last 7 days <ChevronRight size={16} />
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curcuminData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[5, 8]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ stroke: '#10B981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Moisture % Trend</div>
              <div className="text-xs text-gray-400 flex items-center">
                Last 7 days <ChevronRight size={16} />
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moistureData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[1, 2]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ stroke: '#10B981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Batches */}
        <Card className="p-4 mb-6">
          <div className="text-sm font-bold text-gray-800 mb-4">Recent Batches</div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBatches.map((batch, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{batch.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{batch.farm}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{batch.harvestDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{batch.grade}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button className="text-blue-500 hover:text-blue-700">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentPage === page
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>

        {/* Recent Activity and Quick Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-green-700">Recent Activity</div>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start">
                    <div className="mr-3">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{activity.type}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(activity.details).map(([key, value], i) => (
                          <div key={i}>
                            <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</span>: {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold text-gray-700 mb-4">Quick Action</div>
            <div className="space-y-2">
              <button className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center">
                <Activity size={16} className="mr-2" />
                <span>Inspection Detail</span>
              </button>
              <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center">
                <Database size={16} className="mr-2" />
                <span>Inspection History</span>
              </button>
              <button className="w-full py-2 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center">
                <FileText size={16} className="mr-2" />
                <span>Reports & Data Export</span>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Notification Panel and Latest Results */}
      <div className="hidden lg:flex flex-col w-80 p-4 border-l bg-white">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Latest Lab Results</h2>
          {latestResults.map((result, idx) => (
            <div key={idx} className="mb-4 p-3 rounded-md border border-gray-200">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{result.id}</span>
                {result.status === 'Passed' ? (
                  <span className="text-green-500 flex items-center">
                    <CheckCircle size={14} className="mr-1" /> Passed
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center">
                    <XCircle size={14} className="mr-1" /> Failed
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Moisture</span>
                  <span className="font-medium">{result.moisture}</span>
                </div>
                <div className="flex justify-between">
                  <span>Curcumin</span>
                  <span className="font-medium">{result.curcumin}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-2 flex justify-center">
            <div className="flex space-x-1">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentPage === page
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs">
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notification</h2>
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 rounded-md border border-gray-200 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <XCircle size={16} />
            </button>
            <div className="flex items-start">
              <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Pass!</div>
                <div className="text-xs text-gray-500">Batch #001 Successfully Passed inspection results</div>
                <div className="text-xs text-gray-400 mt-1">2 hours ago</div>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-md border border-gray-200 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <XCircle size={16} />
            </button>
            <div className="flex items-start">
              <AlertCircle size={18} className="text-orange-500 mr-2 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Upcoming Inspection</div>
                <div className="text-xs text-gray-500">Batch #002 due for inspection tomorrow</div>
                <div className="text-xs text-gray-400 mt-1">24 hours ago</div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  );
}