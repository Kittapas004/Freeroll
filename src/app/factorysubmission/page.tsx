'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";


export default function FactorySubmissionPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

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
                            <button className="px-4 py-2 border rounded">Reset</button>
                            <button className="px-4 py-2 rounded bg-green-600 text-white">Search</button>
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
                                <button className="bg-green-600 text-white px-4 py-2 rounded">Submit to Factory</button>
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
                                <tr className="border-b">
                                    <td className="py-2 px-2">T-Batch-001</td>
                                    <td className="py-2 px-2">Little Farm</td>
                                    <td className="py-2 px-2">Capsules: 1200 packs</td>
                                    <td className="py-2 px-2">50 Kg</td>
                                    <td className="py-2 px-2">
                                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                                            Completed
                                        </span>
                                    </td>
                                    <td className="py-2 px-2">All turmeric used efficiently.</td>
                                    <td className="py-2 px-2 text-center">
                                        <button className="text-blue-600 hover:underline flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-2">T-Batch-021</td>
                                    <td className="py-2 px-2">Little Farm 2</td>
                                    <td className="py-2 px-2">Capsules: 1200 packs</td>
                                    <td className="py-2 px-2">50 Kg</td>
                                    <td className="py-2 px-2">
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full">
                                            In process
                                        </span>
                                    </td>
                                    <td className="py-2 px-2">Awaiting final packaging</td>
                                    <td className="py-2 px-2 text-center">
                                        <button className="text-blue-600 hover:underline flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="flex justify-stared mt-4 gap-2">
                            <button className="w-8 h-8 rounded-full border flex items-center justify-center"> <ChevronLeft className="w-4 h-4" />  </button>
                            <button className="w-8 h-8 rounded-full border bg-green-600 text-white">1</button>
                            <button className="w-8 h-8 rounded-full border">2</button>
                            <button className="w-8 h-8 rounded-full border">3</button>
                            <button className="w-8 h-8 rounded-full border flex items-center justify-center"> <ChevronRight className="w-4 h-4" /> </button>
                        </div>
                    </div>

                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}