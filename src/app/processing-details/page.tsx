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
    Loader2,
    FileText
} from "lucide-react";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
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

            // Fetch factory processing records, farms, and user data
            const [processingResponse, farmsResponse, userResponse] = await Promise.all([
                fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate=factory_submission&filters[Processing_Status][$in][0]=Received&filters[Processing_Status][$in][1]=Processing', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                }),
                fetch('https://api-freeroll-production.up.railway.app/api/farms?populate=*', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                }),
                fetch('https://api-freeroll-production.up.railway.app/api/users/me?populate=factory', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                })
            ]);

            if (!processingResponse.ok || !farmsResponse.ok) {
                // Check for authentication errors
                if (processingResponse.status === 401 || farmsResponse.status === 401) {
                    console.error('❌ JWT token expired, redirecting to login');
                    localStorage.removeItem("jwt");
                    localStorage.removeItem("userId");
                    window.location.href = "/";
                    return;
                }
                throw new Error('Failed to fetch data');
            }

            const processingData = await processingResponse.json();
            const farmsData = await farmsResponse.json();
            const userData = userResponse.ok ? await userResponse.json() : null;
            
            console.log('✅ Processing data fetched:', processingData);
            console.log('✅ Farms data fetched:', farmsData);
            console.log('✅ User data fetched:', userData);
            console.log('🔍 All userData fields:', userData ? Object.keys(userData) : 'userData is null/undefined');
            console.log('🏭 Factory relation data:', userData?.factory);

            // Get factory name from user data - try factory relation first
            let factoryName = 'TurmeRic Processing Plant'; // default fallback
            
            if (userData) {
                if (userData.factory) {
                    console.log('🏭 Factory relation fields:', Object.keys(userData.factory));
                    // Try different possible factory field names
                    factoryName = userData.factory.Factory_Name || 
                                 userData.factory.name || 
                                 userData.factory.factory_name ||
                                 userData.factory.title ||
                                 userData.factory.company_name ||
                                 factoryName;
                } else {
                    // Fallback to other possible fields
                    factoryName = userData.Factory || 
                                 userData.factory || 
                                 userData.company || 
                                 userData.organization || 
                                 userData.factoryName ||
                                 userData.Company ||
                                 (userData.username ? `${userData.username} Processing Plant` : null) || 
                                 (userData.email ? userData.email.split('@')[0] + ' Processing Plant' : null) || 
                                 'TurmeRic Processing Plant';
                }
            }
            
            console.log('🏭 Factory name determined:', factoryName);

            // Create a farm lookup map
            const farmMap = new Map();
            farmsData.data.forEach((farm: any) => {
                console.log('🚜 Farm data structure:', farm);
                farmMap.set(farm.Farm_Name, farm);
            });
            
            console.log('📋 Available farms in map:', Array.from(farmMap.keys()));

            const formattedData: BatchData[] = processingData.data.map((item: any) => {
                console.log('🔍 Processing item:', item);
                console.log('🏭 Factory submission data:', item.factory_submission);
                console.log('🏭 factoryName fallback:', factoryName);
                
                // Get farm information from multiple sources
                let farmLocation = 'Unknown Location';
                let farmName = item.factory_submission?.Farm_Name || 'Unknown Farm';
                let cropType = 'Unknown'; 
                let farmerName = 'Unknown Farmer';
                let farmerContact = 'N/A';
                
                // Look up farm data for complete information
                let farmData = null;
                if (farmName && farmMap.has(farmName)) {
                    farmData = farmMap.get(farmName);
                    farmLocation = farmData.Farm_Address || farmLocation;
                    cropType = farmData.Crop_Type || cropType;
                    farmerName = farmData.Farmer_Name || item.factory_submission?.Farmer_Name || farmerName;
                    farmerContact = farmData.Contact || item.factory_submission?.Contact || farmerContact;
                } else if (item.factory_submission?.Farm_Address) {
                    // Fallback to factory submission data
                    farmLocation = item.factory_submission.Farm_Address;
                    farmerName = item.factory_submission.Farmer_Name || farmerName;
                    farmerContact = item.factory_submission.Contact || farmerContact;
                }
                
                return {
                    id: item.id.toString(),
                    documentId: item.documentId,
                    batchId: item.Batch_Id || `T-batch-${item.id}`,
                    farmName: farmName,
                    farmLocation: farmLocation,
                    crop: cropType,
                    cultivation: item.factory_submission?.Cultivation_Method || farmData?.Cultivation_Method || 'Unknown',
                    weight: parseFloat(item.factory_submission?.Weight || item.factory_submission?.Yield) || 500,
                    quality: item.factory_submission?.Quality_Grade || 'Grade A',
                    harvestDate: item.factory_submission?.Date || item.factory_submission?.createdAt || new Date().toISOString(),
                    testType: item.factory_submission?.Test_Type || 'Unknown',
                    status: item.Processing_Status || 'Received',
                    farmer: farmerName,
                    contact: farmerContact,
                    dateReceived: item.Date_Received || item.createdAt || new Date().toISOString(),
                    factory: item.Factory || factoryName
                };
            });

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
            case 'in progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'pending':
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'waiting':
            case 'received':
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
                                <Card key={batch.id} className="p-6 hover:shadow-lg transition-shadow">
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
                                            className="w-full mt-4 bg-gray-800 hover:bg-gray-900 active:bg-gray-950 hover:shadow-lg active:shadow-sm transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center gap-2 cursor-pointer"
                                            onClick={() => router.push(`/processing-details/${batch.documentId}`)}
                                        >
                                            <FileText className="w-4 h-4" />
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
