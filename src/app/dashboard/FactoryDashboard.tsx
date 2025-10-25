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
  documentId: string;
  type: 'new_submission' | 'pass' | 'processing' | 'export_success';
  title: string;
  message: string;
  batchId: string;
  date: string;
  read: boolean;
  notification_status: 'General' | 'Succeed' | 'Failed' | 'Warning';
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
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]); // ✅ เพิ่ม state สำหรับ Admin Notifications
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

  // ✅ Format relative time (same as Farmer Dashboard)
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    let diff = Math.round((now.getTime() - date.getTime()) / 1000); // seconds passed

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    const divisions = [
      { amount: 60, name: "second" },
      { amount: 60, name: "minute" },
      { amount: 24, name: "hour" },
      { amount: 30, name: "day" },
      { amount: 12, name: "month" },
      { amount: Infinity, name: "year" },
    ];

    for (let i = 0; i < divisions.length; i++) {
      if (Math.abs(diff) < divisions[i].amount) {
        return rtf.format(-diff, divisions[i].name as Intl.RelativeTimeFormatUnit);
      }
      diff = Math.round(diff / divisions[i].amount);
    }

    return "";
  };

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

  // 🔔 Fetch Factory Notifications from Strapi
  const fetchFactoryNotifications = async (): Promise<void> => {
    try {
      console.log('🔔 Fetching Factory notifications from Strapi...');
      const response = await fetch(
        `https://api-freeroll-production.up.railway.app/api/factory-notifications?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}&sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }
      );

      if (!response.ok) {
        console.error('❌ Failed to fetch notifications');
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        
        // Try to get error details
        try {
          const errorText = await response.text();
          console.error('Error details:', errorText);
        } catch (e) {
          console.error('Could not read error details');
        }
        
        return;
      }

      const result = await response.json();
      console.log('✅ Raw notification data:', result);

      if (!result.data || result.data.length === 0) {
        console.log('📝 No notifications found, setting empty array');
        setFactoryNotifications([]);
        return;
      }

      // Map Strapi notifications to FactoryNotification interface
      const mappedNotifications: FactoryNotification[] = result.data.map((notification: any) => {
        // Get batch ID from various sources (relations or fallback)
        const batchId = notification.batch?.Batch_id || 
                       notification.factory_submission?.Batch_id || 
                       notification.factory_processing?.Batch_Id || 
                       'Unknown';
        
        const createdAt = new Date(notification.createdAt || notification.Date);
        const now = new Date();
        const timeDiff = now.getTime() - createdAt.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const timeAgo = hoursAgo < 1 ? 'Just now' : 
                       hoursAgo < 24 ? `${hoursAgo} hours ago` : 
                       `${Math.floor(hoursAgo / 24)} days ago`;

        // Determine notification type based on message content and relations
        let type: 'new_submission' | 'pass' | 'processing' | 'export_success' = 'processing';
        
        if (notification.factory_processing && notification.Text.includes('exported successfully')) {
          type = 'export_success';
        } else if (notification.factory_processing && notification.Text.includes('completed successfully')) {
          type = 'pass';
        } else if (notification.factory_submission) {
          type = 'new_submission';
        } else if (notification.Text.includes('processing')) {
          type = 'processing';
        }

        return {
          id: notification.id.toString(),
          documentId: notification.documentId,
          type,
          title: notification.Text.length > 100 
            ? notification.Text.substring(0, 100) + '...' 
            : notification.Text, // Show full message if short, or first 50 chars with ellipsis
          message: notification.Text,
          batchId,
          date: timeAgo,
          read: notification.Notification_status !== 'General', // Assume 'General' means unread
          notification_status: notification.Notification_status || 'General'
        };
      });

      console.log('📋 Mapped notifications:', mappedNotifications);
      setFactoryNotifications(mappedNotifications);

    } catch (err) {
      console.error('❌ Error fetching factory notifications:', err);
      setFactoryNotifications([
        {
          id: '1',
          documentId: '1',
          type: 'new_submission',
          title: 'Error Loading',
          message: 'Unable to fetch notifications. Please refresh the page.',
          batchId: 'System',
          date: 'now',
          read: false,
          notification_status: 'Failed'
        }
      ]);
    }
  };

  // ✅ NEW: Fetch Admin Notifications
  const fetchAdminNotifications = async (): Promise<void> => {
    try {
      console.log('🔔 Fetching Admin notifications...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-freeroll-production.up.railway.app';
      const response = await fetch(
        `${apiUrl}/api/admin-notifications?filters[$and][0][Status][$eq]=Active&filters[$and][1][$or][0][Target_Role][$eq]=All&filters[$and][1][$or][1][Target_Role][$eq]=Factory&sort=Priority:desc,createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (!response.ok) {
        console.error('❌ Failed to fetch admin notifications');
        return;
      }

      const result = await response.json();
      console.log('✅ Admin notifications:', result);

      // Filter out expired notifications and map to factory notification format
      const activeNotifications = result.data
        .filter((item: any) => {
          if (!item.Expire_Date) return true;
          return new Date(item.Expire_Date) > new Date();
        })
        .map((notification: any) => {
          console.log('📅 Admin notification date:', {
            createdAt: notification.createdAt,
            formatted: formatRelativeTime(notification.createdAt)
          });
          return {
            id: `admin-${notification.id}`,
            documentId: notification.documentId,
            type: 'admin' as const,
            title: notification.Title,
            message: notification.Message,
            batchId: 'Admin',
            date: formatRelativeTime(notification.createdAt), // ✅ ใช้ formatRelativeTime แทน
            read: false,
            notification_status: notification.Priority,
            priority: notification.Priority,
            category: notification.Category,
            linkUrl: notification.Link_Url,
            isAdmin: true,
            createdAt: notification.createdAt // ✅ เก็บ original date สำหรับ dismiss
          };
        });

      // ✅ กรอง dismissed notifications ออก (แยก key ตาม role)
      const dismissed = JSON.parse(localStorage.getItem('dismissedAdminNotifications_Factory') || '[]');
      const filteredNotifications = activeNotifications.filter(
        (n: any) => !dismissed.includes(n.id)
      );

      setAdminNotifications(filteredNotifications);
    } catch (error) {
      console.error('❌ Error fetching admin notifications:', error);
    }
  };

  // ✅ Dismiss Admin Notification (store in localStorage แยกตาม role)
  const dismissAdminNotification = (notificationId: string): void => {
    // Get dismissed notifications from localStorage (แยก key ตาม role)
    const dismissed = JSON.parse(localStorage.getItem('dismissedAdminNotifications_Factory') || '[]');
    if (!dismissed.includes(notificationId)) {
      dismissed.push(notificationId);
      localStorage.setItem('dismissedAdminNotifications_Factory', JSON.stringify(dismissed));
    }
    // Remove from UI
    setAdminNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatAdminTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  // 🗑️ Delete Factory Notification
  const deleteFactoryNotification = async (documentId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    
    try {
      const response = await fetch(
        `https://api-freeroll-production.up.railway.app/api/factory-notifications/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // Remove from local state
      setFactoryNotifications((prev) => 
        prev.filter((n) => n.documentId !== documentId)
      );

      console.log('✅ Notification deleted successfully');
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
      alert("Failed to delete notification. Please try again.");
    }
  };

  // 📩 Create Factory Notification (for use in other functions)
  const createFactoryNotification = async (
    message: string, 
    batchDocumentId?: string, 
    notificationStatus: 'General' | 'Succeed' | 'Failed' | 'Warning' = 'General'
  ): Promise<void> => {
    try {
      console.log('🔔 Creating notification with userId:', localStorage.getItem("userId"));
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          data: {
            Text: message,
            Date: new Date().toISOString(),
            Notification_status: notificationStatus,
            batch: batchDocumentId,
            user_documentId: localStorage.getItem("userId"),
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create notification");
      }

      console.log('✅ Factory notification created:', message);
      // Refresh notifications after creating new one
      fetchFactoryNotifications();
    } catch (error) {
      console.error("❌ Error creating factory notification:", error);
    }
  };

  const fetchFactoryData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏭 Fetching Factory data from Strapi...');
      
      // 🔥 Step 1: ดึง Factory ของ user ที่ login อยู่
      const userResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/users/me?populate=factory`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });
      
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user factory data");
      }
      
      const userData = await userResponse.json();
      const userFactoryDocumentId = userData.factory?.documentId;
      
      console.log("User's factory documentId:", userFactoryDocumentId);
      
      if (!userFactoryDocumentId) {
        console.warn("User does not have a factory assigned");
        setStats({
          totalProcessed: 0,
          pendingSubmissions: 0,
          completedBatches: 0,
          totalOutput: 0
        });
        setLoading(false);
        return;
      }
      
      // 🔥 Step 2: Fetch factory submissions and processings ที่ตรงกับ factory ของ user เท่านั้น
      const [submissionsRes, processingRes] = await Promise.all([
        fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*&filters[factory][documentId][$eq]=${userFactoryDocumentId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
        }),
        fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings?populate=factory_submission&filters[factory_submission][factory][documentId][$eq]=${userFactoryDocumentId}`, {
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
        // Filter Processing, Completed and Export Success for calculations (รวมทั้ง Processing)
        const relevantProcessings = processings.filter((p: any) => 
          p.Processing_Status === 'Processing' ||
          p.Processing_Status === 'Completed' || 
          p.Processing_Status === 'Export Success'
        );

        console.log('✅ Processing + Completed + Export Success Processings:', relevantProcessings);
        console.log('📊 Processing Status Breakdown:', processings.map((p: any) => ({
          batch: p.Batch_Id,
          status: p.Processing_Status,
          included: (p.Processing_Status === 'Processing' || p.Processing_Status === 'Completed' || p.Processing_Status === 'Export Success')
        })));
        
        // Calculate real stats from Processing + Completed + Export Success records
        
        // 1. Total Turmeric Used = sum of all processed_weight from relevant processings
        const totalTurmericUsed = relevantProcessings.reduce((sum: number, p: any) => {
          const processedWeight = parseFloat(p.processed_weight) || 0;
          return sum + processedWeight;
        }, 0);

        // 2. Calculate total waste from output_records_json
        const totalWaste = relevantProcessings.reduce((sum: number, p: any) => {
          try {
            if (p.output_records_json) {
              const outputRecords = JSON.parse(p.output_records_json);
              const wasteSum = outputRecords.reduce((wasteTotal: number, rec: any) => {
                return wasteTotal + (parseFloat(rec.wasteQuantity) || 0);
              }, 0);
              return sum + wasteSum;
            }
          } catch (e) {
            console.error('Error parsing output_records_json for waste:', e);
          }
          return sum;
        }, 0);

        // 3. Find Top Product Output by parsing output_records_json and grouping by productType
        const productTypeTotals: { [key: string]: number } = {};
        
        relevantProcessings.forEach((p: any) => {
          try {
            if (p.output_records_json) {
              const outputRecords = JSON.parse(p.output_records_json);
              outputRecords.forEach((rec: any) => {
                const productType = rec.productType || 'N/A';
                const quantity = parseFloat(rec.quantity) || 0;
                
                if (!productTypeTotals[productType]) {
                  productTypeTotals[productType] = 0;
                }
                productTypeTotals[productType] += quantity;
              });
            }
          } catch (e) {
            console.error('Error parsing output_records_json for products:', e);
          }
        });

        console.log('🏷️ Product Type Totals:', productTypeTotals);

        // Find the product type with highest total output
        let topProductTypeName = 'N/A';
        let topProductOutput = 0;
        Object.entries(productTypeTotals).forEach(([type, total]: [string, any]) => {
          if (total > topProductOutput) {
            topProductTypeName = type;
            topProductOutput = total;
          }
        });

        console.log(`🥇 Top Product: ${topProductTypeName} with ${topProductOutput}`);

        // Set the top product type state
        setTopProductType(topProductTypeName);
        
        // Get unit from output_records_json for the top product type
        let topProductUnit = 'kg'; // default
        for (const p of relevantProcessings) {
          try {
            if (p.output_records_json) {
              const outputRecords = JSON.parse(p.output_records_json);
              const topProductRecord = outputRecords.find((rec: any) => 
                rec.productType === topProductTypeName
              );
              if (topProductRecord) {
                topProductUnit = topProductRecord.unit || 'kg';
                break; // Found the unit, exit loop
              }
            }
          } catch (e) {
            console.error('Error finding unit for top product:', e);
          }
        }
        
        setTopProductUnit(topProductUnit);

        const totalOutput = topProductOutput; // Top product total output quantity

        const totalRemaining = relevantProcessings.reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.remaining_stock) || 0);
        }, 0);

        // Calculate batches awaiting export (all processings that are NOT completed or exported yet)
        const batchesAwaitingExport = processings.filter((p: any) => 
          p.Processing_Status !== 'Completed' && p.Processing_Status !== 'Export Success'
        ).length;

        const pendingSubmissions = processings.filter((p: any) => 
          p.Processing_Status === 'Received' || p.Processing_Status === 'Processing'
        ).length;
        
        const completedBatches = relevantProcessings.length; // Count of relevant processings
        
        console.log('🧮 Calculation Summary:', {
          totalRecords: processings.length,
          relevantProcessings: relevantProcessings.length,
          totalTurmericUsed: Math.round(totalTurmericUsed * 100) / 100,
          totalWaste: Math.round(totalWaste * 100) / 100,
          topProductType: topProductTypeName,
          topProductOutput: Math.round(topProductOutput * 100) / 100,
          batchesAwaitingExport: batchesAwaitingExport
        });
        
        setStats({
          totalProcessed: Math.round(totalTurmericUsed * 100) / 100, // Total from Processing + Completed + Export Success
          pendingSubmissions: Math.round(totalWaste * 100) / 100, // Total waste from Processing + Completed + Export Success
          completedBatches: batchesAwaitingExport, // Batches awaiting export count
          totalOutput: Math.round(topProductOutput * 100) / 100 // Top product output from Processing + Completed + Export Success
        });

        console.log('📊 Updated stats:', {
          totalTurmericUsed,
          totalWaste, 
          completedBatches,
          topProductOutput,
          topProductTypeName
        });

        // Process real recent processing data from processings collection - แสดงทั้งที่กำลัง Processing และ Completed
        const recentProcessingData: RecentProcessing[] = processings
          .filter((processing: any) => {
            // แสดงเฉพาะที่อยู่ในสถานะ Processing, Completed หรือ Export Success
            const status = processing.Processing_Status;
            
            return status && (
              status === 'Processing' || 
              status === 'Completed' || 
              status === 'Export Success'
            );
          })
          .sort((a: any, b: any) => {
            // เรียงตามวันที่ล่าสุดก่อน
            const dateA = new Date(a.processing_date_custom || a.Date_Received || a.createdAt);
            const dateB = new Date(b.processing_date_custom || b.Date_Received || b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5) // เอา 5 รายการล่าสุด
          .map((processing: any) => {
            // Parse output_records_json to get product output
            let productOutput = 'Processing in progress';
            let processor = 'Factory Processing';
            
            try {
              if (processing.output_records_json) {
                const outputRecords = JSON.parse(processing.output_records_json);
                if (outputRecords.length > 0) {
                  // แสดง output records ทั้งหมด (สูงสุด 2 รายการ)
                  const outputs = outputRecords.slice(0, 2).map((rec: any) => 
                    `${rec.productType}: ${rec.quantity} ${rec.unit}`
                  ).join(', ');
                  productOutput = outputRecords.length > 2 
                    ? `${outputs}, +${outputRecords.length - 2} more`
                    : outputs;
                  
                  // Get processor from first output record
                  processor = outputRecords[0].processor || 'Factory Processing';
                }
              } else {
                // ถ้ายังไม่มี output_records_json แสดงว่ากำลัง processing อยู่
                productOutput = 'Processing in progress';
                // ลอง get processor จาก operator_processor field หรือ inspector
                processor = processing.operator_processor || 
                           processing.inspector_name || 
                           processing.processor || 
                           'Factory Processing';
              }
            } catch (e) {
              console.error('Error parsing output_records_json:', e);
            }

            // Map processing status properly for Recent Processing
            const processingStatus = processing.Processing_Status || 'Processing';
            let displayStatus: 'Passed' | 'Processing' = 'Processing';
            
            // Show "Passed" for both Completed and Export Success
            if (processingStatus === 'Completed' || processingStatus === 'Export Success') {
              displayStatus = 'Passed';
            }

            console.log(`Recent Processing (Filtered) - Batch ${processing.Batch_Id}:`, {
              originalStatus: processing.Processing_Status,
              displayStatus: displayStatus,
              output: productOutput,
              processor: processor
            });

            return {
              id: processing.id.toString(),
              batchId: processing.Batch_Id || `T-Batch-${String(processing.id).padStart(3, '0')}`,
              date: processing.processing_date_custom || processing.Date_Received || processing.createdAt,
              processor: processor,
              productOutput,
              processMethod: processing.output_records_json ? 'Multi-Product Processing' : 'Standard Processing',
              status: displayStatus
            };
          });

        setRecentProcessing(recentProcessingData);

        // Generate processing history from real processing data (including Export Success)
        const history: ProcessingHistory[] = processings.slice(0, 6).map((processing: any) => {
          // Parse output_records_json to get product output
          let outputText = 'Processing';
          
          try {
            if (processing.output_records_json) {
              const outputRecords = JSON.parse(processing.output_records_json);
              if (outputRecords.length > 0) {
                // แสดง output record แรก
                const firstOutput = outputRecords[0];
                outputText = `${firstOutput.productType}: ${firstOutput.quantity} ${firstOutput.unit}`;
                if (outputRecords.length > 1) {
                  outputText += ` +${outputRecords.length - 1} more`;
                }
              }
            }
          } catch (e) {
            console.error('Error parsing output_records_json for history:', e);
          }

          // Map processing status to display status
          const processingStatus = processing.Processing_Status || 'Processing';
          let displayStatus = processingStatus;
          
          // Ensure "Export Success" is displayed properly
          if (processingStatus === 'Export Success') {
            displayStatus = 'Export Success';
          } else if (processingStatus === 'Completed') {
            displayStatus = 'Completed';
          } else if (processingStatus === 'Processing') {
            displayStatus = 'Processing';
          } else if (processingStatus === 'Received') {
            displayStatus = 'Received';
          }

          console.log(`Processing History - Batch ${processing.Batch_Id}:`, {
            originalStatus: processing.Processing_Status,
            displayStatus: displayStatus,
            output: outputText
          });

          return {
            id: processing.id.toString(),
            batchId: processing.Batch_Id || `T-Batch-${String(processing.id).padStart(3, '0')}`,
            date: processing.Date_Received || processing.createdAt,
            status: displayStatus,
            output: outputText
          };
        });

        setProcessingHistory(history);

        // Set completed reports for Recent Activity
        setCompletedReports(relevantProcessings.slice(0, 3)); // Keep latest 3 relevant reports

        // Update processing trend with real data from output_records_json by grouping by month
        const monthlyData: { [key: string]: { month: string; powder: number; extract: number; capsule: number; tea_bag: number } } = {};
        
        relevantProcessings.forEach((processing: any) => {
          const processingDate = processing.processing_date_custom || processing.Date_Received || processing.createdAt;
          const date = new Date(processingDate);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, powder: 0, extract: 0, capsule: 0, tea_bag: 0 };
          }
          
          // Parse output_records_json to get product outputs
          try {
            if (processing.output_records_json) {
              const outputRecords = JSON.parse(processing.output_records_json);
              outputRecords.forEach((rec: any) => {
                const quantity = parseFloat(rec.quantity) || 0;
                const productType = (rec.productType || '').toLowerCase();
                
                // Categorize by product types
                if (productType.includes('powder')) {
                  monthlyData[monthKey].powder += quantity;
                } else if (productType.includes('extract')) {
                  monthlyData[monthKey].extract += quantity;
                } else if (productType.includes('capsule')) {
                  monthlyData[monthKey].capsule += quantity;
                } else if (productType.includes('tea bag') || productType.includes('tea_bag')) {
                  monthlyData[monthKey].tea_bag += quantity;
                } else {
                  // Default to powder if type is unclear
                  monthlyData[monthKey].powder += quantity;
                }
              });
            }
          } catch (e) {
            console.error('Error parsing output_records_json for trend:', e);
          }
        });

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

        // Fetch Factory Notifications from Strapi instead of generating locally
        fetchFactoryNotifications();

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

        // Generate turmeric usage vs waste data for line chart from Processing + Completed + Export Success
        const processedData = relevantProcessings.map((processing: any) => {
          // Use processing_date_custom if available, otherwise fallback to Date_Received or createdAt
          const processingDate = processing.processing_date_custom || processing.Date_Received || processing.createdAt;
          const date = new Date(processingDate);
          
          // Calculate total waste from output_records_json
          let totalWasteForBatch = 0;
          try {
            if (processing.output_records_json) {
              const outputRecords = JSON.parse(processing.output_records_json);
              totalWasteForBatch = outputRecords.reduce((sum: number, rec: any) => {
                return sum + (parseFloat(rec.wasteQuantity) || 0);
              }, 0);
            }
          } catch (e) {
            console.error('Error parsing output_records_json for waste chart:', e);
          }
          
          return {
            date: date,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            turmeric_used: parseFloat(processing.processed_weight) || 0, // Use processed_weight instead of incoming_weight
            waste: totalWasteForBatch,
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

        console.log('📈 Daily Usage Data (Processing + Completed + Export Success):', dailyUsageData);

        // If we have real data, use it; otherwise show empty chart
        const finalDailyData = dailyUsageData.length >= 1 ? dailyUsageData : [];
        
        setDailyUsageData(finalDailyData);

        console.log('📊 Real data statistics (Processing + Completed + Export Success):', {
          totalSubmissions: submissions.length,
          totalProcessings: processings.length,
          relevantProcessings: relevantProcessings.length,
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
            documentId: '1',
            type: 'new_submission',
            title: 'Welcome to Factory Dashboard',
            message: 'No factory submissions yet. Waiting for farmers to submit batches.',
            batchId: 'System',
            date: 'now',
            read: false,
            notification_status: 'General'
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
          documentId: '1',
          type: 'new_submission',
          title: 'Connection Error',
          message: 'Unable to fetch factory data. Please check your connection.',
          batchId: 'System',
          date: 'now',
          read: false,
          notification_status: 'Failed'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchFactoryData();
    fetchAdminNotifications(); // ✅ เพิ่มการดึง Admin Notifications
    // Auto-refresh notifications every 2 minutes
    const notificationInterval = setInterval(() => {
      fetchFactoryNotifications();
      fetchAdminNotifications(); // ✅ Refresh Admin Notifications ด้วย
    }, 120000);
    return () => clearInterval(notificationInterval);
  }, []);

  // ✅ รวม Factory Notifications และ Admin Notifications
  const allNotifications = [...adminNotifications, ...factoryNotifications].sort(
    (a: any, b: any) => {
      // Sort by timestamp (newest first)
      const dateA = new Date(a.date === 'Just now' ? Date.now() : a.date);
      const dateB = new Date(b.date === 'Just now' ? Date.now() : b.date);
      return dateB.getTime() - dateA.getTime();
    }
  );

  const notificationsPageCount = Math.ceil(allNotifications.length / ITEMS_PER_PAGE);
  const visibleNotifications = allNotifications.slice(
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
                        item.status === 'Export Success' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : item.status === 'Completed' 
                          ? 'bg-green-100 text-green-600'
                          : item.status === 'Received'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'Processing'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
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
                visibleNotifications.map((notification) => {
                  const isAdmin = notification.isAdmin || notification.type === 'admin';
                  
                  // Admin notification styling
                  const getBorderClass = () => {
                    if (!isAdmin) return 'border-gray-200';
                    switch (notification.priority) {
                      case 'Urgent': return 'border-l-4 border-l-red-600';
                      case 'High': return 'border-l-4 border-l-orange-600';
                      case 'Normal': return 'border-l-4 border-l-blue-600';
                      case 'Low': return 'border-l-4 border-l-green-600';
                      default: return 'border-gray-200';
                    }
                  };

                  const getIcon = () => {
                    if (isAdmin) {
                      switch (notification.priority) {
                        case 'Urgent': return <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />;
                        case 'High': return <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />;
                        case 'Normal': return <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />;
                        case 'Low': return <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />;
                        default: return <Bell className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />;
                      }
                    } else {
                      if (notification.type === 'pass' || notification.type === 'export_success') 
                        return <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />;
                      if (notification.type === 'processing') 
                        return <Settings className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />;
                      if (notification.type === 'new_submission') 
                        return <Package className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />;
                      return <Bell className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />;
                    }
                  };

                  return (
                    <div key={notification.id} className={`p-3 rounded-md border hover:shadow-sm transition-shadow ${getBorderClass()}`}>
                      <div className="flex items-start gap-2">
                        {getIcon()}
                        <div className="flex-1 min-w-0">
                          {isAdmin && notification.title && (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-semibold text-gray-900">{notification.title}</p>
                              {notification.category && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                  {notification.category}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {isAdmin && <span className="text-green-600 font-medium">[Admin] </span>}
                            {isAdmin ? notification.message : notification.title}
                          </p>
                          {/* Date และ Link ในบรรทัดเดียวกัน */}
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-400">{notification.date}</p>
                            {isAdmin && notification.linkUrl && (
                              <a
                                href={notification.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View More →
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                          {/* ✅ แสดงปุ่ม dismiss สำหรับ admin, delete สำหรับ regular */}
                          <button
                            className="text-gray-300 hover:text-red-500 text-xs flex-shrink-0"
                            onClick={() => isAdmin ? dismissAdminNotification(notification.id) : deleteFactoryNotification(notification.documentId)}
                            title={isAdmin ? "Dismiss notification" : "Delete notification"}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
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