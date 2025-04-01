'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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

export default function PlantingBatchesPage() {

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem('sidebarOpen', String(!prev));
            return !prev;
        });
    };

    type PlantingBatches = {
        batches_id: string;
        planting_date: string;
        plant_variety: string;
        cultivation_method: string;
        status: number;
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
        { batches_id: 'T-Batch-001', image: "/TurmeRic-logo.png", planting_date: '2023-01-01', plant_variety: 'Turmeric', cultivation_method: 'Organic', status: 1, location: 'Mae Fah Luang', recent_fertilizer_record: { date: '2023-02-01', fertilizer_type: 'NPK', amount: 100, size: 50, note: 'First application', method: 'Spray' }, recent_harvest_record: { date: '2023-06-01', yleld: 200, quality_grade: 'A', method: 'Manual', note: 'Good quality', result_type: 'Fresh', curcumin_quality: '40', amount_report: 150 }, lab_submission_record: { date: '2023-07-01', lab_name: 'Lab A', quality_grade: 'A+', status: 'Completed' } },
        { batches_id: 'T-Batch-002', image: "/TurmeRic-logo.png", planting_date: '2023-02-01', plant_variety: 'Turmeric', cultivation_method: 'Conventional', status: 2, location: 'Mae Fah Luang', recent_fertilizer_record: { date: '2023-03-01', fertilizer_type: 'NPK', amount: 150, size: 75, note: 'Second application', method: 'Spray' }, recent_harvest_record: { date: '2023-07-01', yleld: 250, quality_grade: 'B', method: 'Manual', note: 'Average quality', result_type: 'Dried', curcumin_quality: '50', amount_report: 200 }, lab_submission_record: { date: '2023-08-01', lab_name: 'Lab B', quality_grade: 'B+', status: 'In Progress' } },
        { batches_id: 'T-Batch-003', image: "/AIS.jpg", planting_date: '2023-03-01', plant_variety: 'Turmeric', cultivation_method: 'Organic', status: 3, location: 'Mae Fah Luang', recent_fertilizer_record: { date: '2023-04-01', fertilizer_type: 'NPK', amount: 200, size: 100, note: 'Third application', method: 'Spray' }, recent_harvest_record: { date: '2023-08-01', yleld: 300, quality_grade: 'A+', method: 'Manual', note: 'Excellent quality', result_type: 'Fresh', curcumin_quality: '80', amount_report: 250 }, lab_submission_record: { date: '2023-09-01', lab_name: 'Lab C', quality_grade: 'A++', status: 'Completed' } },
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
                                    <div className="flex flex-col gap-4 p-4">
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
                                            <select id="cultivation-method" className="border rounded p-2 bg-gray-100 w-full">
                                                <option value="littleFarm">Organic</option>
                                                <option value="littleFarm2">Conventional</option>
                                            </select>

                                        </div>
                                        <div>
                                            <Label htmlFor="location" className="text-sm font-medium">
                                                Location
                                            </Label>
                                            <select id="location" className="border rounded p-2 bg-gray-100 w-full">
                                                <option value="littleFarm">Little Farm</option>
                                                <option value="littleFarm2">Little Farm 2</option>
                                            </select>

                                        </div>
                                        <div>
                                            <Label htmlFor="status" className="text-sm font-medium">
                                                Status
                                            </Label>
                                            <select id="status" disabled className="border rounded p-2 cursor-not-allowed bg-gray-100 w-full">
                                                <option value="planted">Planted</option>
                                                <option value="fertilized2">Fertilized</option>
                                                <option value="havested">Havested</option>
                                                <option value="labSubmissed">Lab Submissed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="image" className="text-sm font-medium">
                                                Image URL
                                            </Label>
                                            <Input id="image" placeholder="https://example.com/image.jpg" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex justify-end">
                                    <Button variant="outline" className="bg-red-600 text-white" onClick={() => console.log('Close dialog')}>
                                        Cancle
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
                            <Card
                                className="p-4 flex flex-col items-start justify-start hover:bg-accent relative w-full cursor-pointer"
                                key={batch.batches_id}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-white text-5xl font-semibold opacity-0 hover:opacity-100 bg-black/40 transition-opacity rounded-lg">
                                    More Detail
                                </div>
                                <CardContent className="flex flex-col items-start w-full">
                                    <img
                                        src={batch.image}
                                        alt="Batch Image"
                                        className="w-full max-h-[120px] object-cover rounded-2xl border-accent-foreground p-1 mb-4 text-green-700 bg-green-200"
                                    />
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
                                        <h1 className="text-sm font-semibold">{batch.status}</h1>
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
