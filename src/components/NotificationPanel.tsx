'use client';
import { Info, CheckCircle2, XCircle, CircleArrowLeft, CircleArrowRight, Bell, SearchX, AlertCircle, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import React, { useState, useEffect } from "react";

function formatRelativeTime(dateString: string): string {
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
}

const iconMap = {
  General: <Info className="w-4 h-4 text-blue-500" />,
  Succeed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  Failed: <XCircle className="w-4 h-4 text-red-500" />,
  Warning: <XCircle className="w-4 h-4 text-yellow-500" />,
};

const ITEMS_PER_PAGE = 3;

// ฟังก์ชันสำหรับทำความสะอาดข้อความ notification
function cleanNotificationMessage(message: string): string {
  // ลบ hash/ID ที่ไม่ต้องการออก (เช่น gypi01me8e6a791tgros6iuq)
  return message
    .replace(/\s+[a-z0-9]{20,}\s*/gi, '') // ลบ hash ที่ยาวมากกว่า 20 ตัวอักษร
    .replace(/\s+[a-z0-9]{15,}\s*/gi, '') // ลบ hash ที่ยาวมากกว่า 15 ตัวอักษร
    .replace(/\s+sample\s+[a-z0-9]{10,}\s*/gi, ' sample ') // ลบ sample ID
    .replace(/\s+for\s+sample\s+[a-z0-9]{10,}\s*/gi, ' for sample ') // ลบ sample ID หลัง "for sample"
    .replace(/\s{2,}/g, ' ') // แทนที่ช่องว่างหลายช่องด้วยช่องว่างเดียว
    .trim(); // ลบช่องว่างที่เหลือ
}

interface NotificationPanelProps {
  selectedBatchId?: string; // เพิ่ม prop สำหรับ batch ที่เลือก
  userRole?: string; // เพิ่ม prop สำหรับ user role
}

export default function NotificationPanel({ selectedBatchId, userRole }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  const fecthNotifications = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-freeroll-production.up.railway.app';
      const response = await fetch(
        `${apiUrl}/api/notifications?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const result = await response.json();
      setNotifications(
        result.data.map((notification: any) => ({
          id: notification.id,
          documentId: notification.documentId,
          bacth_id: notification.batch.Batch_id,
          message: notification.Text,
          time: notification.Date,
          Notification_status: notification.Notification_status,
          type: 'regular', // ระบุประเภท
        }))
        .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // ✨ เพิ่มฟังก์ชันดึง Admin Notifications
  const fetchAdminNotifications = async () => {
    if (!userRole) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-freeroll-production.up.railway.app';
      const response = await fetch(
        `${apiUrl}/api/admin-notifications?filters[$and][0][Status][$eq]=Active&filters[$and][1][$or][0][Target_Role][$eq]=All&filters[$and][1][$or][1][Target_Role][$eq]=${userRole}&sort=Priority:desc,createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch admin notifications');
        return;
      }

      const result = await response.json();
      
      // Get dismissed notifications from localStorage (แยก key ตาม role)
      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedAdminNotifications_Farmer') || '[]');
      
      // Filter out expired and dismissed notifications
      const activeNotifications = result.data
        .filter((item: any) => {
          // Filter expired
          if (item.Expire_Date && new Date(item.Expire_Date) <= new Date()) return false;
          // Filter dismissed
          if (dismissedNotifications.includes(`admin-${item.id}`)) return false;
          return true;
        })
        .map((notification: any) => ({
          id: `admin-${notification.id}`,
          documentId: notification.documentId,
          bacth_id: 'Admin',
          message: notification.Message,
          title: notification.Title,
          time: notification.createdAt,
          Notification_status: notification.Priority,
          Priority: notification.Priority,
          Category: notification.Category,
          Link_Url: notification.Link_Url,
          type: 'admin', // ระบุประเภท
        }));

      setAdminNotifications(activeNotifications);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    }
  };

  // ✨ ฟังก์ชัน Dismiss Admin Notification (แยก localStorage ตาม role)
  const dismissAdminNotification = (notificationId: string) => {
    // Remove from UI state
    setAdminNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Save to localStorage (แยก key ตาม role)
    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedAdminNotifications_Farmer') || '[]');
    dismissedNotifications.push(notificationId);
    localStorage.setItem('dismissedAdminNotifications_Farmer', JSON.stringify(dismissedNotifications));
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    try {
      const response = await fetch(
        `https://api-freeroll-production.up.railway.app/api/notifications/${id}`,
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

      setNotifications((prev) => prev.filter((n) => n.documentId !== id));
      alert("Notification deleted successfully");
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  useEffect(() => {
    fecthNotifications();
    fetchAdminNotifications();
  }, [userRole]);

  // รีเซ็ต page เมื่อเปลี่ยน batch
  useEffect(() => {
    setPage(0);
  }, [selectedBatchId]);

  // ✨ รวม notifications ทั้งสองประเภท
  const allNotifications = [...adminNotifications, ...notifications].sort(
    (a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  // กรอง notifications ตาม batch ที่เลือก (ไม่กรอง admin notifications)
  const filteredNotifications = selectedBatchId 
    ? allNotifications.filter(n => n.type === 'admin' || n.bacth_id === selectedBatchId)
    : allNotifications;

  const pageCount = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const visibleNotifications = filteredNotifications.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <div className={clsx("bg-white rounded-2xl p-4 shadow-sm mt-3")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="text-green-600" size={16} />
          <div className="text-sm font-bold text-gray-700">Notification</div>
        </div>
        {selectedBatchId && (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {selectedBatchId}
          </div>
        )}
      </div>

      {/* กำหนดความสูงคงที่สำหรับ notification container */}
      <div className="h-80 flex flex-col justify-between">
        {/* Notification items container */}
        <div className="space-y-3 text-sm flex-1 overflow-y-auto">
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((n, i) => {
              const isAdminNotification = n.type === 'admin';
              
              // ไอคอนสำหรับ Admin Notification ตาม Priority
              const getAdminIcon = () => {
                if (!isAdminNotification) return iconMap[n.Notification_status as keyof typeof iconMap];
                
                switch (n.Priority) {
                  case 'Urgent':
                    return <AlertCircle className="w-4 h-4 text-red-600" />;
                  case 'High':
                    return <AlertTriangle className="w-4 h-4 text-orange-600" />;
                  case 'Normal':
                    return <Info className="w-4 h-4 text-blue-600" />;
                  case 'Low':
                    return <CheckCircle2 className="w-4 h-4 text-green-600" />;
                  default:
                    return <Info className="w-4 h-4 text-gray-600" />;
                }
              };

              // สีขอบสำหรับ Admin Notification
              const getBorderColor = () => {
                if (!isAdminNotification) return 'border-gray-200';
                
                switch (n.Priority) {
                  case 'Urgent':
                    return 'border-l-4 border-l-red-600';
                  case 'High':
                    return 'border-l-4 border-l-orange-600';
                  case 'Normal':
                    return 'border-l-4 border-l-blue-600';
                  case 'Low':
                    return 'border-l-4 border-l-green-600';
                  default:
                    return 'border-gray-200';
                }
              };

              return (
                <div
                  key={i}
                  className={`relative border px-3 py-2 rounded-lg min-h-[4rem] group ${getBorderColor()}`}
                >
                  {/* ปุ่ม X มุมขวาบน (ทั้ง Admin และ Regular) */}
                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    onClick={() => isAdminNotification ? dismissAdminNotification(n.id) : handleDeleteNotification(n.documentId)}
                    title={isAdminNotification ? "Dismiss notification" : "Delete notification"}
                  >
                    ✕
                  </button>

                  <div className="flex gap-2 flex-1 min-w-0 pr-6">
                    <div className="flex-shrink-0 mt-1">
                      {getAdminIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* แสดง Title สำหรับ Admin Notification */}
                      {isAdminNotification && n.title && (
                        <div className="text-gray-900 text-sm font-semibold mb-1 flex items-center gap-2">
                          {n.title}
                          {n.Category && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {n.Category}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-gray-700 text-sm line-clamp-2">
                        {!selectedBatchId && !isAdminNotification && (
                          <span className="text-blue-600 font-medium">{n.bacth_id} </span>
                        )}
                        {isAdminNotification && (
                          <span className="text-green-600 font-medium">[Admin] </span>
                        )}
                        {isAdminNotification ? n.message : cleanNotificationMessage(n.message)}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-gray-400">
                          {formatRelativeTime(n.time)}
                        </div>
                        
                        {/* Link สำหรับ Admin Notification */}
                        {isAdminNotification && n.Link_Url && (
                          <a
                            href={n.Link_Url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View More →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <SearchX className="text-gray-400 w-8 h-8" />
                </div>
                <div>No notifications</div>
                {selectedBatchId && (
                  <div className="text-xs text-gray-400 mt-1">
                    for {selectedBatchId}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* เพิ่ม placeholder เมื่อมี notification น้อยกว่า 3 */}
          {visibleNotifications.length > 0 && visibleNotifications.length < ITEMS_PER_PAGE && 
            Array.from({ length: ITEMS_PER_PAGE - visibleNotifications.length }).map((_, i) => (
              <div key={`placeholder-${i}`} className="min-h-[4rem] opacity-0 pointer-events-none">
                {/* Invisible placeholder to maintain consistent height */}
              </div>
            ))
          }
        </div>

        {/* Navigation ที่ด้านล่างเสมอ */}
        <div className="pt-2 mt-2 border-t">
          {pageCount > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
              >
                <CircleArrowLeft size={16} />
              </button>
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  className={clsx(
                    "w-2 h-2 rounded-full transition-colors",
                    i === page ? "bg-green-600" : "bg-gray-300"
                  )}
                  onClick={() => setPage(i)}
                />
              ))}
              <button
                className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
                disabled={page === pageCount - 1}
              >
                <CircleArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}