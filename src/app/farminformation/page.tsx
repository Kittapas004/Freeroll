'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, MapPin, Pencil, Trash } from "lucide-react";

export default function FarmInformationPage() {

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem('sidebarOpen', String(!prev));
            return !prev;
        });
    };

    type YourFarm = {
        name: string;
        address: string;
        type: string;
        size: number;
        method: string;
    };

    const yourfarms: YourFarm[] = [
        { name: 'Little Farm', address: '123 Farm Road , Mae Fah Luang', type: 'Turmeric', size: 150, method: 'Organic' },
        { name: 'Little Farm 2', address: '456 Creek Rord , Mae Fah Luang', type: 'Turmeric', size: 200, method: 'Conventional' },
    ];

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-2xl font-semibold">Farm Information</h1>
                    </div>
                </header>
                <main className="flex flex-row h-full">
                    <div className="flex-1 p-4 overflow-auto">
                        <Card className="p-4 flex flex-col gap-4">
                            <h1 className="text-lg font-semibold">Add New Farm</h1>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="farm-name" className="text-sm font-medium">Farm Name</Label>
                                    <Input type="text" id="farm-name" className="border rounded p-2" placeholder="Enter farm name" ></Input>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="farm-location" className="text-sm font-medium">Farm Address</Label>
                                    <Input type="text" id="farm-location" className="border rounded p-2" placeholder="Enter farm location"></Input>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="farm-size" className="text-sm font-medium">Farm Size</Label>
                                    <div className="flex flex-row gap-2">
                                        <Input type="number" id="farm-size" className="border rounded p-2" placeholder="Enter farm size"></Input>
                                        <select id="farm-size" className="border rounded">
                                            <option value="acres">Acres</option>
                                            <option value="rai">Rai</option>
                                        </select>
                                    </div>


                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="crop-type" className="text-sm font-medium">Crop Type</label>
                                    <select id="crop-type" className="border rounded p-2">
                                        <option value="">Select Crop type</option>
                                        <option value="turmeric">Turmeric</option>
                                        <option value="specialTurmeric">Special turmeric</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="cultivation-method" className="text-sm font-medium">Cultivation Method</label>
                                    <select id="cultivation-method" className="border rounded p-2">
                                        <option value="">Select Cultivation Method</option>
                                        <option value="organic">Organic</option>
                                        <option value="conventional">Conventional</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-start mt-4">
                                <button className="flex flex-row bg-green-500 shadow-2xl text-white px-4 py-2 rounded gap-2 hover:bg-green-800"><Save></Save>Save Details</button>
                            </div>
                        </Card>
                        <div className="mt-6">
                            <h1 className="text-lg font-semibold">Your Farms</h1>
                            {yourfarms.map((yourfarm) => (
                                <Card className="p-4 flex flex-row gap-4 mt-4 items-center justify-between hover:bg-accent" key={yourfarm.name}>
                                    <div className="flex flex-row gap-6 items-center">
                                        <MapPin className="rounded-2xl border-accent-foreground p-1 text-green-700 bg-green-200 w-10 h-10"></MapPin>
                                        <div className="flex flex-col gap-2 pr-4">
                                            <h1 className="text-lg font-semibold">{yourfarm.name}</h1>
                                            <p className="text-sm text-gray-500">{yourfarm.address}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 pr-4">
                                            <p className="text-sm text-gray-500">Crop Type</p>
                                            <h1 className="text-sm font-semibold">{yourfarm.type}</h1>
                                        </div>
                                        <div className="flex flex-col gap-2 pr-4">
                                            <p className="text-sm text-gray-500">Size</p>
                                            <h1 className="text-sm font-semibold">{yourfarm.size} Acres</h1>
                                        </div>
                                        <div className="flex flex-col gap-2 pr-4">
                                            <p className="text-sm text-gray-500">Method</p>
                                            <h1 className="text-sm font-semibold">{yourfarm.method}</h1>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4">
                                        <button className="text-blue-600"><Pencil className="hover:bg-blue-400 hover:text-white rounded-lg p-1 h-8 w-8"></Pencil></button>
                                        <button className="text-red-600"><Trash className="hover:bg-red-400 hover:text-white rounded-lg p-1 h-8 w-8"></Trash></button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
