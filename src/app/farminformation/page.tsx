'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, MapPin, Pencil, Trash } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function FarmInformationPage() {
    const router = useRouter();
    const [role, setRole] = React.useState<string | "loading">("loading");
    const [farmdata, setFarmdata] = useState<Farm[]>([]);

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
        Farm_Size: number;
        Farm_Address: string;
        Farm_Name: string;
        publishedAt: string;
        Latitude: string;
        Longitude: string;
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
            setFarmdata(data.data.filter((farm: Farm) => farm.publishedAt !== null));
            return data;
        } catch (error) {
            console.error('Error fetching farms:', error);
            return [];
        }
    };

    React.useEffect(() => {
        fetchFarms();
    }, []);

    const [farmSizeUnit, setFarmSizeUnit] = useState('Acres');
    const [cropType, setCropType] = useState('');
    const [cultivationMethod, setCultivationMethod] = useState('');


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
                                        <Input type="number" id="farm-size" className="border rounded p-2" placeholder="Enter farm size" min={0}></Input>
                                        <Select defaultValue="Acres" onValueChange={(setFarmSizeUnit)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Acres">
                                                    Acres
                                                </SelectItem>
                                                <SelectItem value="Rai">
                                                    Rai
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>


                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="crop-type" className="text-sm font-medium">Crop Type</label>
                                    <Select onValueChange={(setCropType)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Crop Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Turmeric">
                                                Turmeric
                                            </SelectItem>
                                            <SelectItem value="Special Turmeric">
                                                Special Turmeric
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="Latitude" className="text-sm font-medium">Latitude (°)</Label>
                                    <Input type="text" id="Latitude" className="border rounded p-2" placeholder="Enter the latitude in decimal degrees (e.g., 15.8700)" ></Input>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="Longitude" className="text-sm font-medium">Longitude (°)</Label>
                                    <Input type="text" id="Longitude" className="border rounded p-2" placeholder="Enter the longitude in decimal degrees (e.g., 100.9925)" ></Input>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="cultivation-method" className="text-sm font-medium">Cultivation Method</label>
                                    <Select onValueChange={(setCultivationMethod)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Cultivation Method" />
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
                            </div>
                            <div className="flex justify-start mt-4">
                                <button className="flex flex-row bg-green-500 shadow-2xl text-white px-4 py-2 rounded gap-2 hover:bg-green-800"
                                    onClick={
                                        async () => {
                                            const farmName = (document.getElementById("farm-name") as HTMLInputElement).value;
                                            const farmLocation = (document.getElementById("farm-location") as HTMLInputElement).value;
                                            const farmSize = parseFloat((document.getElementById("farm-size") as HTMLInputElement).value);
                                            const latitude = parseFloat((document.getElementById("Latitude") as HTMLInputElement).value);
                                            const longitude = parseFloat((document.getElementById("Longitude") as HTMLInputElement).value);

                                            try {
                                                const response = await fetch("https://api-freeroll-production.up.railway.app/api/farms", {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                                                    },
                                                    body: JSON.stringify({
                                                        data: {
                                                            Farm_Name: farmName,
                                                            Farm_Address: farmLocation,
                                                            Farm_Size: farmSize,
                                                            Farm_Size_Unit: farmSizeUnit,
                                                            Crop_Type: cropType,
                                                            Latitude: latitude,
                                                            Longitude: longitude,
                                                            Cultivation_Method: cultivationMethod,
                                                            user_documentId: localStorage.getItem("userId"),
                                                        }
                                                    }),
                                                });
                                                if (!response.ok) {
                                                    throw new Error('Failed to create farm');
                                                }
                                                alert('Farm created successfully');
                                                fetchFarms();
                                            } catch (error) {
                                                console.error('Error creating farm:', error);
                                            }
                                        }
                                    }>
                                    <Save />Add Farm
                                </button>
                            </div>
                        </Card>
                        <div className="mt-6">
                            <h1 className="text-lg font-semibold">Your Farms</h1>
                            {farmdata.map((yourfarm) => (
                                <Card className="p-4 flex flex-row gap-2 mt-4 items-center justify-between hover:bg-accent" key={yourfarm.id}>
                                    <div className="flex flex-row gap-6 items-center w-full">
                                        <MapPin className="rounded-2xl border-accent-foreground p-1 text-green-700 bg-green-200 w-10 h-10"></MapPin>
                                        <div className="grid grid-cols-5 w-full gap-4 mt-4">
                                            <div className="flex flex-col gap-2">
                                                <h1 className="text-lg font-semibold">{yourfarm.Farm_Name}</h1>
                                                <p className="text-sm text-gray-500">{yourfarm.Farm_Address}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-gray-500">Crop Type</p>
                                                <h1 className="text-sm font-semibold">{yourfarm.Crop_Type}</h1>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-gray-500">Size</p>
                                                <h1 className="text-sm font-semibold">{yourfarm.Farm_Size} {yourfarm.Farm_Size_Unit}</h1>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-gray-500">Method</p>
                                                <h1 className="text-sm font-semibold">{yourfarm.Cultivation_Method}</h1>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-gray-500">Coordinates</p>
                                                <h1 className="text-sm font-semibold">Latitude (°): {yourfarm.Latitude}</h1>
                                                <h1 className="text-sm font-semibold">Longitude (°): {yourfarm.Longitude}</h1>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="flex gap-4">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button className="text-blue-600 bg-accent hover:bg-blue-400 hover:text-white"><Pencil /></Button>
                                            </PopoverTrigger>
                                            <PopoverContent side="left" className="w-full">
                                                <div className="p-4">
                                                    <h1 className="text-lg font-semibold mb-4">Edit Farm</h1>
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        <div className="flex flex-col gap-2">
                                                            <Label htmlFor="edit-farm-name" className="text-sm font-medium">Farm Name</Label>
                                                            <Input
                                                                type="text"
                                                                id="edit-farm-name"
                                                                className="border rounded p-2"
                                                                defaultValue={yourfarm.Farm_Name}
                                                                onChange={(e) => (yourfarm.Farm_Name = e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label htmlFor="edit-farm-location" className="text-sm font-medium">Farm Address</Label>
                                                            <Input
                                                                type="text"
                                                                id="edit-farm-location"
                                                                className="border rounded p-2"
                                                                defaultValue={yourfarm.Farm_Address}
                                                                onChange={(e) => (yourfarm.Farm_Address = e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label htmlFor="edit-farm-size" className="text-sm font-medium">Farm Size</Label>
                                                            <div className="flex flex-row gap-2">
                                                                <Input
                                                                    type="number"
                                                                    id="edit-farm-size"
                                                                    className="border rounded p-2"
                                                                    defaultValue={yourfarm.Farm_Size}
                                                                    onChange={(e) => (yourfarm.Farm_Size = parseFloat(e.target.value))}
                                                                />
                                                                <Select
                                                                    defaultValue={yourfarm.Farm_Size_Unit}
                                                                    onValueChange={(value) => (yourfarm.Farm_Size_Unit = value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Acres">Acres</SelectItem>
                                                                        <SelectItem value="Rai">Rai</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label htmlFor="edit-crop-type" className="text-sm font-medium">Crop Type</Label>
                                                            <Select
                                                                defaultValue={yourfarm.Crop_Type}
                                                                onValueChange={(value) => (yourfarm.Crop_Type = value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Turmeric">Turmeric</SelectItem>
                                                                    <SelectItem value="Special Turmeric">Special Turmeric</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label htmlFor="edit-Longitude" className="text-sm font-medium">Longitude</Label>
                                                            <Input
                                                                type="text"
                                                                id="edit-Longitude"
                                                                className="border rounded p-2"
                                                                defaultValue={yourfarm.Longitude}
                                                                onChange={(e) => (yourfarm.Longitude = e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label htmlFor="edit-Latitude" className="text-sm font-medium">Latitude</Label>
                                                            <Input
                                                                type="text"
                                                                id="edit-Latitude"
                                                                className="border rounded p-2"
                                                                defaultValue={yourfarm.Latitude}
                                                                onChange={(e) => (yourfarm.Latitude = e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label htmlFor="edit-cultivation-method" className="text-sm font-medium">Cultivation Method</Label>
                                                            <Select
                                                                defaultValue={yourfarm.Cultivation_Method}
                                                                onValueChange={(value) => (yourfarm.Cultivation_Method = value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Organic">Organic</SelectItem>
                                                                    <SelectItem value="Conventional">Conventional</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end mt-4">
                                                        <Button
                                                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-800"
                                                            onClick={async () => {
                                                                try {
                                                                    const response = await fetch(`https://api-freeroll-production.up.railway.app/api/farms/${yourfarm.documentId}`, {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                                                                        },
                                                                        body: JSON.stringify({
                                                                            data: {
                                                                                Farm_Name: yourfarm.Farm_Name,
                                                                                Farm_Address: yourfarm.Farm_Address,
                                                                                Farm_Size: yourfarm.Farm_Size,
                                                                                Farm_Size_Unit: yourfarm.Farm_Size_Unit,
                                                                                Crop_Type: yourfarm.Crop_Type,
                                                                                Cultivation_Method: yourfarm.Cultivation_Method,
                                                                                Latitude: yourfarm.Latitude,
                                                                                Longitude: yourfarm.Longitude,
                                                                            }
                                                                        }),
                                                                    });
                                                                    if (!response.ok) {
                                                                        throw new Error('Failed to update farm');
                                                                    }
                                                                    alert('Farm updated successfully');
                                                                    fetchFarms();
                                                                } catch (error) {
                                                                    console.error('Error updating farm:', error);
                                                                }
                                                            }}
                                                        >
                                                            Save Changes
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            className="text-red-600 bg-accent hover:bg-red-400 hover:text-white"
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to delete this farm? This action cannot be undone.")) {
                                                    (async () => {
                                                        try {
                                                            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/farms/${yourfarm.documentId}`, {
                                                                method: 'DELETE',
                                                                headers: {
                                                                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                                                                },
                                                            });
                                                            if (!response.ok) {
                                                                throw new Error('Failed to delete farm');
                                                            }
                                                            setFarmdata(farmdata.filter(farm => farm.documentId !== yourfarm.documentId));
                                                        } catch (error) {
                                                            console.error('Error deleting farm:', error);
                                                        }
                                                    })();
                                                }
                                            }}
                                        >
                                            <Trash />
                                        </Button>
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
