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
    };

    const fetchFarms = async () => {
        try {
            const response = await fetch(`http://localhost:1337/api/farms?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`, {
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


    const fetchPlantingBatches = async () => {
        try {
            const response = await fetch(`http://localhost:1337/api/batches?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch planting batches');
            }
            const data = await response.json();
            setPlantingBatches(
                data.data.map((batch: any) => ({
                    Batch_id: batch.Batch_id,
                    documentId: batch.documentId,
                    Date_of_Planting: batch.Date_of_Planting,
                    Plant_Variety: batch.Plant_Variety,
                    Farm_documentId: batch.Farm.documentId,
                    Farm_Status: batch.Farm.Farm_Status,
                    Farm_Name: batch.Farm.Farm_Name,
                    Farm_Cultivation_Method: batch.Farm.Cultivation_Method,
                    Batch_Status: batch.Batch_Status,
                    Batch_image: batch.Batch_image?.url
                        ? `http://localhost:1337${batch.Batch_image.url}`
                        : "",
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
            const response = await fetch(`http://localhost:1337/api/batches`, {
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

    const generateNewBatchId = async () => {
        const allBatches = await fetchAllBatchesForIDGeneration();

        const maxBatchNumber = allBatches.reduce((max: number, batch: any) => {
            const match = batch.Batch_id?.match(/T-Batch-(\d+)/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);

        return `T-Batch-${String(maxBatchNumber + 1).padStart(3, "0")}`;
    };

    const handleAddBatch = async () => {
        try {
            const jwt = localStorage.getItem("jwt");
            const userId = localStorage.getItem("userId");

            if (!jwt || !userId || !selectedFarm) {
                console.error("Missing required data");
                return;
            }

            let imageId = null;

            if (imageInputRef.current?.files?.[0]) {
                const formData = new FormData();
                formData.append("files", imageInputRef.current.files[0]);

                const uploadRes = await fetch("http://localhost:1337/api/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                imageId = uploadData[0]?.id;
            }

            const newBatchId = await generateNewBatchId();

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
                },
            };

            const response = await fetch("http://localhost:1337/api/batches", {
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

                const farmUpdateResponse = await fetch(`http://localhost:1337/api/farms/${selectedFarm?.documentId}`, {
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
            console.log("Batch added:", result);
            await fetchPlantingBatches();
            setIsDialogOpen(false);
            alert("Batch added successfully!");

        } catch (error) {
            console.error("Error adding batch:", error);
            alert("Something went wrong while adding the batch.");
        }
    };



    React.useEffect(() => {
        fetchFarms();
        fetchPlantingBatches();
    }, []);

    React.useEffect(() => {
        if (isDialogOpen) {
            generateNewBatchId().then(setPreviewBatchId);
        }
    }, [isDialogOpen]);

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
                            <DialogContent className="w-fit">
                                <DialogHeader className="flex flex-col gap-2 items-start">
                                    <DialogTitle>Add New Batch</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details of the new batch below.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="batch-id" className="text-sm font-medium flex items-center gap-2">
                                                Batch ID
                                            </Label>
                                            <Input
                                                id="batch-id"
                                                value={previewBatchId || "Loading..."}
                                                disabled
                                                className="cursor-not-allowed bg-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="planting-date" className="text-sm font-medium">
                                                Planting Date
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
                                                    <SelectValue placeholder="Select Method" />
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
                                            <Label htmlFor="location" className="text-sm font-medium">
                                                Location
                                            </Label>
                                            <Select value={location} onValueChange={(value) => {
                                                setLocation(value);
                                                const farm = farmdata.find((f) => f.Farm_Name === value);
                                                setSelectedFarm(farm);
                                            }}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Farm" />
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
                                            <Label htmlFor="status" className="text-sm font-medium">
                                                Status
                                            </Label>
                                            <Select disabled defaultValue="Planted">
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Planted">
                                                        Planted
                                                    </SelectItem>
                                                    <SelectItem value="Fertilized">
                                                        Fertilized
                                                    </SelectItem>
                                                    <SelectItem value="Harvested">
                                                        Harvested
                                                    </SelectItem>
                                                    <SelectItem value="Lab Submitted">
                                                        Lab Submitted
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-sm font-medium mb-2 block">Image</Label>
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
                                                        <p className="text-sm">Drag & drop an image here</p>
                                                        <p className="text-xs text-gray-400">or click to browse</p>
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
                                </div>
                                <DialogFooter className="flex justify-end">
                                    <Button variant="outline" className="bg-red-600 text-white" onClick={() => {
                                        setImagePreview(null);
                                        if (imageInputRef.current) {
                                            imageInputRef.current.value = '';
                                        }
                                        setCultivationMethod("");
                                        setLocation("");
                                        const inputs = document.querySelectorAll('#planting-date, #plant-variety');
                                        inputs.forEach(input => (input as HTMLInputElement).value = '');

                                    }}>
                                        Clear
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-green-600 dark:text-white"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAddBatch();
                                        }}
                                    >
                                        Add Batch
                                    </Button>
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
                                        src={batch.Batch_image}
                                        alt="Batch Image"
                                        className={`w-full h-37.5 object-cover ${batch.Batch_Status === "Completed Past Data" ? "grayscale-100" : ""}`}
                                    />
                                    <Circle
                                        className={`absolute top-2 right-2 w-6 h-6 ${batch.Batch_Status === "Completed Successfully"
                                            ? "text-green-600 fill-green-600"
                                            : batch.Batch_Status === "Pending Actions"
                                                ? "text-yellow-600 fill-yellow-600"
                                                : batch.Batch_Status === "Completed Past Data"
                                                    ? "text-gray-600 fill-gray-600"
                                                    : "text-red-600 fill-red-600"
                                            }`}
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
                                                {batch.Farm_Status}
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
