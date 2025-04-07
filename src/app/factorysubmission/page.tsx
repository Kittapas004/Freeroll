'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";


export default function FactorySubmissionPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const router = useRouter();
    const batchId = "T-Batch-001"; // หรือให้ dynamic จาก map ก็ได้

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 1; // ต่อหน้าแสดงกี่รายการ (ลองใส่น้อย ๆ จะเห็นเปลี่ยนหน้าได้ชัดเจน)

    const feedbackData = [
        {
            id: "T-Batch-001",
            farm: "Little Farm",
            output: "Capsules: 1200 packs",
            remain: "50 Kg",
            status: "Completed",
            note: "All turmeric used efficiently.",
        },
        {
            id: "T-Batch-021",
            farm: "Little Farm 2",
            output: "Capsules: 1200 packs",
            remain: "50 Kg",
            status: "In process",
            note: "Awaiting final packaging",
        },
        // เพิ่มได้ตามต้องการ
    ];

    const totalPages = Math.ceil(feedbackData.length / itemsPerPage);
    const currentItems = feedbackData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem("sidebarOpen", String(!prev));
            return !prev;
        });
    };

    const batchData = [
        {
            id: "T-Batch-001",
            farm: "Little Farm",
            test: "Curcuminoid/ Moisture",
            grade: "A",
            yield: "2,450",
            date: "Jan 15, 2025",
            status: "Completed",
        },
        {
            id: "T-Batch-021",
            farm: "Little Farm 2",
            test: "-",
            grade: "A",
            yield: "1,500",
            date: "Jan 15, 2025",
            status: "Completed",
        },
    ];

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(batchData.map((item) => item.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
        );
    };

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-xl font-semibold">Factory Submission</h1>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4">
                    <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">Batch ID</label>
                            <input
                                type="text"
                                placeholder="Enter batch ID"
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Date of Result</label>
                            <input
                                type="date"
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Farm Name</label>
                            <select className="w-full border rounded px-3 py-2">
                                <option>All Farms</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Test Type</label>
                            <select className="w-full border rounded px-3 py-2">
                                <option>Curcuminoid Test</option>
                            </select>
                        </div>
                        <div className="col-span-full flex justify-end gap-2">
                            <button className="px-4 py-2 border rounded transition-colors hover:bg-gray-100">
                                Reset
                            </button>
                            <button className="px-4 py-2 rounded bg-green-600 text-white transition-colors hover:bg-green-700">
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-lg">Ready for Factory Submission</h2>
                            <a href="#" className="text-sm text-blue-600">View All</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-2">
                                            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                                        </th>
                                        <th className="text-left py-2 px-2">Batch ID</th>
                                        <th className="text-left py-2 px-2">Farm Name</th>
                                        <th className="text-left py-2 px-2">Test Type</th>
                                        <th className="text-left py-2 px-2">Quality Grade</th>
                                        <th className="text-left py-2 px-2">Yield</th>
                                        <th className="text-left py-2 px-2">Date of Result</th>
                                        <th className="text-left py-2 px-2">Status</th>
                                        <th className="text-left py-2 px-2">Choose Factory</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batchData.map((batch) => (
                                        <tr className="border-b" key={batch.id}>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(batch.id)}
                                                    onChange={() => handleSelectRow(batch.id)}
                                                />
                                            </td>
                                            <td className="px-2 py-2">{batch.id}</td>
                                            <td className="px-2 py-2">{batch.farm}</td>
                                            <td className="px-2 py-2">{batch.test}</td>
                                            <td className="px-2 py-2">{batch.grade}</td>
                                            <td className="px-2 py-2">{batch.yield}</td>
                                            <td className="px-2 py-2">{batch.date}</td>
                                            <td className="px-2 py-2 text-green-600">{batch.status}</td>
                                            <td className="px-2 py-2">
                                                <select className="border rounded px-2 py-1">
                                                    <option>Select Factory</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 text-right">
                                <button className="bg-green-600 text-white px-4 py-2 rounded transition-colors hover:bg-green-700">
                                    Submit to Factory
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="font-semibold text-lg mb-4">Recent Factory Feedback</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="py-2 px-2">Batch</th>
                                    <th className="py-2 px-2">Farm Name</th>
                                    <th className="py-2 px-2">Product Output</th>
                                    <th className="py-2 px-2">Remaining Turmeric</th>
                                    <th className="py-2 px-2">Status</th>
                                    <th className="py-2 px-2">Note</th>
                                    <th className="py-2 px-2 text-center"> </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-gray-500">
                                            No data on this page.
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-2 px-2">{item.id}</td>
                                            <td className="py-2 px-2">{item.farm}</td>
                                            <td className="py-2 px-2">{item.output}</td>
                                            <td className="py-2 px-2">{item.remain}</td>
                                            <td className="py-2 px-2">
                                                <span
                                                    className={`text-xs px-3 py-1 rounded-full ${item.status === "Completed"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2">{item.note}</td>
                                            <td className="py-2 px-2 text-center">
                                                <button
                                                    onClick={() => router.push(`/factorysubmission/${item.id}`)}
                                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>


                        </table>

                        <div className="flex justify-start mt-4 gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 rounded-full border flex items-center justify-center transition hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-full border transition ${currentPage === i + 1
                                        ? "bg-green-600 text-white"
                                        : "hover:bg-gray-100"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 rounded-full border flex items-center justify-center transition hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                    </div>

                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}