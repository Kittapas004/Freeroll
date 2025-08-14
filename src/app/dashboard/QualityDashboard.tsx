'use client';

import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, XCircle, AlertCircle, ChevronRight, FileText, Activity, Database, Eye, Send, Bell, Calendar, BarChart3, ClipboardList, CircleArrowLeft, CircleArrowRight, Clock, Zap, History, FlaskConical } from "lucide-react";
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalInspected: number;
  passRate: number;
  pendingInspections: number;
  rejectedBatches: number;
}

interface ChartData {
  day: string;
  curcumin: number;
  moisture: number;
  date: string;
}

interface RecentBatch {
  id: string;
  batchId: string;
  farmName: string;
  harvestDate: string;
  grade: string;
  status: 'Passed' | 'Failed';
  testDate: string;
  curcuminLevel?: number;
  moistureLevel?: number;
}

interface LatestResult {
  id: string;
  batchId: string;
  moisture: string;
  curcumin: string;
  status: 'Passed' | 'Failed';
  testDate: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  date: string;
  batchId?: string;
  icon: React.ReactNode;
  details: Record<string, string>;
}

// ✅ Updated interface for lab notifications
interface LabNotification {
  id: string;
  type: 'new_submission' | 'pending' | 'completed';
  title: string;
  message: string;
  batchId: string;
  farmName: string;
  submissionDate: string;
  submissionStatus: 'Pending' | 'Draft' | 'Completed';
  qualityGrade: string;
  read: boolean;
  documentId: string;
}

interface ApiRecord {
  id: string | number;
  documentId?: string;
  attributes?: {
    batch?: {
      data?: {
        attributes?: {
          Batch_id?: string;
          batch_id?: string;
          Farm?: {
            data?: {
              attributes?: {
                Farm_Name?: string;
                farm_name?: string;
              }
            }
          }
        }
      };
      Batch_id?: string;
      batch_id?: string;
      Farm?: {
        Farm_Name?: string;
        farm_name?: string;
      }
    };
    harvest_record?: any;
    Submission_status?: string;
    Quality_grade?: string;
    Date?: string;
    createdAt?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface ApiResponse {
  data: ApiRecord[];
  meta?: any;
}

export default function QualityDashboard() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    role: "",
  });

  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    totalInspected: 0,
    passRate: 0,
    pendingInspections: 0,
    rejectedBatches: 0
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([]);
  const [latestResults, setLatestResults] = useState<LatestResult[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // ✅ Updated notifications state
  const [labNotifications, setLabNotifications] = useState<LabNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role check
  const [role, setRole] = useState<string | 'loading'>('loading');
  const ALLOWED_ROLES = ['Quality Inspection'];

  // Pagination states for sidebar
  const [latestResultsPage, setLatestResultsPage] = useState(0);
  const [notificationsPage, setNotificationsPage] = useState(0);
  const ITEMS_PER_PAGE = 2;

  // Latest Results pagination
  const latestResultsPageCount = Math.ceil(latestResults.length / ITEMS_PER_PAGE);
  const visibleLatestResults = latestResults.slice(
    latestResultsPage * ITEMS_PER_PAGE,
    latestResultsPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // Notifications pagination  
  const notificationsPageCount = Math.ceil(labNotifications.length / ITEMS_PER_PAGE);
  const visibleNotifications = labNotifications.slice(
    notificationsPage * ITEMS_PER_PAGE,
    notificationsPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const toggleSidebar = () => {
    console.log("Sidebar toggled");
  };

  // Quality assessment function
  const determineTestStatusEnhanced = (record: any): 'Passed' | 'Failed' => {
    console.log('🔍 === DEBUG QUALITY ASSESSMENT ===');
    console.log('Input record:', {
      id: record.id,
      batchId: record.batchId,
      testing_method: record.testing_method,
      curcumin_quality: record.curcuminQuality,
      moisture_quality: record.moistureQuality,
      hplc_total_curcuminoids: record.hplc_total_curcuminoids,
      hplc_moisture_quantity: record.hplc_moisture_quantity
    });

    const curcuminThreshold = 3.0; // minimum 3% curcumin
    const moistureThreshold = 15.0; // maximum 15% moisture

    // ตรวจสอบ testing method
    const testingMethod = record.testing_method || 'NIR Spectroscopy';
    console.log('Testing Method:', testingMethod);

    let curcuminValue = null;
    let moistureValue = null;

    if (testingMethod === 'HPLC') {
      // สำหรับ HPLC ใช้ hplc_total_curcuminoids และแปลงจาก mg/g เป็น %
      const hplcTotalCurcuminoids = record.hplc_total_curcuminoids;
      const hplcMoisture = record.hplc_moisture_quantity;

      if (hplcTotalCurcuminoids) {
        curcuminValue = parseFloat(hplcTotalCurcuminoids) / 10; // mg/g to %
        console.log('HPLC Curcumin conversion:', `${hplcTotalCurcuminoids} mg/g → ${curcuminValue}%`);
      }

      if (hplcMoisture) {
        moistureValue = parseFloat(hplcMoisture);
        console.log('HPLC Moisture:', `${moistureValue}%`);
      }
    } else {
      // สำหรับ NIR/UV-Vis ใช้ข้อมูลเดิม
      curcuminValue = record.curcuminQuality;
      moistureValue = record.moistureQuality;
      console.log('Standard Method - Curcumin:', `${curcuminValue}%`);
      console.log('Standard Method - Moisture:', `${moistureValue}%`);
    }

    // ✅ เพิ่ม debug logs
    console.log('Final values for assessment:');
    console.log('- Curcumin Value:', curcuminValue);
    console.log('- Moisture Value:', moistureValue);
    console.log('- Curcumin Threshold: ≥', curcuminThreshold, '%');
    console.log('- Moisture Threshold: ≤', moistureThreshold, '%');

    // ✅ เพิ่ม step-by-step logic check
    let curcuminPass = true;
    let moisturePass = true;

    if (curcuminValue !== null && curcuminValue !== undefined) {
      curcuminPass = curcuminValue >= curcuminThreshold;
      console.log(`Curcumin Check: ${curcuminValue}% >= ${curcuminThreshold}% = ${curcuminPass ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('Curcumin Check: No data available = PASS (default)');
    }

    if (moistureValue !== null && moistureValue !== undefined) {
      moisturePass = moistureValue <= moistureThreshold;
      console.log(`Moisture Check: ${moistureValue}% <= ${moistureThreshold}% = ${moisturePass ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('Moisture Check: No data available = PASS (default)');
    }

    const finalResult = curcuminPass && moisturePass ? 'Passed' : 'Failed';

    console.log('=== ASSESSMENT RESULT ===');
    console.log('Curcumin:', curcuminPass ? '✅ PASS' : '❌ FAIL');
    console.log('Moisture:', moisturePass ? '✅ PASS' : '❌ FAIL');
    console.log('FINAL RESULT:', finalResult);
    console.log('==============================\n');

    return finalResult;
  };


  // ✅ ULTRA SIMPLIFIED: Lab Notifications without complex filters
  // ✅ Lab Notifications with TypeScript fixes
  const fetchLabNotifications = async () => {
    try {
      console.log('=== 🎯 FETCHING Lab Notifications ===');
      const userId = localStorage.getItem("userId");
      const jwt = localStorage.getItem("jwt");

      if (!userId || !jwt) {
        console.error('❌ Missing credentials');
        setLabNotifications([]);
        return;
      }

      // Get ALL lab submission records with the SAME populate strategy as fetchDashboardData
      const recordsUrl = `http://localhost:1337/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&sort=createdAt:desc`;
      console.log('🔗 Fetching from URL:', recordsUrl);

      const recordsRes = await fetch(recordsUrl, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!recordsRes.ok) {
        throw new Error(`Failed to load records: ${recordsRes.status}`);
      }

      const recordsData = await recordsRes.json();
      console.log('📊 Raw API Response:', recordsData);

      if (!recordsData.data || recordsData.data.length === 0) {
        console.log('ℹ️ No lab submission records found');
        setLabNotifications([]);
        return;
      }

      console.log(`📊 Total records found: ${recordsData.data.length}`);

      // Process records using EXACT SAME LOGIC as fetchDashboardData
      const notifications: LabNotification[] = recordsData.data.slice(0, 10).map((record: any, index: number) => {
        console.log(`\n=== Processing Record ${index + 1} (ID: ${record.id}) ===`);

        const attrs = record.attributes || record;
        console.log('Record attributes keys:', Object.keys(attrs));

        let batchId = 'N/A';
        let farmName = 'Unknown Farm';

        // 🔥 USE EXACT SAME EXTRACTION LOGIC AS fetchDashboardData
        console.log('🔍 Extracting batch and farm info...');

        // Extract batch and farm info - Method 1: Standard nested structure
        if (attrs?.batch?.data?.attributes) {
          const batchData = attrs.batch.data.attributes;
          console.log('📋 Found batch data:', batchData);

          batchId = batchData?.Batch_id || batchData?.batch_id || 'N/A';
          console.log('✅ Batch ID from method 1:', batchId);

          if (batchData?.Farm?.data?.attributes) {
            const farmData = batchData.Farm.data.attributes;
            console.log('📋 Found farm data:', farmData);
            farmName = farmData.Farm_Name || farmData.farm_name || 'Unknown Farm';
            console.log('✅ Farm Name from method 1:', farmName);
          } else {
            console.log('❌ No nested farm data in method 1');
          }
        }

        // Method 2: Direct batch access (fallback from fetchDashboardData)
        if (batchId === 'N/A' || farmName === 'Unknown Farm') {
          console.log('🔍 Trying method 2: Direct batch access...');
          if (attrs?.batch) {
            console.log('📋 Direct batch object:', attrs.batch);

            if (batchId === 'N/A') {
              batchId = attrs.batch?.Batch_id || attrs.batch?.batch_id || 'N/A';
              console.log('✅ Batch ID from method 2:', batchId);
            }

            if (farmName === 'Unknown Farm') {
              farmName = attrs.batch?.Farm?.Farm_Name || attrs.batch?.Farm?.farm_name || 'Unknown Farm';
              console.log('✅ Farm Name from method 2:', farmName);
            }
          }
        }

        // Method 3: Log what we actually have for debugging
        console.log('🔍 Final extraction results:');
        console.log('- Batch ID:', batchId);
        console.log('- Farm Name:', farmName);
        console.log('- Full batch structure:', JSON.stringify(attrs?.batch, null, 2));

        // Extract other fields
        const submissionStatus = attrs?.Submission_status || 'Pending';
        const qualityGrade = attrs?.Quality_grade || 'Not Graded';
        const submissionDate = attrs?.Date || attrs?.createdAt || new Date().toISOString();

        console.log('📋 Other extracted data:', {
          submissionStatus,
          qualityGrade,
          submissionDate
        });

        // Determine notification type
        let notificationType: 'new_submission' | 'pending' | 'completed' = 'new_submission';
        let title = 'New Sample Received';

        if (submissionStatus === 'Pending') {
          notificationType = 'pending';
          title = 'Inspection Pending';
        } else if (submissionStatus === 'Completed') {
          notificationType = 'completed';
          title = 'Inspection Completed';
        }

        const notification: LabNotification = {
          id: `lab-${record.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: notificationType,
          title,
          message: `Batch ${batchId} from ${farmName}`,
          batchId,
          farmName,
          submissionDate,
          submissionStatus: submissionStatus as 'Pending' | 'Draft' | 'Completed',
          qualityGrade,
          read: submissionStatus === 'Completed',
          documentId: record.documentId || record.id?.toString() || `record-${index}`
        };

        console.log('✅ Final notification created:', {
          id: notification.id.substring(0, 20) + '...',
          batchId: notification.batchId,
          farmName: notification.farmName,
          message: notification.message
        });

        return notification;
      });

      console.log('\n=== FINAL SUMMARY ===');
      console.log(`✅ Total notifications: ${notifications.length}`);
      notifications.forEach((n, i) => {
        console.log(`${i + 1}. ${n.batchId} -> "${n.farmName}"`);
      });

      // Set state with clear logging
      console.log('🔄 Setting notifications in state...');
      setLabNotifications(notifications);
      console.log('✅ State updated successfully');

    } catch (err) {
      console.error('❌ Error in fetchLabNotifications:', err);
      setLabNotifications([]);
    }
  };

  // Fetch dashboard data with enhanced debugging
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Fetching Dashboard Data ===');

      // Get lab info first
      const labRes = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!labRes.ok) {
        throw new Error('Failed to get lab information');
      }

      const labData = await labRes.json();
      if (!labData.data || labData.data.length === 0) {
        throw new Error('No lab found for this user.');
      }

      const labId = labData.data[0].documentId;
      console.log('Lab ID:', labId);

      // Get lab submission records with enhanced populate
      const recordsUrl = `http://localhost:1337/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&filters[lab][documentId][$eq]=${labId}&sort=createdAt:desc`;
      console.log('Fetching from URL:', recordsUrl);

      const recordsRes = await fetch(recordsUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!recordsRes.ok) {
        throw new Error(`Failed to load records: ${recordsRes.status}`);
      }

      const recordsData = await recordsRes.json();
      console.log('Full Records Data:', JSON.stringify(recordsData, null, 2));

      if (!recordsData.data) {
        setStats({ totalInspected: 0, passRate: 0, pendingInspections: 0, rejectedBatches: 0 });
        return;
      }

      // Enhanced data processing
      const processedRecords = await Promise.all(recordsData.data.map(async (record: any, index: number) => {
        const attrs = record.attributes || record;

        console.log(`\n=== Processing Record ${index + 1} (ID: ${record.id}) ===`);

        let batchId = 'N/A';
        let farmName = 'Unknown Farm';
        let harvestDate = '';

        // Extract batch and farm info (ใช้ logic เดิม)
        if (attrs?.batch?.data?.attributes) {
          const batchData = attrs.batch.data.attributes;
          batchId = batchData?.Batch_id || batchData?.batch_id || 'N/A';

          if (batchData?.Farm?.data?.attributes) {
            farmName = batchData.Farm.data.attributes.Farm_Name || batchData.Farm.data.attributes.farm_name || 'Unknown Farm';
          }
        }

        if (batchId === 'N/A') {
          console.log('Method 3: Trying direct batch access...');
          if (attrs?.batch) {
            batchId = attrs.batch?.Batch_id || attrs.batch?.batch_id || 'N/A';
            farmName = attrs.batch?.Farm?.Farm_Name || attrs.batch?.Farm?.farm_name || 'Unknown Farm';
          }
        }

        // Extract harvest date (ใช้ logic เดิม)
        if (attrs?.harvest_record?.data?.attributes) {
          harvestDate = attrs.harvest_record.data.attributes.harvest_date ||
            attrs.harvest_record.data.attributes.Date ||
            attrs.harvest_record.data.attributes.createdAt || '';
        }

        // ✅ เพิ่ม: รองรับ HPLC data
        const testingMethod = attrs?.testing_method || record?.testing_method || 'NIR Spectroscopy';

        // ✅ เพิ่ม: ดึงข้อมูล HPLC ถ้ามี
        const finalRecord = {
          id: record.id.toString(),
          batchId,
          farmName,
          submissionStatus: attrs?.Submission_status || 'Draft',
          qualityGrade: attrs?.Quality_grade || 'Not Graded',

          // ✅ Standard test data
          curcuminQuality: attrs?.curcumin_quality,
          moistureQuality: attrs?.moisture_quality,

          // ✅ HPLC test data
          testing_method: testingMethod,
          hplc_total_curcuminoids: attrs?.hplc_total_curcuminoids,
          hplc_moisture_quantity: attrs?.hplc_moisture_quantity,
          hplc_quality_assessment: attrs?.hplc_quality_assessment,

          testDate: attrs?.test_date || attrs?.createdAt,
          harvestDate: harvestDate || attrs?.createdAt,
          inspectorNotes: attrs?.inspector_notes || ''
        };

        console.log('Final processed record:', finalRecord);
        return finalRecord;
      }));

      console.log('=== Final Processing Summary ===');
      console.log('Total records processed:', processedRecords.length);

      // Calculate stats
      const totalRecords = processedRecords.length;
      const completedRecords = processedRecords.filter(r => r.submissionStatus === 'Completed');
      const pendingRecords = processedRecords.filter(r => r.submissionStatus === 'Pending' || r.submissionStatus === 'Draft');

      const passedRecords = completedRecords.filter(r => {
        const status = determineTestStatusEnhanced(r);
        return status === 'Passed';
      });

      const failedRecords = completedRecords.filter(r => {
        const status = determineTestStatusEnhanced(r);
        return status === 'Failed';
      });

      const passRate = completedRecords.length > 0 ? Math.round((passedRecords.length / completedRecords.length) * 100) : 0;

      setStats({
        totalInspected: totalRecords,
        passRate: passRate,
        pendingInspections: pendingRecords.length,
        rejectedBatches: failedRecords.length
      });

      // Prepare recent batches (only completed ones)
      const recentCompletedBatches: RecentBatch[] = completedRecords
        .slice(0, 10)
        .map(record => {
          // ✅ ใช้ enhanced status determination
          const status = determineTestStatusEnhanced(record);

          // ✅ ดึงค่าที่ถูกต้องตาม testing method
          let curcuminLevel = record.curcuminQuality;
          let moistureLevel = record.moistureQuality;

          if (record.testing_method === 'HPLC') {
            // แปลง HPLC values สำหรับการแสดงผล
            if (record.hplc_total_curcuminoids) {
              curcuminLevel = parseFloat(record.hplc_total_curcuminoids) / 10;
            }
            if (record.hplc_moisture_quantity) {
              moistureLevel = parseFloat(record.hplc_moisture_quantity);
            }
          }

          return {
            id: record.id,
            batchId: record.batchId,
            farmName: record.farmName,
            harvestDate: record.harvestDate,
            grade: record.qualityGrade,
            status: status,
            testDate: record.testDate,
            curcuminLevel: curcuminLevel,
            moistureLevel: moistureLevel
          };
        });
      setRecentBatches(recentCompletedBatches);

      // Prepare latest results
      const latestTestResults: LatestResult[] = completedRecords
        .filter(r => {
          // ✅ เช็คทั้ง standard และ HPLC results
          const hasStandardResults = r.curcuminQuality || r.moistureQuality;
          const hasHPLCResults = r.hplc_total_curcuminoids || r.hplc_moisture_quantity;
          return hasStandardResults || hasHPLCResults;
        })
        .slice(0, 6)
        .map(record => {
          const status = determineTestStatusEnhanced(record);

          // ✅ แสดงผลตาม testing method
          let moistureDisplay = 'N/A';
          let curcuminDisplay = 'N/A';

          if (record.testing_method === 'HPLC') {
            if (record.hplc_total_curcuminoids) {
              curcuminDisplay = `${record.hplc_total_curcuminoids} mg/g`;
            }
            if (record.hplc_moisture_quantity) {
              moistureDisplay = `${record.hplc_moisture_quantity}%`;
            }
          } else {
            if (record.curcuminQuality) {
              curcuminDisplay = `${record.curcuminQuality}%`;
            }
            if (record.moistureQuality) {
              moistureDisplay = `${record.moistureQuality}%`;
            }
          }

          return {
            id: record.id,
            batchId: record.batchId,
            moisture: moistureDisplay,
            curcumin: curcuminDisplay,
            status: status,
            testDate: record.testDate
          };
        });

      setLatestResults(latestTestResults);

      // Prepare chart data (last 7 days of completed tests)
      const chartDataPoints: ChartData[] = [];
      const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = daysOfWeek[date.getDay()];

        const dayRecords = completedRecords.filter(record => {
          if (!record.testDate) return false;
          const recordDate = new Date(record.testDate);
          return recordDate.toDateString() === date.toDateString();
        });

        // ✅ คำนวณค่าเฉลี่ยโดยรองรับ HPLC
        let totalCurcumin = 0;
        let totalMoisture = 0;
        let curcuminCount = 0;
        let moistureCount = 0;

        dayRecords.forEach(record => {
          if (record.testing_method === 'HPLC') {
            if (record.hplc_total_curcuminoids) {
              totalCurcumin += parseFloat(record.hplc_total_curcuminoids) / 10; // แปลงเป็น %
              curcuminCount++;
            }
            if (record.hplc_moisture_quantity) {
              totalMoisture += parseFloat(record.hplc_moisture_quantity);
              moistureCount++;
            }
          } else {
            if (record.curcuminQuality) {
              totalCurcumin += record.curcuminQuality;
              curcuminCount++;
            }
            if (record.moistureQuality) {
              totalMoisture += record.moistureQuality;
              moistureCount++;
            }
          }
        });

        const avgCurcumin = curcuminCount > 0 ? totalCurcumin / curcuminCount : 0;
        const avgMoisture = moistureCount > 0 ? totalMoisture / moistureCount : 0;

        chartDataPoints.push({
          day: dayName,
          curcumin: Number(avgCurcumin.toFixed(1)),
          moisture: Number(avgMoisture.toFixed(1)),
          date: date.toISOString().split('T')[0]
        });
      }

      setChartData(chartDataPoints);

      // Generate recent activities
      const activities: RecentActivity[] = [
        ...completedRecords.slice(0, 3).map((record, index) => {
          const status = determineTestStatusEnhanced(record); // ✅ ใช้ enhanced function

          return {
            id: `activity-${record.id}`,
            type: 'Quality Inspection Completed',
            description: `Batch ${record.batchId} inspection completed`,
            date: record.testDate || record.harvestDate,
            batchId: record.batchId,
            icon: <Activity size={18} className="text-blue-500" />,
            details: {
              batch: record.batchId,
              farm: record.farmName,
              grade: record.qualityGrade,
              status: status,
              method: record.testing_method // ✅ เพิ่ม testing method
            }
          };
        }),
        ...processedRecords.filter(r => r.submissionStatus === 'Pending').slice(0, 2).map((record, index) => ({
          id: `pending-${record.id}`,
          type: 'Pending Inspection',
          description: `Batch ${record.batchId} awaiting inspection`,
          date: record.harvestDate,
          batchId: record.batchId,
          icon: <AlertCircle size={18} className="text-orange-500" />,
          details: {
            batch: record.batchId,
            farm: record.farmName,
            status: 'Pending'
          }
        }))
      ];

      setRecentActivities(activities.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // ✅ NEW: Format notification time
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Status Badge Component
  const StatusBadge: React.FC<{ status: 'Passed' | 'Failed' }> = ({ status }) => {
    if (status === 'Passed') {
      return (
        <div className="inline-flex items-center justify-center rounded-full text-xs px-3 py-1 bg-green-100 text-green-600">
          <CheckCircle size={14} className="mr-1" /> Passed
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center justify-center rounded-full text-xs px-3 py-1 bg-red-100 text-red-600">
          <XCircle size={14} className="mr-1" /> Failed
        </div>
      );
    }
  };

  // Navigation handlers
  const handleViewBatchDetails = (batchId: string) => {
    router.push(`/inspection-details/${batchId}`);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'inspection-details':
        router.push('/inspection-details');
        break;
      case 'inspection-history':
        router.push('/inspection-history');
        break;
      case 'reports-export':
        router.push('/reports');
        break;
      default:
        break;
    }
  };

  // ✅ NEW: Notification management functions
  const markNotificationAsRead = (id: string) => {
    setLabNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const removeNotification = (id: string) => {
    setLabNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setLabNotifications([]);
  };

  // ✅ NEW: Get notification icon based on type
  const getNotificationIcon = (type: 'new_submission' | 'pending' | 'completed') => {
    switch (type) {
      case 'new_submission':
        return <AlertCircle size={18} className="text-blue-500" />;
      case 'pending':
        return <Clock size={18} className="text-orange-500" />;
      case 'completed':
        return <CheckCircle size={18} className="text-green-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  // User data fetch
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

  // Role check and data fetch
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setRole(userRole || '');
  }, []);

  useEffect(() => {
    if (role === 'loading') return;
    if (!ALLOWED_ROLES.includes(role)) {
      router.push('/unauthorized');
      return;
    }
    fetchDashboardData();
    fetchLabNotifications(); // ✅ Add this call
  }, [role]);

  // ✅ UPDATED: Auto-refresh data every 3 minutes
  useEffect(() => {
    if (role !== 'loading' && ALLOWED_ROLES.includes(role)) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing dashboard data...');
        fetchDashboardData();
        fetchLabNotifications();
      }, 180000); // 3 minutes

      return () => clearInterval(interval);
    }
  }, [role]);

  // ✅ NEW: Calculate unread notifications count
  const unreadCount = labNotifications.filter(n => !n.read).length;

  if (role === 'loading' || loading) {
    return (
      <main className="flex flex-row h-full bg-gray-50">
        <div className="flex-1 p-5 overflow-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-row h-full bg-gray-50">
        <div className="flex-1 p-5 overflow-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchDashboardData}
                    className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-row h-full">
      <div className="flex-1 p-4 overflow-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-2xl font-semibold text-gray-800">
            <SidebarTrigger onClick={toggleSidebar} />
            Welcome {user.name}!
          </div>
          {/* <div className="flex gap-2">
            <button
              onClick={() => {
                fetchDashboardData();
                fetchLabNotifications();
              }}
              className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
            >
              Refresh Data
            </button>
          </div> */}
        </div>

        {/* KPIs Summary Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-4">
          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Total Inspected Batches
              <span className="text-lg"><BarChart3 className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stats.totalInspected}</div>
            <div className="text-xs text-gray-400 mt-0.5">Last updated: March 2025</div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Pass Rate
              <span className="text-lg"><CheckCircle className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stats.passRate}%</div>
            <div className="text-xs text-gray-400 mt-0.5">Quality Assessment</div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Pending Inspections
              <span className="text-lg"><ClipboardList className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stats.pendingInspections}</div>
            <div className="text-xs text-gray-400 mt-0.5">Awaiting Review</div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-4">
            <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
              Rejected Batches
              <span className="text-lg"><XCircle className="text-green-600" /></span>
            </div>
            <div className="text-xl font-bold text-gray-800 mt-1">{stats.rejectedBatches}</div>
            <div className="text-xs text-gray-400 mt-0.5">Failed Quality Check</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="text-green-600" size={16} />
                <div className="text-sm font-medium text-gray-600">Curcumin % Trend</div>
              </div>
              <div className="text-xs text-gray-400 flex items-center">
                Last 7 days <ChevronRight size={16} />
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Curcumin']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="curcumin"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ stroke: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="text-green-600" size={16} />
                <div className="text-sm font-medium text-gray-600">Moisture % Trend</div>
              </div>
              <div className="text-xs text-gray-400 flex items-center">
                Last 7 days <ChevronRight size={16} />
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Moisture']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="moisture"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ stroke: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Batches Table */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mt-6">
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
                {recentBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No batches found
                    </td>
                  </tr>
                ) : (
                  recentBatches.slice(0, 5).map((batch) => (
                    <tr key={batch.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{batch.batchId}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{batch.farmName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(batch.harvestDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Grade {batch.grade}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewBatchDetails(batch.id)}
                          className="text-blue-500 hover:text-blue-700 flex items-center"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity and Quick Action */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="text-green-600" size={16} />
                <div className="text-sm font-bold text-green-700">Recent Activity</div>
              </div>
            </div>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No recent activities
                </div>
              ) : (
                recentActivities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="border p-4 rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-medium text-sm text-gray-700 mb-2">
                      <span className="text-lg text-green-600">{activity.icon}</span>
                      <span>{activity.type}</span>
                    </div>
                    <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                      <li>Batch: {activity.details.batch}</li>
                      <li>Farm: {activity.details.farm}</li>
                      <li>Grade: {activity.details.grade}</li>
                      <li>Status: {activity.details.status}</li>
                      <li>Date: {formatDate(activity.date)}</li>
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-green-600" size={16} />
              <div className="text-sm font-bold text-green-700">Quick Action</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => handleQuickAction('inspection-details')}
                className="border border-gray-200 hover:border-green-300 hover:shadow-sm rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-white"
              >
                <Activity size={24} className="mb-2 text-green-600" />
                <span className="text-xs text-center text-gray-700">Inspection Details</span>
              </div>

              <div
                onClick={() => handleQuickAction('inspection-history')}
                className="border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-white"
              >
                <Database size={24} className="mb-2 text-blue-600" />
                <span className="text-xs text-center text-gray-700">Inspection History</span>
              </div>

              <div
                onClick={() => handleQuickAction('reports-export')}
                className="border border-gray-200 hover:border-gray-400 hover:shadow-sm rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-white col-span-2"
              >
                <FileText size={24} className="mb-2 text-gray-600" />
                <span className="text-xs text-center text-gray-700">Reports & Data Export</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ UPDATED: Right Sidebar - Latest Lab Results & Lab Notifications */}
      <div className="hidden lg:flex flex-col w-1/4 p-4 border-l bg-white space-y-4">
        {/* Latest Lab Results Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="text-green-600" size={16} />
              <h2 className="text-lg font-semibold">Latest Lab Results</h2>
            </div>
          </div>

          {/* Fixed height container */}
          <div className="h-72 flex flex-col justify-between">
            {/* Results container */}
            <div className="space-y-3 flex-1">
              {visibleLatestResults.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <CheckCircle size={24} className="text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">No Results Yet</div>
                    <div className="text-xs text-gray-400">Complete some inspections first</div>
                  </div>
                </div>
              ) : (
                visibleLatestResults.map((result) => (
                  <div key={result.id} className="p-3 rounded-md border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{result.batchId}</span>
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
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Moisture</span>
                        <span className="font-medium">{result.moisture}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Curcumin</span>
                        <span className="font-medium">{result.curcumin}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {formatDate(result.testDate)}
                    </div>
                  </div>
                ))
              )}

              {/* Placeholder for consistent height */}
              {visibleLatestResults.length > 0 && visibleLatestResults.length < ITEMS_PER_PAGE &&
                Array.from({ length: ITEMS_PER_PAGE - visibleLatestResults.length }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="h-20 opacity-0 pointer-events-none">
                  </div>
                ))
              }
            </div>

            {/* Navigation at bottom */}
            <div className="pt-3 mt-3 border-t">
              {latestResultsPageCount > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setLatestResultsPage((prev) => Math.max(prev - 1, 0))}
                    disabled={latestResultsPage === 0}
                  >
                    <CircleArrowLeft size={16} />
                  </button>
                  {Array.from({ length: latestResultsPageCount }).map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i === latestResultsPage ? "bg-green-600" : "bg-gray-300"
                        }`}
                      onClick={() => setLatestResultsPage(i)}
                    />
                  ))}
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setLatestResultsPage((prev) => Math.min(prev + 1, latestResultsPageCount - 1))}
                    disabled={latestResultsPage === latestResultsPageCount - 1}
                  >
                    <CircleArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ UPDATED: Lab Notifications Card with forced re-render */}
        <div key={`notifications-${Date.now()}`} className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="text-green-600" size={16} />
              <h2 className="text-lg font-semibold">Lab Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              {labNotifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="Clear all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Fixed height container */}
          <div className="h-72 flex flex-col justify-between">
            {/* Notifications container */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {labNotifications.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-medium">All Caught Up!</div>
                    <div className="text-xs text-gray-500">No pending notifications</div>
                    <div className="text-xs text-gray-400 mt-1">Lab system running smoothly</div>
                  </div>
                </div>
              ) : (
                visibleNotifications.map((notification) => (
                  <div key={`${notification.id}-${notification.farmName}`} className="p-3 rounded-md border border-gray-200 relative group hover:bg-gray-50">
                    {/* Delete button */}
                    <button
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      onClick={() => removeNotification(notification.id)}
                      title="Remove notification"
                    >
                      <XCircle size={16} />
                    </button>

                    <div
                      className={`flex items-start cursor-pointer ${!notification.read ? 'opacity-100' : 'opacity-60'}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0 ml-2">
                        <div className={`text-sm font-medium flex items-center ${!notification.read ? 'font-bold' : ''}`}>
                          {notification.title}
                          {!notification.read && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Batch: <span className="font-medium text-blue-600">{notification.batchId}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Farm: <span className="font-medium text-green-600">{notification.farmName}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Status: <span className={`font-medium ${notification.submissionStatus === 'Completed' ? 'text-green-600' :
                            notification.submissionStatus === 'Pending' ? 'text-orange-600' : 'text-gray-600'
                            }`}>{notification.submissionStatus}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatNotificationTime(notification.submissionDate)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/inspection-details');
                            }}
                            className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom info and navigation */}
            <div className="pt-3 mt-3 border-t">
              <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                <span>
                  {labNotifications.length > 0 ? `${labNotifications.length} notification(s)` : 'No notifications'}
                </span>
                <button
                  onClick={fetchLabNotifications}
                  className="text-blue-600 hover:text-blue-800"
                  title="Refresh notifications"
                >
                  Refresh
                </button>
              </div>

              {/* Pagination for notifications */}
              {notificationsPageCount > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setNotificationsPage((prev) => Math.max(prev - 1, 0))}
                    disabled={notificationsPage === 0}
                  >
                    <CircleArrowLeft size={16} />
                  </button>
                  {Array.from({ length: notificationsPageCount }).map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i === notificationsPage ? "bg-green-600" : "bg-gray-300"
                        }`}
                      onClick={() => setNotificationsPage(i)}
                    />
                  ))}
                  <button
                    className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    onClick={() => setNotificationsPage((prev) => Math.min(prev + 1, notificationsPageCount - 1))}
                    disabled={notificationsPage === notificationsPageCount - 1}
                  >
                    <CircleArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}