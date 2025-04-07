'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { notFound } from "next/navigation";
import { use } from "react";
import { MapPin, Calendar, Sprout, Leaf, Plus, Wrench, FlaskConical, Notebook, Check, ChartSpline, Star, SquarePen, Trash, Circle, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";



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
    }[];
    recent_harvest_record: {
        id: string;
        date: string;
        yleld: number;
        quality_grade: string;
        method: string;
        note: string;
        result_type: string;
        curcumin_quality: string;
        amount_report: number;
    }[];
    lab_submission_record: {
        id: string;
        date: string;
        lab_name: string;
        quality_grade: string;
        status: string;
        report: File | null;
    }[];
};

const tabs = [
    { name: "Fertilizer", icon: <Sprout size={16} />, key: "fertilizer" },
    { name: "Harvest", icon: <Wrench size={16} />, key: "harvest" },
    { name: "Lab Submission", icon: <FlaskConical size={16} />, key: "lab" }
];

const plantingbatches: PlantingBatches[] = [
    {
        batches_id: 'T-Batch-001',
        image: "/batch1.png",
        planting_date: '2023-01-01',
        plant_variety: 'Turmeric',
        cultivation_method: 'Organic',
        status: 'completed_successfully',
        location: 'Mae Fah Luang',
        recent_fertilizer_record: [
            { date: '2023-02-01', fertilizer_type: 'NPK', amount: 100, size: 50, note: 'First application', method: 'Spray' },
            { date: '2023-03-01', fertilizer_type: 'Compost', amount: 120, size: 60, note: 'Second application', method: 'Broadcast' }
        ],
        recent_harvest_record: [
            {
                id: '1',
                date: '2023-06-01',
                yleld: 200,
                quality_grade: 'A',
                method: 'Manual',
                note: 'Good quality',
                result_type: 'Uv Spectroscopy',
                curcumin_quality: '70',
                amount_report: 150
            },
            {
                id: '2',
                date: '2023-07-15',
                yleld: 220,
                quality_grade: 'A+',
                method: 'Machine',
                note: 'Excellent yield',
                result_type: 'Uv Spectroscopy',
                curcumin_quality: '75',
                amount_report: 180
            }
        ],
        lab_submission_record: [{
            id: '1',
            date: '2023-07-01',
            lab_name: 'Lab A',
            quality_grade: 'A+',
            status: 'Completed',
            report: null
        }]
    },
    {
        batches_id: 'T-Batch-002',
        image: "/batch1.png",
        planting_date: '2023-02-01',
        plant_variety: 'Turmeric',
        cultivation_method: 'Conventional',
        status: 'pending_actions',
        location: 'Mae Fah Luang',
        recent_fertilizer_record: [
            { date: '2023-03-01', fertilizer_type: 'NPK', amount: 150, size: 75, note: 'Second application', method: 'Spray' },
            { date: '2023-04-01', fertilizer_type: 'Urea', amount: 130, size: 70, note: 'Third application', method: 'Drip' }
        ],
        recent_harvest_record: [
            {
                id: '3',
                date: '2023-07-01',
                yleld: 250,
                quality_grade: 'B',
                method: 'Manual',
                note: 'Average quality',
                result_type: 'Uv Spectroscopy',
                curcumin_quality: '50',
                amount_report: 200
            },
            {
                id: '4',
                date: '2023-08-10',
                yleld: 270,
                quality_grade: 'B+',
                method: 'Machine',
                note: 'Improved quality',
                result_type: 'Uv Spectroscopy',
                curcumin_quality: '55',
                amount_report: 220
            }
        ],
        lab_submission_record: [{
            id: '2',
            date: '2023-08-01',
            lab_name: 'Lab B',
            quality_grade: 'B+',
            status: 'In Progress',
            report: null
        }]
    },
    {
        batches_id: 'T-Batch-003',
        image: "/batch1.png",
        planting_date: '2023-03-01',
        plant_variety: 'Turmeric',
        cultivation_method: 'Organic',
        status: 'issues_detected',
        location: 'Mae Fah Luang',
        recent_fertilizer_record: [
            { date: '2023-04-01', fertilizer_type: 'NPK', amount: 200, size: 100, note: 'Third application', method: 'Spray' },
            { date: '2023-05-01', fertilizer_type: 'Organic', amount: 180, size: 90, note: 'Fourth application', method: 'Broadcast' }
        ],
        recent_harvest_record: [
            {
                id: '5',
                date: '2023-08-01',
                yleld: 300,
                quality_grade: 'A+',
                method: 'Manual',
                note: 'Excellent quality',
                result_type: 'Uv Spectroscopy',
                curcumin_quality: '80',
                amount_report: 250
            },
            {
                id: '6',
                date: '2023-09-20',
                yleld: 320,
                quality_grade: 'A++',
                method: 'Machine',
                note: 'Outstanding yield',
                result_type: 'Uv Spectroscopy',
                curcumin_quality: '85',
                amount_report: 280
            },
        {
                id: '7',
                date: '2023-10-01',
                yleld: 350,
                quality_grade: 'A++',
                method: 'Machine',
                note: 'Outstanding yield',
                result_type: 'Dried',
                curcumin_quality: '85',
                amount_report: 280
            },
            {
                id: '8',
                date: '2023-10-15',
                yleld: 370,
                quality_grade: 'A++',
                method: 'Machine',
                note: 'Outstanding yield',
                result_type: 'Dried',
                curcumin_quality: '85',
                amount_report: 280
            }
        ],
        lab_submission_record: [{
            id: '3',
            date: '2023-09-01',
            lab_name: 'Lab C',
            quality_grade: 'A++',
            status: 'Completed',
            report: null
        },
        {
            id: '4',
            date: '2023-09-15',
            lab_name: 'Lab D',
            quality_grade: 'A++',
            status: 'In Progress',
            report: null
        }]
    }
];

export default function PlantingBatchDetail({ params }: { params: Promise<{ batches_id: string }> }) {
    const { batches_id } = use(params);
    const batch = plantingbatches.find(b => b.batches_id === batches_id);
    if (!batch) return notFound();
    const [activeTab, setActiveTab] = useState("fertilizer");
    const [expandedRow, setExpandedRow] = useState<string | number | null>(null);
    const toggleRow = (id: string | number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem('sidebarOpen', String(!prev));
            return !prev;
        });
    };

    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        date: "",
        amount: "",
        size: "",
        fertilizer_type: "Organic",
        method: "Spray",
        note: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between items-center px-4 py-2 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-2xl font-semibold">{batch.batches_id}</h1>
                        <div className="relative flex flex-row items-center">
                            <div className="relative group">
                                <Circle
                                    className={
                                        "cursor-pointer " +
                                        (batch.status === "completed_successfully"
                                            ? "text-green-600 fill-green-600"
                                            : batch.status === "pending_actions"
                                                ? "text-yellow-600 fill-yellow-600"
                                                : batch.status === "issues_detected"
                                                    ? "text-red-600 fill-red-600"
                                                    : "text-gray-600 fill-gray-600")
                                    }
                                />
                                <div className="absolute left-8 top-1/2 z-10 opacity-0 group-hover:opacity-100 group-hover:block bg-white text-black text-sm p-2 rounded shadow-lg whitespace-nowrap transition-opacity duration-200 pointer-events-none">
                                    <p className="text-sm font-semibold">Color-Coded indicators</p>
                                    <p className="text-green-600 flex flex-row gap-2"><Circle className="text-green-600 fill-green-600" /> Completed Successfully</p>
                                    <p className="text-yellow-600 flex flex-row gap-2"><Circle className="text-yellow-600 fill-yellow-600" /> Pending Actions</p>
                                    <p className="text-red-600 flex flex-row gap-2"><Circle className="text-red-600 fill-red-600" /> Issues Detected</p>
                                    <p className="text-gray-600 flex flex-row gap-2"><Circle className="text-gray-600 fill-gray-600" /> Completed Past Data</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center text-sm gap-1 bg-gray-500 rounded-lg text-white p-1">
                            <MapPin size={16} /> {batch.location}
                        </div>
                    </div>
                </header>
                <main>
                <div className="h-full max-h-[240px] w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${batch.image})` }} />


                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4 -mt-10 relative z-10 w-full max-w-5xl mx-auto">
                    <Card className="p-4 shadow-md justify-center">
                        <div className="flex items-center gap-4">
                            <Calendar size={40} className="bg-green-500 text-white rounded-sm p-1" />
                            <div className="flex flex-col">
                                <p className="text-muted-foreground">Start Date</p>
                                <h3 className="text-xl font-semibold">{new Date(batch.planting_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 shadow-md justify-center">
                        <div className="flex items-center gap-4">
                            <Sprout size={40} className="bg-green-500 text-white rounded-sm p-1" />
                            <div className="flex flex-col">
                                <p className="text-muted-foreground">Plant Variety</p>
                                <h3 className="text-xl font-semibold">{batch.plant_variety}</h3>
                                <p className="text-sm text-muted-foreground">Optimal Growth</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 shadow-md justify-center">
                        <div className="flex items-center gap-4">
                            <Leaf size={40} className="bg-green-500 text-white rounded-sm p-1" />
                            <div className="flex flex-col">
                                <p className="text-muted-foreground">Cultivation Method</p>
                                <h3 className="text-xl font-semibold">{batch.cultivation_method}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="px-4 mt-6">
                    {/* --- Tabs --- */}
                    <div className="flex gap-6 items-center relative">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                className={`flex items-center gap-2 text-sm font-medium px-2 pb-2 transition-all
                        ${activeTab === tab.key ? "text-green-600 font-semibold border-b-[1px] z-10 border-green-600" : "text-gray-400"}
                        `}
                                onClick={() => { setActiveTab(tab.key), setIsAdding(false) }}
                            >
                                {tab.icon} {tab.name}
                            </button>
                        ))}
                        <Separator orientation="horizontal" className="absolute -bottom-0 h-[2px] transition-all bg-gray-300 mt-1" />
                    </div>
                </div>

                {activeTab === "fertilizer" && (
                    <div className="px-4 py-4 space-y-4">
                        {!isAdding && (
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Recent Fertilizer Records</h2>
                                <Button onClick={() => setIsAdding(true)} className="bg-green-600 hover:bg-green-700">
                                    <Plus size={16} /> Add Record
                                </Button>
                            </div>
                        )}
                        {isAdding ? (
                            <div className="flex flex-col gap-4 pt-1">
                                <h2 className="text-lg font-semibold">Add Fertilizer Record</h2>
                                <Card className="p-4 space-y-4 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <Label>Date</Label>
                                            <Input type="date" name="date" value={formData.date} onChange={handleChange} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>Fertilizer Type</Label>
                                            <Select>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Fertilizer Type" />
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
                                        <div className="flex flex-col gap-1">
                                            <Label>Quantity Applied</Label>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Input type="number" name="amount" placeholder="Enter Quantity Applied here ..." min={0} value={formData.amount} onChange={handleChange} />
                                                <Select defaultValue="kg">
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="kg">
                                                            kg
                                                        </SelectItem>
                                                        <SelectItem value="g">
                                                            g
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>How to Apply</Label>
                                            <Select>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select How to Apply" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Spray">
                                                        Spray
                                                    </SelectItem>
                                                    <SelectItem value="Broadcast">
                                                        Broadcast
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>Acres</Label>
                                            <Input type="number" name="size" placeholder="Acres" min={0} value={formData.size} onChange={handleChange} />
                                        </div>
                                        <div className="flex flex-col gap-1 col-span-2">
                                            <Label>Notes (Optional)</Label>
                                            <Textarea name="note" placeholder="Enter Notes here ... (Optional)" value={formData.note} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button onClick={() => setIsAdding(false)} className="bg-red-500 hover:bg-red-600">Cancel</Button>
                                        <Button className="bg-green-600 hover:bg-green-700">Save</Button>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            batch.recent_fertilizer_record.map((rec, i) => (
                                <Card key={i} className="p-4 space-y-1 shadow-sm">
                                    <div className="gap-1 flex flex-col">
                                        <div className="flex gap-2 text-sm text-muted-foreground">
                                            <span className="bg-green-500 text-white px-2 rounded">Spray</span>
                                            <span>{new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold">{rec.fertilizer_type}</h3>
                                        <div className="flex flex-row gap-4">
                                            <div className="flex flex-col">
                                                <p className="text-sm text-muted-foreground">Applied:</p>
                                                <h1>{rec.amount} kg per square meter</h1>
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-sm text-muted-foreground">Acres:</p>
                                                <h1>{rec.size}</h1>
                                            </div>
                                        </div>
                                        <Separator orientation="horizontal" className="h-[2px] bg-gray-300 mt-1"></Separator>
                                        <p className="flex flex-row items-center gap-1 text-xs text-muted-foreground"><Notebook />Note: {rec.note}</p>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "harvest" && (
                    <div className="px-4 py-4 space-y-4">
                        {!isAdding && (
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Recent Harvest Records</h2>
                                <div className="flex gap-2">
                                    <Button className="bg-green-800 hover:bg-green-900"><Check size={16} /> Mark as Complete</Button>
                                    <Button onClick={() => setIsAdding(true)} className="bg-green-600 hover:bg-green-700">
                                        <Plus size={16} /> Add Record
                                    </Button>
                                </div>
                            </div>
                        )}
                        {isAdding ? (
                            <div className="flex flex-col gap-4 pt-1">
                                <h2 className="text-lg font-semibold">Add Harvest Record</h2>
                                <Card className="p-4 space-y-4 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <Label>Harvest Date</Label>
                                            <Input type="date" name="date" onChange={handleChange} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>Harvest Method</Label>
                                            <Select>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Harvest Method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Machine">
                                                        Machine Harvesting
                                                    </SelectItem>
                                                    <SelectItem value="Manual">
                                                        Manual Harvesting
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>Yield Amount</Label>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Input type="number" name="yield" min={0} placeholder="Enter Yield Amount here ..." onChange={handleChange} />
                                                <Select defaultValue="kg">
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="kg">
                                                            kg
                                                        </SelectItem>
                                                        <SelectItem value="g">
                                                            g
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>Curcumin Quatity (%)</Label>
                                            <Input type="number" name="curcumin" placeholder="Enter Curcumin Amount here ..." onChange={handleChange} min={0} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>Quality Grade</Label>
                                            <Select>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Grade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A+">
                                                        Grade A+
                                                    </SelectItem>
                                                    <SelectItem value="A">
                                                        Grade A
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-1 row-span-2">
                                            <Label>Notes (Optional)</Label>
                                            <Textarea className="h-full" name="note" placeholder="Enter Notes here ... (Optional)" onChange={handleChange} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label>Result Type</Label>
                                            <Input type="result" name="result" disabled placeholder="Enter Result Type Amount here ..." defaultValue={"UV Spectroscopy"} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button onClick={() => setIsAdding(false)} className="bg-red-500 hover:bg-red-600">Cancel</Button>
                                        <Button className="bg-green-600 hover:bg-green-700">Save</Button>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-3 gap-10 w-full max-w-5xl mx-auto pt-1">
                                    <Card className="items-center justify-center">
                                        <CardContent className="p-4 w-full">
                                            <div className="flex flex-row gap-1 justify-between">
                                                <p className="text-sm text-muted-foreground">Total Yield <br /> ({batch.batches_id})</p>
                                                <ChartSpline className="bg-green-400 text-green-900 p-1 rounded-sm" />
                                            </div>
                                            <h1 className="text-2xl font-bold">
                                                {batch.recent_harvest_record.reduce((total, recent_harvest_record) => total + recent_harvest_record.yleld, 0)}
                                            </h1>
                                            <p className="text-sm text-muted-foreground">Latest Harvest {batch.recent_harvest_record.length > 0 ? new Date(batch.recent_harvest_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No records available"}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="items-center justify-center">
                                        <CardContent className="p-4 w-full">
                                            <div className="flex flex-row gap-1 justify-between">
                                                <p className="text-sm text-muted-foreground">Average Quality Grade <br />({batch.batches_id})</p>
                                                <Star className="bg-yellow-400 text-yellow-900 p-1 rounded-sm" />
                                            </div>
                                            <h1 className="text-2xl font-bold">Garde {batch.recent_harvest_record.length > 0 ? batch.recent_harvest_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].quality_grade : "No records available"}</h1>
                                            <p>
                                                {Array.isArray(batch.recent_harvest_record) && batch.recent_harvest_record.length > 0 ? (
                                                    (() => {
                                                        const sortedRecords = batch.recent_harvest_record.sort(
                                                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                                                        );
                                                        const latest = parseFloat(sortedRecords[0].curcumin_quality);

                                                        if (sortedRecords.length > 1) {
                                                            const previous = parseFloat(sortedRecords[1].curcumin_quality);
                                                            return latest > previous ? (
                                                                <span className="text-green-600 flex items-center gap-1">
                                                                    ↑ {latest - previous}% Improvement
                                                                </span>
                                                            ) : (
                                                                <span className="text-red-600 flex items-center gap-1">
                                                                    ↓ {previous - latest}% regression
                                                                </span>
                                                            );
                                                        } else {
                                                            return (
                                                                <span className="text-gray-600 flex items-center gap-1">
                                                                    {latest} Only one record
                                                                </span>
                                                            );
                                                        }
                                                    })()
                                                ) : (
                                                    <span className="text-gray-500">No records available</span>
                                                )}
                                            </p>

                                        </CardContent>
                                    </Card>
                                    <Card className="items-center justify-center">
                                        <CardContent className="p-4 w-full">
                                            <div className="flex flex-row gap-1 justify-between">
                                                <p className="text-sm text-muted-foreground">Pending Lab Reports <br />({batch.batches_id})</p>
                                                <FlaskConical className="bg-blue-400 text-blue-900 p-1 rounded-sm" />
                                            </div>
                                            <h1 className="text-2xl font-bold">{batch.lab_submission_record.length}</h1>
                                            <p className="text-sm text-muted-foreground">Updated {(() => {
                                                if (batch.lab_submission_record.length > 0) {
                                                    const latestSubmission = batch.lab_submission_record.sort(
                                                        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                                                    )[0];
                                                    const lastUpdate = new Date(latestSubmission.date);
                                                    const now = new Date();
                                                    const diffInHours = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));
                                                    if (diffInHours > 24) {
                                                        return `${Math.floor(diffInHours / 24)} days ago`;
                                                    }
                                                    return `${diffInHours} hours ago`;
                                                } else {
                                                    return "No updates available";
                                                }
                                            })()}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Yield</TableHead>
                                            <TableHead>Quality</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Curcumin Quality</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batch.recent_harvest_record.map((harvest_record) => (
                                            <React.Fragment key={harvest_record.id}>
                                                <TableRow key={harvest_record.id}>
                                                    <TableCell>{harvest_record.date}</TableCell>
                                                    <TableCell>{harvest_record.yleld}</TableCell>
                                                    <TableCell>{harvest_record.quality_grade}</TableCell>
                                                    <TableCell>{harvest_record.method}</TableCell>
                                                    <TableCell>{harvest_record.curcumin_quality}</TableCell>
                                                    <TableCell className="flex gap-2">
                                                        <Button className="bg-blue-600 hover:bg-blue-700"><SquarePen size={16} /></Button>
                                                        <Button className="bg-red-600 hover:bg-red-700"><Trash size={16} /></Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" onClick={() => toggleRow(harvest_record.id)}>
                                                            {expandedRow === harvest_record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>

                                                {expandedRow === harvest_record.id && (
                                                    <TableRow className="bg-gray-100">
                                                        <TableCell colSpan={7}>
                                                            <div className="p-4">
                                                                <h1 className="text-green-600 text-xl font-semibold">Information</h1>
                                                                <div className="flex flex-row gap-4 mt-2">
                                                                    <div>
                                                                        <p className="text-gray-500">Result Type:</p>
                                                                        <h1>{harvest_record.result_type || "N/A"}</h1>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500">Notes:</p>
                                                                        <h1>{harvest_record.note || "-"}</h1>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === "lab" && (
                    <div className="px-4 py-4 space-y-4">
                        <h2 className="text-lg font-semibold">Laboratory Report</h2>
                        <div className="flex flex-row gap-4 items-center">
                            <div className="flex flex-row gap-2 items-center"><Sprout className="text-green-600" />
                                <p className="text-sm text-muted-foreground">Total Yield:</p>
                                <h1 className="font-semibold">{batch.recent_harvest_record.reduce((total, record) => total + record.yleld, 0)}</h1>
                            </div>
                            <div className="flex flex-row gap-2 items-center"><Calendar className="text-green-600" />
                                <p className="text-sm text-muted-foreground">Harvest Date:</p>
                                <h1 className="font-semibold">{batch.recent_harvest_record.length > 0 ? new Date(batch.recent_harvest_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No records available"}</h1>
                            </div>
                        </div>
                        <div className="flex flex-col">
                        <Label className="text-lg">
                            Lab Name
                        </Label>
                        <Select>
                            <SelectTrigger className="w-fit">
                                <SelectValue placeholder="Select Lab Name" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LabMFU">
                                MFU Lab
                                </SelectItem>
                                <SelectItem value="LabVRI">
                                VRI Lab
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label>Select Samples for Testing</Label>
                            {batch.recent_harvest_record.map((rec_harvest) => (
                                <Card className="p-4 flex flex-row gap-4 mt-4 items-center justify-between hover:bg-accent" key={rec_harvest.id}>
                                    <div className="flex flex-row gap-6 items-center">
                                        <Checkbox id={rec_harvest.id} className="h-4 w-4 border-muted-foreground"/>
                                        <div className="flex flex-col gap-2 pr-4">
                                            <p className="text-sm">Sample from {new Date(rec_harvest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            <h1 className="text-lg font-semibold">{rec_harvest.yleld} kg - Grade {rec_harvest.quality_grade}</h1>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <div className="flex justify-end mt-4 gap-4">
                            <Button className="bg-red-600 hover:bg-red-700 ml-2">Cancel</Button>
                            <Button className="bg-green-600 hover:bg-green-700">Submit to Lab</Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lab Name</TableHead>
                                    <TableHead>Test Date</TableHead>
                                    <TableHead>Quality</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Report</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batch.lab_submission_record.map((lab_rec) => (
                                    <React.Fragment key={lab_rec.id}>
                                        <TableRow key={lab_rec.id}>
                                            <TableCell>{lab_rec.lab_name}</TableCell>
                                            <TableCell>{lab_rec.date}</TableCell>
                                            <TableCell>{lab_rec.quality_grade}</TableCell>
                                            <TableCell>{lab_rec.status}</TableCell>
                                            <TableCell>{lab_rec.report ? (typeof lab_rec.report === "string" ? lab_rec.report : lab_rec.report.name) : "-"}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button className="bg-blue-600 hover:bg-blue-700"><Pencil size={16} /></Button>
                                                <Button className="bg-red-600 hover:bg-red-700"><Trash size={16} /></Button>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                </main>
            </SidebarInset>
        </SidebarProvider >
    );
}