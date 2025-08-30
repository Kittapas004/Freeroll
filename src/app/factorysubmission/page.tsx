'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Factory } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React from "react";
import Link from "next/link";


export default function FactorySubmissionPage() {
    const [factorySubmissionData, setFactorySubmission] = useState<any[]>([]);
    const [feedbackData, setFeedbackData] = useState<any[]>([]);
    const [allbatchData, setAllBatchData] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        batchId: "",
        dateOfResult: "",
        farmName: "",
        qualityGrade: "",
    });
    const [factorySelections, setFactorySelections] = useState<{ [key: string]: string }>({});
    const [factories, setFactories] = useState<any[]>([]);

    const fetchFactories = async () => {
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factories?populate=*`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch factories");
            }
            const data = await response.json();
            setFactories(data.data.map((factory: any) => ({
                id: factory.id,
                documentId: factory.documentId,
                name: factory.Factory_Name || factory.name || 'Unknown Factory',
                location: factory.Location || 'Unknown Location',
                status: factory.Status || 'Active',
            })));
        } catch (error) {
            console.error("Error fetching factories:", error);
            setFactories([]); // Set empty array on error
        }
    };

    const fetchAllBatchData = async () => {
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch all batch data");
            }
            const data = await response.json();
            setAllBatchData(data.data.map((batch: any) => ({
                id: batch.Batch_id || `batch-${batch.id}`,
            })));
        }
        catch (error) {
            console.error("Error fetching all batch data:", error);
            setAllBatchData([]); // Set empty array on error
        }
    };
    const fetchFactoryData = async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append("filters[user_documentId][$eq]", localStorage.getItem("userId") || "");
            queryParams.append("filters[Submission_status][$eq]", "Waiting");

            if (filters.batchId) {
                queryParams.append("filters[Batch_id][$eq]", filters.batchId);
            }
            if (filters.dateOfResult) {
                queryParams.append("filters[Date][$eq]", filters.dateOfResult);
            }
            if (filters.farmName && filters.farmName !== "*") {
                queryParams.append("filters[Farm_Name][$eq]", filters.farmName);
            }
            if (filters.qualityGrade && filters.qualityGrade !== "*") {
                queryParams.append("filters[Quality_Grade][$eq]", filters.qualityGrade);
            }

            console.log("Query Params:", queryParams.toString());
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*&${queryParams.toString()}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch factory data");
            }

            const data = await response.json();
            setFactorySubmission(
                data.data.map((batch: any) => ({
                    id: batch.Batch_id || `batch-${batch.id}`,
                    documentId: batch.documentId,
                    farm: batch.Farm_Name || 'Unknown Farm',
                    test: batch.Test_Type || "-",
                    grade: batch.Quality_Grade || 'N/A',
                    yield: batch.Yield || 0,
                    date: batch.Date || batch.createdAt,
                    status: batch.Submission_status || 'Unknown',
                }))
            );
        } catch (error) {
            console.error("Error fetching batch data:", error);
            setFactorySubmission([]); // Set empty array on error
        }
    };

    const handleSubmitToFactory = async (documentId: string, factorySelection: string) => {
        if (!factorySelection) {
            alert("Please select a factory before submitting.");
            return;
        }
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions/${documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Submission_status: "Pending",
                        Factory: factorySelection,
                        Date_Received: new Date().toISOString(),
                    },
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to submit to factory");
            }
            await fetchFactoryData();
            alert("Submitted to factory successfully!");
        }
        catch (error) {
            console.error("Error submitting to factory:", error);
        }
    };
    type Farm = {
        id: number;
        documentId: string;
        Crop_Type: string;
        Cultivation_Method: string;
        Farm_Size_Unit: string;
        Farm_Status: string;
        Farm_Size: number;
        Farm_Address: string;
        Farm_Name: string;
    };
    const [farmdata, setFarmdata] = useState<Farm[]>([]);
    const fetchFarms = async () => {
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/farms?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch farms');
            }
            const data = await response.json();
            setFarmdata(data.data.map((farm: any) => ({
                id: farm.id,
                documentId: farm.documentId,
                Crop_Type: farm.Crop_Type || 'Unknown',
                Cultivation_Method: farm.Cultivation_Method || 'Unknown',
                Farm_Size_Unit: farm.Farm_Size_Unit || 'hectares',
                Farm_Size: farm.Farm_Size || 0,
                Farm_Address: farm.Farm_Address || 'Unknown',
                Farm_Status: farm.Farm_Status || 'Active',
                Farm_Name: farm.Farm_Name || 'Unknown Farm',
            })));
            return data;
        } catch (error) {
            console.error('Error fetching farms:', error);
            setFarmdata([]); // Set empty array on error
            return [];
        }
    };
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    const fetchFeedbackData = async () => {
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}&filters[Submission_status][$ne]=Waiting`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch feedback data");
            }
            const data = await response.json();
            setFeedbackData(
                data.data.map((item: any) => ({
                    id: item.Batch_id || `batch-${item.id}`,
                    documentId: item.documentId,
                    farm: item.Farm_Name || 'Unknown Farm',
                    output_capsules: item.Output_Capsules || 0,
                    output_essential_oil: item.Output_Essential_Oil || 0,
                    remain: item.Turmeric_Utilization_Remaining || 0,
                    unit: item.Unit || 'kg',
                    status: item.Submission_status || 'Unknown',
                    note: item.Note || '',
                }))
            );
        }
        catch (error) {
            console.error("Error fetching feedback data:", error);
            setFeedbackData([]); // Set empty array on error
        }
    };

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

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(factorySubmissionData.map((item) => item.documentId));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectRow = (documentId: string) => {
        setSelectedRows((prev) =>
            prev.includes(documentId) ? prev.filter((row) => row !== documentId) : [...prev, documentId]
        );
    };

    React.useEffect(() => {
        fetchFactories();
        fetchFarms();
        fetchAllBatchData();
        fetchFactoryData();
        fetchFeedbackData();
    }, []);

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
                            <Label className="text-sm font-medium block mb-1">Batch ID</Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Enter batch ID"
                                    className="w-full border rounded px-3 py-2"
                                    value={filters.batchId}
                                    onChange={(e) => {
                                        setFilters({ ...filters, batchId: e.target.value });
                                    }}
                                />
                                {filters.batchId && (
                                    <div className="absolute z-10 bg-white border rounded shadow mt-1 w-full max-h-40 overflow-y-auto">
                                        {Array.from(
                                            new Set(
                                                allbatchData
                                                    .filter((batch) =>
                                                        batch.id.toLowerCase().includes(filters.batchId.toLowerCase())
                                                    )
                                                    .map((batch) => batch.id)
                                            )
                                        ).map((uniqueBatchId) => (
                                            <div
                                                key={uniqueBatchId}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    setFilters({ ...filters, batchId: uniqueBatchId });
                                                }}
                                            >
                                                {uniqueBatchId}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium block mb-1">Date of Result</Label>
                            <Input
                                type="date"
                                className="w-full border rounded px-3 py-2"
                                value={filters.dateOfResult}
                                onChange={(e) => setFilters({ ...filters, dateOfResult: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium block mb-1">Farm Name</Label>
                            <Select
                                value={filters.farmName}
                                onValueChange={(value) => setFilters({ ...filters, farmName: value })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Farm" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="*">All Farms</SelectItem>
                                    {farmdata.map((farm) => (
                                        <SelectItem key={farm.id} value={farm.Farm_Name}>
                                            {farm.Farm_Name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium block mb-1">Quality Grade</Label>
                            <Select
                                value={filters.qualityGrade}
                                onValueChange={(value) => setFilters({ ...filters, qualityGrade: value })}
                            >
                                <SelectTrigger className="w-full border rounded px-3 py-2">
                                    <SelectValue placeholder="Select Quality Grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="*">All Grades</SelectItem>
                                    <SelectItem value="Grade A">Grade A</SelectItem>
                                    <SelectItem value="Grade B">Grade B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-full flex justify-end gap-2">
                            <button
                                className="px-4 py-2 border rounded transition-colors hover:bg-gray-100"
                                onClick={() => {
                                    setFilters({
                                        batchId: "",
                                        dateOfResult: "",
                                        farmName: "",
                                        qualityGrade: "",
                                    });
                                    fetchFactoryData(); // Reload data without filters
                                }}
                            >
                                Reset
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-green-600 text-white transition-colors hover:bg-green-700"
                                onClick={fetchFactoryData}
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-lg">Ready for Factory Submission</h2>
                            {factorySubmissionData.length > 0 && (
                                <span className="text-sm text-gray-600">
                                    {factorySubmissionData.length} batch{factorySubmissionData.length !== 1 ? 'es' : ''} waiting
                                </span>
                            )}
                        </div>
                        {factorySubmissionData.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Factory className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No batches ready for submission</h3>
                                <p className="text-gray-500 text-sm">
                                    Batches will appear here when they're ready to be sent to factories.
                                </p>
                            </div>
                        ) : (
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
                                            <th className="text-left py-2 px-2">Date</th>
                                            <th className="text-left py-2 px-2">Status</th>
                                            <th className="text-left py-2 px-2">Choose Factory</th>
                                        </tr>
                                    </thead>
                                <tbody>
                                    {factorySubmissionData.map((batch) => (
                                        <tr className="border-b" key={batch.documentId}>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(batch.documentId)}
                                                    onChange={() => handleSelectRow(batch.documentId)}
                                                />
                                            </td>
                                            <td className="px-2 py-2">{batch.id}</td>
                                            <td className="px-2 py-2">{batch.farm}</td>
                                            <td className="px-2 py-2">{batch.test}</td>
                                            <td className="px-2 py-2">{batch.grade}</td>
                                            <td className="px-2 py-2">{batch.yield} kg</td>
                                            <td className="px-2 py-2">
                                                {new Date(batch.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-2 py-2">
                                                <span className="text-blue-600 text-xs px-2 py-1 bg-blue-50 rounded">
                                                    {batch.status}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Select
                                                    value={factorySelections[batch.documentId] || ""}
                                                    onValueChange={(value) =>
                                                        setFactorySelections((prev) => ({
                                                            ...prev,
                                                            [batch.documentId]: value,
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger className="w-full border rounded px-2 py-1">
                                                        <SelectValue placeholder="Select Factory" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {factories.length > 0 ? (
                                                            factories.map((factory) => (
                                                                <SelectItem key={factory.documentId} value={factory.name}>
                                                                    {factory.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="no-factories" disabled>
                                                                No factories available
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 text-right">
                                <button 
                                    className="bg-green-600 text-white px-4 py-2 rounded transition-colors hover:bg-green-700 disabled:opacity-50"
                                    disabled={selectedRows.length === 0}
                                    onClick={() => {
                                        if (selectedRows.length === 0) {
                                            alert("Please select at least one batch to submit.");
                                            return;
                                        }
                                        
                                        const missingFactories = selectedRows.filter(documentId => !factorySelections[documentId]);
                                        if (missingFactories.length > 0) {
                                            alert("Please select a factory for all selected batches.");
                                            return;
                                        }
                                        
                                        selectedRows.forEach((documentId) => {
                                            const selectedFactory = factorySelections[documentId];
                                            handleSubmitToFactory(documentId, selectedFactory);
                                        });

                                        fetchFactoryData();
                                        setSelectedRows([]);
                                        setSelectAll(false);
                                        fetchFeedbackData();
                                    }}
                                >
                                    Submit to Factory ({selectedRows.length})
                                </button>
                            </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-lg">Recent Factory Feedback</h2>
                            {feedbackData.length > 0 && (
                                <span className="text-sm text-gray-600">
                                    {feedbackData.length} record{feedbackData.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        
                        {feedbackData.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ChevronRight className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No factory feedback yet</h3>
                                <p className="text-gray-500 text-sm">
                                    Factory feedback will appear here after batches are processed.
                                </p>
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="py-2 px-2">Batch</th>
                                            <th className="py-2 px-2">Farm Name</th>
                                            <th className="py-2 px-2">Product Output</th>
                                            <th className="py-2 px-2">Remaining Turmeric</th>
                                            <th className="py-2 px-2">Status</th>
                                            <th className="py-2 px-2">Note</th>
                                            <th className="py-2 px-2 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                {currentItems.length === 0 ? (
                                    <tr key="no-data">
                                        <td colSpan={7} className="text-center py-4 text-gray-500">
                                            No data on this page.
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => (
                                        <tr key={item.documentId} className="border-b">
                                            <td className="py-2 px-2">{item.id}</td>
                                            <td className="py-2 px-2">{item.farm}</td>
                                            <td className="py-2 px-2">
                                                {item.output_capsules || item.output_essential_oil
                                                    ? `${item.output_capsules ? `Capsules: ${item.output_capsules} packs` : ""} ${item.output_essential_oil ? `Essential Oil: ${item.output_essential_oil} liters` : ""}`.trim()
                                                    : "-"}</td>
                                            <td className="py-2 px-2">{item.remain && item.unit ? `${item.remain} ${item.unit}` : "-"}</td>
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
                                            <td className="py-2 px-2">{item.note ? `${item.note}` : "-"}</td>
                                            <td className="py-2 px-2 text-center">
                                                <Link href={`/factorysubmission/${item.documentId}`} key={item.documentId}>
                                                    {item.status === "Completed" && (
                                                        <button
                                                            onClick={() => router.push(`/factorysubmission/${item.id}`)}
                                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </Link>
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
                        </>
                        )}
                    </div>

                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}