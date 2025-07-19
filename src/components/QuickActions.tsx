import { useRouter } from "next/navigation"
import { CheckCircle, PencilRuler, ShoppingBasket, FlaskConical, Zap } from "lucide-react";

interface QuickActionsProps {
  batchDoucumentId?: string;
  showHeader?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดง header
}

export default function QuickActions({ batchDoucumentId, showHeader = true }: QuickActionsProps) {
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
      {/* แสดง header เฉพาะเมื่อ showHeader เป็น true */}
      {showHeader && (
        <div className="flex items-center gap-2 mb-2">
          <Zap className="text-green-600" size={16} />
          <div className="text-sm font-bold text-green-700">Quick Action</div>
        </div>
      )}
      
      {/* แสดง header แบบเดิมเมื่อ showHeader เป็น false (สำหรับ backward compatibility) */}
      {!showHeader && (
        <div className="text-sm font-bold text-green-700 mb-2">Quick Action</div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            className="flex flex-col items-center gap-1 border rounded-xl py-3 hover:bg-gray-50 transition-colors"
            onClick={() => handleClick(action.path)}
          >
            {action.icon}
            <span className="text-xs text-gray-700 font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}