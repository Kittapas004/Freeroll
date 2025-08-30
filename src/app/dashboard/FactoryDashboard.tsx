'use client';

import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React, { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  Activity, 
  Database, 
  Eye, 
  Send, 
  Bell, 
  Calendar, 
  BarChart3, 
  ClipboardList, 
  CircleArrowLeft, 
  CircleArrowRight, 
  Clock, 
  Zap, 
  History, 
  Factory,
  Package,
  TrendingUp,
  Settings,
  Users,
  Truck
} from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FactoryStats {
  totalProcessed: number;
  pendingSubmissions: number;
  completedBatches: number;
  totalOutput: number;
}

interface ProcessingTrend {
  month: string;
  capsules: number;
  essential_oil: number;
  powder: number;
}

interface RecentProcessing {
  id: string;
  batchId: string;
  date: string;
  processor: string;
  productOutput: string;
  processMethod: string;
  status: 'Passed' | 'Processing';
}

interface ProductionData {
  name: string;
  value: number;
  color: string;
}

interface FactoryNotification {
  id: string;
  type: 'new_submission' | 'upcoming_inspection' | 'pass' | 'processing';
  title: string;
  message: string;
  batchId: string;
  date: string;
  read: boolean;
}

interface ProcessingHistory {
  id: string;
  batchId: string;
  date: string;
  status: string;
  output: string;
}

export default function FactoryDashboard() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    role: "",
  });

  // Data states
  const [stats, setStats] = useState<FactoryStats>({
    totalProcessed: 0,
    pendingSubmissions: 0,
    completedBatches: 0,
    totalOutput: 0
  });

  const [processingTrend, setProcessingTrend] = useState<ProcessingTrend[]>([]);
  const [recentProcessing, setRecentProcessing] = useState<RecentProcessing[]>([]);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [factoryNotifications, setFactoryNotifications] = useState<FactoryNotification[]>([]);
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [notificationsPage, setNotificationsPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const ITEMS_PER_PAGE = 3;

  const toggleSidebar = () => {
    console.log("Sidebar toggled");
  };

  const fetchUserData = async (): Promise<void> => {
    try {
      const res = await fetch('https://api-freeroll-production.up.railway.app/api/users/me?populate=*', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await res.json();
      setUser({
        name: userData.username || "",
        email: userData.email || "",
        avatar: userData.avatar?.url ? `https://api-freeroll-production.up.railway.app${userData.avatar.url}` : "",
        role: userData.user_role || "",
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchFactoryData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏭 Fetching Factory submissions from Strapi...');
      
      // Simplified API call
      const factoryRes = await fetch(
        'https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (!factoryRes.ok) {
        console.error('❌ Failed to fetch factory data, status:', factoryRes.status);
        throw new Error(`Failed to fetch factory data: ${factoryRes.status}`);
      }

      const factoryData = await factoryRes.json();
      console.log('✅ Factory Data from Strapi:', factoryData);
      
      const submissions = factoryData.data || [];
      console.log(`📊 Found ${submissions.length} factory submissions`);
      
      if (submissions.length > 0) {
        // Calculate real stats from submissions
        const totalTurmericUsed = submissions.reduce((sum: number, s: any) => {
          return sum + (parseFloat(s.Turmeric_Utilization_Used) || parseFloat(s.Yield) || 0);
        }, 0);

        const totalCapsules = submissions.reduce((sum: number, s: any) => {
          return sum + (parseInt(s.Output_Capsules) || 0);
        }, 0);

        const totalEssentialOil = submissions.reduce((sum: number, s: any) => {
          return sum + (parseFloat(s.Output_Essential_Oil) || 0);
        }, 0);

        const totalWaste = submissions.reduce((sum: number, s: any) => {
          return sum + (parseFloat(s.Turmeric_Utilization_Waste) || 0);
        }, 0);

        const pendingSubmissions = submissions.filter((s: any) => 
          s.Submission_status === 'Waiting' || s.Submission_status === 'Pending'
        ).length;
        
        const completedBatches = submissions.filter((s: any) => 
          s.Submission_status === 'Completed'
        ).length;
        
        setStats({
          totalProcessed: Math.round(totalTurmericUsed * 100) / 100, // Total turmeric used
          pendingSubmissions: pendingSubmissions, // Pending submissions
          completedBatches: completedBatches, // Completed batches
          totalOutput: totalCapsules // Total capsules produced
        });

        // Process real recent processing data
        const recentProcessingData: RecentProcessing[] = submissions.slice(0, 10).map((submission: any) => {
          const capsules = parseInt(submission.Output_Capsules) || 0;
          const essentialOil = parseFloat(submission.Output_Essential_Oil) || 0;
          
          let productOutput = '';
          if (capsules > 0 && essentialOil > 0) {
            productOutput = `Capsules: ${capsules} packs, Oil: ${essentialOil}L`;
          } else if (capsules > 0) {
            productOutput = `Capsules: ${capsules} packs`;
          } else if (essentialOil > 0) {
            productOutput = `Essential Oil: ${essentialOil} liters`;
          } else if (submission.Yield) {
            productOutput = `Yield: ${submission.Yield} kg`;
          } else {
            productOutput = 'Processing in progress';
          }

          return {
            id: submission.id.toString(),
            batchId: submission.Batch_id || `T-batch-${submission.id}`,
            date: submission.Date_Processed || submission.Date_Received || submission.Date || submission.createdAt,
            processor: submission.Processed_By || submission.Factory || 'Factory Processing',
            productOutput,
            processMethod: submission.Test_Type || 'Standard Processing',
            status: submission.Submission_status === 'Completed' ? 'Passed' : 'Processing'
          };
        });

        setRecentProcessing(recentProcessingData);

        // Generate processing history from real data
        const history: ProcessingHistory[] = submissions.slice(0, 6).map((submission: any) => {
          const capsules = parseInt(submission.Output_Capsules) || 0;
          const essentialOil = parseFloat(submission.Output_Essential_Oil) || 0;
          
          let output = '';
          if (capsules > 0) output += `Capsules: ${capsules} packs`;
          if (essentialOil > 0) {
            if (output) output += ', ';
            output += `Oil: ${essentialOil}L`;
          }
          if (!output && submission.Yield) output = `Yield: ${submission.Yield} kg`;
          if (!output) output = 'Processing';

          return {
            id: submission.id.toString(),
            batchId: submission.Batch_id || `T-batch-${submission.id}`,
            date: submission.Date_Processed || submission.Date_Received || submission.createdAt,
            status: submission.Submission_status === 'Completed' ? 'Complete' : (submission.Submission_status || 'Processing'),
            output
          };
        });

        setProcessingHistory(history);

        // Update processing trend with real data by grouping by month
        const monthlyData = submissions.reduce((acc: any, submission: any) => {
          const date = new Date(submission.Date_Processed || submission.Date_Received || submission.createdAt);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, capsules: 0, essential_oil: 0, powder: 0 };
          }
          
          acc[monthKey].capsules += submission.Output_Capsules || 0;
          acc[monthKey].essential_oil += submission.Output_Essential_Oil || 0;
          // Estimate powder production based on yield
          acc[monthKey].powder += Math.round((submission.Yield || 0) * 0.1);
          
          return acc;
        }, {});

        const trendData = Object.values(monthlyData) as ProcessingTrend[];
        if (trendData.length > 0) {
          setProcessingTrend(trendData);
        } else {
          // Fallback with current month data
          const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          setProcessingTrend([
            { month: currentMonth, capsules: totalCapsules, essential_oil: totalEssentialOil, powder: Math.round(totalTurmericUsed * 0.1) }
          ]);
        }

        // Generate real notifications based on recent submissions
        const notifications: FactoryNotification[] = submissions.slice(0, 4).map((submission: any, index: number) => {
          const batchId = submission.batch?.Batch_id || submission.Batch_id || `T-batch-${submission.id}`;
          const timeDiff = new Date().getTime() - new Date(submission.createdAt).getTime();
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
          const timeAgo = hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`;

          let type: 'new_submission' | 'upcoming_inspection' | 'pass' | 'processing' = 'processing';
          let title = 'Processing';
          let message = `${batchId} is being processed`;

          if (submission.Submission_status === 'Completed') {
            type = 'pass';
            title = 'Processing Complete!';
            message = `${batchId} successfully completed processing`;
          } else if (submission.Submission_status === 'Waiting') {
            type = 'new_submission';
            title = 'New Submission';
            message = `${batchId} received from ${submission.Farm_Name || 'farm'}`;
          } else if (submission.Submission_status === 'Pending') {
            type = 'processing';
            title = 'In Progress';
            message = `${batchId} currently being processed`;
          }

          return {
            id: submission.id.toString(),
            type,
            title,
            message,
            batchId,
            date: timeAgo,
            read: index > 1 // Mark first 2 as unread
          };
        });

        setFactoryNotifications(notifications);

        // Generate production data for pie chart based on real data
        const productionPieData: ProductionData[] = [
          { 
            name: 'Capsules', 
            value: totalCapsules > 0 ? Math.round((totalCapsules / (totalCapsules + totalEssentialOil + totalTurmericUsed * 0.1)) * 100) : 65, 
            color: '#10B981' 
          },
          { 
            name: 'Essential Oil', 
            value: totalEssentialOil > 0 ? Math.round((totalEssentialOil / (totalCapsules + totalEssentialOil + totalTurmericUsed * 0.1)) * 100) : 25, 
            color: '#F59E0B' 
          },
          { 
            name: 'Powder', 
            value: totalTurmericUsed > 0 ? Math.round(((totalTurmericUsed * 0.1) / (totalCapsules + totalEssentialOil + totalTurmericUsed * 0.1)) * 100) : 10, 
            color: '#EF4444' 
          }
        ];

        setProductionData(productionPieData);

        console.log('📊 Real data statistics:', {
          totalSubmissions: submissions.length,
          totalTurmericUsed,
          totalCapsules,
          totalEssentialOil,
          pendingSubmissions,
          completedBatches
        });

      } else {
        // ✅ Fallback หากไม่มีข้อมูล
        console.log('📝 No factory submissions found, showing empty state');
        setStats({
          totalProcessed: 0,
          pendingSubmissions: 0,
          completedBatches: 0,
          totalOutput: 0
        });
        setRecentProcessing([]);
        setProcessingHistory([]);
        setFactoryNotifications([
          {
            id: '1',
            type: 'new_submission',
            title: 'Welcome to Factory Dashboard',
            message: 'No factory submissions yet. Waiting for farmers to submit batches.',
            batchId: 'System',
            date: 'now',
            read: false
          }
        ]);

        // Set default trend data
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        setProcessingTrend([
          { month: currentMonth, capsules: 0, essential_oil: 0, powder: 0 }
        ]);

        setProductionData([
          { name: 'Capsules', value: 33, color: '#10B981' },
          { name: 'Essential Oil', value: 33, color: '#F59E0B' },
          { name: 'Powder', value: 34, color: '#EF4444' }
        ]);
      }

    } catch (err) {
      console.error('❌ Error fetching factory data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      // Set fallback data even on error
      setStats({
        totalProcessed: 0,
        pendingSubmissions: 0,
        completedBatches: 0,
        totalOutput: 0
      });
      setRecentProcessing([]);
      setProcessingHistory([]);
      setFactoryNotifications([
        {
          id: '1',
          type: 'new_submission',
          title: 'Connection Error',
          message: 'Unable to fetch factory data. Please check your connection.',
          batchId: 'System',
          date: 'now',
          read: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchFactoryData();
  }, []);

  const notificationsPageCount = Math.ceil(factoryNotifications.length / ITEMS_PER_PAGE);
  const visibleNotifications = factoryNotifications.slice(
    notificationsPage * ITEMS_PER_PAGE,
    notificationsPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const historyPageCount = Math.ceil(processingHistory.length / ITEMS_PER_PAGE);
  const visibleHistory = processingHistory.slice(
    historyPage * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading factory dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="flex flex-row h-full">
      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <SidebarTrigger onClick={toggleSidebar} />
            <Factory className="text-blue-600" size={28} />
            Welcome {user.name}!
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Turmeric Used</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalProcessed.toLocaleString()} kg</p>
                <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Product Output</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOutput > 0 ? `${stats.totalOutput} packs` : 'Capsules'}</p>
                <p className="text-xs text-gray-400">{stats.totalOutput > 0 ? 'Total capsules produced' : 'L850 packs'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing Load / Waste</p>
                <p className="text-2xl font-bold text-gray-800">{stats.completedBatches} kg</p>
                <p className="text-xs text-gray-400">from processing operations</p>
              </div>
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Batches Awaiting Export</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingSubmissions} batches</p>
                <p className="text-xs text-gray-400">Ready for factory submission</p>
              </div>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Product Output Trend */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Product Output Trend</h3>
                <select className="text-sm border rounded px-2 py-1">
                  <option>Last 1 year</option>
                  <option>Last 6 months</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processingTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="capsules" fill="#10B981" name="Capsules" />
                  <Bar dataKey="essential_oil" fill="#F59E0B" name="Essential Oil" />
                  <Bar dataKey="powder" fill="#EF4444" name="Powder" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Turmeric used vs Waste Trend */}
          <div>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Turmeric used vs Waste Trend</h3>
                <select className="text-sm border rounded px-2 py-1">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[
                  { day: 'MON', turmeric_used: 520, waste: 180 },
                  { day: 'TUE', turmeric_used: 480, waste: 160 },
                  { day: 'WED', turmeric_used: 550, waste: 190 },
                  { day: 'THU', turmeric_used: 600, waste: 200 },
                  { day: 'FRI', turmeric_used: 580, waste: 185 },
                  { day: 'SAT', turmeric_used: 520, waste: 175 },
                  { day: 'SUN', turmeric_used: 490, waste: 170 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="turmeric_used" stroke="#10B981" strokeWidth={2} name="Turmeric Used" />
                  <Line type="monotone" dataKey="waste" stroke="#EF4444" strokeWidth={2} name="Waste" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>

        {/* Recent Processing Table */}
        <Card className="mb-6">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Processing</h3>
            {recentProcessing.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Batch ID</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Processor</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Product output</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Process Method</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProcessing.slice(0, 5).map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{item.batchId}</td>
                        <td className="py-3 px-4">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{item.processor}</td>
                        <td className="py-3 px-4">{item.productOutput}</td>
                        <td className="py-3 px-4">{item.processMethod}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Passed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link href="/processing-details">
                            <button 
                              className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                            >
                              View Details
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No processing records yet</p>
                <p className="text-gray-400 text-xs">Processing data will appear here when farmers submit batches</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Recent Activity
              </h3>
              <button className="text-green-600 text-sm hover:text-green-800">See All</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Reports & Data Export</p>
                  <p className="text-xs text-gray-600">Report • T-Batch-042</p>
                  <p className="text-xs text-gray-500">Date: Mar 22, 2025</p>
                  <p className="text-xs text-gray-500">Export Type: PDF Document</p>
                  <p className="text-xs text-gray-500">Status: Export.submitted</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Processing Details</p>
                  <p className="text-xs text-gray-600">Batch • T-Batch-042</p>
                  <p className="text-xs text-gray-500">Processing Date: Mar 21, 2025</p>
                  <p className="text-xs text-gray-500">Product Output: Capsules</p>
                  <p className="text-xs text-gray-500">Output: 800 kg</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Action</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/processing-details">
                <button 
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors w-full"
                >
                  <Settings className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Processing Detail</span>
                </button>
              </Link>
              
              <Link href="/processing-history">
                <button 
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors w-full"
                >
                  <History className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Processing History</span>
                </button>
              </Link>
              
              <Link href="/reports">
                <button 
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors w-full"
                >
                  <FileText className="w-6 h-6 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Reports & Data Export</span>
                </button>
              </Link>
              
              <Link href="/settings">
                <button 
                  className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors w-full"
                >
                  <Settings className="w-6 h-6 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Settings</span>
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-1/4 p-4 border-l bg-gray-50">
        {/* Processing History */}
        <Card className="mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Processing History</h3>
              {historyPageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryPage(Math.max(0, historyPage - 1))}
                    disabled={historyPage === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <CircleArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">
                    {historyPage + 1} / {historyPageCount}
                  </span>
                  <button
                    onClick={() => setHistoryPage(Math.min(historyPageCount - 1, historyPage + 1))}
                    disabled={historyPage >= historyPageCount - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <CircleArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {visibleHistory.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.batchId}</p>
                    <p className="text-xs text-gray-600">{item.output}</p>
                    <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notification
              </h3>
              {notificationsPageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNotificationsPage(Math.max(0, notificationsPage - 1))}
                    disabled={notificationsPage === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <CircleArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">
                    {notificationsPage + 1} / {notificationsPageCount}
                  </span>
                  <button
                    onClick={() => setNotificationsPage(Math.min(notificationsPageCount - 1, notificationsPage + 1))}
                    disabled={notificationsPage >= notificationsPageCount - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <CircleArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {visibleNotifications.map((notification) => (
                <div key={notification.id} className="p-3 bg-white rounded border">
                  <div className="flex items-start gap-2">
                    {notification.type === 'pass' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                    {notification.type === 'upcoming_inspection' && <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />}
                    {notification.type === 'processing' && <Settings className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                    {notification.type === 'new_submission' && <Package className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.date}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}