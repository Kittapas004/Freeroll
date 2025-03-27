const timeline = [
    { status: "Planted Completed", date: "08 Jun 12:20 PM", color: "green" },
    { status: "Record Fertilizer Completed", date: "20 Jun 14:25 PM", color: "green" },
    { status: "Harvesting Completed", date: "28 Sep 11:00 AM", color: "green" },
    { status: "Sample Sent to Lab", date: "2 Oct 12:30 PM", color: "blue" },
    { status: "Submitted to Factory", date: "28 Oct 10:30 AM", color: "gray" },
    { status: "Final Product Produced", date: "29 Nov 9:35 AM", color: "gray" },
  ];
  
  export default function HistoryTimeline() {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Turmeric History – Batch 001
        </div>
  
        <ul className="space-y-4 text-sm">
          {timeline.map((item, i) => (
            <li key={i} className="relative pl-6">
              <span
                className={`absolute left-0 top-1 w-3 h-3 rounded-full bg-${item.color}-500`}
              ></span>
              <div className="font-medium text-gray-800">{item.status}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  }