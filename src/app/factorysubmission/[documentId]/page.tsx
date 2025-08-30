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
            // Fetch factory submission data
            const submissionResponse = await fetch(
                `https://api-freeroll-production.up.railway.app/api/factory-submissions/${batchdocumentId}?populate=*`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    }
                });
            
            if (!submissionResponse.ok) {
                throw new Error("Failed to fetch factory submission");
            }
            
            const submissionData = await submissionResponse.json();
            
            // Fetch corresponding factory processing data
            const processingResponse = await fetch(
                `https://api-freeroll-production.up.railway.app/api/factory-processings?filters[factory_submission][$eq]=${batchdocumentId}&populate=*`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    }
                });
            
            let processingData = null;
            if (processingResponse.ok) {
                const processingResult = await processingResponse.json();
                if (processingResult.data && processingResult.data.length > 0) {
                    processingData = processingResult.data[0]; // Get the first processing record
                }
            }
            
            // Combine data from both sources
            const submission = submissionData.data;
            setFactoryData({
                id: submission.Batch_id || `batch-${submission.id}`,
                documentId: submission.documentId,
                farm_name: submission.Farm_Name || 'Unknown Farm',
                grade: submission.Quality_Grade || 'N/A',
                yield: submission.Yield || 0,
                Date_Received: processingData?.Date_Received || submission.createdAt,
                Factory: submission.Factory || 'Unknown Factory',
                Output_Capsules: processingData?.Output_Capsules || 0,
                Output_Essential_Oil: processingData?.Output_Essential_Oil || 0,
                used: processingData?.Turmeric_Utilization_Used || 0,
                remaining: processingData?.Turmeric_Utilization_Remaining || 0,
                waste: processingData?.Turmeric_Utilization_Waste || 0,
                Date_Processed: processingData?.Date_Processed || null,
                Processed_By: processingData?.Processed_By || 'Unknown',
                Attachments: processingData?.Attachments || [],
                Processing_Status: processingData?.Processing_Status || 'Received',
            });
            console.log('Processing Data:', processingData);
            console.log('Attachments:', processingData?.Attachments?.length || 0);
        } catch (error) {
            console.error("Error fetching factory data:", error);
            setFactoryData(null);
        }
    };

    useEffect(() => {
        fetchFactoryData();
    }, [batchdocumentId]);

    if (!factoryData) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger onClick={toggleSidebar} />
                            <h1 className="text-xl font-semibold">Factory Feedback Details</h1>
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto p-4">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <p className="text-lg text-gray-500">Loading factory data...</p>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    const usedpercent = factoryData.used + factoryData.remaining + factoryData.waste > 0 
        ? (factoryData.used / (factoryData.used + factoryData.remaining + factoryData.waste)) * 100
        : 0;
    const remainingpercent = factoryData.used + factoryData.remaining + factoryData.waste > 0
        ? (factoryData.remaining / (factoryData.used + factoryData.remaining + factoryData.waste)) * 100
        : 0;
    const wastepercent = factoryData.used + factoryData.remaining + factoryData.waste > 0
        ? (factoryData.waste / (factoryData.used + factoryData.remaining + factoryData.waste)) * 100
        : 0;

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
                                <p>Date Received: </p><p>{factoryData.Date_Received ? new Date(factoryData.Date_Received).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
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
                                <p>Date Processed: </p><p>{factoryData.Date_Processed ? new Date(factoryData.Date_Processed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not processed yet'}</p>
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
                                factoryData.Attachments.map((attachment: any, index: number) => (
                                    <div
                                        key={attachment.id || index}
                                        className="flex items-center justify-between p-4 border rounded cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleDownloadAttachment(attachment.id)}
                                    >
                                        <div>
                                            <p className="font-medium">{attachment.name || 'Unknown file'}</p>
                                            <p className="text-xs text-muted-foreground">{attachment.mime || 'Unknown type'}</p>
                                        </div>
                                        <Download className="w-5 h-5" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 col-span-2">No attachments available.</p>
                            )}
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}