'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState, useEffect } from "react";
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
    Eye
} from "lucide-react";

interface HistoryData {
    id: string;
    documentId: string;
    batchId: string;
    farmName: string;
    weight: number;
    quality: string;
    dateProcessed: string;
    processedBy: string;
    outputCapsules: number;
    outputEssentialOil: number;
    turmericUsed: number;
    turmericRemaining: number;
    turmericWaste: number;
    status: string;
    factory: string;
}

export default function ProcessingHistoryPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [filteredData, setFilteredData] = useState<HistoryData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        batchId: "",
        farmName: "",
        factory: "",
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

            const response = await fetch('https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*&filters[Submission_status][$ne]=Waiting', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch processing history');
            }

            const data = await response.json();
            console.log('✅ Processing history fetched:', data);

            const formattedData: HistoryData[] = data.data.map((item: any) => ({
                id: item.id.toString(),
                documentId: item.documentId,
                batchId: item.Batch_id || `T-batch-${item.id}`,
                farmName: item.Farm_Name || 'Unknown Farm',
                weight: parseFloat(item.Yield) || 0,
                quality: item.Quality_Grade || 'Grade A',
                dateProcessed: item.Date_Processed || item.Date_Received || item.createdAt,
                processedBy: item.Processed_By || 'Factory Team',
                outputCapsules: parseInt(item.Output_Capsules) || 0,
                outputEssentialOil: parseFloat(item.Output_Essential_Oil) || 0,
                turmericUsed: parseFloat(item.Turmeric_Utilization_Used) || 0,
                turmericRemaining: parseFloat(item.Turmeric_Utilization_Remaining) || 0,
                turmericWaste: parseFloat(item.Turmeric_Utilization_Waste) || 0,
                status: item.Submission_status || 'Completed',
                factory: item.Factory || 'MFU'
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

    const handleSearch = () => {
        let filtered = [...historyData];

        if (filters.batchId) {
            filtered = filtered.filter(item => 
                item.batchId.toLowerCase().includes(filters.batchId.toLowerCase())
            );
        }
        if (filters.farmName) {
            filtered = filtered.filter(item => 
                item.farmName.toLowerCase().includes(filters.farmName.toLowerCase())
            );
        }
        if (filters.factory && filters.factory !== "all") {
            filtered = filtered.filter(item => item.factory === filters.factory);
        }
        if (filters.dateFrom) {
            filtered = filtered.filter(item => 
                new Date(item.dateProcessed) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            filtered = filtered.filter(item => 
                new Date(item.dateProcessed) <= new Date(filters.dateTo)
            );
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFilters({
            batchId: "",
            farmName: "",
            factory: "",
            dateFrom: "",
            dateTo: "",
        });
        setFilteredData(historyData);
        setCurrentPage(1);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getQualityColor = (quality: string) => {
        switch (quality.toLowerCase()) {
            case 'grade a':
                return 'text-green-600';
            case 'grade b':
                return 'text-yellow-600';
            case 'grade c':
                return 'text-orange-600';
            default:
                return 'text-gray-600';
        }
    };

    useEffect(() => {
        fetchHistoryData();
    }, []);

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-xl font-semibold">Processing History</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Search Filters */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Search Filters</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <Label htmlFor="batchId" className="text-sm font-medium">Batch ID</Label>
                                <Input
                                    id="batchId"
                                    placeholder="Enter batch ID"
                                    value={filters.batchId}
                                    onChange={(e) => setFilters({...filters, batchId: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label htmlFor="farmName" className="text-sm font-medium">Farm Name</Label>
                                <Input
                                    id="farmName"
                                    placeholder="Enter farm name"
                                    value={filters.farmName}
                                    onChange={(e) => setFilters({...filters, farmName: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label htmlFor="factory" className="text-sm font-medium">Factory</Label>
                                <Select
                                    value={filters.factory}
                                    onValueChange={(value) => setFilters({...filters, factory: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Factory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Factories</SelectItem>
                                        <SelectItem value="MFU">MFU</SelectItem>
                                        <SelectItem value="Lamduan">Lamduan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="dateFrom" className="text-sm font-medium">Date From</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateTo" className="text-sm font-medium">Date To</Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                        </div>
                    </Card>

                    {/* Processing History Table */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Processing History</h2>
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
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Batch ID</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Farm Name</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Weight</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Quality</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Date Processed</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Output</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4 font-medium">{item.batchId}</td>
                                                    <td className="py-3 px-4">{item.farmName}</td>
                                                    <td className="py-3 px-4">{item.weight} kg</td>
                                                    <td className={`py-3 px-4 font-medium ${getQualityColor(item.quality)}`}>
                                                        {item.quality}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {new Date(item.dateProcessed).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-xs">
                                                            {item.outputCapsules > 0 && (
                                                                <div>Capsules: {item.outputCapsules} packs</div>
                                                            )}
                                                            {item.outputEssentialOil > 0 && (
                                                                <div>Oil: {item.outputEssentialOil}L</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => console.log('View details for:', item.batchId)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
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
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
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
