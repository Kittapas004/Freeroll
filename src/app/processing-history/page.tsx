'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Search,
    Package,
    Calendar,
    Weight,
    Star,
    Factory as FactoryIcon,
    User,
    Clock,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Eye
} from "lucide-react";

interface HistoryData {
    id: string;
    documentId: string;
    lotId: string;
    farmName: string;
    date: string;
    processor: string;
    productOutput: string;
    processMethod: string;
    status: string;
}

export default function ProcessingHistoryPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [filteredData, setFilteredData] = useState<HistoryData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All status");
    const [dateFilter, setDateFilter] = useState("Last 7 days");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [filters, setFilters] = useState({
        lotId: "",
        farmName: "",
        dateFrom: "",
        dateTo: "",
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentItems = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem("sidebarOpen", String(!prev));
            return !prev;
        });
    };

    const fetchHistoryData = async () => {
        try {
            setLoading(true);
            console.log('📋 Fetching processing history...');

            const response = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*&filters[Processing_Status][$eq]=Completed', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch processing history');
            }

            const data = await response.json();
            console.log('✅ Processing history fetched:', data);
            
            // Log sample item to check output_unit field
            if (data.data && data.data.length > 0) {
                console.log('🔍 Sample item fields:', {
                    final_product_type: data.data[0].final_product_type,
                    output_quantity: data.data[0].output_quantity,
                    output_unit: data.data[0].output_unit,
                    processing_method: data.data[0].processing_method
                });
            }

            const formattedData: HistoryData[] = data.data.map((item: any) => ({
                id: item.id.toString(),
                documentId: item.documentId,
                lotId: item.batch_lot_number || `T-Batch-${String(item.id).padStart(3, '0')}`,
                farmName: item.factory_submission?.Farm_Name || 'Lamine Yamal',
                date: new Date(item.processing_date_custom || item.Date_Received || item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                processor: item.operator_processor || 'Lamine Yamal',
                productOutput: (() => {
                    const productType = item.final_product_type || 'Powder';
                    const quantity = item.output_quantity || 0;
                    const unit = item.output_unit || 'kg'; // อ่านหน่วยจาก Strapi

                    // ใช้ข้อมูลจาก Strapi แทน if-else logic
                    return `${productType}: ${quantity} ${unit}`;
                })(),
                processMethod: item.processing_method || item.final_product_type || 'Processing',
                status: item.Processing_Status || 'Complete'
            }));

            setHistoryData(formattedData);
            setFilteredData(formattedData);
        } catch (error) {
            console.error('❌ Error fetching processing history:', error);
            setHistoryData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

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

    const handleReset = () => {
        setFilters({
            lotId: "",
            farmName: "",
            dateFrom: "",
            dateTo: "",
        });
        setFilteredData(historyData);
        setCurrentPage(1);
    };

    const handleViewDetails = (processingId: string) => {
        // Navigate to processing details page
        router.push(`/processing-details/${processingId}`);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'complete':
                return 'bg-green-100 text-green-800';
            case 'pending':
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    useEffect(() => {
        fetchHistoryData();
    }, []);

    // Filter data when search query or filters change
    useEffect(() => {
        let filtered = [...historyData];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.lotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.farmName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "All status") {
            filtered = filtered.filter(item => 
                item.status.toLowerCase() === statusFilter.toLowerCase() ||
                (statusFilter === "Complete" && item.status.toLowerCase() === "completed")
            );
        }

        // Date filter
        if (dateFilter !== "All time") {
            const now = new Date();
            now.setHours(23, 59, 59, 999);

            const daysAgo = {
                "Last 7 days": 7,
                "Last 30 days": 30,
                "Last 90 days": 90
            }[dateFilter];

            if (daysAgo) {
                const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
                cutoffDate.setHours(0, 0, 0, 0);

                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.date);
                    return itemDate >= cutoffDate && itemDate <= now;
                });
            }
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchQuery, statusFilter, dateFilter, historyData]);

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-xl font-semibold">Processing History</h1>
                    </div>

                </header>

                <main className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-grow max-w-lg">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Processing Results..."
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
                                            {["All status", "Complete", "Completed"].map((status) => (
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
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} processing records
                        </p>
                    </div>

                    {/* Processing History Table */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Recent Processing</h2>
                            <div className="text-sm text-gray-600">
                                Showing {currentItems.length} of {filteredData.length} entries
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                                <span className="ml-2 text-gray-600">Loading processing history...</span>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No processing history found</h3>
                                <p className="text-gray-500">No records match your search criteria.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Lot ID</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Processor</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Product Output</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Process Method</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4 font-medium">{item.lotId}</td>
                                                    <td className="py-3 px-4">{item.date}</td>
                                                    <td className="py-3 px-4">{item.processor}</td>
                                                    <td className="py-3 px-4">{item.productOutput}</td>
                                                    <td className="py-3 px-4">{item.processMethod}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                            ✓ {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="pr-6 py-4 whitespace-nowrap text-sm ">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(item.documentId || item.id)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Eye size={16} className="mr-1" />
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                        <div className="text-sm text-gray-600">
                                            Showing 1 to 10 of 97 results
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="w-8 h-8 p-0"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>

                                            {/* Page numbers */}
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700"
                                                >
                                                    1
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-8 h-8 p-0"
                                                    onClick={() => setCurrentPage(2)}
                                                >
                                                    2
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-8 h-8 p-0"
                                                    onClick={() => setCurrentPage(3)}
                                                >
                                                    3
                                                </Button>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="w-8 h-8 p-0"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
