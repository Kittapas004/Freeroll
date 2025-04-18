import { useRouter } from "next/navigation"
import { CheckCircle, PencilRuler, ShoppingBasket, FlaskConical } from "lucide-react";


interface QuickActionsProps {
  batchDoucumentId?: string
}

export default function QuickActions({ batchDoucumentId }: QuickActionsProps) {
  const actions = [
    { icon: <CheckCircle className="w-5 h-5 text-green-600" />, label: "Planted", path: `/plantingbatches`, },
    { icon: <PencilRuler className="w-5 h-5 text-yellow-500" />, label: "Record Fertilizer", path: `/plantingbatches/${batchDoucumentId}?fertilizer`, },
    { icon: <ShoppingBasket className="w-5 h-5 text-gray-600" />, label: "Record Harvest", path: `/plantingbatches/${batchDoucumentId}?harvest`, },
    { icon: <FlaskConical className="w-5 h-5 text-blue-500" />, label: "Lab Submission", path: `/plantingbatches/${batchDoucumentId}?lab`, },
  ];
  const router = useRouter()

  const handleClick = (path: string) => {
    if (path && path !== "#") {
      router.push(path)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm h-fit">
      <div className="text-sm font-bold text-green-700 mb-2">Quick Action</div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            className="flex flex-col items-center gap-1 border rounded-xl py-3 hover:bg-gray-50"
            onClick={() => handleClick(action.path)} // ✅ เพิ่ม onClick handler
          >
            {action.icon}
            <span className="text-xs text-gray-700 font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
