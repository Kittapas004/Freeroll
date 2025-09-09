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
  powder: number;
  extract: number;
  capsule: number;
  tea_bag: number;
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
  const [dailyUsageData, setDailyUsageData] = useState<any[]>([]);
  const [recentProcessing, setRecentProcessing] = useState<RecentProcessing[]>([]);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [factoryNotifications, setFactoryNotifications] = useState<FactoryNotification[]>([]);
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistory[]>([]);
  const [topProductType, setTopProductType] = useState<string>('Unknown');
  const [topProductUnit, setTopProductUnit] = useState<string>('kg');
  const [completedReports, setCompletedReports] = useState<any[]>([]);
  
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
      
      console.log('🏭 Fetching Factory data from Strapi...');
      
      // Fetch both factory submissions and factory processing records
      const [submissionsRes, processingRes] = await Promise.all([
        fetch('https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*', {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
        }),
        fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*', {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
        })
      ]);

      if (!submissionsRes.ok || !processingRes.ok) {
        console.error('❌ Failed to fetch factory data');
        throw new Error('Failed to fetch factory data');
      }

      const submissionsData = await submissionsRes.json();
      const processingData = await processingRes.json();
      
      console.log('✅ Factory Submissions:', submissionsData);
      console.log('✅ Factory Processing:', processingData);
      
      // Debug: Check output_unit field in processing records
      if (processingData.data && processingData.data.length > 0) {
        console.log('🔍 Sample processing record with output_unit:', {
          id: processingData.data[0].id,
          final_product_type: processingData.data[0].final_product_type,
          output_quantity: processingData.data[0].output_quantity,
          output_unit: processingData.data[0].output_unit,
          allFields: Object.keys(processingData.data[0])
        });
      }
      
      const submissions = submissionsData.data || [];
      const processings = processingData.data || [];
      console.log(`📊 Found ${submissions.length} factory submissions and ${processings.length} processing records`);
      
      if (processings.length > 0) {
        // Filter only completed processings for calculations
        const completedProcessings = processings.filter((p: any) => 
          p.Processing_Status === 'Completed'
        );

        console.log('✅ Completed Processings:', completedProcessings);
        
        // Calculate real stats from completed processing records only
        
        // 1. Total Turmeric Used = sum of all output_quantity from completed processings
        const totalTurmericUsed = completedProcessings.reduce((sum: number, p: any) => {
          const output = parseFloat(p.output_quantity) || 0;
          return sum + output;
        }, 0);

        // 2. Calculate total waste = sum of all waste_quantity from completed processings
        const totalWaste = completedProcessings.reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.waste_quantity) || 0);
        }, 0);

        // 3. Find Top Product Output by grouping final_product_type and summing output_quantity from completed processings
        const productTypeTotals = completedProcessings.reduce((acc: any, p: any) => {
          const productType = p.final_product_type || 'Unknown Product';
          const output = parseFloat(p.output_quantity) || 0;
          
          if (!acc[productType]) {
            acc[productType] = 0;
          }
          acc[productType] += output;
          
          return acc;
        }, {});

        console.log('🏷️ Product Type Totals:', productTypeTotals);

        // Find the product type with highest total output
        let topProductTypeName = 'Unknown Product';
        let topProductOutput = 0;
        Object.entries(productTypeTotals).forEach(([type, total]: [string, any]) => {
          if (total > topProductOutput) {
            topProductTypeName = type;
            topProductOutput = total;
          }
        });

        console.log(`🥇 Top Product: ${topProductTypeName} with ${topProductOutput} kg`);

        // Set the top product type state
        setTopProductType(topProductTypeName);
        
        // Get unit from the most recent processing record of the top product type
        const topProductProcessings = completedProcessings.filter((p: any) => 
          p.final_product_type === topProductTypeName
        );
        const latestTopProductProcessing = topProductProcessings.length > 0 
          ? topProductProcessings[topProductProcessings.length - 1] 
          : null;
        
        const unit = latestTopProductProcessing?.output_unit || 'kg';
        setTopProductUnit(unit);

        const totalOutput = totalTurmericUsed; // Same as total turmeric used for simplicity

        const totalRemaining = completedProcessings.reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.remaining_stock) || 0);
        }, 0);

        // Calculate batches awaiting export (all processings that are NOT completed yet)
        const batchesAwaitingExport = processings.filter((p: any) => 
          p.Processing_Status !== 'Completed'
        ).length;

        const pendingSubmissions = processings.filter((p: any) => 
          p.Processing_Status === 'Received' || p.Processing_Status === 'Processing'
        ).length;
        
        const completedBatches = completedProcessings.length; // Count of completed processings
        
        setStats({
          totalProcessed: Math.round(totalTurmericUsed * 100) / 100, // Total output_quantity from completed only
          pendingSubmissions: Math.round(totalWaste * 100) / 100, // Total waste_quantity from completed only
          completedBatches: batchesAwaitingExport, // Batches awaiting export count
          totalOutput: Math.round(topProductOutput * 100) / 100 // Top product output quantity from completed only
        });

        console.log('📊 Updated stats:', {
          totalTurmericUsed,
          totalWaste, 
          completedBatches,
          topProductOutput,
          topProductTypeName
        });

        // Process real recent processing data from processings collection
        const recentProcessingData: RecentProcessing[] = processings.slice(0, 10).map((processing: any) => {
          const output = parseFloat(processing.output_quantity) || 0;
          const finalProductType = processing.final_product_type || 'Unknown Product';
          
          let productOutput = '';
          if (output > 0) {
            const unit = processing.output_unit || 'kg';
            productOutput = `${finalProductType}: ${output} ${unit}`;
          } else {
            productOutput = 'Processing in progress';
          }

          return {
            id: processing.id.toString(),
            batchId: processing.Batch_Id || `T-batch-${processing.id}`,
            date: processing.Date_Received || processing.createdAt,
            processor: processing.operator_processor || processing.Factory || 'Factory Processing',
            productOutput,
            processMethod: processing.final_product_type || 'Standard Processing',
            status: processing.Processing_Status === 'Completed' ? 'Passed' : 'Processing'
          };
        });

        setRecentProcessing(recentProcessingData);

        // Generate processing history from real processing data
        const history: ProcessingHistory[] = processings.slice(0, 6).map((processing: any) => {
          const output = parseFloat(processing.output_quantity) || 0;
          const finalProductType = processing.final_product_type || 'Unknown';
          
          let outputText = '';
          if (output > 0) {
            const unit = processing.output_unit || 'kg';
            outputText = `${finalProductType}: ${output} ${unit}`;
          } else {
            outputText = 'Processing';
          }

          return {
            id: processing.id.toString(),
            batchId: processing.Batch_Id || `T-batch-${processing.id}`,
            date: processing.Date_Received || processing.createdAt,
            status: processing.Processing_Status || 'Processing',
            output: outputText
          };
        });

        setProcessingHistory(history);

        // Set completed reports for Recent Activity
        setCompletedReports(completedProcessings.slice(0, 3)); // Keep latest 3 completed reports

        // Update processing trend with real data from completed processings only by grouping by month
        const monthlyData = completedProcessings.reduce((acc: any, processing: any) => {
          const processingDate = processing.processing_date_custom || processing.Date_Received || processing.createdAt;
          const date = new Date(processingDate);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, powder: 0, extract: 0, capsule: 0, tea_bag: 0 };
          }
          
          const output = parseFloat(processing.output_quantity) || 0;
          const productType = (processing.final_product_type || '').toLowerCase();
          
          // Categorize by actual product types from Strapi
          if (productType.includes('powder')) {
            acc[monthKey].powder += output;
          } else if (productType.includes('extract')) {
            acc[monthKey].extract += output;
          } else if (productType.includes('capsule')) {
            acc[monthKey].capsule += output;
          } else if (productType.includes('tea bag') || productType.includes('tea_bag')) {
            acc[monthKey].tea_bag += output;
          } else {
            // Default to powder if type is unclear
            acc[monthKey].powder += output;
          }
          
          return acc;
        }, {});

        const trendData = Object.values(monthlyData) as ProcessingTrend[];
        if (trendData.length > 0) {
          setProcessingTrend(trendData);
        } else {
          // Fallback with current month data
          const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          setProcessingTrend([
            { month: currentMonth, powder: totalOutput * 0.4, extract: totalOutput * 0.3, capsule: totalOutput * 0.2, tea_bag: totalOutput * 0.1 }
          ]);
        }

        // Generate real notifications based on recent processings
        const notifications: FactoryNotification[] = processings.slice(0, 4).map((processing: any, index: number) => {
          const batchId = processing.Batch_Id || `T-batch-${processing.id}`;
          const timeDiff = new Date().getTime() - new Date(processing.createdAt).getTime();
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
          const timeAgo = hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`;

          let type: 'new_submission' | 'upcoming_inspection' | 'pass' | 'processing' = 'processing';
          let title = 'Processing';
          let message = `${batchId} is being processed`;

          if (processing.Processing_Status === 'Completed') {
            type = 'pass';
            title = 'Processing Complete!';
            message = `${batchId} successfully completed processing`;
          } else if (processing.Processing_Status === 'Received') {
            type = 'new_submission';
            title = 'New Processing Request';
            message = `${batchId} received for processing`;
          } else if (processing.Processing_Status === 'Processing') {
            type = 'processing';
            title = 'In Progress';
            message = `${batchId} currently being processed`;
          }

          return {
            id: processing.id.toString(),
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
            name: 'Output', 
            value: totalOutput > 0 ? Math.round((totalOutput / (totalOutput + totalWaste + totalRemaining)) * 100) : 50, 
            color: '#10B981' 
          },
          { 
            name: 'Waste', 
            value: totalWaste > 0 ? Math.round((totalWaste / (totalOutput + totalWaste + totalRemaining)) * 100) : 30, 
            color: '#F59E0B' 
          },
          { 
            name: 'Remaining', 
            value: totalRemaining > 0 ? Math.round((totalRemaining / (totalOutput + totalWaste + totalRemaining)) * 100) : 20, 
            color: '#EF4444' 
          }
        ];

        setProductionData(productionPieData);

        // Generate turmeric usage vs waste data for line chart from completed processing data only
        const processedData = completedProcessings.map((processing: any) => {
          // Use processing_date_custom if available, otherwise fallback to Date_Received or createdAt
          const processingDate = processing.processing_date_custom || processing.Date_Received || processing.createdAt;
          const date = new Date(processingDate);
          return {
            date: date,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            turmeric_used: parseFloat(processing.output_quantity) || 0,
            waste: parseFloat(processing.waste_quantity) || 0,
            processing: processing
          };
        });

        // Sort by date and take last 7 entries
        const sortedData = processedData.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
        const last7Days = sortedData.slice(-7);

        // Group by day and sum the values (in case multiple processings on same day)
        const groupedByDay = last7Days.reduce((acc: any, item: any) => {
          const dayKey = item.day;
          if (!acc[dayKey]) {
            acc[dayKey] = {
              day: dayKey,
              turmeric_used: 0,
              waste: 0,
              count: 0
            };
          }
          acc[dayKey].turmeric_used += item.turmeric_used;
          acc[dayKey].waste += item.waste;
          acc[dayKey].count += 1;
          return acc;
        }, {});

        const dailyUsageData = Object.values(groupedByDay);

        console.log('📈 Daily Usage Data (Completed Only):', dailyUsageData);

        // If we have real completed data, use it; otherwise show empty chart
        const finalDailyData = dailyUsageData.length >= 1 ? dailyUsageData : [];
        
        setDailyUsageData(finalDailyData);

        console.log('📊 Real data statistics (Completed Processings Only):', {
          totalSubmissions: submissions.length,
          totalProcessings: processings.length,
          completedProcessings: completedProcessings.length,
          totalTurmericUsed,
          totalOutput,
          totalWaste,
          totalRemaining,
          pendingSubmissions,
          completedBatches
        });

      } else {
        // ✅ Fallback หากไม่มีข้อมูล
        console.log('📝 No factory submissions found, showing empty state');
        setTopProductType('No Product Data');
        setTopProductUnit('kg');
        setStats({
          totalProcessed: 0,
          pendingSubmissions: 0,
          completedBatches: 0,
          totalOutput: 0
        });
        setRecentProcessing([]);
        setProcessingHistory([]);
        setCompletedReports([]);
        setDailyUsageData([]); // Show empty chart instead of mock data
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
          { month: currentMonth, powder: 0, extract: 0, capsule: 0, tea_bag: 0 }
        ]);

        setProductionData([
          { name: 'No Data', value: 100, color: '#9CA3AF' }
        ]);
      }

    } catch (err) {
      console.error('❌ Error fetching factory data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setTopProductType('Error Loading Data');
      setTopProductUnit('kg');
      
      // Set fallback data even on error
      setStats({
        totalProcessed: 0,
        pendingSubmissions: 0,
        completedBatches: 0,
        totalOutput: 0
      });
      setRecentProcessing([]);
      setProcessingHistory([]);
      setCompletedReports([]);
      setDailyUsageData([]); // Show empty chart instead of mock data
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-2xl font-semibold text-gray-800">
            <SidebarTrigger onClick={toggleSidebar} />
            Welcome {user.name}!
          </div>
        </div>

        {/* KPIs Summary Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-4">
          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Total Turmeric Used
              <span className="text-lg"><Package className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stats.totalProcessed.toLocaleString()} kg</div>
            <div className="text-xs text-gray-400 mt-0.5">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Top Product Output
              <span className="text-lg"><TrendingUp className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{topProductType}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stats.totalOutput.toLocaleString()} {topProductUnit} total</div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Processing Waste
              <span className="text-lg"><Settings className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stats.pendingSubmissions.toLocaleString()} kg</div>
            <div className="text-xs text-gray-400 mt-0.5">Total waste produced</div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Batches Awaiting Export
              <span className="text-lg"><Truck className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stats.completedBatches} batches</div>
            <div className="text-xs text-gray-400 mt-0.5">Ready for factory submission</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {/* Product Output Trend */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Factory className="text-green-600" size={16} />
                <div className="text-sm font-medium text-gray-600">Product Output Trend</div>
              </div>
              <div className="text-xs text-gray-400 flex items-center">
                Last 1 year <ChevronRight size={16} />
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processingTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="powder" fill="#10B981" name="Powder" />
                  <Bar dataKey="extract" fill="#F59E0B" name="Extract" />
                  <Bar dataKey="capsule" fill="#EF4444" name="Capsule" />
                  <Bar dataKey="tea_bag" fill="#8B5CF6" name="Tea Bag" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Turmeric used vs Waste Trend */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-600" size={16} />
                <div className="text-sm font-medium text-gray-600">Turmeric used vs Waste Trend</div>
              </div>
              <div className="text-xs text-gray-400 flex items-center">
                Last 7 days <ChevronRight size={16} />
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyUsageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="turmeric_used"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ stroke: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Turmeric Used"
                  />
                  <Line
                    type="monotone"
                    dataKey="waste"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ stroke: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Waste"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Processing Table */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mt-6">
          <div className="text-sm font-bold text-gray-800 mb-4">Recent Processing</div>
          {recentProcessing.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processor</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product output</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process Method</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentProcessing.slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.batchId}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.processor}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.productOutput}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.processMethod}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center rounded-full text-xs px-3 py-1 ${
                          item.status === 'Passed' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {item.status === 'Passed' ? (
                            <CheckCircle size={14} className="mr-1" />
                          ) : (
                            <Clock size={14} className="mr-1" />
                          )}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Link href="/processing-details">
                          <button 
                            className="text-blue-500 hover:text-blue-700 flex items-center"
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

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Activity */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="text-green-600" size={16} />
                <div className="text-sm font-bold text-green-700">Recent Activity</div>
              </div>
            </div>
            <div className="space-y-4">
              {recentProcessing.length > 0 ? (
                recentProcessing.slice(0, 3).map((processing) => (
                  <div
                    key={processing.id}
                    className="border p-4 rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-medium text-sm text-gray-700 mb-2">
                      <span className="text-lg text-green-600">
                        {processing.status === 'Passed' ? (
                          <CheckCircle size={18} />
                        ) : (
                          <Settings size={18} />
                        )}
                      </span>
                      <span>Processing {processing.status === 'Passed' ? 'Completed' : 'In Progress'}</span>
                    </div>
                    <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                      <li>Batch: {processing.batchId}</li>
                      <li>Processor: {processing.processor}</li>
                      <li>Product: {processing.processMethod}</li>
                      <li>Status: {processing.status}</li>
                      <li>Date: {new Date(processing.date).toLocaleDateString()}</li>
                    </ul>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No recent activities
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-green-600" size={16} />
              <div className="text-sm font-bold text-green-700">Quick Action</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/processing-details">
                <div className="border border-gray-200 hover:border-green-300 hover:shadow-sm rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-white">
                  <Settings size={24} className="mb-2 text-green-600" />
                  <span className="text-xs text-center text-gray-700">Processing Details</span>
                </div>
              </Link>

              <Link href="/processing-history">
                <div className="border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-white">
                  <History size={24} className="mb-2 text-blue-600" />
                  <span className="text-xs text-center text-gray-700">Processing History</span>
                </div>
              </Link>

              <Link href="/processing-reports">
                <div className="border border-gray-200 hover:border-gray-400 hover:shadow-sm rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-white col-span-2">
                  <FileText size={24} className="mb-2 text-gray-600" />
                  <span className="text-xs text-center text-gray-700">Reports & Data Export</span>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:flex flex-col w-1/4 p-4 border-l bg-white space-y-4">{/* Processing History */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="text-green-600" size={16} />
              <h2 className="text-lg font-semibold">Processing History</h2>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="space-y-3">
              {visibleHistory.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CheckCircle size={24} className="text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">No History Yet</div>
                    <div className="text-xs text-gray-400">Processing history will appear here</div>
                  </div>
                </div>
              ) : (
                visibleHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-md border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{item.batchId}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'Completed' 
                          ? 'bg-green-100 text-green-600'
                          : item.status === 'Received'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Output: {item.output}</div>
                      <div className="text-gray-400">{new Date(item.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {historyPageCount > 1 && (
              <div className="pt-3 mt-3 border-t">
                <div className="flex justify-center items-center gap-2">
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setHistoryPage(Math.max(0, historyPage - 1))}
                    disabled={historyPage === 0}
                  >
                    <CircleArrowLeft size={16} />
                  </button>
                  {Array.from({ length: historyPageCount }).map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === historyPage ? "bg-green-600" : "bg-gray-300"
                      }`}
                      onClick={() => setHistoryPage(i)}
                    />
                  ))}
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setHistoryPage(Math.min(historyPageCount - 1, historyPage + 1))}
                    disabled={historyPage >= historyPageCount - 1}
                  >
                    <CircleArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Factory Notifications */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="text-green-600" size={16} />
              <h2 className="text-lg font-semibold">Factory Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              {factoryNotifications.filter(n => !n.read).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {factoryNotifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="space-y-3">
              {factoryNotifications.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-medium">All Caught Up!</div>
                    <div className="text-xs text-gray-500">No pending notifications</div>
                    <div className="text-xs text-gray-400 mt-1">Factory system running smoothly</div>
                  </div>
                </div>
              ) : (
                visibleNotifications.map((notification) => (
                  <div key={notification.id} className="p-3 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-2">
                      {notification.type === 'pass' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                      {notification.type === 'upcoming_inspection' && <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />}
                      {notification.type === 'processing' && <Settings className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                      {notification.type === 'new_submission' && <Package className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1 break-words">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.date}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notificationsPageCount > 1 && (
              <div className="pt-3 mt-3 border-t">
                <div className="flex justify-center items-center gap-2">
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setNotificationsPage(Math.max(0, notificationsPage - 1))}
                    disabled={notificationsPage === 0}
                  >
                    <CircleArrowLeft size={16} />
                  </button>
                  {Array.from({ length: notificationsPageCount }).map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === notificationsPage ? "bg-green-600" : "bg-gray-300"
                      }`}
                      onClick={() => setNotificationsPage(i)}
                    />
                  ))}
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setNotificationsPage(Math.min(notificationsPageCount - 1, notificationsPage + 1))}
                    disabled={notificationsPage >= notificationsPageCount - 1}
                  >
                    <CircleArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}