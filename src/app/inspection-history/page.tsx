'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Check, X, ChevronDown, MoreVertical, ChevronLeft, ChevronRight, Eye, FileText } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface InspectionRecord {
    id: string;
    batch_id: string;
    farm_name: string;
    date: string;
    status: string;
    inspector: string;
    curcumin_quality?: number;
    moisture_quality?: number;
    test_date?: string;
    inspector_notes?: string;
    harvest_date?: string;
    testing_method?: string;
    test_results_display?: {
        curcuminoids?: string | null;
        moisture?: string | null;
    };
}

export default function InspectionHistory() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All status");
    const [dateFilter, setDateFilter] = useState("Last 7 days");
    const [currentPage, setCurrentPage] = useState(1);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

    // State for API data
    const [inspections, setInspections] = useState<InspectionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalResults, setTotalResults] = useState(0);
    const [role, setRole] = useState<string | 'loading'>('loading');

    const router = useRouter();
    const resultsPerPage = 5;
    const ALLOWED_ROLES = ['Quality Inspection'];

    // Fetch inspection history data
    const fetchInspectionHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('=== Fetching Inspection History ===');

            // Get lab info first
            const labRes = await fetch(`https://popular-trust-9012d3ebd9.strapiapp.com/api/labs?documentId=${localStorage.getItem("userId")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            if (!labRes.ok) {
                throw new Error('Failed to get lab information');
            }

            const labData = await labRes.json();
            console.log('Lab Data:', labData);

            if (!labData.data || labData.data.length === 0) {
                throw new Error('No lab found for this user.');
            }

            const labId = labData.data[0].documentId;
            console.log('Lab ID:', labId);

            // Get lab submission records with populated data - simplified approach
            const recordsUrl = `https://popular-trust-9012d3ebd9.strapiapp.com/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&filters[lab][documentId][$eq]=${labId}`;
            console.log('Fetching records from:', recordsUrl);

            const recordsRes = await fetch(recordsUrl, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            if (!recordsRes.ok) {
                const errorText = await recordsRes.text();
                throw new Error(`Failed to load inspection records: ${recordsRes.status} - ${errorText}`);
            }

            const recordsData = await recordsRes.json();
            console.log('Records Data:', recordsData);

            if (!recordsData.data) {
                setInspections([]);
                setTotalResults(0);
                return;
            }
            // Process and map the records - อัพเดทเพื่อรองรับ HPLC
            const mappedInspections: InspectionRecord[] = await Promise.all(recordsData.data.map(async (record: any) => {
                const attrs = record.attributes || record;

                // Extract batch and farm info with multiple fallback methods
                let batchId = 'N/A';
                let farmName = 'Unknown Farm';

                if (attrs?.batch?.data?.attributes) {
                    const batchData = attrs.batch.data.attributes;
                    batchId = batchData?.Batch_id || 'N/A';

                    if (batchData?.Farm?.data?.attributes) {
                        farmName = batchData.Farm.data.attributes.Farm_Name || 'Unknown Farm';
                    }
                } else if (attrs?.batch?.data) {
                    batchId = attrs.batch.data?.Batch_id || 'N/A';
                    farmName = attrs.batch.data?.Farm?.Farm_Name || 'Unknown Farm';
                } else if (record?.batch) {
                    batchId = record.batch?.Batch_id || 'N/A';
                    farmName = record.batch?.Farm?.Farm_Name || 'Unknown Farm';
                }

                // If still no farm name, try to fetch batch separately
                if (farmName === 'Unknown Farm' && batchId !== 'N/A') {
                    console.log(`Fetching batch ${batchId} separately for farm name`);
                    try {
                        const batchRes = await fetch(`https://popular-trust-9012d3ebd9.strapiapp.com/api/batches?filters[Batch_id][$eq]=${batchId}&populate[Farm]=*`, {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                            },
                        });

                        if (batchRes.ok) {
                            const batchData = await batchRes.json();
                            if (batchData.data && batchData.data.length > 0) {
                                const batch = batchData.data[0];
                                if (batch.attributes?.Farm?.data?.attributes?.Farm_Name) {
                                    farmName = batch.attributes.Farm.data.attributes.Farm_Name;
                                }
                            }
                        }
                    } catch (batchError) {
                        console.warn('Could not fetch batch data separately:', batchError);
                    }
                }

                // ตรวจสอบ testing method และผลการทดสอบ
                const submissionStatus = attrs?.Submission_status || record?.Submission_status || 'Draft';
                const testingMethod = attrs?.testing_method || record?.testing_method || 'NIR Spectroscopy';

                console.log(`Processing record ${record.id}:`, {
                    submissionStatus,
                    testingMethod,
                    hplc_total_curcuminoids: attrs?.hplc_total_curcuminoids,
                    curcumin_quality: attrs?.curcumin_quality
                });

                // ดึงข้อมูลผลการทดสอบตาม testing method
                let hasTestResults = false;
                let curcuminValue = null;
                let moistureValue = null;
                let testResultsDisplay = null;
                let status = 'Failed'; // Default

                if (testingMethod === 'HPLC') {
                    // สำหรับ HPLC ใช้ข้อมูลจาก total_curcuminoids และ moisture_quantity
                    const hplcTotalCurcuminoids = attrs?.hplc_total_curcuminoids || record?.hplc_total_curcuminoids;
                    const hplcMoisture = attrs?.hplc_moisture_quantity || record?.hplc_moisture_quantity;

                    console.log(`HPLC Data for record ${record.id}:`, {
                        hplcTotalCurcuminoids,
                        hplcMoisture
                    });

                    if (hplcTotalCurcuminoids || hplcMoisture) {
                        hasTestResults = true;

                        // แปลงค่า total curcuminoids จาก mg/g เป็น % สำหรับการเปรียบเทียบ
                        if (hplcTotalCurcuminoids) {
                            curcuminValue = parseFloat(hplcTotalCurcuminoids) / 10; // mg/g to %
                        }

                        if (hplcMoisture) {
                            moistureValue = parseFloat(hplcMoisture);
                        }

                        // สร้าง display text สำหรับ HPLC
                        testResultsDisplay = {
                            curcuminoids: hplcTotalCurcuminoids ? `${hplcTotalCurcuminoids} mg/g` : null,
                            moisture: hplcMoisture ? `${hplcMoisture}%` : null
                        };
                    }
                } else {
                    // สำหรับ NIR/UV-Vis ใช้ข้อมูลเดิม
                    const standardCurcumin = attrs?.curcumin_quality || record?.curcumin_quality;
                    const standardMoisture = attrs?.moisture_quality || record?.moisture_quality;

                    if (standardCurcumin !== null || standardMoisture !== null) {
                        hasTestResults = true;
                        curcuminValue = standardCurcumin;
                        moistureValue = standardMoisture;

                        testResultsDisplay = {
                            curcuminoids: standardCurcumin ? `${standardCurcumin}%` : null,
                            moisture: standardMoisture ? `${standardMoisture}%` : null
                        };
                    }
                }

                // เฉพาะรายการที่เสร็จสิ้นและมีผลการทดสอบ
                if (submissionStatus === 'Completed' && hasTestResults) {
                    // กำหนดเกณฑ์การผ่าน
                    const curcuminThreshold = 3.0; // minimum 3% curcumin
                    const moistureThreshold = 15.0; // maximum 15% moisture

                    const curcuminPass = curcuminValue === null || curcuminValue >= curcuminThreshold;
                    const moisturePass = moistureValue === null || moistureValue <= moistureThreshold;

                    status = (curcuminPass && moisturePass) ? 'Passed' : 'Failed';

                    console.log(`Quality assessment for record ${record.id}:`, {
                        curcuminValue,
                        moistureValue,
                        curcuminPass,
                        moisturePass,
                        finalStatus: status
                    });
                } else {
                    // ข้ามรายการที่ไม่เสร็จสิ้นหรือไม่มีผลการทดสอบ
                    console.log(`Skipping record ${record.id}:`, {
                        reason: !hasTestResults ? 'No test results' : 'Not completed',
                        submissionStatus,
                        hasTestResults
                    });
                    return null;
                }

                // Get inspector name (simplified - using lab name or default)
                const inspector = labData.data[0]?.attributes?.Lab_Name || 'Lab Inspector';

                return {
                    id: record.id.toString(),
                    batch_id: batchId,
                    farm_name: farmName,
                    date: attrs?.test_date || record?.test_date || attrs?.createdAt || attrs?.Date || record?.createdAt,
                    status: status,
                    inspector: inspector,
                    curcumin_quality: curcuminValue,
                    moisture_quality: moistureValue,
                    test_date: attrs?.test_date || record?.test_date,
                    inspector_notes: attrs?.inspector_notes || record?.inspector_notes,
                    harvest_date: attrs?.harvest_record?.data?.attributes?.harvest_date || '',
                    testing_method: testingMethod,
                    test_results_display: testResultsDisplay
                };
            }));


            // Remove nulls from skipped records
            const filteredMappedInspections = mappedInspections.filter(Boolean) as InspectionRecord[];

            console.log('Mapped Inspections:', filteredMappedInspections);
            setInspections(filteredMappedInspections);
            setTotalResults(filteredMappedInspections.length);

        } catch (err) {
            console.error('Error fetching inspection history:', err);
            setError(err instanceof Error ? err.message : 'Failed to load inspection history');
        } finally {
            setLoading(false);
        }
    };

    // Filter inspections based on search and filters
    const filteredInspections = inspections.filter(inspection => {
        const matchesSearch = inspection.batch_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inspection.farm_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All status" || inspection.status === statusFilter;

        // Date filtering (simplified)
        let matchesDate = true;
        if (dateFilter !== "All time") {
            const inspectionDate = new Date(inspection.date);
            const now = new Date();

            // Reset time to start of day for accurate comparison
            now.setHours(23, 59, 59, 999);

            const daysAgo = {
                "Last 7 days": 7,
                "Last 30 days": 30,
                "Last 90 days": 90
            }[dateFilter];

            if (daysAgo) {
                const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
                cutoffDate.setHours(0, 0, 0, 0); // Set to start of cutoff day

                // Check if inspection date is valid and within range
                if (isNaN(inspectionDate.getTime())) {
                    matchesDate = false; // Invalid date
                } else {
                    matchesDate = inspectionDate >= cutoffDate && inspectionDate <= now;
                }

                console.log(`Date Filter Debug:`, {
                    filter: dateFilter,
                    daysAgo,
                    inspectionDate: inspectionDate.toLocaleDateString(),
                    cutoffDate: cutoffDate.toLocaleDateString(),
                    now: now.toLocaleDateString(),
                    matchesDate
                });
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Calculate pagination AFTER filteredInspections
    const totalPages = Math.ceil(filteredInspections.length / resultsPerPage);
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const currentPageData = filteredInspections.slice(startIndex, endIndex);

    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    // Handle view inspection details
    const handleViewInspection = (inspectionId: string) => {
        router.push(`/inspection-details/${inspectionId}`);
    };

    // Event handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setIsStatusDropdownOpen(false);
        setCurrentPage(1);
    };

    const handleDateFilter = (filter: string) => {
        setDateFilter(filter);
        setIsDateDropdownOpen(false);
        setCurrentPage(1);
    };

    // Check user role and fetch data
    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        setRole(userRole || '');
    }, []);

    useEffect(() => {
        if (role === 'loading') return;
        if (!ALLOWED_ROLES.includes(role)) {
            router.push('/unauthorized');
            return;
        }
        fetchInspectionHistory();
    }, [role]);

    // Auto-refresh data every 30 seconds
    // useEffect(() => {
    //     if (role !== 'loading' && ALLOWED_ROLES.includes(role)) {
    //         const interval = setInterval(() => {
    //             fetchInspectionHistory();
    //         }, 30000);

    //         return () => clearInterval(interval);
    //     }
    // }, [role]);

    if (role === 'loading' || loading) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                            <h1 className="text-2xl font-semibold text-gray-800">Quality Inspection History</h1>
                        </div>
                    </header>
                    <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading completed test results...</p>
                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (error) {
        return (
            <div className="flex h-full bg-gray-50">
                <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <AppSidebar />
                    <SidebarInset>
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-6">
                                <SidebarTrigger onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                                <h1 className="text-2xl font-semibold text-gray-800">Quality Inspection History</h1>
                            </div>
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="text-red-500 mb-4">
                                    <X size={48} />
                                </div>
                                <p className="text-red-600 font-medium mb-2">Error loading inspection history</p>
                                <p className="text-gray-500 mb-4">{error}</p>
                                <Button onClick={fetchInspectionHistory} variant="outline">
                                    Retry
                                </Button>
                            </div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-gray-50">
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <div className="p-5 overflow-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <SidebarTrigger onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                            <h1 className="text-2xl font-semibold text-gray-800">Quality Inspection History</h1>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-grow max-w-lg">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Search size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by batch ID or farm name..."
                                    className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                {/* Status Filter */}
                                <div className="relative">
                                    <button
                                        className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white w-full sm:w-40"
                                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                    >
                                        <span className="text-sm">{statusFilter}</span>
                                        <ChevronDown size={16} className="text-gray-500" />
                                    </button>
                                    {isStatusDropdownOpen && (
                                        <div className="absolute right-0 mt-1 w-full sm:w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                            <div className="py-1">
                                                {["All status", "Passed", "Failed"].map((status) => (
                                                    <button
                                                        key={status}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                        onClick={() => handleStatusFilter(status)}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Date Filter */}
                                <div className="relative">
                                    <button
                                        className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white w-full sm:w-40"
                                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                    >
                                        <span className="text-sm">{dateFilter}</span>
                                        <ChevronDown size={16} className="text-gray-500" />
                                    </button>
                                    {isDateDropdownOpen && (
                                        <div className="absolute right-0 mt-1 w-full sm:w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                            <div className="py-1">
                                                {["Last 7 days", "Last 30 days", "Last 90 days", "All time"].map((filter) => (
                                                    <button
                                                        key={filter}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                        onClick={() => handleDateFilter(filter)}
                                                    >
                                                        {filter}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Results Summary */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredInspections.length)} of {filteredInspections.length} inspections
                            </p>
                        </div>

                        {/* Recent Inspections */}
                        <Card className="overflow-hidden mb-4">
                            <div className="p-4 pb-2">
                                <h2 className="text-lg font-medium text-gray-800">Inspection History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Batch ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Farm Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Test Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Inspector
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Test Results
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentPageData.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <FileText size={48} className="text-gray-300 mb-2" />
                                                        <p>No inspection records found</p>
                                                        <p className="text-sm mt-1">Try adjusting your search criteria</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            currentPageData.map((inspection) => (
                                                <tr key={inspection.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {inspection.batch_id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {inspection.farm_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(inspection.date)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {inspection.status === "Passed" && (
                                                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                                <Check size={14} className="mr-1" /> Passed
                                                            </span>
                                                        )}
                                                        {inspection.status === "Failed" && (
                                                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                                                <X size={14} className="mr-1" /> Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {inspection.inspector}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {inspection.test_results_display ? (
                                                            <div className={inspection.status === "Failed" ? "text-red-600" : "text-gray-900"}>
                                                                {inspection.testing_method === 'HPLC' ? (
                                                                    // แสดงผลสำหรับ HPLC
                                                                    <>
                                                                        {inspection.test_results_display.curcuminoids && (
                                                                            <div>Curcuminoids: {inspection.test_results_display.curcuminoids}</div>
                                                                        )}
                                                                        {inspection.test_results_display.moisture && (
                                                                            <div>Moisture: {inspection.test_results_display.moisture}</div>
                                                                        )}
                                                                        <div className="text-xs text-gray-500 mt-1">Method: HPLC</div>
                                                                    </>
                                                                ) : (
                                                                    // แสดงผลสำหรับ NIR/UV-Vis
                                                                    <>
                                                                        {inspection.test_results_display.curcuminoids && (
                                                                            <div>Curcumin: {inspection.test_results_display.curcuminoids}</div>
                                                                        )}
                                                                        {inspection.test_results_display.moisture && (
                                                                            <div>Moisture: {inspection.test_results_display.moisture}</div>
                                                                        )}
                                                                        <div className="text-xs text-gray-500 mt-1">Method: {inspection.testing_method}</div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">No test results</span>
                                                        )}
                                                    </td>
                                                    <td className="pr-6 py-4 whitespace-nowrap text-sm ">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewInspection(inspection.id)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Eye size={16} className="mr-1" />
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination - แสดงเฉพาะเมื่อมีมากกว่า 1 หน้า */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                    <div className="text-sm text-gray-500">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i + 1}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPage === i + 1
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                                onClick={() => setCurrentPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}

                                        <button
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}