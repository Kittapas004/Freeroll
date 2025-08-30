'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Circle, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as React from "react";
import { useRouter } from "next/navigation";

export default function PlantingBatchesPage() {

    const router = useRouter();
    const [role, setRole] = React.useState<string | "loading">("loading");
    const [farmdata, setFarmdata] = useState<Farm[]>([]);
    const [plantVariety, setPlantVariety] = useState("");
    const [plantingDate, setPlantingDate] = useState("");
    const [cultivationMethod, setCultivationMethod] = useState<string | undefined>();
    const [location, setLocation] = useState<string | undefined>();
    const [plantingbatches, setPlantingBatches] = useState<PlantingBatch[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [status] = useState("Pending Actions");
    const [selectedFarm, setSelectedFarm] = useState<Farm | undefined>();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [previewBatchId, setPreviewBatchId] = useState("");
    const [currentStep, setCurrentStep] = useState(1); // เพิ่ม state สำหรับขั้นตอน
    
    // เพิ่ม state สำหรับฟิลด์ใหม่
    const [soilPH, setSoilPH] = useState("");
    const [soilQuality, setSoilQuality] = useState("");
    const [waterSource, setWaterSource] = useState<string | undefined>();
    const [laborCost, setLaborCost] = useState(0);
    const [materialCost, setMaterialCost] = useState(0);
    const [otherCosts, setOtherCosts] = useState(0);

    // Function to check and update expired batches
    const checkAndUpdateExpiredBatches = async () => {
        try {
            // Fetch all "Completed Successfully" batches
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/batches?filters[Batch_Status][$eq]=Completed Successfully&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (!response.ok) return;

            const data = await response.json();
            const currentTime = new Date().getTime();
            const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds

            // Check each batch and update if expired
            for (const batch of data.data) {
                let shouldUpdate = false;
                
                // If no completion_timestamp, it's old data - update immediately
                if (!batch.completion_timestamp) {
                    console.log(`Old completed batch ${batch.Batch_id} without timestamp detected, updating to 'Completed Past Data'`);
                    shouldUpdate = true;
                } else {
                    // Check if 10 minutes have passed since completion
                    const completionTime = new Date(batch.completion_timestamp).getTime();
                    if (currentTime - completionTime >= tenMinutesInMs) {
                        console.log(`Batch ${batch.Batch_id} has expired (10+ minutes), updating to 'Completed Past Data'`);
                        shouldUpdate = true;
                    }
                }

                if (shouldUpdate) {
                    await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${batch.documentId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                        },
                        body: JSON.stringify({
                            data: {
                                Batch_Status: "Completed Past Data",
                            },
                        }),
                    });
                }
            }
            
            // Refresh the batches list after updates
            await fetchPlantingBatches();
        } catch (error) {
            console.error("Error checking/updating expired batches:", error);
        }
    };

    React.useEffect(() => {
        const userRole = localStorage.getItem("userRole");
        setRole(userRole || "");
    }, []);

    React.useEffect(() => {
        if (role === "loading") return;

        if (role !== "Farmer") {
            router.push("/unauthorized");
        }
    }, [role, router]);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem('sidebarOpen', String(!prev));
            return !prev;
        });
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

    type PlantingBatch = {
        Batch_id: string;
        documentId: string;
        Date_of_Planting: string;
        Plant_Variety: string;
        Farm_documentId: string;
        Farm_Name: string;
        Farm_Status: string;
        Farm_Cultivation_Method: string;
        Batch_Status: string;
        Batch_image: string;
        Soil_pH?: number;
        Soil_Quality?: string;
        Water_Source?: string;
        Labor_Cost?: number;
        Material_Cost?: number;
        Other_Costs?: number;
        Total_Planting_Cost?: number;
    };

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
                Crop_Type: farm.Crop_Type,
                Cultivation_Method: farm.Cultivation_Method,
                Farm_Size_Unit: farm.Farm_Size_Unit,
                Farm_Size: farm.Farm_Size,
                Farm_Address: farm.Farm_Address,
                Farm_Status: farm.Farm_Status,
                Farm_Name: farm.Farm_Name,
            })));
            return data;
        } catch (error) {
            console.error('Error fetching farms:', error);
            return [];
        }
    };

    const uploadDefaultImage = async (jwt: string): Promise<number | null> => {
        try {
            // สร้าง FormData สำหรับอัพโหลดรูป default
            const formData = new FormData();

            // ใช้ fetch เพื่อดึงไฟล์ batch1.png จาก public folder
            const response = await fetch('/batch1.png');
            if (!response.ok) {
                console.error('Default image not found');
                return null;
            }

            const blob = await response.blob();
            const file = new File([blob], 'batch1.png', { type: 'image/png' });

            formData.append("files", file);

            const uploadRes = await fetch("https://api-freeroll-production.up.railway.app/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
                body: formData,
            });

            if (!uploadRes.ok) {
                console.error('Failed to upload default image');
                return null;
            }

            const uploadData = await uploadRes.json();
            console.log('✅ Default image uploaded successfully:', uploadData[0]?.id);
            return uploadData[0]?.id || null;
        } catch (error) {
            console.error('Error uploading default image:', error);
            return null;
        }
    };

    const getBatchImageUrl = (batchImage: any) => {
        if (!batchImage) return "/batch1.png"; // fallback เป็นรูป default

        // ลองหลายรูปแบบของ Strapi structure
        const possibleUrls = [
            batchImage.url,                                    // Direct URL
            batchImage.data?.attributes?.url,                  // Strapi v4 structure  
            batchImage.data?.attributes?.formats?.medium?.url, // Medium format
            batchImage.data?.attributes?.formats?.small?.url,  // Small format
        ];

        const validUrl = possibleUrls.find(url => url);

        if (validUrl) {
            // ตรวจสอบว่าเป็น full URL หรือไม่
            if (validUrl.startsWith('http')) {
                return validUrl;
            } else {
                return `https://api-freeroll-production.up.railway.app${validUrl}`;
            }
        }

        return "/batch1.png"; // fallback เป็นรูป default
    };

    const fetchPlantingBatches = async () => {
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/batches?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}&sort=Batch_id:asc`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch planting batches');
            }
            const data = await response.json();

            // เรียงลำดับตาม Batch_id (T-Batch-001, T-Batch-002, T-Batch-003, ...)
            const sortedBatches = data.data.sort((a: any, b: any) => {
                const getNumber = (batchId: string) => {
                    const match = batchId.match(/T-Batch-(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                };
                return getNumber(a.Batch_id) - getNumber(b.Batch_id);
            });

            setPlantingBatches(
                sortedBatches.map((batch: any) => ({
                    Batch_id: batch.Batch_id,
                    documentId: batch.documentId,
                    Date_of_Planting: batch.Date_of_Planting,
                    Plant_Variety: batch.Plant_Variety,
                    Farm_documentId: batch.Farm.documentId,
                    Farm_Status: batch.Farm.Farm_Status,
                    Farm_Name: batch.Farm.Farm_Name,
                    Farm_Cultivation_Method: batch.Farm.Cultivation_Method,
                    Batch_Status: batch.Batch_Status,
                    Batch_image: getBatchImageUrl(batch.Batch_image),
                }))
            );
            return data;
        } catch (error) {
            console.error('Error fetching planting batches:', error);
            return [];
        }
    };

    const fetchAllBatchesForIDGeneration = async () => {
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/batches`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch all batches');
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching all batches:', error);
            return [];
        }
    };

    const getDisplayStatus = (batchStatus: string): string => {
        switch (batchStatus) {
            case "Pending Actions":
                return "Planted";
            case "Completed Successfully":
            case "Completed Past Data":
                return "End Planted";
            default:
                return "Planted";
        }
    };

    const getCircleColor = (batchStatus: string): string => {
        switch (batchStatus) {
            case "Completed Successfully":
                return "text-green-600 fill-green-600";
            case "Pending Actions":
                return "text-yellow-600 fill-yellow-600";
            case "Completed Past Data":
                return "text-gray-600 fill-gray-600";
            default:
                return "text-red-600 fill-red-600";
        }
    };

    const generateNewBatchId = async () => {
        const allBatches = await fetchAllBatchesForIDGeneration();

        const maxBatchNumber = allBatches.reduce((max: number, batch: any) => {
            const match = batch.Batch_id?.match(/T-Batch-(\d+)/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);

        return `T-Batch-${String(maxBatchNumber + 1).padStart(3, "0")}`;
    };

    const [isAddingBatch, setIsAddingBatch] = useState(false);

    // Functions สำหรับจัดการ steps
    const handleNext = () => {
        // ตรวจสอบข้อมูลของ step 1
        if (!plantingDate || !plantVariety?.trim() || !cultivationMethod || !location || !selectedFarm || !soilPH || !soilQuality?.trim() || !waterSource) {
            alert("Please fill in all required fields");
            return;
        }
        setCurrentStep(2);
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleCancel = () => {
        setIsDialogOpen(false);
        setCurrentStep(1);
        // รีเซ็ตฟอร์ม
        setImagePreview(null);
        setPlantingDate("");
        setPlantVariety("");
        setCultivationMethod(undefined);
        setLocation(undefined);
        setSelectedFarm(undefined);
        setSoilPH("");
        setSoilQuality("");
        setWaterSource(undefined);
        setLaborCost(0);
        setMaterialCost(0);
        setOtherCosts(0);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleAddBatch = async () => {
        // ป้องกันการเรียกซ้ำถ้ากำลัง process อยู่
        if (isAddingBatch) return;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!plantingDate || !plantVariety?.trim() || !cultivationMethod || !location || !selectedFarm || !soilPH || !soilQuality?.trim() || !waterSource) {
            alert("Please fill in all required fields");
            return;
        }

        setIsAddingBatch(true); // เริ่ม loading

        try {
            const jwt = localStorage.getItem("jwt");
            const userId = localStorage.getItem("userId");

            if (!jwt || !userId || !selectedFarm) {
                console.error("Missing required data");
                return;
            }

            let imageId = null;

            // ตรวจสอบว่ามีการเลือกรูปใหม่หรือไม่
            if (imageInputRef.current?.files?.[0]) {
                // ถ้ามีการเลือกรูปใหม่ ให้อัพโหลดรูปนั้น
                const formData = new FormData();
                formData.append("files", imageInputRef.current.files[0]);

                const uploadRes = await fetch("https://api-freeroll-production.up.railway.app/api/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageId = uploadData[0]?.id;
                    console.log('✅ User selected image uploaded:', imageId);
                }
            } else {
                // ถ้าไม่มีการเลือกรูป ให้อัพโหลดรูป default
                imageId = await uploadDefaultImage(jwt);
                console.log('✅ Default image will be used:', imageId);
            }

            const newBatchId = await generateNewBatchId();
            const totalPlantingCost = laborCost + materialCost + otherCosts;

            const batchPayload = {
                data: {
                    Batch_id: newBatchId,
                    Date_of_Planting: plantingDate,
                    Plant_Variety: plantVariety,
                    Batch_Status: "Pending Actions",
                    user_documentId: userId,
                    Farm: selectedFarm.documentId,
                    Batch_image: imageId,
                    Cultivation_Method: cultivationMethod,
                    Soil_pH: parseFloat(soilPH),
                    Soil_Quality: soilQuality,
                    Water_Source: waterSource,
                    Labor_Cost: laborCost,
                    Material_Cost: materialCost,
                    Other_Costs: otherCosts,
                    Total_Planting_Cost: totalPlantingCost,
                },
            };

            console.log('🚀 Creating batch with payload:', batchPayload);

            const response = await fetch("https://api-freeroll-production.up.railway.app/api/batches", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(batchPayload),
            });

            if (!response.ok) {
                throw new Error("Failed to add batch");
            }

            if (response.ok) {
                const farmUpdatePayload = {
                    data: {
                        Farm_Status: "Planted",
                    },
                };

                const farmUpdateResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/farms/${selectedFarm?.documentId}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(farmUpdatePayload),
                });

                if (!farmUpdateResponse.ok) {
                    throw new Error("Failed to update farm status");
                }
            }

            const result = await response.json();
            console.log("✅ Batch added successfully:", result);

            // รีเซ็ตฟอร์ม
            await fetchPlantingBatches();
            setIsDialogOpen(false);
            setCurrentStep(1); // รีเซ็ต step กลับไปที่ 1
            setImagePreview(null);
            setPlantingDate("");
            setPlantVariety("");
            setCultivationMethod(undefined);
            setLocation(undefined);
            setSelectedFarm(undefined);
            setSoilPH("");
            setSoilQuality("");
            setWaterSource(undefined);
            setLaborCost(0);
            setMaterialCost(0);
            setOtherCosts(0);

            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }

            alert("Batch added successfully!");

        } catch (error) {
            console.error("❌ Error adding batch:", error);
            alert("Something went wrong while adding the batch. Please try again.");
        } finally {
            setIsAddingBatch(false); // จบ loading
        }
    };

    React.useEffect(() => {
        fetchFarms();
        fetchPlantingBatches();
    }, []);

    React.useEffect(() => {
        if (isDialogOpen) {
            generateNewBatchId().then(setPreviewBatchId);
            setCurrentStep(1); // รีเซ็ต step เมื่อเปิด dialog
        }
    }, [isDialogOpen]);

    // Add periodic check for expired batches
    React.useEffect(() => {
        // Check immediately when component mounts
        checkAndUpdateExpiredBatches();
        
        // Set up interval to check every minute
        const intervalId = setInterval(() => {
            checkAndUpdateExpiredBatches();
        }, 60000); // Check every 60 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []); // Run once on mount and cleanup on unmount

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-2xl font-semibold">Planting Batches</h1>
                    </div>
                </header>
                <main>
                    <div className="grid grid-cols-4 gap-4 p-4">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger>
                                <Card className="h-full items-center justify-center hover:bg-accent cursor-pointer">
                                    <div className="flex flex-col gap-4 p-4 justify-center items-center">
                                        <Plus className="h-[96px] w-[96px] text-gray-500" />
                                        <h2 className="text-lg font-semibold">Add New Batch</h2>
                                        <p className="text-sm text-gray-500">Click to add a new batch of turmeric planting.</p>
                                    </div>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="w-fit max-w-2xl">
                                <DialogHeader className="flex flex-col gap-2 items-start">
                                    <DialogTitle>Add New Batch</DialogTitle>
                                    <DialogDescription>
                                        {currentStep === 1 
                                            ? "Enter the details for the new cultivation batch"
                                            : "Record planting costs and upload image"
                                        }
                                    </DialogDescription>
                                </DialogHeader>
                                
                                {/* Step 1: Basic Information */}
                                {currentStep === 1 && (
                                    <div className="flex flex-col gap-4 p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="batch-id" className="text-sm font-medium flex items-center gap-2">
                                                    Batch ID
                                                </Label>
                                                <Input
                                                    id="batch-id"
                                                    value={previewBatchId || "T-Batch-001"}
                                                    disabled
                                                    className="cursor-not-allowed bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="your-farms" className="text-sm font-medium">
                                                    Your Farms
                                                </Label>
                                                <Select value={location} onValueChange={(value) => {
                                                    setLocation(value);
                                                    const farm = farmdata.find((f) => f.Farm_Name === value);
                                                    setSelectedFarm(farm);
                                                }}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Your Farms" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {farmdata.map((farm) => (
                                                            <SelectItem key={farm.id} value={farm.Farm_Name}>
                                                                {farm.Farm_Name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="planting-date" className="text-sm font-medium">
                                                    Date of Planting
                                                </Label>
                                                <Input
                                                    id="planting-date"
                                                    type="date"
                                                    value={plantingDate}
                                                    onChange={(e) => setPlantingDate(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="plant-variety" className="text-sm font-medium">
                                                    Plant Variety
                                                </Label>
                                                <Input
                                                    id="plant-variety"
                                                    placeholder="Enter plant variety"
                                                    value={plantVariety}
                                                    onChange={(e) => setPlantVariety(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="cultivation-method" className="text-sm font-medium">
                                                    Cultivation Method
                                                </Label>
                                                <Select value={cultivationMethod} onValueChange={setCultivationMethod}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Organic">
                                                            Organic
                                                        </SelectItem>
                                                        <SelectItem value="Conventional">
                                                            Conventional
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="status" className="text-sm font-medium">
                                                    Status
                                                </Label>
                                                <Input
                                                    id="status"
                                                    value="Planted"
                                                    disabled
                                                    className="cursor-not-allowed bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="soil-ph" className="text-sm font-medium">
                                                    Soil pH
                                                </Label>
                                                <Input
                                                    id="soil-ph"
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="14"
                                                    placeholder="Enter numeric value"
                                                    value={soilPH}
                                                    onChange={(e) => setSoilPH(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="soil-quality" className="text-sm font-medium">
                                                    Soil Quality
                                                </Label>
                                                <Select value={soilQuality} onValueChange={setSoilQuality}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Soil Quality" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Poor">
                                                            Poor
                                                        </SelectItem>
                                                        <SelectItem value="Moderate">
                                                            Moderate
                                                        </SelectItem>
                                                        <SelectItem value="Good">
                                                            Good 
                                                        </SelectItem>
                                                        <SelectItem value="Excellent">
                                                            Excellent
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor="water-source" className="text-sm font-medium">
                                                    Water Source
                                                </Label>
                                                <Select value={waterSource} onValueChange={setWaterSource}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select one" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="River / Stream">
                                                            River / Stream
                                                        </SelectItem>
                                                        <SelectItem value="Pond / Lake">
                                                            Pond / Lake
                                                        </SelectItem>
                                                        <SelectItem value="Groundwater">
                                                            Groundwater
                                                        </SelectItem>
                                                        <SelectItem value="Rainwater Harvesting">
                                                            Rainwater Harvesting
                                                        </SelectItem>
                                                        <SelectItem value="Irrigation Canal">
                                                            Irrigation Canal
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Cost Tracking and Image Upload */}
                                {currentStep === 2 && (
                                    <div className="flex flex-col gap-4 p-4">
                                        {/* Planting Cost Tracking Section */}
                                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold">Planting Cost Tracking</h3>
                                                    <p className="text-sm text-gray-500">Record planting costs for this batch</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <Label htmlFor="labor-cost" className="text-sm font-medium">
                                                        Labor Cost (THB)
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="labor-cost"
                                                            type="number"
                                                            min="0"
                                                            value={laborCost}
                                                            onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                                                            className="pr-8"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="material-cost" className="text-sm font-medium">
                                                        Material Cost (THB)
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="material-cost"
                                                            type="number"
                                                            min="0"
                                                            value={materialCost}
                                                            onChange={(e) => setMaterialCost(parseFloat(e.target.value) || 0)}
                                                            className="pr-8"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <Label htmlFor="other-costs" className="text-sm font-medium">
                                                    Other Costs (THB)
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="other-costs"
                                                        type="number"
                                                        min="0"
                                                        value={otherCosts}
                                                        onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)}
                                                        className="pr-8"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="border-t border-gray-200 pt-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">Total Planting Cost:</span>
                                                    <span className="font-bold text-lg">฿{(laborCost + materialCost + otherCosts).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Upload Image Section */}
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Upload Image</Label>
                                            <div
                                                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 transition cursor-pointer bg-gray-50 relative"
                                                onClick={() => imageInputRef.current?.click()}
                                                onDrop={handleDrop}
                                                onDragOver={handleDragOver}
                                            >
                                                {imagePreview ? (
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="absolute inset-0 object-cover w-full h-full rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 z-10">
                                                        <img
                                                            src="/batch1.png"
                                                            alt="Default Preview"
                                                            className="w-24 h-24 object-cover rounded-lg opacity-50"
                                                        />
                                                        <p className="text-sm">Upload a file or drag and drop</p>
                                                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB (default: batch1.png)</p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={imageInputRef}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            handleFile(file);
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <DialogFooter className="flex justify-between">
                                    {currentStep === 1 ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="bg-red-500 text-white hover:bg-red-600"
                                                onClick={handleCancel}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="bg-green-600 text-white hover:bg-green-700"
                                                onClick={handleNext}
                                            >
                                                Next
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="bg-red-500 text-white hover:bg-red-600"
                                                onClick={handleBack}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                className="bg-green-600 text-white hover:bg-green-700 min-w-[100px]"
                                                disabled={isAddingBatch}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleAddBatch();
                                                }}
                                            >
                                                {isAddingBatch ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Adding...
                                                    </div>
                                                ) : (
                                                    "Add Batch"
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {plantingbatches.map((batch) => (
                            <Link href={`/plantingbatches/${batch.documentId}`} key={batch.documentId}>
                                <Card className="flex flex-col items-start justify-start hover:bg-accent relative w-full cursor-pointer overflow-hidden py-0 pb-6">
                                    <div className="absolute z-10 inset-0 flex items-center justify-center text-white text-5xl font-semibold opacity-0 hover:opacity-100 bg-black/40 transition-opacity rounded-lg">
                                        More Detail
                                    </div>
                                    <img
                                        src={batch.Batch_image || "/batch1.png"}
                                        alt="Batch Image"
                                        className={`w-full h-37.5 object-cover ${batch.Batch_Status === "Completed Past Data" ? "grayscale-100" : ""}`}
                                        onError={(e) => {
                                            console.error("❌ Error loading batch image, using default:", batch.Batch_image);
                                            e.currentTarget.src = "/batch1.png";
                                        }}
                                        onLoad={() => {
                                            console.log("✅ Batch image loaded successfully:", batch.Batch_image);
                                        }}
                                    />
                                    {/* 🎯 ใช้ฟังก์ชัน getCircleColor */}
                                    <Circle
                                        className={`absolute top-2 right-2 w-6 h-6 ${getCircleColor(batch.Batch_Status)}`}
                                    />
                                    <CardContent className="flex flex-col items-start w-full">
                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-lg font-semibold">{batch.Batch_id}</h1>
                                            <p className="text-sm text-gray-500">Planted: {batch.Date_of_Planting}</p>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Plant Variety:</p>
                                            <h1 className="text-sm font-semibold">{batch.Plant_Variety}</h1>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Cultivation Method:</p>
                                            <h1 className="text-sm font-semibold">{batch.Farm_Cultivation_Method}</h1>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Status:</p>
                                            <h1 className="text-sm font-semibold">
                                                {/* 🎯 ใช้ฟังก์ชัน getDisplayStatus */}
                                                {getDisplayStatus(batch.Batch_Status)}
                                            </h1>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Location:</p>
                                            <h1 className="text-sm font-semibold">{batch.Farm_Name}</h1>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
