interface StatCardProps {
    type: "harvest" | "quality" | "status" | "task";
  }
  
  const cardData = {
    harvest: {
      title: "Next Harvest",
      value: "15 Days",
      sub: "Expected: March 20, 2025",
      icon: "🌾",
    },
    quality: {
      title: "Harvest Quality",
      value: "92%  Grade A",
      sub: "8% Grade B",
      icon: "⭐",
    },
    status: {
      title: "Status",
      value: "Planted",
      sub: "9 More Months to Go!",
      icon: "🌱",
    },
    task: {
      title: "Upcoming Tasks",
      value: "Plant",
      sub: "Next: Fertilization",
      icon: "📋",
    },
  };
  
  export default function StatCard({ type }: StatCardProps) {
    const data = cardData[type];
  
    return (
      <div className="bg-white border rounded-2xl shadow-sm p-4">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span className="text-lg">{data.icon}</span>
          {data.title}
        </div>
        <div className="text-xl font-bold text-gray-800 mt-1">{data.value}</div>
        <div className="text-xs text-gray-400 mt-0.5">{data.sub}</div>
      </div>
    );
  }