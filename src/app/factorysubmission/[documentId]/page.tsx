'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import React, { useState, useEffect } from "react";
import { Download, Factory, Image as ImageIcon } from "lucide-react";
import { useParams } from "next/navigation";

export default function FactoryFeedbackDetailPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [factoryData, setFactoryData] = useState<any>(null); // Initialize as null
    const params = useParams();
    const batchdocumentId = params?.documentId as string;

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem("sidebarOpen", String(!prev));
            return !prev;
        });
    };

    const handleDownloadAttachment = async (attachmentsId: string) => {
        if (!attachmentsId) {
            console.error("No attachment document ID provided for download.");
            return;
        }

        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/upload/files/${attachmentsId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch the attachment.");
            }

            const attachment = await response.json();

            const downloadUrl = `https://api-freeroll-production.up.railway.app${attachment.url}`;

            const fileRes = await fetch(downloadUrl);
            const blob = await fileRes.blob();

            // Create a download link and trigger the download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = attachment.name || "attachment";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url); // Clean up the URL object
        } catch (error) {
            console.error("Error downloading attachment:", error);
        }
    };

    const fetchFactoryData = async () => {
        try {
            const response = await fetch(
                `https://api-freeroll-production.up.railway.app/api/factory-submissions/${batchdocumentId}?populate=*`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    }
                });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            setFactoryData({
                id: data.data.Batch_id,
                documentId: data.data.documentId,
                farm_name: data.data.Farm_Name,
                grade: data.data.Quality_Grade,
                yield: data.data.Yield,
                Date_Received: data.data.Date_Received,
                Factory: data.data.Factory,
                Output_Capsules: data.data.Output_Capsules,
                Output_Essential_Oil: data.data.Output_Essential_Oil,
                used: data.data.Turmeric_Utilization_Used,
                remaining: data.data.Turmeric_Utilization_Remaining,
                waste: data.data.Turmeric_Utilization_Waste,
                Date_Processed: data.data.Date_Processed,
                Processed_By: data.data.Processed_By,
                Attachments: data.data.Attachments || [],
            });
            console.log(data.data.Attachments.length);
        } catch (error) {
            console.error("Error fetching factory data:", error);
        }
    };

    useEffect(() => {
        fetchFactoryData();
    }, [batchdocumentId]);

    if (!factoryData) {
        return <p>Loading...</p>;
    }

    const usedpercent =
        (factoryData.used /
            (factoryData.used + factoryData.remaining + factoryData.waste)) *
        100;
    const remainingpercent =
        (factoryData.remaining /
            (factoryData.used + factoryData.remaining + factoryData.waste)) *
        100;
    const wastepercent =
        (factoryData.waste /
            (factoryData.used + factoryData.remaining + factoryData.waste)) *
        100;

    const usedpercentString = `${usedpercent.toFixed(2)}%`;
    const remainingpercentString = `${remainingpercent.toFixed(2)}%`;
    const wastepercentString = `${wastepercent.toFixed(2)}%`;

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-xl font-semibold">
                            Factory Feedback Details {factoryData.id}
                        </h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Batch Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow p-6 space-y-2">
                            <h2 className="font-bold mb-2">Batch Overview</h2>
                            <div className="flex items-center justify-between">
                                <p>Batch ID: </p><p>{factoryData.id}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p>Farm Name: </p><p>{factoryData.farm_name}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p>Grade: </p><p>{factoryData.grade}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p>Yield: </p><p>{factoryData.yield} kg</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p>Date Received: </p><p>{new Date(factoryData.Date_Received).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p>Destination Factory: </p><p>{factoryData.Factory}</p>
                            </div>
                        </div>

                        {/* Processing Outcome */}
                        <div className="bg-white rounded-xl shadow p-6 space-y-2">
                            <h2 className="font-bold mb-2">Processing Outcome</h2>
                            <div className="flex items-center justify-between">
                                <p>Processing Status: </p><p className="text-green-600">Completed</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p>Date Processed: </p><p>{new Date(factoryData.Date_Processed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p>Processed By: </p><p>{factoryData.Processed_By}</p>
                            </div>
                        </div>
                    </div>

                    {/* Output Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="font-semibold mb-4">Output Summary</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded">
                                    <p className="text-blue-700 font-semibold">Capsules</p>
                                    <p className="text-xl font-bold">{factoryData.Output_Capsules}</p>
                                    <p className="text-sm">packs</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded">
                                    <p className="text-green-700 font-semibold">Essential Oil</p>
                                    <p className="text-xl font-bold">{factoryData.Output_Essential_Oil}</p>
                                    <p className="text-sm">liters</p>
                                </div>
                            </div>
                        </div>

                        {/* Turmeric Utilization */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="font-semibold mb-4">Turmeric Utilization</h2>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Used ({usedpercentString})
                                </p>
                                <div className="w-full bg-gray-200 h-2 rounded">
                                    <div
                                        className="bg-purple-600 h-2 rounded"
                                        style={{ width: `${usedpercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-right">{factoryData.used} kg</p>

                                <p className="text-sm font-medium">
                                    Remaining ({remainingpercentString})
                                </p>
                                <div className="w-full bg-gray-200 h-2 rounded">
                                    <div
                                        className="bg-green-600 h-2 rounded"
                                        style={{ width: `${remainingpercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-right">{factoryData.remaining} kg</p>

                                <p className="text-sm font-medium">
                                    Waste/Loss ({wastepercentString})
                                </p>
                                <div className="w-full bg-gray-200 h-2 rounded">
                                    <div
                                        className="bg-red-600 h-2 rounded"
                                        style={{ width: `${wastepercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-right">{factoryData.waste} kg</p>
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="font-semibold mb-4">Attachments</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {factoryData.Attachments && factoryData.Attachments.length > 0 ? (
                                factoryData.Attachments.map((attachment: any) => (
                                    console.log(attachment.id),
                                    <div
                                        key={attachment.documentId}
                                        className="flex items-center justify-between p-4 border rounded cursor-pointer"
                                        onClick={() => handleDownloadAttachment(attachment.id)}
                                    >
                                        <div>
                                            <p className="font-medium">{attachment.name}</p>
                                            <p className="text-xs text-muted-foreground">{attachment.mime}</p>
                                        </div>
                                        <Download className="w-5 h-5" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No attachments available.</p>
                            )}
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}