'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Factory, Clock, CheckCircle, Package, Truck, AlertCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React from "react";


// Status badge component with icons
const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
        const statusLower = status.toLowerCase();

        if (statusLower.includes('completed') || statusLower.includes('finished') || statusLower.includes('export success')) {
            return {
                icon: CheckCircle,
                bgColor: 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200',
                textColor: 'text-green-800',
                iconColor: 'text-green-600',
                shadow: 'shadow-sm'
            };
        }
        
        if (statusLower.includes('processing') || statusLower.includes('in progress')) {
            return {
                icon: Package,
                bgColor: 'bg-gradient-to-r from-blue-100 to-blue-100  ',
                textColor: 'text-blue-800',
                iconColor: 'text-blue-600',
                shadow: 'shadow-sm'
            };
        }
        
        if (statusLower.includes('awaiting') || statusLower.includes('waiting') || statusLower.includes('pending')) {
            return {
                icon: Clock,
                bgColor: 'bg-gradient-to-r from-yellow-100 to-yellow-100 ',
                textColor: 'text-amber-800',
                iconColor: 'text-amber-600',
                shadow: 'shadow-sm'
            };
        }
        
        
        if (statusLower.includes('received') ) {
            return {
                icon: Truck,
                bgColor: 'bg-gradient-to-r from-indigo-100 to-blue-100 ',
                textColor: 'text-indigo-800',
                iconColor: 'text-indigo-600',
                shadow: 'shadow-sm'
            };
        }
        
        // Default for unknown status
        return {
            icon: AlertCircle,
            bgColor: 'bg-gradient-to-r from-gray-100 to-slate-100 border border-gray-200',
            textColor: 'text-gray-700',
            iconColor: 'text-gray-500',
            shadow: 'shadow-sm'
        };
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium cursor-default ${config.bgColor} ${config.textColor} ${config.shadow}`}>
            <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
            {status}
        </span>
    );
};

export default function FactorySubmissionPage() {
    const [factorySubmissionData, setFactorySubmission] = useState<any[]>([]);
    const [feedbackData, setFeedbackData] = useState<any[]>([]);
    const [allbatchData, setAllBatchData] = useState<any[]>([]);
    // ลบ exportedBatchData state ออก
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
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/batches?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`, {
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
            // Fetch factory submissions with status "Waiting" instead of ready-for-factory records
            console.log("Fetching factory submissions with Waiting status...");
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}&filters[Submission_status][$eq]=Waiting`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch factory submissions");
            }

            const data = await response.json();
            console.log("Factory submissions with Waiting status:", data.data);

            // Apply additional filters if provided
            let filteredRecords = data.data;

            if (filters.batchId) {
                filteredRecords = filteredRecords.filter((record: any) =>
                    record.Batch_id.includes(filters.batchId)
                );
            }

            if (filters.dateOfResult) {
                filteredRecords = filteredRecords.filter((record: any) =>
                    record.Date?.startsWith(filters.dateOfResult)
                );
            }

            if (filters.farmName && filters.farmName !== "*") {
                filteredRecords = filteredRecords.filter((record: any) =>
                    record.Farm_Name === filters.farmName
                );
            }

            // Transform data to match factory submission format
            const transformedData = filteredRecords.map((record: any) => ({
                id: record.Batch_id,
                documentId: record.documentId,
                farm: record.Farm_Name,
                test: record.Test_Type,
                grade: record.Quality_Grade,
                yield: record.Yield,
                date: record.Date,
                status: "Ready",
                factorySubmissionData: record, // เก็บข้อมูลเต็มไว้ใช้ตอนอัปเดต
            }));

            console.log("Final transformed data:", transformedData);
            setFactorySubmission(transformedData);
        } catch (error) {
            console.error("Error fetching factory submissions:", error);
            setFactorySubmission([]); // Set empty array on error
        }
    };

    const getFactoryName = (factoryDocumentId: string) => {
        const factory = factories.find(f => f.documentId === factoryDocumentId);
        return factory ? factory.name : 'Unknown Factory';
    };

    const handleSubmitToFactory = async (documentId: string, factorySelection: string) => {
        if (!factorySelection) {
            alert("Please select a factory before submitting.");
            return;
        }

        try {
            // Find the factory submission record
            const submissionRecord = factorySubmissionData.find(item => item.documentId === documentId);
            if (!submissionRecord || !submissionRecord.factorySubmissionData) {
                alert("Factory submission record not found.");
                return;
            }

            const submissionData = submissionRecord.factorySubmissionData;
            console.log("Updating factory submission:", submissionData);

            // Update factory submission status and factory selection
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions/${documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Submission_status: "Pending",
                        factory: factorySelection,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Factory submission update error response:", errorData);
                throw new Error(`Failed to update factory submission: ${response.status} - ${errorData}`);
            }

            const factorySubmissionResult = await response.json();
            console.log("Factory submission updated successfully:", factorySubmissionResult);

            // Create new Factory Processing record
            const processingResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Batch_Id: submissionData.Batch_id,
                        factory: factorySelection,
                        Date_Received: new Date().toISOString().split('T')[0],
                        Processing_Status: "Received",
                        factory_submission: documentId,
                    },
                }),
            });

            if (!processingResponse.ok) {
                const processingErrorData = await processingResponse.text();
                console.error("Factory processing creation error:", processingErrorData);
                throw new Error(`Failed to create factory processing record: ${processingResponse.status}`);
            }

            const processingResult = await processingResponse.json();
            console.log("Factory processing record created:", processingResult);

            // Update batch status
            if (submissionData.batch) {
                await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${submissionData.batch}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: {
                            Batch_Status: "Submitted to Factory",
                        },
                    }),
                });
            }

            await fetchFactoryData();
            await fetchFeedbackData(); // รีเฟรชข้อมูล feedback ด้วย
            alert("Submitted to factory successfully!");
        }
        catch (error: any) {
            console.error("Error submitting to factory:", error);
            const errorMessage = error.message || "Unknown error occurred";
            alert(`Failed to submit to factory: ${errorMessage}`);
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
            console.log("Fetching feedback data...");
            
            // Fetch factory processings with export history populated
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings?populate=factory_submission&populate=export_factory_history&filters[factory_submission][user_documentId][$eq]=${localStorage.getItem("userId")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Feedback fetch error:", response.status, errorText);
                throw new Error(`Failed to fetch feedback data: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Feedback data received:", data);
            
            // ตรวจสอบว่ามี data หรือไม่
            if (!data.data || !Array.isArray(data.data)) {
                console.warn("No data array found in response:", data);
                setFeedbackData([]);
                return;
            }
            
            // Transform data และเช็คสถานะจาก Processing_Status
            const transformedData = data.data.map((item: any) => {
                // ใช้ Processing_Status เป็นหลักในการกำหนดสถานะ (ไม่พึ่งพา export_factory_history)
                const processingStatus = item.Processing_Status || "Unknown";
                
                // กำหนด status ตาม Processing_Status
                let status = processingStatus;
                if (processingStatus === "Export Success") {
                    status = "Export Success";
                } else if (processingStatus === "Completed") {
                    status = "Awaiting Export";
                }

                // ใช้ Processing_Status เพื่อกำหนดว่าถูก export แล้วหรือไม่
                const hasExportHistory = processingStatus === "Export Success";

                console.log(`Processing item ${item.Batch_Id}:`, {
                    batchId: item.Batch_Id,
                    processing_status: processingStatus,
                    final_status: status,
                    hasExported: hasExportHistory
                });

                return {
                    id: item.Batch_Id || `batch-${item.id}`,
                    documentId: item.documentId,
                    farm: item.factory_submission?.Farm_Name || 'Unknown Farm',
                    product_output: item.output_quantity || 0,
                    product_type: item.final_product_type || 'Powder',
                    remaining_turmeric: item.remaining_stock || 0,
                    waste_turmeric: item.waste_quantity || 0,
                    unit: item.output_unit || 'kg',
                    status: status,
                    note: item.compliance_notes || item.inspection_notes || '',
                    hasExportHistory: hasExportHistory, // ใช้ Processing_Status แทน export_factory_history
                };
            });

            console.log("Transformed feedback data:", transformedData);
            setFeedbackData(transformedData);
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

    // Function สำหรับสร้าง pagination pages
    const getPaginationPages = () => {
        const pages = [];
        const maxVisiblePages = 7; // จำนวนหน้าสูงสุดที่จะแสดง
        
        if (totalPages <= maxVisiblePages) {
            // แสดงทุกหน้าถ้าจำนวนน้อย
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // แสดงแบบมีจุด ... ถ้าจำนวนมาก
            if (currentPage <= 4) {
                // ถ้าอยู่หน้าแรกๆ แสดง 1,2,3,4,5...สุดท้าย
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                // ถ้าอยู่หน้าท้ายๆ แสดง แรก...N-4,N-3,N-2,N-1,N
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // ถ้าอยู่ตรงกลาง แสดง 1...currentPage-1,currentPage,currentPage+1...สุดท้าย
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };


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
                                                    <div className="flex gap-2">
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
                                                                <SelectValue placeholder="Select Factory">
                                                                    {factorySelections[batch.documentId] ?
                                                                        getFactoryName(factorySelections[batch.documentId]) :
                                                                        "Select Factory"
                                                                    }
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {factories.length > 0 ? (
                                                                    factories.map((factory) => (
                                                                        <SelectItem key={factory.documentId} value={factory.documentId}>
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
                                                        <button
                                                            onClick={() => handleSubmitToFactory(batch.documentId, factorySelections[batch.documentId])}
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                                            disabled={!factorySelections[batch.documentId]}
                                                        >
                                                            Submit
                                                        </button>
                                                    </div>
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
                                            <th className="py-2 px-2">Waste Turmeric</th>
                                            <th className="py-2 px-2">Status</th>
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
                                                        {item.product_output && item.unit
                                                            ? `${item.product_output} ${item.unit} (${item.product_type || 'Powder'})`
                                                            : "-"}
                                                    </td>
                                                    <td className="py-2 px-2">{item.remaining_turmeric && item.unit ? `${item.remaining_turmeric} ${item.unit}` : "-"}</td>
                                                    <td className="py-2 px-2">{item.waste_turmeric && item.unit ? `${item.waste_turmeric} ${item.unit}` : "-"}</td>
                                                    <td className="py-2 px-2">
                                                        <StatusBadge status={item.status} />
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        {(item.status === "Export Success" ) && (
                                                            <button
                                                                onClick={() => router.push(`/processing-details/${item.documentId}`)}
                                                                className="text-blue-600 hover:underline flex items-center gap-1 mx-auto"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                View
                                                            </button>
                                                        )}
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

                                    {getPaginationPages().map((page, index) => {
                                        if (page === '...') {
                                            return (
                                                <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
                                                    ...
                                                </span>
                                            );
                                        }
                                        
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page as number)}
                                                className={`w-8 h-8 rounded-full border transition ${currentPage === page
                                                    ? "bg-green-600 text-white border-green-600"
                                                    : "hover:bg-gray-100 border-gray-300"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}

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