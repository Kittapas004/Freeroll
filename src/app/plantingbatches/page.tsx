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

export default function PlantingBatchesPage() {

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
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

    const [cultivationMethod, setCultivationMethod] = useState<string | undefined>();
    const [location, setLocation] = useState<string | undefined>();


    type PlantingBatches = {
        batches_id: string;
        planting_date: string;
        plant_variety: string;
        cultivation_method: string;
        status: string;
        location: string;
        image: string;
        recent_fertilizer_record: {
            date: string;
            fertilizer_type: string;
            amount: number;
            size: number;
            note: string;
            method: string;
        };
        recent_harvest_record: {
            date: string;
            yleld: number;
            quality_grade: string;
            method: string;
            note: string;
            result_type: string;
            curcumin_quality: string;
            amount_report: number;
        };
        lab_submission_record: {
            date: string;
            lab_name: string;
            quality_grade: string;
            status: string;
        };
    };

    const plantingbatches: PlantingBatches[] = [
        { batches_id: 'T-Batch-001', image: "/batch1.png", planting_date: '2023-01-01', plant_variety: 'Turmeric', cultivation_method: 'Organic', status: 'completed_successfully', location: 'Mae Fah Luang', recent_fertilizer_record: { date: '2023-02-01', fertilizer_type: 'NPK', amount: 100, size: 50, note: 'First application', method: 'Spray' }, recent_harvest_record: { date: '2023-06-01', yleld: 200, quality_grade: 'A', method: 'Manual', note: 'Good quality', result_type: 'Fresh', curcumin_quality: '40', amount_report: 150 }, lab_submission_record: { date: '2023-07-01', lab_name: 'Lab A', quality_grade: 'A+', status: 'Completed' } },
        { batches_id: 'T-Batch-002', image: "/batch1.png", planting_date: '2023-02-01', plant_variety: 'Turmeric', cultivation_method: 'Conventional', status: 'pending_actions', location: 'Mae Fah Luang', recent_fertilizer_record: { date: '2023-03-01', fertilizer_type: 'NPK', amount: 150, size: 75, note: 'Second application', method: 'Spray' }, recent_harvest_record: { date: '2023-07-01', yleld: 250, quality_grade: 'B', method: 'Manual', note: 'Average quality', result_type: 'Dried', curcumin_quality: '50', amount_report: 200 }, lab_submission_record: { date: '2023-08-01', lab_name: 'Lab B', quality_grade: 'B+', status: 'In Progress' } },
        { batches_id: 'T-Batch-003', image: "/batch1.png", planting_date: '2023-03-01', plant_variety: 'Turmeric', cultivation_method: 'Organic', status: 'issues_detected', location: 'Mae Fah Luang', recent_fertilizer_record: { date: '2023-04-01', fertilizer_type: 'NPK', amount: 200, size: 100, note: 'Third application', method: 'Spray' }, recent_harvest_record: { date: '2023-08-01', yleld: 300, quality_grade: 'A+', method: 'Manual', note: 'Excellent quality', result_type: 'Fresh', curcumin_quality: '80', amount_report: 250 }, lab_submission_record: { date: '2023-09-01', lab_name: 'Lab C', quality_grade: 'A++', status: 'Completed' } },
    ];

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
                    {/* // make card to use add new batche */}
                    <div className="grid grid-cols-4 gap-4 p-4">
                        <Dialog>
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
                                            <Input id="batch-id" placeholder="T-Batch-003" disabled className="cursor-not-allowed bg-gray-100" />
                                        </div>
                                        <div>
                                            <Label htmlFor="planting-date" className="text-sm font-medium">
                                                Planting Date
                                            </Label>
                                            <Input id="planting-date" type="date" placeholder="2023-09-01" />
                                        </div>
                                        <div>
                                            <Label htmlFor="plant-variety" className="text-sm font-medium">
                                                Plant Variety
                                            </Label>
                                            <Input id="plant-variety" placeholder="Enter plant variety" />

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
                                            <Select value={location} onValueChange={setLocation}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Farm" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="littleFarm">
                                                        Little Farm
                                                    </SelectItem>
                                                    <SelectItem value="littleFarm2">
                                                        Little Farm 2
                                                    </SelectItem>
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
                                    <Button type="submit" className="bg-green-600 dark:text-white" onClick={(e) => {
                                        // function for Save Batch
                                    }}>
                                        Save Batch
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {plantingbatches.map((batch) => (
                            <Link href={`/plantingbatches/${batch.batches_id}`} key={batch.batches_id}>
                                <Card className="flex flex-col items-start justify-start hover:bg-accent relative w-full cursor-pointer overflow-hidden py-0 pb-6">
                                    <div className="absolute z-10 inset-0 flex items-center justify-center text-white text-5xl font-semibold opacity-0 hover:opacity-100 bg-black/40 transition-opacity rounded-lg">
                                        More Detail
                                    </div>
                                    <img
                                        src={batch.image}
                                        alt="Batch Image"
                                        className="w-full h-37.5 object-cover"
                                    />
                                    <Circle
                                        className={`absolute top-2 right-2 w-6 h-6 ${batch.status === "completed_successfully"
                                            ? "text-green-600 fill-green-600"
                                            : batch.status === "pending_actions"
                                                ? "text-yellow-600 fill-yellow-600"
                                                : batch.status === "issues_detected"
                                                    ? "text-red-600 fill-red-600"
                                                    : "text-gray-600 fill-gray-600"
                                            }`}
                                    />
                                    <CardContent className="flex flex-col items-start w-full">
                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-lg font-semibold">{batch.batches_id}</h1>
                                            <p className="text-sm text-gray-500">{batch.planting_date}</p>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Plant Variety:</p>
                                            <h1 className="text-sm font-semibold">{batch.plant_variety}</h1>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Cultivation Method:</p>
                                            <h1 className="text-sm font-semibold">{batch.cultivation_method}</h1>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Status:</p>
                                            <h1 className="text-sm font-semibold">
                                                {batch.status === 'completed_successfully'
                                                    ? 'Completed Successfully'
                                                    : batch.status === 'pending_actions'
                                                        ? 'Pending Actions'
                                                        : batch.status === 'issues_detected'
                                                            ? 'Issues Detected'
                                                            : batch.status === 'completed_past_date'
                                                                ? 'Completed Past Date'
                                                                : 'Unknown'}
                                            </h1>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-2">
                                            <p className="text-sm text-gray-500">Location:</p>
                                            <h1 className="text-sm font-semibold">{batch.location}</h1>
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
