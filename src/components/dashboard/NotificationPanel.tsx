import { Info, CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

const notifications = [
  {
    type: "info",
    message: "For Batch #001, the factory processed 200 kg of turmeric",
    time: "1 minute ago",
  },
  {
    type: "success",
    message: "Batch #001 Successfully. Passed inspection results",
    time: "2 hours ago",
  },
  {
    type: "error",
    message: "Batch #003 Fail. The quality is not up to standard.",
    time: "24 hours ago",
  },
];

const iconMap = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function NotificationPanel({ className }: { className?: string }) {
  return (
    <div className={clsx("bg-white rounded-2xl p-4 shadow-sm", className)}>
      <div className="text-sm font-semibold text-gray-700 mb-2">Notification</div>

      <div className="space-y-3 text-sm">
        {notifications.map((n, i) => (
          <div
            key={i}
            className="flex items-start justify-between border px-3 py-2 rounded-lg"
          >
            <div className="flex gap-2">
              {iconMap[n.type as keyof typeof iconMap]}
              <div>
                <div className="text-gray-700 text-sm font-medium">
                  {n.message}
                </div>
                <div className="text-xs text-gray-400">{n.time}</div>
              </div>
            </div>
            <button className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
          </div>
        ))}

        <div className="flex justify-center gap-2 mt-2">
          <button className="w-2 h-2 rounded-full bg-green-600"></button>
          <button className="w-2 h-2 rounded-full bg-gray-300"></button>
          <button className="w-2 h-2 rounded-full bg-gray-300"></button>
        </div>
      </div>
    </div>
  );
}
