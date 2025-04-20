'use client';
import { Info, CheckCircle2, XCircle, CircleArrowLeft, CircleArrowRight } from "lucide-react";
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

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  const fecthNotifications = async () => {
    try {
      const response = await fetch(
        `http://localhost:1337/api/notifications?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`,
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
        }))
        .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:1337/api/notifications/${id}`,
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
  }, []);

  const pageCount = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const visibleNotifications = notifications.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <div className={clsx("bg-white rounded-2xl p-4 shadow-sm mt-3")}>
      <div className="text-sm font-bold text-gray-700 mb-2">Notification</div>

      <div className="space-y-3 text-sm">
        {visibleNotifications.map((n, i) => (
          <div
            key={i}
            className="flex items-start justify-between border px-3 py-2 rounded-lg"
          >
            <div className="flex gap-2">
              {iconMap[n.Notification_status as keyof typeof iconMap]}
              <div>
                <div className="text-gray-700 text-sm font-medium">
                 {n.bacth_id} {n.message}
                </div>
                <div className="text-xs text-gray-400">
                {formatRelativeTime(n.time)}
                </div>
              </div>
            </div>
            <button
              className="text-gray-300 hover:text-gray-500 text-xs"
              onClick={() => handleDeleteNotification(n.documentId)}
            >
              ✕
            </button>
          </div>
        ))}

        {pageCount > 1 && (
          <div className="flex justify-center items-center gap-2 mt-2">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
            >
              <CircleArrowLeft/>
            </button>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
          key={i}
          className={clsx(
            "w-2 h-2 rounded-full",
            i === page ? "bg-green-600" : "bg-gray-300"
          )}
          onClick={() => setPage(i)}
              ></button>
            ))}
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
              disabled={page === pageCount - 1}
            >
              <CircleArrowRight/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
