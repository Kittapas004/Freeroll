interface ActivityItem {
    icon: string;
    title: string;
    content: string[];
  }
  
  const activities: ActivityItem[] = [
    {
      icon: "🧺",
      title: "Harvest Tracking",
      content: [
        "Batch : T-Batch-001",
        "Date : January 25,2025",
        "Quantity : 100 kg",
        "Plant Variety : Curcuma longa",
      ],
    },
    {
      icon: "🧪",
      title: "Record Fertilizer",
      content: [
        "Batch : T-Batch-001",
        "Date : February 03,2025",
        "Fertilizer Type : Nitrogen (N)",
        "Fertilizer Quantity : 20 kg",
      ],
    },
    {
      icon: "📄",
      title: "Farm Information",
      content: [
        "Farm Location : 123 Farm Road , Mae Fah Luang",
        "Crop Type : Turmeric",
        "Farm Site : 150 Acres",
        "Cultivation Method : Organic",
      ],
    },
  ];
  
  export default function RecentActivity({ className = "" }: { className?: string }) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-green-700">Recent Activity</div>
          {/* <button className="text-xs text-green-600 hover:underline">See All</button> */}
        </div>
  
        <div className="space-y-4">
          {activities.map((act, i) => (
            <div key={i} className="border p-3 rounded-xl">
              <div className="flex items-center gap-2 font-medium text-sm text-gray-700 mb-1">
                <span className="text-lg">{act.icon}</span>
                {act.title}
              </div>
              <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
                {act.content.map((line, j) => (
                  <li key={j}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }