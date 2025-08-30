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
    MapPin, 
    Calendar, 
    Weight, 
    Star,
    Factory as FactoryIcon,
    User,
    Clock,
    Loader2
} from "lucide-react";

interface BatchData {
    id: string;
    documentId: string;
    batchId: string;
    farmName: string;
    farmLocation: string;
    crop: string;
    cultivation: string;
    weight: number;
    quality: string;
    harvestDate: string;
    testType: string;
    status: string;
    farmer: string;
    contact: string;
    dateReceived: string;
    factory?: string;
}

export default function ProcessingDetailsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [batchData, setBatchData] = useState<BatchData[]>([]);
    const [filteredData, setFilteredData] = useState<BatchData[]>([]);
    const [filters, setFilters] = useState({
        batchId: "",
        farmName: "",
        testType: "",
        dateReceived: "",
    });

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem("sidebarOpen", String(!prev));
            return !prev;
        });
    };

    const fetchBatchData = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching batch data for Processing Details...');

            const response = await fetch('https://api-freeroll-production.up.railway.app/api/factory-submissions?populate=*', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch batch data');
            }

            const data = await response.json();
            console.log('✅ Batch data fetched:', data);

            const formattedData: BatchData[] = data.data.map((item: any) => ({
                id: item.id.toString(),
                documentId: item.documentId,
                batchId: item.Batch_id || `T-batch-${item.id}`,
                farmName: item.Farm_Name || 'Unknown Farm',
                farmLocation: item.Farm_Address || 'Unknown Location',
                crop: 'Turmeric',
                cultivation: item.Cultivation_Method || 'Organic',
                weight: parseFloat(item.Yield) || 0,
                quality: item.Quality_Grade || 'Grade A',
                harvestDate: item.Date || item.createdAt,
                testType: item.Test_Type || 'Curcuminoid',
                status: item.Submission_status || 'Waiting',
                farmer: item.Farmer_Name || 'Unknown Farmer',
                contact: item.Contact || 'N/A',
                dateReceived: item.Date_Received || item.createdAt,
                factory: item.Factory || 'MFU'
            }));

            setBatchData(formattedData);
            setFilteredData(formattedData);
        } catch (error) {
            console.error('❌ Error fetching batch data:', error);
            setBatchData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        let filtered = [...batchData];

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
        if (filters.testType && filters.testType !== "all") {
            filtered = filtered.filter(item => item.testType === filters.testType);
        }
        if (filters.dateReceived) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.dateReceived).toISOString().split('T')[0];
                return itemDate === filters.dateReceived;
            });
        }

        setFilteredData(filtered);
    };

    const handleReset = () => {
        setFilters({
            batchId: "",
            farmName: "",
            testType: "",
            dateReceived: "",
        });
        setFilteredData(batchData);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'waiting':
                return 'bg-blue-100 text-blue-800';
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
        fetchBatchData();
    }, []);

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-xl font-semibold">Processing Details</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Batch Information Search */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Batch Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                <Label htmlFor="dateReceived" className="text-sm font-medium">Date Received</Label>
                                <Input
                                    id="dateReceived"
                                    type="date"
                                    value={filters.dateReceived}
                                    onChange={(e) => setFilters({...filters, dateReceived: e.target.value})}
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
                                <Label htmlFor="testType" className="text-sm font-medium">Test Type</Label>
                                <Select
                                    value={filters.testType}
                                    onValueChange={(value) => setFilters({...filters, testType: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Curcuminoid Test" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tests</SelectItem>
                                        <SelectItem value="Curcuminoid">Curcuminoid Test</SelectItem>
                                        <SelectItem value="Moisture">Moisture Test</SelectItem>
                                        <SelectItem value="Quality">Quality Test</SelectItem>
                                    </SelectContent>
                                </Select>
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

                    {/* Batch Cards */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                            <span className="ml-2 text-gray-600">Loading batch data...</span>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
                            <p className="text-gray-500">No processing data matches your search criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredData.map((batch) => (
                                <Card key={batch.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">{batch.batchId}</h3>
                                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    <span>{batch.farmLocation}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                                                {batch.status}
                                            </span>
                                        </div>

                                        {/* Farm Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm">
                                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="font-medium">{batch.farmName}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Package className="w-4 h-4 mr-2 text-gray-400" />
                                                <span>{batch.crop} - {batch.cultivation}</span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="flex items-center text-gray-600">
                                                    <Weight className="w-4 h-4 mr-1" />
                                                    <span>{batch.weight} kg</span>
                                                </div>
                                                <div className={`flex items-center mt-1 ${getQualityColor(batch.quality)}`}>
                                                    <Star className="w-4 h-4 mr-1" />
                                                    <span className="font-medium">{batch.quality}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center text-gray-600">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    <span>{new Date(batch.harvestDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center text-gray-600 mt-1">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span>{batch.testType}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Factory Info */}
                                        {batch.factory && (
                                            <div className="flex items-center text-sm text-gray-600 pt-2 border-t">
                                                <FactoryIcon className="w-4 h-4 mr-2" />
                                                <span>Assigned to: {batch.factory}</span>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <Button 
                                            className="w-full mt-4 bg-gray-800 hover:bg-gray-900"
                                            onClick={() => console.log('Record details for:', batch.batchId)}
                                        >
                                            Record Details
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
