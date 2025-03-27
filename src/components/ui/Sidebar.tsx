import { Home, Leaf, Layers, Upload, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Leaf, label: "Farm Information", href: "/farm-info" },
  { icon: Layers, label: "Planting Batches", href: "/planting-batches" },
  { icon: Upload, label: "Factory Submission", href: "/factory-submission" },
  { icon: Settings, label: "Setting", href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col justify-between">
      <div>
        <div className="flex w-full max-w-sm flex-col gap-6 items-center">
          <Image src="/TurmeRic-logo.png" alt="logo" width={32} height={32} />
          {/* <span className="text-2xl font-bold text-green-600">TurmeRic</span> */}
        </div>

        <nav className="mt-6 space-y-2 px-4">
          {menuItems.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-green-100 text-gray-700 text-sm font-medium"
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Image
            src="/window.svg"
            alt="avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="text-sm">
            <p className="font-semibold leading-none">Kittapas Viriyappapaibool</p>
            <p className="text-gray-500 text-xs">LittleFarm@gmail.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
