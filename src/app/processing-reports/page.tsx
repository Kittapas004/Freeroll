'use client'

import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, CheckCircle, ArrowRight, ArrowLeft, Send, Check, X } from "lucide-react";

function FileDownload({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

interface ProcessingRecord {
    id: string;
    documentId?: string | number;
    lotId: string;
    farmName: string;
    processor: string;
    productType: string;
    output: number;
    outputUnit: string;
    dateOfResult: string;
    status: string;
    exported?: boolean;
    exportStatus?: string;
}

interface ExportHistoryItem {
    id: string;
    lotId: string;
    exportedBy: string;
    exportType: string;
    date: string;
    status: string;
}

export default function ProcessingReportsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedFarm, setSelectedFarm] = useState("All Farms");
    const [selectedProductType, setSelectedProductType] = useState("All Types");
    const [lotIdFilter, setLotIdFilter] = useState("");
    const [processingDateFilter, setProcessingDateFilter] = useState("");

    // Data states
    const [completedData, setCompletedData] = useState<ProcessingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination states for Data Export section
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(2); // จำกัด 2 รายการต่อหน้า

    // Selected items for export
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Export history state
    const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
    const [exportHistorySearch, setExportHistorySearch] = useState("");

    // Filter export history in real time
    const filteredExportHistory: ExportHistoryItem[] = exportHistory.filter((item: ExportHistoryItem) => {
        const q = exportHistorySearch.toLowerCase();
        return (
            item.lotId?.toLowerCase().includes(q) ||
            item.exportedBy?.toLowerCase().includes(q) ||
            item.exportType?.toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q)
        );
    });

    const [exportedItemIds, setExportedItemIds] = useState<string[]>([]);

    // User state for factory user
    const [userName, setUserName] = useState<string>('Unknown User');

    // Fetch user data to get factory user name
    const fetchUserData = async () => {
        try {
            const response = await fetch('https://api-freeroll-production.up.railway.app/api/users/me?populate=*', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const user = await response.json();
            const username = user.username || user.email || 'Unknown User';
            setUserName(username);
            console.log("Factory User Name:", username);
        } catch (err) {
            console.error('Error fetching user data:', err);
            setUserName('Unknown User');
        }
    };

    // Fetch completed processing records
    const fetchCompletedRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('=== Fetching Processing Completed Records ===');

            const response = await fetch(
                `https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*&filters[Processing_Status][$eq]=Completed`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Failed to fetch records: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Raw API Data:', data);

            // Log sample item to check output_unit field
            if (data.data && data.data.length > 0) {
                console.log('🔍 Sample processing record fields:', {
                    final_product_type: data.data[0].final_product_type,
                    output_quantity: data.data[0].output_quantity,
                    output_unit: data.data[0].output_unit,
                    processing_method: data.data[0].processing_method
                });
            }

            if (!data.data || data.data.length === 0) {
                console.log('No completed processing records found');
                setCompletedData([]);
                return;
            }

            // Map the data to our interface
            const processedRecords: ProcessingRecord[] = data.data.map((item: any) => {
                const productType = item.final_product_type || 'Powder';
                const quantity = item.output_quantity || 0;
                const outputUnit = item.output_unit || 'kg'; // อ่านหน่วยจาก Strapi แทน if-else

                return {
                    id: item.id.toString(),
                    documentId: item.documentId,
                    lotId: item.batch_lot_number|| `Lot-${String(item.id).padStart(3, '0')}`,
                    farmName: item.factory_submission?.Farm_Name || 'Unknown Farm',
                    processor: item.operator_processor || userName,
                    productType: productType,
                    output: quantity, // ใช้ quantity แทน output
                    outputUnit: outputUnit,
                    dateOfResult: new Date(item.processing_date_custom || item.Date_Received || item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }),
                    status: 'Complete',
                    exported: false,
                    exportStatus: 'Not Exported'
                };
            });

            console.log('Processed records:', processedRecords);
            console.log('🔍 Sample processed record:', {
                productType: processedRecords[0]?.productType,
                output: processedRecords[0]?.output,
                outputUnit: processedRecords[0]?.outputUnit,
                formatted: processedRecords[0] ? formatProductOutput(
                    processedRecords[0].productType, 
                    processedRecords[0].output, 
                    processedRecords[0].outputUnit
                ) : 'N/A'
            });
            setCompletedData(processedRecords);

        } catch (err) {
            console.error('Error fetching completed records:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch processing records');
        } finally {
            setLoading(false);
        }
    };

    // Fetch export history
    const fetchExportHistory = async () => {
        try {
            console.log('Fetching export history...');

            const response = await fetch(
                `https://api-freeroll-production.up.railway.app/api/export-factory-histories?populate=*&sort=export_date:desc`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                    },
                }
            );

            if (!response.ok) {
                console.error('Failed to fetch export history');
                setExportHistory([]);
                return;
            }

            const data = await response.json();
            console.log('Export History Data:', data);

            if (!data.data) {
                setExportHistory([]);
                return;
            }

            // Map the data to our interface
            const mappedHistory: ExportHistoryItem[] = data.data.map((item: any) => ({
                id: item.id.toString(),
                lotId: item.lot_id || 'Unknown',
                exportedBy: item.exported_by || 'Unknown User',
                exportType: item.export_type || 'PDF Document',
                date: new Date(item.export_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                status: item.status_export || 'Export Success'
            }));

            setExportHistory(mappedHistory);
        } catch (err) {
            console.error('Error fetching export history:', err);
            setExportHistory([]);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchUserData();
        fetchCompletedRecords();
        fetchExportHistory();
    }, []);

    // Function to format product output with correct units from Strapi
    const formatProductOutput = (productType: string, quantity: number, unit: string): string => {
        // ใช้ข้อมูลจาก Strapi โดยตรง แทนการคำนวณ
        return `${productType}: ${quantity} ${unit}`;
    };

    // Get unique farm names for dropdown
    const uniqueFarmNames = [...new Set(completedData.map(item => item.farmName))];

    // Get unique product types for dropdown
    const uniqueProductTypes = [...new Set(completedData.map(item => item.productType))];
    
    // Filter data based on search criteria
    const filteredData = completedData.filter((item: ProcessingRecord) => {
        // Farm name match
        const farmMatch = selectedFarm === "All Farms" || item.farmName === selectedFarm;
        
        // Product type match - use actual productType field
        const productTypeMatch = selectedProductType === "All Types" || item.productType === selectedProductType;
        
        // Lot ID match
        const lotMatch = !lotIdFilter || item.lotId.toLowerCase().includes(lotIdFilter.toLowerCase());
        
        // Date match - compare dates properly
        let dateMatch = true;
        if (processingDateFilter) {
            try {
                const filterDate = new Date(processingDateFilter);
                const itemDate = new Date(item.dateOfResult);
                // Compare only the date part (ignore time)
                dateMatch = filterDate.toDateString() === itemDate.toDateString();
            } catch (error) {
                console.error('Date comparison error:', error);
                dateMatch = item.dateOfResult.includes(processingDateFilter);
            }
        }

        return farmMatch && productTypeMatch && lotMatch && dateMatch;
    }).sort((a, b) => {
        // Sort by date (newest first)
        return new Date(b.dateOfResult).getTime() - new Date(a.dateOfResult).getTime();
    });

    // Update filtered data when filters change
    useEffect(() => {
        // Reset pagination when filters change
        setCurrentPage(1);
        // Clear selection when filtering
        setSelectedItems([]);
        setSelectAll(false);
    }, [lotIdFilter, selectedFarm, selectedProductType, processingDateFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handle checkbox changes
    const handleSelectItem = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedData.map(item => item.id));
        }
        setSelectAll(!selectAll);
    };

    // Export data function
    const handleExportData = async () => {
        if (selectedItems.length === 0) {
            alert('Please select at least one item to export');
            return;
        }

        try {
            const selectedBatchesData = completedData.filter((item: ProcessingRecord) => selectedItems.includes(item.id));

            // Create export data
            const exportData = selectedBatchesData.map((item: ProcessingRecord) => ({
                lotId: item.lotId,
                farmName: item.farmName,
                processor: item.processor,
                output: formatProductOutput(item.productType, item.output, item.outputUnit),
                dateOfResult: item.dateOfResult,
                status: item.status,
            }));

            const lotNames = selectedBatchesData.map((item: ProcessingRecord) => item.lotId).join(', ');

            // Save export history to API
            const exportHistoryData = {
                data: {
                    lot_id: lotNames,
                    exported_by: userName, // Use actual factory user name
                    export_type: 'PDF Document',
                    export_date: new Date().toISOString(),
                    status_export: 'Export Success',
                    // factory_processings: selectedItems.map(id => parseInt(id))
                }
            };

            const saveResponse = await fetch(
                `https://api-freeroll-production.up.railway.app/api/export-factory-histories`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                    },
                    body: JSON.stringify(exportHistoryData),
                }
            );

            if (saveResponse.ok) {
                console.log('Export history saved successfully');
                // Refresh export history to show the new record
                fetchExportHistory();
            } else {
                console.error('Failed to save export history');
            }

            // Mark items as exported
            setExportedItemIds(prev => [...prev, ...selectedItems]);

            // Clear selection
            setSelectedItems([]);
            setSelectAll(false);

            console.log('Export successful:', exportData);
            alert('Export completed successfully!');

        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        }
    };

    // Clear export history
    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear all export history? This action cannot be undone.')) {
            return;
        }

        try {
            // First, fetch all export history records to get their documentIds
            const response = await fetch(
                `https://api-freeroll-production.up.railway.app/api/export-factory-histories?populate=*`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch export history: ${response.status}`);
            }

            const data = await response.json();
            console.log('Records to delete:', data);

            if (!data.data || data.data.length === 0) {
                alert('No export history records found to delete.');
                return;
            }

            // Delete each record individually using documentId
            let deletedCount = 0;
            let failedCount = 0;

            for (const item of data.data) {
                try {
                    // Try deleting with documentId first, then fall back to id
                    const deleteId = item.documentId || item.id;
                    
                    // Try multiple endpoint formats
                    const endpoints = [
                        `https://api-freeroll-production.up.railway.app/api/export-factory-histories/${deleteId}`,
                        `https://api-freeroll-production.up.railway.app/api/export-factory-history/${deleteId}`,
                    ];

                    let deleteSuccess = false;

                    for (const endpoint of endpoints) {
                        try {
                            const deleteResponse = await fetch(endpoint, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                                },
                            });

                            if (deleteResponse.ok) {
                                deletedCount++;
                                deleteSuccess = true;
                                console.log(`Successfully deleted record: ${deleteId} using ${endpoint}`);
                                break;
                            } else {
                                console.log(`Failed to delete using ${endpoint}: ${deleteResponse.status}`);
                            }
                        } catch (endpointError) {
                            console.log(`Error with endpoint ${endpoint}:`, endpointError);
                        }
                    }

                    if (!deleteSuccess) {
                        failedCount++;
                        console.error(`Failed to delete record ${deleteId} with all endpoints`);
                    }

                } catch (deleteError) {
                    failedCount++;
                    console.error(`Error deleting record ${item.documentId || item.id}:`, deleteError);
                }
            }

            // Clear local state
            setExportHistory([]);
            setExportHistorySearch("");

            // Show result message
            if (deletedCount > 0 && failedCount === 0) {
                alert(`Export history cleared successfully! ${deletedCount} records deleted.`);
            } else if (deletedCount > 0 && failedCount > 0) {
                alert(`Partially cleared export history. ${deletedCount} records deleted, ${failedCount} failed.`);
            } else {
                alert('Failed to clear export history. Please check console for details and verify your delete permissions in Strapi.');
            }

            // Refresh the export history data
            fetchExportHistory();

        } catch (error) {
            console.error('Error clearing export history:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Failed to clear export history: ${errorMessage}`);
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setLotIdFilter("");
        setSelectedFarm("All Farms");
        setSelectedProductType("All Types");
        setProcessingDateFilter("");
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
                            <h1 className="text-2xl font-semibold text-gray-800">
                                Reports & Data Export
                            </h1>
                        </div>
                    </header>
                    <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading processing data...</p>
                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (error) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
                            <h1 className="text-2xl font-semibold text-gray-800">
                                Reports & Data Export
                            </h1>
                        </div>
                    </header>
                    <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                            <div className="text-center text-red-600">
                                <X size={48} className="mx-auto mb-4" />
                                <p className="font-medium mb-2">Error loading data</p>
                                <p className="text-sm">{error}</p>
                                <button
                                    onClick={fetchCompletedRecords}
                                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                {/* Header */}
                <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Reports & Data Export
                        </h1>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                    <div className="mx-auto space-y-6">

                        {/* Search Filters Section */}
                        <div className="bg-white rounded-md shadow-sm p-6">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                {/* Lot ID Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lot ID</label>
                                    <input
                                        type="text"
                                        placeholder="Enter lot ID"
                                        value={lotIdFilter}
                                        onChange={(e) => setLotIdFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                {/* Processing Date Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Processing Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={processingDateFilter}
                                            onChange={(e) => setProcessingDateFilter(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                                {/* Farm Name Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                                    <div className="relative">
                                        <select
                                            value={selectedFarm}
                                            onChange={(e) => setSelectedFarm(e.target.value)}
                                            className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="All Farms">All Farms</option>
                                            {uniqueFarmNames.map((farmName) => (
                                                <option key={farmName} value={farmName}>
                                                    {farmName}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                {/* Product Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                                    <div className="relative">
                                        <select
                                            value={selectedProductType}
                                            onChange={(e) => setSelectedProductType(e.target.value)}
                                            className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="All Types">All Types</option>
                                            {uniqueProductTypes.map((productType) => (
                                                <option key={productType} value={productType}>
                                                    {productType}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex justify-end space-x-2">
                                <button
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => {
                                        // Force re-filter by triggering pagination reset
                                        setCurrentPage(1);
                                        setSelectedItems([]);
                                        setSelectAll(false);
                                    }}
                                    className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center hover:bg-green-600"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Data Export Section */}
                        <div className="bg-white rounded-md shadow-sm p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-lg font-medium">Data Export</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {filteredData.length === completedData.length 
                                            ? `Total ${completedData.length} records`
                                            : `Found ${filteredData.length} of ${completedData.length} records`
                                        }
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExportData}
                                        disabled={selectedItems.length === 0}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <FileDownload className="w-4 h-4 mr-2" />
                                        Export Data
                                    </button>
                                </div>
                            </div>

                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr className="text-left text-sm font-medium text-gray-700 border-b">
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output (kg/units)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Result</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                No processing records found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => handleSelectItem(item.id)}
                                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.lotId}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{item.farmName}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{item.processor}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{formatProductOutput(item.productType, item.output, item.outputUnit)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {new Date(item.dateOfResult).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>


                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>

                                        <span className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Export History - Added more top margin for better spacing */}
                        <div className="bg-white rounded-md shadow-sm">
                            <div className="p-6 border-b">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-800">Recent Export History</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleClearHistory}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                        >
                                            Clear History
                                        </button>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search batches..."
                                                value={exportHistorySearch}
                                                onChange={(e) => setExportHistorySearch(e.target.value)}
                                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-48"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exported By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Export Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredExportHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                No export history found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExportHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.lotId}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{item.exportedBy}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{item.exportType}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{item.date}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <Send className="w-3 h-3 mr-1" />
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
