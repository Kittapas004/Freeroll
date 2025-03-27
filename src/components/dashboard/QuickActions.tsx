import { CheckCircle, PencilRuler, ShoppingBasket, FlaskConical } from "lucide-react";

const actions = [
  { icon: <CheckCircle className="w-5 h-5 text-green-600" />, label: "Planted" },
  { icon: <PencilRuler className="w-5 h-5 text-yellow-500" />, label: "Record Fertilizer" },
  { icon: <ShoppingBasket className="w-5 h-5 text-gray-600" />, label: "Record Harvest" },
  { icon: <FlaskConical className="w-5 h-5 text-blue-500" />, label: "Lab Submission" },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm h-fit">
      <div className="text-sm font-semibold text-gray-700 mb-2">Quick Action</div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            className="flex flex-col items-center gap-1 border rounded-xl py-3 hover:bg-gray-50"
          >
            {action.icon}
            <span className="text-xs text-gray-700 font-medium">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
