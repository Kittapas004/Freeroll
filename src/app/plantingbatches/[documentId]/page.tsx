'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Sprout, Leaf, Plus, Wrench, FlaskConical, Notebook, Check, ChartSpline, Star, SquarePen, Trash, Circle, ChevronDown, ChevronUp, Pencil, EllipsisVertical, Tractor, Settings, Package, BarChart, FileText, Scale, Beaker, BarChart3, Droplets, RotateCcw, Timer, Repeat, History, ChevronRight, ChevronLeft, SprayCan, Microscope, Clock, User, Printer } from "lucide-react";
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
import { useParams, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";


export default function PlantingBatchDetail() {
    const searchParams = useSearchParams();
    const { documentId } = useParams();
    const router = useRouter();
    console.log("Document ID:", documentId);
    type Batches = {
        batches_id: string;
        planting_date: string;
        plant_variety: string;
        cultivation_method: string;
        status: string;
        location: string;
        farm_id: string;
        image: string;
        Farm_Status: string;
        completion_timestamp?: string; // Add completion timestamp field
        soil_pH?: number;
        soil_quality?: string;
        water_source?: string;
        labor_cost?: number;
        material_cost?: number;
        other_costs?: number;
        total_planting_cost?: number;
        recent_fertilizer_record: {
            id: string;
            documentId: string;
            date: string;
            fertilizer_type: string;
            amount: number;
            size: number;
            note: string;
            method: string;
            unit: string;
            fertilizer_cost?: number;
            application_labor_cost?: number;
            total_fertilizer_cost?: number;
        }[];
        recent_harvest_record: {
            id: string;
            documentId: string;
            date: string;
            yleld: number;
            quality_grade: string;
            method: string;
            note: string;
            result_type: string;
            curcumin_quality: string;
            yleld_unit: string;
            status: string;
            lab_status: string;
            // Cost tracking fields
            labor_cost?: number;
            equipment_cost?: number;
            total_harvest_cost?: number;
            // KaminCAL fields
            kamincal_sample_name?: string;
            kamincal_plant_weight?: number;
            kamincal_solvent_volume?: number;
            kamincal_average_od?: number;
            kamincal_concentration?: number;
            kamincal_number_of_replications?: number;
            kamincal_first_time?: number;
            kamincal_analytical_instrument?: string;
            kamincal_second_time?: number;
            kamincal_curcuminoid_content?: string;
            kamincal_curcuminoid_percentage?: number;
            kamincal_third_time?: number;
        }[];
        lab_submission_record: {
            id: string;
            documentId: string;
            date: string;
            lab_name: string;
            quality_grade: string;
            status: string;
            harvest_record: string;
            report: string | null;
            exported?: boolean; // ⭐ เพิ่มฟิลด์นี้
            export_status?: string; // ⭐ เพิ่มฟิลด์นี้
            export_date?: string; // ⭐ เพิ่มฟิลด์นี้
            testing_method?: string; // ⭐ เพิ่มฟิลด์นี้
        }[];
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

    type KaminCALData = {
        sample_name: string;
        plant_weight: string;
        solvent_volume: string;
        average_od: string;
        concentration: string;
        number_of_replications: string;
        first_time: string;
        analytical_instrument: string;
        second_time: string;
        curcuminoid_content: string;
        curcuminoid_percentage: string;
        third_time: string;
    };

    const tabs = [
        { name: "Fertilizer", icon: <Sprout size={16} />, key: "fertilizer" },
        { name: "Harvest", icon: <Wrench size={16} />, key: "harvest" },
        { name: "Lab History", icon: <History size={16} />, key: "lab" },
        { name: "GAP", icon: <FileText size={16} />, key: "gap" }
    ];

    const [PlantingBatches, setPlantingBatches] = useState<Batches | null>(null);
    const [farmdata, setFarmdata] = useState<Farm[]>([]);
    const [currentFarm, setCurrentFarm] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [labdata, setLabdata] = useState<any[]>([]);

    const fetchUserData = async () => {
        try {
            const userId = localStorage.getItem("userId");
            const jwt = localStorage.getItem("jwt");
            
            if (!userId) {
                console.log("No userId found in localStorage");
                return;
            }

            if (!jwt) {
                console.log("No JWT token found in localStorage");
                return;
            }

            console.log("Fetching user data for userId:", userId);
            
            // ลอง endpoint ที่ง่ายกว่าก่อน
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'Content-Type': 'application/json',
                },
            });
            
            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);
            
            if (!response.ok) {
                console.error("API request failed with status:", response.status);
                const errorText = await response.text();
                console.error("Error response:", errorText);
                return;
            }
            
            const data = await response.json();
            setCurrentUser(data);
            console.log("User data fetched successfully:", data);
        } catch (error) {
            console.error("Error in fetchUserData:", error);
        }
    };

    const fetchLabData = async () => {
        try {
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/labs?populate=*`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch lab data");
            const data = await response.json();
            setLabdata(data.data.map((lab: any) => ({
                id: lab.id,
                documentId: lab.documentId,
                Lab_name: lab.Lab_Name,
            })));
        }
        catch (error) {
            console.error("Error fetching lab data:", error);
        }
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


    // ฟังก์ชันสำหรับสร้าง URL รูปภาพ (เพิ่มในโค้ด)
    const getBatchImageUrl = (batchImage: any) => {
        if (!batchImage) return "";

        console.log("🖼️ Batch image data:", batchImage);

        // ลองหลายรูปแบบของ Strapi structure
        const possibleUrls = [
            batchImage.url,                                    // Direct URL
            batchImage.data?.attributes?.url,                  // Strapi v4 structure  
            batchImage.data?.attributes?.formats?.large?.url,  // Large format
            batchImage.data?.attributes?.formats?.medium?.url, // Medium format
            batchImage.data?.attributes?.formats?.small?.url,  // Small format
        ];

        const validUrl = possibleUrls.find(url => url);
        console.log("🔗 Found batch image URL:", validUrl);

        if (validUrl) {
            // ตรวจสอบว่าเป็น full URL หรือไม่
            if (validUrl.startsWith('http')) {
                return validUrl;
            } else {
                return `https://api-freeroll-production.up.railway.app${validUrl}`;
            }
        }

        return "";
    };

    // ใน fetchPlantingBatches function แก้ไขเป็น:
    const fetchPlantingBatches = async () => {
        try {
            console.log("Fetching data for documentId:", documentId);
            const res = await fetch(
                `https://api-freeroll-production.up.railway.app/api/batches/${documentId}?` +
                `populate[Farm][populate]=*&` +
                `populate[Batch_image][populate]=*&` +
                `populate[lab_submission_records][populate]=*&` +
                `populate[harvest_records][populate]=*&` +
                `populate[fertilizer_records][populate]=*`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch data");

            const data = await res.json();
            console.log("Fetched data:", data);
            console.log("🖼️ Batch_image structure:", data.data.Batch_image);
            console.log("🧪 Batch additional data:", {
                soil_pH: data.data.soil_pH,
                Soil_pH: data.data.Soil_pH,
                soil_quality: data.data.soil_quality,
                Soil_Quality: data.data.Soil_Quality,
                water_source: data.data.water_source,
                Water_Source: data.data.Water_Source,
                labor_cost: data.data.labor_cost,
                Labor_Cost: data.data.Labor_Cost,
                material_cost: data.data.material_cost,
                Material_Cost: data.data.Material_Cost,
                other_costs: data.data.other_costs,
                Other_Costs: data.data.Other_Costs
            });

            const batch = data.data;

            setPlantingBatches({
                batches_id: batch.Batch_id,
                planting_date: batch.Date_of_Planting,
                plant_variety: batch.Plant_Variety,
                cultivation_method: batch.Cultivation_Method,
                status: batch.Batch_Status,
                farm_id: batch.Farm.documentId,
                location: batch.Farm.Farm_Name ?? "N/A",
                Farm_Status: batch.Farm.Farm_Status,
                completion_timestamp: batch.completion_timestamp, // Add completion timestamp
                image: getBatchImageUrl(batch.Batch_image),
                // เพิ่มข้อมูลใหม่ที่เพิ่มใน Add dialog - ใช้ชื่อ field ที่ถูกต้องจาก Strapi
                soil_pH: batch.soil_pH || batch.Soil_pH || 0,
                soil_quality: batch.soil_quality || batch.Soil_Quality || "",
                water_source: batch.water_source || batch.Water_Source || "",
                labor_cost: batch.labor_cost || batch.Labor_Cost || 0,
                material_cost: batch.material_cost || batch.Material_Cost || 0,
                other_costs: batch.other_costs || batch.Other_Costs || 0,
                total_planting_cost: batch.total_planting_cost || batch.Total_Planting_Cost || 0,
                recent_fertilizer_record: batch.fertilizer_records.map((record: any) => ({
                    id: record.id,
                    documentId: record.documentId,
                    date: record.Date,
                    fertilizer_type: record.Fertilizer_type,
                    amount: record.Quantity_applied,
                    size: record.Size,
                    note: record.Note || "",
                    method: record.Method,
                    unit: record.Quantity_applied_unit,
                    fertilizer_cost: record.Fertilizer_Cost || 0,
                    application_labor_cost: record.Application_Labor_Cost || 0,
                    total_fertilizer_cost: record.Total_Fertilizer_Cost || 0,
                })),
                recent_harvest_record: batch.harvest_records.map((record: any) => ({
                    id: record.id,
                    documentId: record.documentId,
                    date: record.Date,
                    yleld: record.yleld,
                    quality_grade: record.quality_grade,
                    method: record.Method,
                    note: record.Note || "",
                    result_type: record.Result_type,
                    curcumin_quality: record.Curcumin_quality,
                    yleld_unit: record.Yleld_unit,
                    lab_status: record.Submission_status,
                    // เพิ่มข้อมูล KaminCAL
                    kamincal_sample_name: record.kamincal_sample_name || "",
                    kamincal_plant_weight: record.kamincal_plant_weight || 0,
                    kamincal_solvent_volume: record.kamincal_solvent_volume || 0,
                    kamincal_average_od: record.kamincal_average_od || 0,
                    kamincal_concentration: record.kamincal_concentration || 0,
                    kamincal_number_of_replications: record.kamincal_number_of_replications || 0,
                    kamincal_first_time: record.kamincal_first_time || 0,
                    kamincal_analytical_instrument: record.kamincal_analytical_instrument || "UV-Vis",
                    kamincal_second_time: record.kamincal_second_time || 0,
                    kamincal_curcuminoid_content: record.kamincal_curcuminoid_content || "",
                    kamincal_curcuminoid_percentage: record.kamincal_curcuminoid_percentage || 0,
                    kamincal_third_time: record.kamincal_third_time || 0,
                    // เพิ่ม Harvest Cost Tracking
                    labor_cost: record.labor_cost || 0,
                    equipment_cost: record.equipment_cost || 0,
                    total_harvest_cost: record.total_harvest_cost || 0,
                })),
                lab_submission_record: batch.lab_submission_records.map((record: any) => ({
                    id: record.id,
                    documentId: record.documentId,
                    date: record.Date,
                    lab_name: record.lab.Lab_Name,
                    quality_grade: record.Quality_grade,
                    status: record.Submission_status,
                    harvest_record: record.harvest_record.documentId,
                    report: record.Report?.[0]?.url
                        ? `https://api-freeroll-production.up.railway.app${record.Report[0].url}`
                        : "",
                    exported: record.exported || false,
                    export_status: record.export_status || 'Unknown',
                    export_date: record.export_date || null,
                    testing_method: record.testing_method
                })),
            });
            
            // Fetch farm data for this batch
            if (batch.Farm?.documentId) {
                try {
                    const farmRes = await fetch(`https://api-freeroll-production.up.railway.app/api/farms/${batch.Farm.documentId}?populate=*`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                        },
                    });
                    if (farmRes.ok) {
                        const farmData = await farmRes.json();
                        setCurrentFarm(farmData.data);
                    }
                } catch (error) {
                    console.error("Error fetching farm data:", error);
                }
            }
            
            return data
        }
        catch (error) {
            console.error("Error fetching data:", error);
            return null;
        }
    };

    const fertilizer_createdata = async () => {
        try {
            if (parseFloat(fertilizer_formData.amount) < 0 || parseFloat(fertilizer_formData.size) < 0) {
                alert("Values cannot be negative!");
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/fertilizer-records`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Date: fertilizer_formData.date,
                        Fertilizer_type: fertilizer_formData.fertilizer_type,
                        Quantity_applied: parseFloat(fertilizer_formData.amount),
                        Size: parseFloat(fertilizer_formData.size),
                        Method: fertilizer_formData.method,
                        Note: fertilizer_formData.note || "",
                        Quantity_applied_unit: fertilizer_formData.unit,
                        Fertilizer_Cost: parseFloat(fertilizer_formData.fertilizer_cost) || 0,
                        Application_Labor_Cost: parseFloat(fertilizer_formData.application_labor_cost) || 0,
                        Total_Fertilizer_Cost: (parseFloat(fertilizer_formData.fertilizer_cost) || 0) + (parseFloat(fertilizer_formData.application_labor_cost) || 0),
                        batch: documentId,
                    }
                })
            });
            try {
                const res_notification = await fetch(`https://api-freeroll-production.up.railway.app/api/notifications`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: {
                            Text: `A new fertilizer record has been created`,
                            Date: new Date().toISOString(),
                            Notification_status: "General",
                            batch: documentId,
                            user_documentId: localStorage.getItem("userId"),
                        }
                    })
                });
                if (!res_notification.ok) throw new Error("Failed to create notification record");
                const update_status_res = await fetch(`https://api-freeroll-production.up.railway.app/api/farms/${PlantingBatches?.farm_id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: {
                            Farm_Status: "Fertilized",
                        }
                    })
                });
                if (!update_status_res.ok) throw new Error("Failed to update Farm Status")
            } catch (error) {
                console.error("Error creating notification record:", error);
            }
            if (!res.ok) throw new Error("Failed to create fertilizer record");
            const data = await res.json();
            console.log("Fertilizer record created:", data);

            setIsAdding(false);
            setfertilizerFormData({
                date: "",
                amount: "",
                size: "",
                fertilizer_type: "",
                method: "",
                note: "",
                unit: "kg",
                fertilizer_cost: "",
                application_labor_cost: "",
            });
            // Optionally, you can show a success message or perform any other actions here
            console.log("Fertilizer record created successfully!");
            alert("Fertilizer record created successfully!");
            // Refetch the planting batches to update the state
            await fetchPlantingBatches();

        } catch (error) {
            console.error("Error creating fertilizer record:", error);
            // Handle error (e.g., show a notification)
            // Optionally, you can also show an error message or perform any other actions here
        }
    };

    const harvest_createdata = async () => {
        try {
            if (parseFloat(harvest_formData.yleld) < 0 || parseFloat(harvest_formData.curcumin_quality) < 0) {
                alert("Values cannot be negative!");
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/harvest-records`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Date: harvest_formData.date,
                        Method: harvest_formData.method,
                        yleld: parseFloat(harvest_formData.yleld),
                        quality_grade: harvest_formData.quality_grade,
                        Note: harvest_formData.note || "",
                        Result_type: harvest_formData.result_type,
                        Curcumin_quality: parseFloat(harvest_formData.curcumin_quality),
                        Yleld_unit: harvest_formData.yleld_unit,
                        Submission_status: "Waiting",
                        batch: documentId,
                        // เพิ่มข้อมูล KaminCAL
                        kamincal_sample_name: kaminCALData.sample_name || "",
                        kamincal_plant_weight: parseFloat(kaminCALData.plant_weight) || 0,
                        kamincal_solvent_volume: parseFloat(kaminCALData.solvent_volume) || 0,
                        kamincal_average_od: parseFloat(kaminCALData.average_od) || 0,
                        kamincal_concentration: parseFloat(kaminCALData.concentration) || 0,
                        kamincal_number_of_replications: parseInt(kaminCALData.number_of_replications) || 0,
                        kamincal_first_time: parseFloat(kaminCALData.first_time) || 0,
                        kamincal_analytical_instrument: kaminCALData.analytical_instrument || "HPLC",
                        kamincal_second_time: parseFloat(kaminCALData.second_time) || 0,
                        kamincal_curcuminoid_content: kaminCALData.curcuminoid_content || "",
                        kamincal_curcuminoid_percentage: parseFloat(kaminCALData.curcuminoid_percentage) || 0,
                        kamincal_third_time: parseFloat(kaminCALData.third_time) || 0,
                        // เพิ่ม Harvest Cost Tracking
                        labor_cost: parseFloat(harvest_formData.labor_cost) || 0,
                        equipment_cost: parseFloat(harvest_formData.equipment_cost) || 0,
                        total_harvest_cost: (parseFloat(harvest_formData.labor_cost) || 0) + (parseFloat(harvest_formData.equipment_cost) || 0),
                    }
                })
            });
            try {
                const res_notification = await fetch(`https://api-freeroll-production.up.railway.app/api/notifications`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: {
                            Text: `A new harvest record has been created`,
                            Date: new Date().toISOString(),
                            Notification_status: "General",
                            batch: documentId,
                            user_documentId: localStorage.getItem("userId"),
                        }
                    })
                });
                if (!res_notification.ok) throw new Error("Failed to create notification record");
            } catch (error) {
                console.error("Error creating notification record:", error);
            }

            const update_status_res = await fetch(`https://api-freeroll-production.up.railway.app/api/farms/${PlantingBatches?.farm_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Farm_Status: "Harvested",
                    }
                })
            });
            if (!update_status_res.ok) throw new Error("Failed to update Farm Status")
            if (!res.ok) throw new Error("Failed to create harvest record");
            const data = await res.json();
            console.log("Harvest record created:", data);

            setIsAdding(false);
            setHarvestFormData({
                date: "",
                yleld: "",
                quality_grade: "",
                method: "",
                note: "",
                result_type: "UV Spectroscopy",
                curcumin_quality: "",
                yleld_unit: "kg",
                labor_cost: "",
                equipment_cost: "",
            });
            // Optionally, you can show a success message or perform any other actions here
            console.log("Harvest record created successfully!");
            alert("Harvest record created successfully!");
            // Refetch the planting batches to update the state
            await fetchPlantingBatches();

        }
        catch (error) {
            console.error("Error creating harvest record:", error);
        }
    };

    const handleKaminCALChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setKaminCALData({ ...kaminCALData, [name]: value });
    };

    const handleSubmitToLab = async () => {
        try {
            if (!selectedLab) {
                alert("Please select a lab name.");
                return;
            }

            if (selectedSamples.length === 0) {
                alert("Please select at least one sample to submit.");
                return;
            }

            if (!PlantingBatches) {
                alert("PlantingBatches data is not available.");
                return;
            }

            console.log('=== DEBUG SUBMIT TO LAB ===');
            console.log('Selected Lab:', selectedLab);
            console.log('Selected Samples:', selectedSamples);
            console.log('Document ID:', documentId);

            // Map through selected samples and create a lab submission record for each
            await Promise.all(
                selectedSamples.map(async (sampleId) => {
                    const sample = PlantingBatches.recent_harvest_record.find(
                        (rec_harvest) => rec_harvest.documentId === sampleId
                    );

                    if (!sample) {
                        console.error(`Sample with ID ${sampleId} not found.`);
                        throw new Error(`Sample with ID ${sampleId} not found in harvest records.`);
                    }

                    console.log('Creating lab submission for sample:', sample);

                    const submitData = {
                        data: {
                            Quality_grade: sample.quality_grade,
                            Submission_status: "Pending",
                            Date: new Date().toISOString(),
                            Report: null,
                            batch: documentId,
                            harvest_record: sampleId,
                            lab: selectedLab,
                        },
                    };

                    console.log('Submission data:', submitData);

                    const res = await fetch(`https://api-freeroll-production.up.railway.app/api/lab-submission-records`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                        },
                        body: JSON.stringify(submitData),
                    });

                    console.log('Lab submission response status:', res.status);

                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error('Lab submission error response:', errorText);
                        throw new Error(`Failed to create lab submission record for sample ID: ${sampleId}. Status: ${res.status}, Error: ${errorText}`);
                    }

                    const responseData = await res.json();
                    console.log('Lab submission created successfully:', responseData);

                    // Update the harvest record status to "Pending"
                    console.log('Updating harvest record status...');
                    const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/harvest-records/${sampleId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                        },
                        body: JSON.stringify({
                            data: {
                                Submission_status: "Pending",
                            },
                        }),
                    });

                    if (!updateRes.ok) {
                        const updateErrorText = await updateRes.text();
                        console.error('Update harvest record error:', updateErrorText);
                        throw new Error(`Failed to update harvest record with ID: ${sampleId}. Status: ${updateRes.status}, Error: ${updateErrorText}`);
                    }

                    // Create notification
                    try {
                        const submitted_notification = await fetch(`https://api-freeroll-production.up.railway.app/api/notifications`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                            },
                            body: JSON.stringify({
                                data: {
                                    Text: `A new lab submission has been created for sample ${sampleId}`,
                                    Date: new Date().toISOString(),
                                    Notification_status: "General",
                                    batch: documentId,
                                    user_documentId: localStorage.getItem("userId"),
                                }
                            })
                        });

                        if (!submitted_notification.ok) {
                            console.error("Failed to create notification, but continuing...");
                        }
                    } catch (notificationError) {
                        console.error("Notification creation failed, but continuing:", notificationError);
                    }
                })
            );

            alert("Samples submitted to the lab successfully!");
            setSelectedSamples([]); // Clear the selection
            await fetchPlantingBatches(); // Refresh the data

        } catch (error) {
            console.error("Error submitting samples to the lab:", error);
            alert(`"Failed to submit samples to the lab. Please try again."`);
        }
    };

    const handleDeleteLabRecord = async (recordId: string, harvest_record: string) => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this lab record?");
            if (!confirmDelete) {
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/lab-submission-records/${recordId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (res.ok) {
                const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/harvest-records/${harvest_record}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: {
                            Submission_status: "Waiting",
                        },
                    }),
                });

                if (!updateRes.ok) throw new Error("Failed to update harvest record status");
            }

            if (!res.ok) throw new Error("Failed to delete lab record");
            if (res.status !== 204) { // Check if the response has content
                const data = await res.json();
                console.log("Lab record deleted:", data);
            }
            alert("Lab record deleted successfully!");
            await fetchPlantingBatches();
        } catch (error) {
            console.error("Error deleting lab record:", error);
            alert("Failed to delete lab record. Please try again.");
        }
    };

    const handleDeleteHarvestRecord = async (recordId: string) => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this harvest record?");
            if (!confirmDelete) {
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/harvest-records/${recordId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (res.ok) {
                alert("Harvest record deleted successfully!");
                await fetchPlantingBatches();
            } else {
                throw new Error("Failed to delete harvest record");
            }
        } catch (error) {
            console.error("Error deleting harvest record:", error);
            alert("Failed to delete harvest record. Please try again.");
        }
    };

    const handleDeleteFertilizerRecord = async (recordId: string) => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this fertilizer record?");
            if (!confirmDelete) {
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/fertilizer-records/${recordId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (res.ok) {
                alert("Fertilizer record deleted successfully!");
                await fetchPlantingBatches();
            } else {
                throw new Error("Failed to delete fertilizer record");
            }
        } catch (error) {
            console.error("Error deleting fertilizer record:", error);
            alert("Failed to delete fertilizer record. Please try again.");
        }
    };

    const handleDeleteBatch = async () => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this batch? This action cannot be undone.");
            if (!confirmDelete) {
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${documentId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (res.ok) {
                alert("Batch deleted successfully!");
                router.push("/plantingbatches");
            } else {
                throw new Error("Failed to delete batch");
            }
        } catch (error) {
            console.error("Error deleting batch:", error);
            alert("Failed to delete batch. Please try again.");
        }
    }

    const handleUpdateFertilizerRecord = async () => {
        try {
            if (!editingRecord) {
                alert("No record selected for editing.");
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/fertilizer-records/${editingRecord.documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Date: fertilizer_formData.date,
                        Fertilizer_type: fertilizer_formData.fertilizer_type,
                        Quantity_applied: parseFloat(fertilizer_formData.amount),
                        Size: parseFloat(fertilizer_formData.size),
                        Method: fertilizer_formData.method,
                        Note: fertilizer_formData.note || "",
                        Quantity_applied_unit: fertilizer_formData.unit,
                        Fertilizer_Cost: parseFloat(fertilizer_formData.fertilizer_cost) || 0,
                        Application_Labor_Cost: parseFloat(fertilizer_formData.application_labor_cost) || 0,
                        Total_Fertilizer_Cost: (parseFloat(fertilizer_formData.fertilizer_cost) || 0) + (parseFloat(fertilizer_formData.application_labor_cost) || 0),
                    },
                }),
            });

            if (!res.ok) throw new Error("Failed to update fertilizer record");

            alert("Fertilizer record updated successfully!");
            setIsEditing(false);
            setEditingRecord(null);
            await fetchPlantingBatches(); // Refresh the data
            await fetchUserData(); // Refresh user data
        } catch (error) {
            console.error("Error updating fertilizer record:", error);
            alert("Failed to update fertilizer record. Please try again.");
        }
    };

    const handleUpdateBatch = async () => {
        try {
            if (!PlantingBatches) {
                alert("No batch data available to update.");
                return;
            }

            let imageId = null;

            // Check if a new image is selected for upload
            if (imageInputRef.current?.files?.[0]) {
                const formData = new FormData();
                formData.append("files", imageInputRef.current.files[0]);

                const uploadRes = await fetch("https://api-freeroll-production.up.railway.app/api/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error("Failed to upload image");
                }

                const uploadData = await uploadRes.json();
                imageId = uploadData[0]?.id; // Get the uploaded image ID
            }

            // Prepare the updated data - รวม cost fields ที่ผู้ใช้อาจแก้ไข
            const updatedData: any = {
                Date_of_Planting: PlantingBatches.planting_date,
                Plant_Variety: PlantingBatches.plant_variety,
                Cultivation_Method: PlantingBatches.cultivation_method,
                // Cost tracking fields
                Soil_pH: PlantingBatches.soil_pH,
                Soil_Quality: PlantingBatches.soil_quality,
                Water_Source: PlantingBatches.water_source,
                Labor_Cost: PlantingBatches.labor_cost,
                Material_Cost: PlantingBatches.material_cost,
                Other_Costs: PlantingBatches.other_costs,
                Total_Planting_Cost: PlantingBatches.total_planting_cost
            };

            console.log("Complete data being sent:", updatedData);

            // Include the uploaded image ID if available
            if (imageId) {
                updatedData.Batch_image = imageId;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({ data: updatedData }),
            });

            if (!res.ok) {
                const errorData = await res.json(); // Parse the error response
                console.error("Server error:", errorData);
                console.error("Status:", res.status);
                console.error("Status Text:", res.statusText);
                throw new Error(`Failed to update batch: ${JSON.stringify(errorData)}`);
            }

            alert("Batch updated successfully!");
            setIsDialogOpen(false);
            setCurrentStep(1);
            setImagePreview(null);
            await fetchPlantingBatches(); // Refresh the data
        } catch (error) {
            console.error("Error updating batch:", error);
            alert("Failed to update batch. Please try again.");
        }
    };

    const handleNext = () => {
        setCurrentStep(2);
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleCancel = () => {
        setIsDialogOpen(false);
        setCurrentStep(1);
        setImagePreview(null);
    };

    const handleUpdateHarvestRecord = async () => {
        try {
            if (!editingRecord) {
                alert("No record selected for editing.");
                return;
            }

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/harvest-records/${editingRecord.documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Date: harvest_formData.date,
                        Method: harvest_formData.method,
                        yleld: parseFloat(harvest_formData.yleld),
                        quality_grade: harvest_formData.quality_grade,
                        Note: harvest_formData.note || "",
                        Result_type: harvest_formData.result_type,
                        Curcumin_quality: parseFloat(harvest_formData.curcumin_quality),
                        Yleld_unit: harvest_formData.yleld_unit,
                        // Add KaminCAL data to the update
                        kamincal_sample_name: kaminCALData.sample_name || "",
                        kamincal_plant_weight: parseFloat(kaminCALData.plant_weight) || 0,
                        kamincal_solvent_volume: parseFloat(kaminCALData.solvent_volume) || 0,
                        kamincal_average_od: parseFloat(kaminCALData.average_od) || 0,
                        kamincal_concentration: parseFloat(kaminCALData.concentration) || 0,
                        kamincal_number_of_replications: parseInt(kaminCALData.number_of_replications) || 0,
                        kamincal_first_time: parseFloat(kaminCALData.first_time) || 0,
                        kamincal_analytical_instrument: kaminCALData.analytical_instrument || "UV-Vis",
                        kamincal_second_time: parseFloat(kaminCALData.second_time) || 0,
                        kamincal_curcuminoid_content: kaminCALData.curcuminoid_content || "",
                        kamincal_curcuminoid_percentage: parseFloat(kaminCALData.curcuminoid_percentage) || 0,
                        kamincal_third_time: parseFloat(kaminCALData.third_time) || 0,
                        // เพิ่ม Harvest Cost Tracking
                        labor_cost: parseFloat(harvest_formData.labor_cost) || 0,
                        equipment_cost: parseFloat(harvest_formData.equipment_cost) || 0,
                        total_harvest_cost: (parseFloat(harvest_formData.labor_cost) || 0) + (parseFloat(harvest_formData.equipment_cost) || 0),
                    },
                }),
            });

            if (!res.ok) throw new Error("Failed to update harvest record");

            alert("Harvest record updated successfully!");
            setIsEditing(false);
            setEditingRecord(null);
            // Reset KaminCAL data
            setKaminCALData({
                sample_name: "",
                plant_weight: "",
                solvent_volume: "",
                average_od: "",
                concentration: "",
                number_of_replications: "",
                first_time: "",
                analytical_instrument: "UV-Vis",
                second_time: "",
                curcuminoid_content: "Pass",
                curcuminoid_percentage: "",
                third_time: "",
            });
            await fetchPlantingBatches(); // Refresh the data
        } catch (error) {
            console.error("Error updating harvest record:", error);
            alert("Failed to update harvest record. Please try again.");
        }
    };

    React.useEffect(() => {
        console.log("useEffect triggered");
        fetchLabData();
        fetchFarms();
        fetchPlantingBatches();
        fetchUserData(); // เปิดกลับมา
    }, []);

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
    }, [PlantingBatches]); // Re-run when PlantingBatches data changes
    const [activeTab, setActiveTab] = useState("fertilizer");
    const [expandedRow, setExpandedRow] = useState<string | number | null>(null);
    const toggleRow = (id: string | number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handleTabChange = (tabKey: string) => {
        setActiveTab(tabKey);
    };

    const handlePrintGAP = () => {
        // สร้าง iframe สำหรับ print แทน window.open
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-1000px';
        printFrame.style.left = '-1000px';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);

        const gapContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>GAP Certification Report</title>
    <style>
        @page {
            margin: 20mm 15mm 15mm 15mm;
            size: A4;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.3;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        .main-header {
            text-align: left;
            margin-bottom: 30px;
            padding: 20px 20px 0 20px;
            page-break-inside: avoid;
            page-break-after: avoid;
        }
        .main-header h1 {
            color: #22c55e;
            margin: 0 0 5px 0;
            font-size: 24px;
            font-weight: bold;
        }
        .main-header p {
            margin: 3px 0;
            color: #666;
            font-size: 13px;
        }
        .main-header .separator {
            border-bottom: 3px solid #22c55e;
            margin: 15px 0 0 0;
            width: 100%;
        }
        .page-header {
            display: none;
        }
        @media print {
            body { 
                print-color-adjust: exact;
            }
            .page-header {
                display: block;
                text-align: left;
                padding: 10px 20px 15px 20px;
                margin-bottom: 20px;
                position: relative;
            }
            .page-header h1 {
                color: #22c55e;
                margin: 0 0 5px 0;
                font-size: 20px;
                font-weight: bold;
            }
            .page-header p {
                margin: 2px 0;
                color: #666;
                font-size: 11px;
            }
            .page-header .separator {
                border-bottom: 2px solid #22c55e;
                margin: 10px 0 0 0;
                width: 100%;
            }
            .main-header {
                display: none;
            }
            .content {
                padding: 0 20px;
            }
        }
        .content {
            padding: 0 20px 20px 20px;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .section h2 {
            background-color: #f8f9fa;
            padding: 8px 12px;
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #333;
            border-left: 4px solid #22c55e;
            page-break-after: avoid;
        }
        .section:nth-child(n+4) {
            page-break-before: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            vertical-align: top;
        }
        .label {
            background-color: #f8f9fa;
            font-weight: bold;
            width: 150px;
        }
        .value {
            background-color: white;
        }
        .cost-table {
            margin-top: 10px;
        }
        .cost-table td {
            text-align: center;
        }
        .cost-table .label {
            text-align: left;
            width: 120px;
        }
        .app-header {
            background-color: #f1f5f9;
            padding: 5px 10px;
            margin: 15px 0 5px 0;
            font-weight: bold;
            color: #374151;
            page-break-after: avoid;
        }
        .app-section {
            page-break-inside: avoid;
            margin-bottom: 15px;
        }
        .cert-box {
            background-color: #dcfce7;
            border: 1px solid #22c55e;
            padding: 15px;
            margin: 20px 0;
            text-align: justify;
            page-break-inside: avoid;
        }
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            page-break-inside: avoid;
        }
        .signature-box {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <!-- Header สำหรับทุกหน้าในการพิมพ์ -->
    <div class="page-header">
        <h1>GAP Certification Report</h1>
        <p>Good Agricultural Practices Certification</p>
        <p>Comprehensive documentation of farming practices</p>
        <div class="separator"></div>
    </div>

    <!-- Header สำหรับหน้าจอปกติ -->
    <div class="main-header">
        <h1>GAP Certification Report</h1>
        <p>Good Agricultural Practices Certification</p>
        <p>Comprehensive documentation of farming practices</p>
        <div class="separator"></div>
    </div>

    <div class="content">

    <!-- 1. Farmer Information -->
    <div class="section">
        <h2>1. Farmer Information</h2>
        <table>
            <tr>
                <td class="label">Full Name</td>
                <td class="value">${currentUser?.username || localStorage.getItem("username") || "Kittapas Viriyapipatpoor"}</td>
            </tr>
            <tr>
                <td class="label">Report Date</td>
                <td class="value">${new Date().toLocaleDateString('en-GB')}</td>
            </tr>
            <tr>
                <td class="label">Email Address</td>
                <td class="value">${currentUser?.email || localStorage.getItem("email") || "littlefarm@gmail.com"}</td>
            </tr>
            <tr>
                <td class="label">Contact Number</td>
                <td class="value">${currentUser?.phone || localStorage.getItem("contactNumber") || "089-123-4567"}</td>
            </tr>
        </table>
    </div>

    <!-- 2. Farm Information -->
    <div class="section">
        <h2>2. Farm Information</h2>
        <table>
            <tr>
                <td class="label">Farm Name</td>
                <td class="value">${currentFarm?.Farm_Name || PlantingBatches?.location || "Little Farm"}</td>
            </tr>
            <tr>
                <td class="label">Farm Size</td>
                <td class="value">${currentFarm ? `${currentFarm.Farm_Size} ${currentFarm.Farm_Size_Unit}` : "15 Rai"}</td>
            </tr>
            <tr>
                <td class="label">Farm Address</td>
                <td class="value">${currentFarm?.Farm_Address || "123 Moo 5, Mae Fah Luang, Muang District, Chiang Rai"}</td>
            </tr>
            <tr>
                <td class="label">Crop Type</td>
                <td class="value">${currentFarm?.Crop_Type || "Turmeric"}</td>
            </tr>
            <tr>
                <td class="label">Cultivation Method</td>
                <td class="value">${currentFarm?.Cultivation_Method || PlantingBatches?.cultivation_method || "Organic Cultivation"}</td>
            </tr>
        </table>
    </div>

    <!-- 3. Planting Information -->
    <div class="section">
        <h2>3. Planting Information</h2>
        <table>
            <tr>
                <td class="label">Batch ID</td>
                <td class="value">${PlantingBatches?.batches_id || ""}</td>
            </tr>
            <tr>
                <td class="label">Date of Planting</td>
                <td class="value">${PlantingBatches?.planting_date ? new Date(PlantingBatches.planting_date).toLocaleDateString('en-GB') : "August 21, 2025"}</td>
            </tr>
            <tr>
                <td class="label">Plant Variety</td>
                <td class="value">${PlantingBatches?.plant_variety || ""}</td>
            </tr>
            <tr>
                <td class="label">Cultivation Method</td>
                <td class="value">${PlantingBatches?.cultivation_method || ""}</td>
            </tr>
            <tr>
                <td class="label">Soil pH</td>
                <td class="value">${PlantingBatches?.soil_pH || ""}</td>
            </tr>
            <tr>
                <td class="label">Soil Quality</td>
                <td class="value">${PlantingBatches?.soil_quality || ""}</td>
            </tr>
            <tr>
                <td class="label">Water Source</td>
                <td class="value">${PlantingBatches?.water_source || ""}</td>
            </tr>
        </table>
        
        <table class="cost-table">
            <tr>
                <td class="label">Planting Cost</td>
                <td class="label">Cost</td>
                <td class="label">Unit</td>
            </tr>
            <tr>
                <td class="label">Labor Cost</td>
                <td class="value">${PlantingBatches?.labor_cost}</td>
                <td class="value">Baht</td>
            </tr>
            <tr>
                <td class="label">Material Cost</td>
                <td class="value">${PlantingBatches?.material_cost}</td>
                <td class="value">Baht</td>
            </tr>
            <tr>
                <td class="label">Other Costs</td>
                <td class="value">${PlantingBatches?.other_costs}</td>
                <td class="value">Baht</td>
            </tr>
            <tr style="font-weight: bold;">
                <td class="label">Total Planting Cost</td>
                <td class="value">${PlantingBatches?.total_planting_cost}</td>
                <td class="value">Baht</td>
            </tr>
        </table>
    </div>

    <!-- 4. Fertilizer Information -->
    <div class="section">
        <h2>4. Fertilizer Information</h2>
        ${PlantingBatches?.recent_fertilizer_record && PlantingBatches.recent_fertilizer_record.length > 0 ? `
            ${PlantingBatches.recent_fertilizer_record.map((record, index) => `
                <div class="app-section">
                    <div class="app-header">Application ${index + 1}</div>
                    <table>
                        <tr>
                            <td class="label">Date</td>
                            <td class="value">${new Date(record.date).toLocaleDateString('en-GB')}</td>
                        </tr>
                        <tr>
                            <td class="label">Fertilizer Type</td>
                            <td class="value">${record.fertilizer_type}</td>
                        </tr>
                        <tr>
                            <td class="label">Quantity Applied</td>
                            <td class="value">${record.amount}</td>
                        </tr>
                        <tr>
                            <td class="label">How to Apply</td>
                            <td class="value">${record.method}</td>
                        </tr>
                        <tr>
                            <td class="label">Acres</td>
                            <td class="value">${record.size}</td>
                        </tr>
                        <tr>
                            <td class="label">Notes</td>
                            <td class="value">${record.note || "-"}</td>
                        </tr>
                        <tr>
                            <td class="label">Total Fertilizer Cost</td>
                            <td class="value">${(record.total_fertilizer_cost || 0).toLocaleString()} Baht</td>
                        </tr>
                    </table>
                </div>
            `).join('')}
        ` : `
            <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">No fertilizer application records available</p>
        `}
    </div>

    <!-- 5. Harvest Information -->
    <div class="section">
        <h2>5. Harvest Information</h2>
        ${PlantingBatches?.recent_harvest_record && PlantingBatches.recent_harvest_record.length > 0 ? `
            ${PlantingBatches.recent_harvest_record.map((record, index) => `
                <div class="app-section">
                    <div class="app-header">Application ${index + 1}</div>
                    <table>
                        <tr>
                            <td class="label">Harvest Date</td>
                            <td class="value">${new Date(record.date).toLocaleDateString('en-GB')}</td>
                        </tr>
                        <tr>
                            <td class="label">Harvest Method</td>
                            <td class="value">${record.method}</td>
                        </tr>
                        <tr>
                            <td class="label">Yield Amount</td>
                            <td class="value">${record.yleld} ${record.yleld_unit}</td>
                        </tr>
                        <tr>
                            <td class="label">Curcuminoid Quality</td>
                            <td class="value">${record.curcumin_quality}%</td>
                        </tr>
                        <tr>
                            <td class="label">Quality Grade</td>
                            <td class="value">${record.quality_grade}</td>
                        </tr>
                        <tr>
                            <td class="label">Result Type</td>
                            <td class="value">${record.result_type}</td>
                        </tr>
                        <tr>
                            <td class="label">Notes</td>
                            <td class="value">${record.note || "-"}</td>
                        </tr>
                        <tr>
                            <td class="label">Total Harvest Cost</td>
                            <td class="value">${(record.total_harvest_cost || 0).toLocaleString()} Baht</td>
                        </tr>
                    </table>
                </div>
            `).join('')}
        ` : `
            <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">No harvest records available</p>
        `}
    </div>

    <!-- 6. Certification Statement -->
    <div class="section">
        <h2>6. Certification Statement</h2>
        <div class="cert-box">
            This document certifies that ${currentFarm?.Farm_Name || PlantingBatches?.location || "Little Farm"}, managed by ${currentUser?.username || localStorage.getItem("username") || "Kittapas Viriyapipatpoor"}, has followed 
            Good Agricultural Practices (GAP) under organic cultivation standards. All planting, fertilizer 
            application, and harvest activities are documented in detail for compliance, traceability, and 
            product quality assurance.
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    <strong>Farmer</strong><br>
                    ${currentUser?.username || localStorage.getItem("username") || "Kittapas Viriyapipatpoor"}
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    <strong>Official Reviewer</strong>
                </div>
            </div>
        </div>
    </div>

    </div> <!-- ปิด content div -->
</body>
</html>`;
        // เขียน HTML content ลงใน iframe
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
        if (frameDoc) {
            frameDoc.write(gapContent);
            frameDoc.close();
            
            // รอให้ content โหลดเสร็จแล้วค่อย print
            setTimeout(() => {
                if (printFrame.contentWindow) {
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    
                    // ลบ iframe หลังจาก print เสร็จ
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                    }, 250);
                }
            }, 250);
        }
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem('sidebarOpen', String(!prev));
            return !prev;
        });
    };

    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const [fertilizer_formData, setfertilizerFormData] = useState({
        date: "",
        amount: "",
        size: "",
        fertilizer_type: "",
        method: "",
        note: "",
        unit: "kg",
        fertilizer_cost: "",
        application_labor_cost: "",
    });

    const [harvest_formData, setHarvestFormData] = useState({
        date: "",
        yleld: "",
        quality_grade: "",
        method: "",
        note: "",
        result_type: "UV-Vis",
        curcumin_quality: "",
        yleld_unit: "kg",
        labor_cost: "",
        equipment_cost: "",
    });

    const [kaminCALData, setKaminCALData] = useState<KaminCALData>({
        sample_name: "",
        plant_weight: "",
        solvent_volume: "",
        average_od: "",
        concentration: "",
        number_of_replications: "",
        first_time: "",
        analytical_instrument: "UV-Vis",
        second_time: "",
        curcuminoid_content: "Pass",
        curcuminoid_percentage: "",
        third_time: "",
    });

    const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
    const [selectedLab, setSelectedLab] = useState<string>("");
    const [labSubmissionModal, setLabSubmissionModal] = useState<{
        isOpen: boolean;
        harvestRecordId: string | null;
        selectedLab: string;
    }>({
        isOpen: false,
        harvestRecordId: null,
        selectedLab: ""
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    // เพิ่ม state สำหรับ Lab pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // เพิ่ม state สำหรับ harvest pagination
    const [harvestCurrentPage, setHarvestCurrentPage] = useState(1);
    const [harvestItemsPerPage] = useState(5);

    // เพิ่ม state สำหรับ fertilizer pagination
    const [fertilizerCurrentPage, setFertilizerCurrentPage] = useState(1);
    const [fertilizerItemsPerPage] = useState(2);

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

    const handleCheckboxChange = (id: string) => {
        setSelectedSamples((prev) => {
            if (prev.includes(id)) {
                // If the sample is already selected, remove it
                return prev.filter((sampleId) => sampleId !== id);
            } else {
                // Otherwise, add it to the selection
                return [...prev, id];
            }
        });
    };

    // Function to check if a batch should be moved to "Completed Past Data"
    const checkAndUpdateExpiredBatches = async () => {
        try {
            if (!PlantingBatches) return;

            // Check if current batch is "Completed Successfully"
            if (PlantingBatches.status === "Completed Successfully") {
                
                // If no completion_timestamp exists, it's old data - update immediately to "Completed Past Data"
                if (!PlantingBatches.completion_timestamp) {
                    console.log("Old completed batch without timestamp detected, updating to 'Completed Past Data'");
                    
                    const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${documentId}`, {
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

                    if (updateRes.ok) {
                        console.log("Old batch updated to 'Completed Past Data'");
                        await fetchPlantingBatches(); // Refresh the data
                    }
                    return;
                }

                // If completion_timestamp exists, check if 10 minutes have passed
                const completionTime = new Date(PlantingBatches.completion_timestamp).getTime();
                const currentTime = new Date().getTime();
                const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds

                if (currentTime - completionTime >= tenMinutesInMs) {
                    console.log("Batch has expired (10+ minutes), updating to 'Completed Past Data'");
                    
                    const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${documentId}`, {
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

                    if (updateRes.ok) {
                        console.log("Batch_Status updated to 'Completed Past Data'");
                        await fetchPlantingBatches(); // Refresh the data
                    }
                }
            }
        } catch (error) {
            console.error("Error checking/updating expired batches:", error);
        }
    };

    const handleMarkAsComplete = async () => {
        try {
            if (!PlantingBatches) {
                alert("PlantingBatches data is not available.");
                return;
            }

            // Check if there are harvest records
            if (!PlantingBatches.recent_harvest_record || PlantingBatches.recent_harvest_record.length === 0) {
                alert("Cannot mark as complete: No harvest records found. Please add at least one harvest record.");
                return;
            }

            console.log("Starting handleMarkAsComplete process...");
            console.log("PlantingBatches:", PlantingBatches);
            console.log("Document ID:", documentId);

            // Update Batch_Status to "Completed Successfully"
            console.log("Updating batch status...");
            
            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Batch_Status: "Completed Successfully",
                    },
                }),
            });

            if (!res.ok) {
                const errorResponse = await res.text();
                console.error("Batch update failed:", errorResponse);
                throw new Error(`Failed to update Batch_Status to Completed Successfully: ${errorResponse}`);
            }

            console.log("Batch status updated successfully");

            // Group harvest records by quality grade
            const groupedHarvestRecords = PlantingBatches.recent_harvest_record.reduce((acc: { [key: string]: { quality_grade: string; total_yield: number; records: string[] } }, record) => {
                if (!record.quality_grade) {
                    console.warn("Harvest record missing quality_grade:", record);
                    return acc;
                }
                
                if (!acc[record.quality_grade]) {
                    acc[record.quality_grade] = { quality_grade: record.quality_grade, total_yield: 0, records: [] };
                }
                acc[record.quality_grade].total_yield += (record.yleld || 0);
                acc[record.quality_grade].records.push(record.documentId);
                return acc;
            }, {});

            console.log("Grouped harvest records:", groupedHarvestRecords);

            // Create factory submission records for each Quality_Grade (NOT ready-for-factory)
            for (const grade in groupedHarvestRecords) {
                const { quality_grade, total_yield, records } = groupedHarvestRecords[grade];
                
                const factorySubmissionData = {
                    Batch_id: PlantingBatches.batches_id || `batch-${documentId}`,
                    Farm_Name: PlantingBatches.location || "Unknown Farm",
                    Quality_Grade: quality_grade,
                    Yield: total_yield,
                    Test_Type: "Curcuminoid",
                    Date: new Date().toISOString().split('T')[0],
                    Submission_status: "Waiting", // รอให้ Farmer เลือก Factory
                    batch: documentId,
                    user_documentId: localStorage.getItem("userId"),
                };

                console.log("Creating factory submission record:", factorySubmissionData);

                const factory_submission_res = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-submissions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: factorySubmissionData,
                    }),
                });

                if (!factory_submission_res.ok) {
                    const errorResponse = await factory_submission_res.text();
                    console.error(`Factory submission creation failed for grade ${quality_grade}:`, errorResponse);
                    throw new Error(`Failed to create factory submission record for Quality Grade: ${quality_grade}. Error: ${errorResponse}`);
                }

                const factorySubmissionResult = await factory_submission_res.json();
                console.log(`Factory submission record created for grade ${quality_grade}:`, factorySubmissionResult);
            }

            console.log("All factory submission records created successfully");            // Update farm status
            console.log("Updating farm status...");
            const farm_res = await fetch(`https://api-freeroll-production.up.railway.app/api/farms/${PlantingBatches.farm_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Farm_Status: "End Planted",
                    },
                }),
            });

            if (!farm_res.ok) {
                const errorResponse = await farm_res.text();
                console.error("Farm update failed:", errorResponse);
                throw new Error(`Failed to update Farm Status to End Planted: ${errorResponse}`);
            }

            console.log("Farm status updated successfully");

            // Create notification
            console.log("Creating notification...");
            const notification_res = await fetch(`https://api-freeroll-production.up.railway.app/api/notifications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Text: `Batch marked as completed successfully and added to factory queue`,
                        Date: new Date().toISOString(),
                        Notification_status: "General",
                        batch: documentId,
                        user_documentId: localStorage.getItem("userId"),
                    }
                })
            });

            if (!notification_res.ok) {
                const errorResponse = await notification_res.text();
                console.error("Notification creation failed:", errorResponse);
                // Don't throw error for notification failure - it's not critical
                console.warn("Failed to create notification, but continuing...");
            } else {
                console.log("Notification created successfully");
            }

            alert("Batch marked as Completed Successfully! You can now submit it to a factory from the Factory Submission page.");
            await fetchPlantingBatches(); // Refresh the data
        } catch (error) {
            console.error("Error marking batch as complete:", error);
            alert(`Failed to mark batch as complete. Error: ${typeof error === "object" && error !== null && "message" in error ? (error as { message?: string }).message : String(error)}. Please try again.`);
        }
    };

    const fertilizer_handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setfertilizerFormData({ ...fertilizer_formData, [e.target.name]: e.target.value });
    };

    const harvest_handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "curcumin_quality") {
            const numericValue = parseFloat(value);
            if (numericValue < 0 || numericValue > 100) {
                alert("Curcumin quality must be between 0 and 100.");
                return;
            }
        }
        setHarvestFormData({ ...harvest_formData, [name]: value });
    };

    // เพิ่มฟังก์ชันนี้ก่อนหน้า React.useEffect
    const handleSubmitSingleToLab = async () => {
        try {
            if (!labSubmissionModal.selectedLab) {
                alert("Please select a lab name.");
                return;
            }

            if (!labSubmissionModal.harvestRecordId) {
                alert("No harvest record selected.");
                return;
            }

            if (!PlantingBatches) {
                alert("PlantingBatches data is not available.");
                return;
            }

            console.log('=== DEBUG SUBMIT SINGLE TO LAB ===');
            console.log('Selected Lab:', labSubmissionModal.selectedLab);
            console.log('Harvest Record ID:', labSubmissionModal.harvestRecordId);

            const sample = PlantingBatches.recent_harvest_record.find(
                (rec_harvest) => rec_harvest.documentId === labSubmissionModal.harvestRecordId
            );

            if (!sample) {
                console.error(`Sample with ID ${labSubmissionModal.harvestRecordId} not found.`);
                throw new Error(`Sample with ID ${labSubmissionModal.harvestRecordId} not found in harvest records.`);
            }

            const submitData = {
                data: {
                    Quality_grade: sample.quality_grade,
                    Submission_status: "Pending",
                    Date: new Date().toISOString(),
                    Report: null,
                    batch: documentId,
                    harvest_record: labSubmissionModal.harvestRecordId,
                    lab: labSubmissionModal.selectedLab,
                },
            };

            const res = await fetch(`https://api-freeroll-production.up.railway.app/api/lab-submission-records`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify(submitData),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to create lab submission record. Status: ${res.status}, Error: ${errorText}`);
            }

            // Update the harvest record status to "Pending"
            const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/harvest-records/${labSubmissionModal.harvestRecordId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Submission_status: "Pending",
                    },
                }),
            });

            if (!updateRes.ok) {
                throw new Error(`Failed to update harvest record.`);
            }

            // Create notification
            try {
                await fetch(`https://api-freeroll-production.up.railway.app/api/notifications`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: {
                            Text: `A new lab submission has been created for sample ${labSubmissionModal.harvestRecordId}`,
                            Date: new Date().toISOString(),
                            Notification_status: "General",
                            batch: documentId,
                            user_documentId: localStorage.getItem("userId"),
                        }
                    })
                });
            } catch (notificationError) {
                console.error("Notification creation failed, but continuing:", notificationError);
            }

            alert("Sample submitted to the lab successfully!");

            // Close modal and reset state
            setLabSubmissionModal({
                isOpen: false,
                harvestRecordId: null,
                selectedLab: ""
            });

            await fetchPlantingBatches(); // Refresh the data

        } catch (error) {
            console.error("Error submitting sample to the lab:", error);
            alert("Failed to submit sample to the lab. Please try again.");
        }
    };

    React.useEffect(() => {
        // Check for query parameters and set the active tab
        if (searchParams.has("fertilizer")) {
            setActiveTab("fertilizer");
        } else if (searchParams.has("harvest")) {
            setActiveTab("harvest");
        } else if (searchParams.has("lab")) {
            setActiveTab("lab");
        }
    }, [searchParams]);

    if (!PlantingBatches) {
        return <p>Loading...</p>;
    }

    // คำนวณข้อมูลสำหรับ pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLabRecords = PlantingBatches?.lab_submission_record?.slice(indexOfFirstItem, indexOfLastItem) || [];
    const totalItems = PlantingBatches?.lab_submission_record?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // เพิ่มการคำนวณสำหรับ harvest pagination
    const harvestIndexOfLastItem = harvestCurrentPage * harvestItemsPerPage;
    const harvestIndexOfFirstItem = harvestIndexOfLastItem - harvestItemsPerPage;
    const currentHarvestRecords = PlantingBatches?.recent_harvest_record?.slice(harvestIndexOfFirstItem, harvestIndexOfLastItem) || [];
    const harvestTotalItems = PlantingBatches?.recent_harvest_record?.length || 0;
    const harvestTotalPages = Math.ceil(harvestTotalItems / harvestItemsPerPage);

    // เพิ่มการคำนวณสำหรับ fertilizer pagination
    const fertilizerIndexOfLastItem = fertilizerCurrentPage * fertilizerItemsPerPage;
    const fertilizerIndexOfFirstItem = fertilizerIndexOfLastItem - fertilizerItemsPerPage;
    const currentFertilizerRecords = PlantingBatches?.recent_fertilizer_record?.slice(fertilizerIndexOfFirstItem, fertilizerIndexOfLastItem) || [];
    const fertilizerTotalItems = PlantingBatches?.recent_fertilizer_record?.length || 0;
    const fertilizerTotalPages = Math.ceil(fertilizerTotalItems / fertilizerItemsPerPage);


    // ฟังก์ชันสำหรับเปลี่ยนหน้า
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // ฟังก์ชันสำหรับไปหน้าก่อนหน้า
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // ฟังก์ชันสำหรับไปหน้าถัดไป
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // เพิ่มฟังก์ชันสำหรับ harvest pagination
    const handleHarvestPageChange = (pageNumber: number) => {
        setHarvestCurrentPage(pageNumber);
    };

    const handleHarvestPrevPage = () => {
        if (harvestCurrentPage > 1) {
            setHarvestCurrentPage(harvestCurrentPage - 1);
        }
    };

    const handleHarvestNextPage = () => {
        if (harvestCurrentPage < harvestTotalPages) {
            setHarvestCurrentPage(harvestCurrentPage + 1);
        }
    };

    // เพิ่มฟังก์ชันสำหรับ fertilizer pagination
    const handleFertilizerPageChange = (pageNumber: number) => {
        setFertilizerCurrentPage(pageNumber);
    };

    const handleFertilizerPrevPage = () => {
        if (fertilizerCurrentPage > 1) {
            setFertilizerCurrentPage(fertilizerCurrentPage - 1);
        }
    };

    const handleFertilizerNextPage = () => {
        if (fertilizerCurrentPage < fertilizerTotalPages) {
            setFertilizerCurrentPage(fertilizerCurrentPage + 1);
        }
    };

    const resetHarvestForm = () => {
        setHarvestFormData({
            date: "",
            method: "",
            yleld: "",
            yleld_unit: "kg",
            quality_grade: "",
            curcumin_quality: "",
            note: "",
            result_type: "",
            labor_cost: "",
            equipment_cost: "",
        });
    };

    const resetKaminCALForm = () => {
        setKaminCALData({
            sample_name: "",
            plant_weight: "",
            solvent_volume: "",
            average_od: "",
            concentration: "",
            number_of_replications: "",
            first_time: "",
            analytical_instrument: "UV-Vis",
            second_time: "",
            curcuminoid_percentage: "",
            curcuminoid_content: "Pass",
            third_time: ""
        });
    };

    const resetAllForms = () => {
        resetHarvestForm();
        resetKaminCALForm();
    };


    if (!PlantingBatches) {
        return <p>Loading...</p>;
    }

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between items-center px-4 py-2 border-b sticky top-0 bg-white z-50">
                    <div className="flex items-center gap-2 justify-between w-full">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger onClick={toggleSidebar} />
                            <h1 className="text-2xl font-semibold">{PlantingBatches.batches_id}</h1>
                            <div className="relative flex flex-row items-center">
                                <div className="relative group">
                                    <Circle
                                        className={
                                            "cursor-pointer " +
                                            (PlantingBatches.status === "Completed Successfully"
                                                ? "text-green-600 fill-green-600"
                                                : PlantingBatches.status === "Pending Actions"
                                                    ? "text-yellow-600 fill-yellow-600"
                                                    : PlantingBatches.status === "Completed Past Data"
                                                        ? "text-gray-600 fill-gray-600"
                                                        : "text-red-600 fill-red-600")
                                        }
                                    />
                                    <div className="absolute left-8 top-1/2 z-10 opacity-0 group-hover:opacity-100 group-hover:block bg-white text-black text-sm p-2 rounded shadow-lg whitespace-nowrap transition-opacity duration-200 pointer-events-none">
                                        <p className="text-sm font-semibold">Color-Coded indicators</p>
                                        <p className="text-green-600 flex flex-row gap-2"><Circle className="text-green-600 fill-green-600" /> Completed Successfully</p>
                                        <p className="text-yellow-600 flex flex-row gap-2"><Circle className="text-yellow-600 fill-yellow-600" /> Pending Actions</p>
                                        <p className="text-red-600 flex flex-row gap-2"><Circle className="text-red-600 fill-red-600" /> Issues Detected</p>
                                        {/* <p className="text-gray-600 flex flex-row gap-2"><Circle className="text-gray-600 fill-gray-600" /> Completed Past Data</p> */}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center text-sm gap-1 bg-gray-500 rounded-lg text-white p-1">
                                <MapPin size={16} /> {PlantingBatches.location}
                            </div>
                        </div>
                        <div className="relative">
                            <EllipsisVertical
                                className="cursor-pointer hover:bg-muted rounded-2xl"
                                onClick={() => setExpandedRow(expandedRow === "batch" ? null : "batch")}
                            />
                            {expandedRow === "batch" && (
                                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">

                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <div
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                                setIsDialogOpen(true);
                                                setCurrentStep(1);
                                                setImagePreview(PlantingBatches?.image || null);
                                            }}
                                        >
                                            Edit
                                        </div>
                                        <DialogContent className="w-fit max-w-2xl">
                                            <DialogHeader className="flex flex-col gap-2 items-start">
                                                <DialogTitle>Edit Batch</DialogTitle>
                                                <DialogDescription>
                                                    Update the details for this cultivation batch (Step {currentStep} of 2)
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex flex-col gap-4 p-4">
                                                {currentStep === 1 && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="batch-id" className="text-sm font-medium">
                                                                Batch ID
                                                            </Label>
                                                            <Input
                                                                id="batch-id"
                                                                value={PlantingBatches?.batches_id || ""}
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
                                                                value={PlantingBatches?.planting_date || ""}
                                                                onChange={(e) =>
                                                                    setPlantingBatches((prev) =>
                                                                        prev ? { ...prev, planting_date: e.target.value } : prev
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="plant-variety" className="text-sm font-medium">
                                                                Plant Variety
                                                            </Label>
                                                            <Input
                                                                id="plant-variety"
                                                                value={PlantingBatches?.plant_variety || ""}
                                                                onChange={(e) =>
                                                                    setPlantingBatches((prev) =>
                                                                        prev ? { ...prev, plant_variety: e.target.value } : prev
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="cultivation-method" className="text-sm font-medium">
                                                                Cultivation Method
                                                            </Label>
                                                            <Select
                                                                value={PlantingBatches?.cultivation_method || ""}
                                                                onValueChange={(value) =>
                                                                    setPlantingBatches((prev) =>
                                                                        prev ? { ...prev, cultivation_method: value } : prev
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select Method" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Organic">Organic</SelectItem>
                                                                    <SelectItem value="Conventional">Conventional</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="location" className="text-sm font-medium">
                                                                Location
                                                            </Label>
                                                            <Select
                                                                value={PlantingBatches?.location || ""}
                                                                onValueChange={(value) =>
                                                                    setPlantingBatches((prev) =>
                                                                        prev ? { ...prev, location: value } : prev
                                                                    )
                                                                }
                                                            >
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
                                                                value={PlantingBatches?.soil_pH || ""}
                                                                onChange={(e) =>
                                                                    setPlantingBatches((prev) =>
                                                                        prev ? { ...prev, soil_pH: parseFloat(e.target.value) } : prev
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="soil-quality" className="text-sm font-medium">
                                                                Soil Quality
                                                            </Label>
                                                            <Input
                                                                id="soil-quality"
                                                                placeholder="Enter Soil Quality"
                                                                value={PlantingBatches?.soil_quality || ""}
                                                                onChange={(e) =>
                                                                    setPlantingBatches((prev) =>
                                                                        prev ? { ...prev, soil_quality: e.target.value } : prev
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Label htmlFor="water-source" className="text-sm font-medium">
                                                                Water Source
                                                            </Label>
                                                            <Select
                                                                value={PlantingBatches?.water_source || ""}
                                                                onValueChange={(value) =>
                                                                    setPlantingBatches((prev) =>
                                                                        prev ? { ...prev, water_source: value } : prev
                                                                    )
                                                                }
                                                            >
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
                                                )}

                                                {currentStep === 2 && (
                                                    <div className="space-y-4">
                                                        {/* Planting Cost Tracking Section */}
                                                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div>
                                                                    <h3 className="text-lg font-semibold">Planting Cost Tracking</h3>
                                                                    <p className="text-sm text-gray-500">Edit planting costs for this batch</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                                <div>
                                                                    <Label htmlFor="labor-cost" className="text-sm font-medium">
                                                                        Labor Cost (THB)
                                                                    </Label>
                                                                    <Input
                                                                        id="labor-cost"
                                                                        type="number"
                                                                        min="0"
                                                                        value={PlantingBatches?.labor_cost || 0}
                                                                        onChange={(e) => {
                                                                            const newValue = parseFloat(e.target.value) || 0;
                                                                            setPlantingBatches((prev) => {
                                                                                if (!prev) return prev;
                                                                                const newLaborCost = newValue;
                                                                                const totalCost = newLaborCost + (prev.material_cost || 0) + (prev.other_costs || 0);
                                                                                return {
                                                                                    ...prev,
                                                                                    labor_cost: newLaborCost,
                                                                                    total_planting_cost: totalCost
                                                                                };
                                                                            });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor="material-cost" className="text-sm font-medium">
                                                                        Material Cost (THB)
                                                                    </Label>
                                                                    <Input
                                                                        id="material-cost"
                                                                        type="number"
                                                                        min="0"
                                                                        value={PlantingBatches?.material_cost || 0}
                                                                        onChange={(e) => {
                                                                            const newValue = parseFloat(e.target.value) || 0;
                                                                            setPlantingBatches((prev) => {
                                                                                if (!prev) return prev;
                                                                                const newMaterialCost = newValue;
                                                                                const totalCost = (prev.labor_cost || 0) + newMaterialCost + (prev.other_costs || 0);
                                                                                return {
                                                                                    ...prev,
                                                                                    material_cost: newMaterialCost,
                                                                                    total_planting_cost: totalCost
                                                                                };
                                                                            });
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                                                <Label htmlFor="other-costs" className="text-sm font-medium">
                                                                    Other Costs (THB)
                                                                </Label>
                                                                <Input
                                                                    id="other-costs"
                                                                    type="number"
                                                                    min="0"
                                                                    value={PlantingBatches?.other_costs || 0}
                                                                    onChange={(e) => {
                                                                        const newValue = parseFloat(e.target.value) || 0;
                                                                        setPlantingBatches((prev) => {
                                                                            if (!prev) return prev;
                                                                            const newOtherCosts = newValue;
                                                                            const totalCost = (prev.labor_cost || 0) + (prev.material_cost || 0) + newOtherCosts;
                                                                            return {
                                                                                ...prev,
                                                                                other_costs: newOtherCosts,
                                                                                total_planting_cost: totalCost
                                                                            };
                                                                        });
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="border-t border-gray-200 pt-3">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Total Planting Cost:</span>
                                                                    <span className="font-bold text-lg">
                                                                        ฿{((PlantingBatches?.labor_cost || 0) + (PlantingBatches?.material_cost || 0) + (PlantingBatches?.other_costs || 0)).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
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
                                                                        <img
                                                                            src="/batch1.png"
                                                                            alt="Default Preview"
                                                                            className="w-24 h-24 object-cover rounded-lg opacity-50"
                                                                        />
                                                                        <p className="text-sm">Drag & drop an image here</p>
                                                                        <p className="text-xs text-gray-400">or click to browse (default: batch1.png)</p>
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
                                            </div>
                                            <DialogFooter className="flex justify-between">
                                                <div>
                                                    {currentStep === 2 && (
                                                        <Button variant="outline" onClick={handleBack}>
                                                            Back
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="bg-red-600 text-white hover:bg-red-500"
                                                        onClick={handleCancel}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    {currentStep === 1 ? (
                                                        <Button
                                                            className="bg-green-600 text-white hover:bg-green-700"
                                                            onClick={handleNext}
                                                        >
                                                            Next
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="submit"
                                                            className="bg-green-600 text-white hover:bg-green-700"
                                                            onClick={() => handleUpdateBatch()}
                                                        >
                                                            Save
                                                        </Button>
                                                    )}
                                                </div>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => { handleDeleteBatch() }
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main>
                    <div
                        className="h-full max-h-[240px] w-full bg-cover bg-center relative"
                        style={{
                            backgroundImage: PlantingBatches.image
                                ? `url(${PlantingBatches.image})`
                                : `url('/batch1.jpg')` // fallback image
                        }}
                        onError={(e) => {
                            console.error("❌ Error loading background image:", PlantingBatches.image);
                            // อาจจะเปลี่ยนเป็นรูป default
                        }}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4 -mt-10 relative z-10 w-full max-w-5xl mx-auto">
                        <Card className="p-4 shadow-md justify-center">
                            <div className="flex items-center gap-4">
                                <Calendar size={40} className="bg-green-500 text-white rounded-sm p-1" />
                                <div className="flex flex-col">
                                    <p className="text-muted-foreground">Start Date</p>
                                    <h3 className="text-xl font-semibold">{new Date(PlantingBatches.planting_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 shadow-md justify-center">
                            <div className="flex items-center gap-4">
                                <Sprout size={40} className="bg-green-500 text-white rounded-sm p-1" />
                                <div className="flex flex-col">
                                    <p className="text-muted-foreground">Plant Variety</p>
                                    <h3 className="text-xl font-semibold">{PlantingBatches.plant_variety}</h3>
                                    <p className="text-sm text-muted-foreground">Optimal Growth</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 shadow-md justify-center">
                            <div className="flex items-center gap-4">
                                <Leaf size={40} className="bg-green-500 text-white rounded-sm p-1" />
                                <div className="flex flex-col">
                                    <p className="text-muted-foreground">Cultivation Method</p>
                                    <h3 className="text-xl font-semibold">{PlantingBatches.cultivation_method}</h3>
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
                                    onClick={() => { handleTabChange(tab.key), setIsAdding(false), setIsEditing(false) }}
                                >
                                    {tab.icon} {tab.name}
                                </button>
                            ))}
                            <Separator orientation="horizontal" className="absolute -bottom-0 h-[2px] transition-all bg-gray-300 mt-1" />
                        </div>
                    </div>

                    {activeTab === "fertilizer" && (
                        <div className="px-4 py-4 space-y-4">
                            {!isAdding && !isEditing && (
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">Recent Fertilizer Records</h2>
                                    <Button onClick={() => {
                                        setIsAdding(true);
                                        // รีเซ็ตฟอร์มเมื่อเปิด Add Record
                                        setfertilizerFormData({
                                            date: "",
                                            amount: "",
                                            size: "",
                                            fertilizer_type: "",
                                            method: "",
                                            note: "",
                                            unit: "kg",
                                            fertilizer_cost: "",
                                            application_labor_cost: "",
                                        });
                                    }} className="bg-green-600 hover:bg-green-700" disabled={PlantingBatches.status === "Completed Successfully" || PlantingBatches.status === "Completed Past Data"}>
                                        <Plus size={16} /> Add Record
                                    </Button>
                                </div>
                            )}
                            {isAdding && (
                                <div className="flex flex-col gap-4 pt-1">
                                    <Card className="p-4 space-y-4 shadow-sm">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <SprayCan className="h-6 w-6 text-green-600" />
                                                <h2 className="text-lg font-semibold">Add Fertilizer Record</h2>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Fill in Fertilizer Application Information</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <Label>Fertilizer Date</Label>
                                                <Input type="datetime-local" name="date" value={fertilizer_formData.date} onChange={fertilizer_handleChange} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>Fertilizer Type</Label>
                                                <Select value={fertilizer_formData.fertilizer_type} onValueChange={(value) => setfertilizerFormData({ ...fertilizer_formData, fertilizer_type: value })}>
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
                                                    <Input type="number" name="amount" placeholder="Enter Quantity Applied here ..." min={0} value={fertilizer_formData.amount} onChange={fertilizer_handleChange} />
                                                    <Select defaultValue="kg" value={fertilizer_formData.unit} onValueChange={(value) => setfertilizerFormData({ ...fertilizer_formData, unit: value })}>
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
                                                <Select value={fertilizer_formData.method} onValueChange={(value) => setfertilizerFormData({ ...fertilizer_formData, method: value })}>
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
                                                <Input type="number" name="size" placeholder="Acres" min={0} value={fertilizer_formData.size} onChange={fertilizer_handleChange} />
                                            </div>
                                            <div className="flex flex-col gap-1 col-span-2">
                                                <Label>Notes (Optional)</Label>
                                                <Textarea name="note" placeholder="Enter Notes here ... (Optional)" value={fertilizer_formData.note} onChange={fertilizer_handleChange} />
                                            </div>
                                        </div>
                                        
                                        {/* Fertilizer Cost Tracking Section */}
                                        <div className="border-t pt-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-6 w-6 bg-green-600 rounded-sm flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">฿</span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-green-600">Fertilizer Cost Tracking</h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">Fill in Fertilizer Cost Tracking Information</p>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <Label>Fertilizer Cost ( THB )</Label>
                                                    <Input 
                                                        type="number" 
                                                        name="fertilizer_cost" 
                                                        placeholder="0" 
                                                        min={0} 
                                                        step="0.01"
                                                        value={fertilizer_formData.fertilizer_cost} 
                                                        onChange={fertilizer_handleChange} 
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label>Application Labor Cost ( THB )</Label>
                                                    <Input 
                                                        type="number" 
                                                        name="application_labor_cost" 
                                                        placeholder="0" 
                                                        min={0} 
                                                        step="0.01"
                                                        value={fertilizer_formData.application_labor_cost} 
                                                        onChange={fertilizer_handleChange} 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">Total Fertilizer Cost :</span>
                                                    <span className="text-lg font-bold text-green-600">
                                                        {((parseFloat(fertilizer_formData.fertilizer_cost) || 0) + 
                                                          (parseFloat(fertilizer_formData.application_labor_cost) || 0)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button onClick={() => setIsAdding(false)} className="bg-red-500 hover:bg-red-600">Cancel</Button>
                                            <Button className="bg-green-600 hover:bg-green-700"
                                                onClick={() => fertilizer_createdata()}
                                            >Add Record</Button>
                                        </div>
                                    </Card>
                                </div>
                            )}
                            {isEditing && (
                                <div className="flex flex-col gap-4 pt-1">
                                    <h2 className="text-lg font-semibold">Edit Fertilizer Record</h2>
                                    <Card className="p-4 space-y-4 shadow-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <Label>Date</Label>
                                                <Input
                                                    type="date"
                                                    name="date"
                                                    value={fertilizer_formData.date}
                                                    onChange={fertilizer_handleChange}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>Fertilizer Type</Label>
                                                <Select
                                                    value={fertilizer_formData.fertilizer_type}
                                                    onValueChange={(value) =>
                                                        setfertilizerFormData({ ...fertilizer_formData, fertilizer_type: value })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Fertilizer Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Organic">Organic</SelectItem>
                                                        <SelectItem value="Conventional">Conventional</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>Quantity Applied</Label>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Input
                                                        type="number"
                                                        name="amount"
                                                        placeholder="Enter Quantity Applied here ..."
                                                        min={0}
                                                        value={fertilizer_formData.amount}
                                                        onChange={fertilizer_handleChange}
                                                    />
                                                    <Select
                                                        defaultValue="kg"
                                                        value={fertilizer_formData.unit}
                                                        onValueChange={(value) =>
                                                            setfertilizerFormData({ ...fertilizer_formData, unit: value })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="kg">kg</SelectItem>
                                                            <SelectItem value="g">g</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>How to Apply</Label>
                                                <Select
                                                    value={fertilizer_formData.method}
                                                    onValueChange={(value) =>
                                                        setfertilizerFormData({ ...fertilizer_formData, method: value })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select How to Apply" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Spray">Spray</SelectItem>
                                                        <SelectItem value="Broadcast">Broadcast</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>Acres</Label>
                                                <Input
                                                    type="number"
                                                    name="size"
                                                    placeholder="Acres"
                                                    min={0}
                                                    value={fertilizer_formData.size}
                                                    onChange={fertilizer_handleChange}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 col-span-2">
                                                <Label>Notes (Optional)</Label>
                                                <Textarea
                                                    name="note"
                                                    placeholder="Enter Notes here ... (Optional)"
                                                    value={fertilizer_formData.note}
                                                    onChange={fertilizer_handleChange}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Fertilizer Cost Tracking Section */}
                                        <div className="border-t pt-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-6 w-6 bg-green-600 rounded-sm flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">฿</span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-green-600">Fertilizer Cost Tracking</h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">Fill in Fertilizer Cost Tracking Information</p>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <Label>Fertilizer Cost ( THB )</Label>
                                                    <Input 
                                                        type="number" 
                                                        name="fertilizer_cost" 
                                                        placeholder="0" 
                                                        min={0} 
                                                        step="0.01"
                                                        value={fertilizer_formData.fertilizer_cost} 
                                                        onChange={fertilizer_handleChange} 
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label>Application Labor Cost ( THB )</Label>
                                                    <Input 
                                                        type="number" 
                                                        name="application_labor_cost" 
                                                        placeholder="0" 
                                                        min={0} 
                                                        step="0.01"
                                                        value={fertilizer_formData.application_labor_cost} 
                                                        onChange={fertilizer_handleChange} 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">Total Fertilizer Cost :</span>
                                                    <span className="text-lg font-bold text-green-600">
                                                        {((parseFloat(fertilizer_formData.fertilizer_cost) || 0) + 
                                                          (parseFloat(fertilizer_formData.application_labor_cost) || 0)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditingRecord(null);
                                                }}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleUpdateFertilizerRecord()}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            )}
                            {!isAdding && !isEditing && (
                                <div className="flex flex-col gap-4">
                                    {currentFertilizerRecords.map((rec, i) => (
                                        <Card key={i} className="p-4 space-y-1 shadow-sm">
                                            <div className="gap-1 flex flex-col">
                                                <div className="flex flex-row justify-between items-center">
                                                    <div className="flex gap-2 text-sm text-muted-foreground">
                                                        <span className="bg-green-500 text-white px-2 rounded">{rec.method}</span>
                                                        <span>{new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                    <div className="relative">
                                                        <Button disabled={PlantingBatches.status === "Completed Successfully" || PlantingBatches.status === "Completed Past Data"} className="cursor-pointer hover:bg-muted rounded-3xl bg-white"
                                                            onClick={() => setExpandedRow(expandedRow === rec.id ? null : rec.id)}
                                                        >
                                                            <EllipsisVertical
                                                                className="text-black"
                                                            />
                                                            {expandedRow === rec.id && (
                                                                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                                                                    <div
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                        onClick={() => {
                                                                            console.log('📝 Editing fertilizer record:', rec);
                                                                            setIsEditing(true);
                                                                            setfertilizerFormData({
                                                                                date: rec.date || "",
                                                                                amount: rec.amount ? rec.amount.toString() : "",
                                                                                size: rec.size ? rec.size.toString() : "",
                                                                                fertilizer_type: rec.fertilizer_type || "",
                                                                                method: rec.method || "",
                                                                                note: rec.note || "",
                                                                                unit: rec.unit || "kg",
                                                                                fertilizer_cost: (rec.fertilizer_cost !== null && rec.fertilizer_cost !== undefined) ? rec.fertilizer_cost.toString() : "0",
                                                                                application_labor_cost: (rec.application_labor_cost !== null && rec.application_labor_cost !== undefined) ? rec.application_labor_cost.toString() : "0",
                                                                            });
                                                                            setEditingRecord(rec);
                                                                            console.log('✅ Form data set:', {
                                                                                fertilizer_cost: (rec.fertilizer_cost !== null && rec.fertilizer_cost !== undefined) ? rec.fertilizer_cost.toString() : "0",
                                                                                application_labor_cost: (rec.application_labor_cost !== null && rec.application_labor_cost !== undefined) ? rec.application_labor_cost.toString() : "0"
                                                                            });
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </div>
                                                                    <div
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                        onClick={() => {
                                                                            handleDeleteFertilizerRecord(rec.documentId);
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Button>
                                                    </div>
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
                                    ))}

                                    {/* Fertilizer Pagination Section */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {fertilizerTotalItems > 0 ? fertilizerIndexOfFirstItem + 1 : 0} to {Math.min(fertilizerIndexOfLastItem, fertilizerTotalItems)} of {fertilizerTotalItems} results
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Previous Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleFertilizerPrevPage}
                                                disabled={fertilizerCurrentPage === 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft size={16} />
                                            </Button>

                                            {/* Page Numbers */}
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: fertilizerTotalPages }, (_, i) => i + 1).map((pageNumber) => {
                                                    if (
                                                        pageNumber === 1 ||
                                                        pageNumber === fertilizerTotalPages ||
                                                        (pageNumber >= fertilizerCurrentPage - 1 && pageNumber <= fertilizerCurrentPage + 1)
                                                    ) {
                                                        return (
                                                            <Button
                                                                key={pageNumber}
                                                                variant={fertilizerCurrentPage === pageNumber ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => handleFertilizerPageChange(pageNumber)}
                                                                className={`h-8 w-8 p-0 ${fertilizerCurrentPage === pageNumber
                                                                    ? "bg-green-600 text-white hover:bg-green-700"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                {pageNumber}
                                                            </Button>
                                                        );
                                                    } else if (
                                                        pageNumber === fertilizerCurrentPage - 2 ||
                                                        pageNumber === fertilizerCurrentPage + 2
                                                    ) {
                                                        return (
                                                            <span key={pageNumber} className="px-2 text-muted-foreground">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>

                                            {/* Next Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleFertilizerNextPage}
                                                disabled={fertilizerCurrentPage === fertilizerTotalPages || fertilizerTotalPages === 0}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "harvest" && (
                        <div className="px-4 py-4 space-y-4">
                            {!isAdding && !isEditing && (
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">Recent Harvest Records</h2>
                                    <div className="flex gap-2">
                                        <Button className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleMarkAsComplete()}
                                            disabled={PlantingBatches.status === "Completed Successfully" || PlantingBatches.status === "Completed Past Data"}
                                        ><Check size={16} /> Mark as Complete</Button>
                                        <Button
                                            onClick={() => {
                                                resetAllForms(); // เพิ่มการ reset form ก่อนเปิด add mode
                                                setIsAdding(true);
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                            disabled={PlantingBatches.status === "Completed Successfully" || PlantingBatches.status === "Completed Past Data"}
                                        >
                                            <Plus size={16} /> Add Record
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {isAdding && (
                                <div className="flex flex-col gap-6 pt-1">
                                    {/* Harvest Record Form */}
                                    <Card className="p-4 space-y-4 shadow-sm">
                                        {/* Updated Header with Tractor Icon และ KaminCAL */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <Tractor className="h-6 w-6 text-green-600" />
                                                    <h2 className="text-lg font-semibold">Add Harvest Record</h2>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Fill in Harvest Information</p>
                                            </div>

                                            {/* ย้าย KaminCAL มาไว้ที่นี่ */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button className="text-white bg-black hover:bg-gray-800 hover:text-white transition-colors duration-200">
                                                        <Microscope className="h-4 w-4 mr-2" />
                                                        KaminCAL
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent side="left" className="w-[800px] max-h-[600px] overflow-y-auto">
                                                    <div className="p-4">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <Leaf className="h-6 w-6 text-green-600" />
                                                            <h2 className="text-lg font-semibold">KaminCAL</h2>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-4">Fill in Turmeric Information</p>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="flex flex-col gap-1">
                                                                <Label><FileText className="h-4 w-4" />Sample Name</Label>
                                                                <Input
                                                                    name="sample_name"
                                                                    value={kaminCALData.sample_name}
                                                                    onChange={handleKaminCALChange}
                                                                    placeholder="Name"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Scale className="h-4 w-4" />Plant weight</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="plant_weight"
                                                                        type="number"
                                                                        value={kaminCALData.plant_weight}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg"
                                                                        disabled
                                                                        className="w-16 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Beaker className="h-4 w-4" />Solvent volume</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="solvent_volume"
                                                                        type="number"
                                                                        value={kaminCALData.solvent_volume}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mL"
                                                                        disabled
                                                                        className="w-16 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><BarChart3 className="h-4 w-4" />Average OD</Label>
                                                                <Input
                                                                    name="average_od"
                                                                    type="number"
                                                                    step="0.001"
                                                                    value={kaminCALData.average_od}
                                                                    onChange={handleKaminCALChange}
                                                                    placeholder="e.g., 1.2"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Droplets className="h-4 w-4" />Concentration</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="concentration"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.concentration}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Repeat className="h-4 w-4" />Number of replications</Label>
                                                                <Input
                                                                    name="number_of_replications"
                                                                    type="number"
                                                                    value={kaminCALData.number_of_replications}
                                                                    onChange={handleKaminCALChange}
                                                                    placeholder="Enter the number of times the test"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Timer className="h-4 w-4" />First time</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="first_time"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.first_time}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg/mL"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Settings className="h-4 w-4" />Analytical Instrument</Label>
                                                                <Select
                                                                    value={kaminCALData.analytical_instrument}
                                                                    onValueChange={(value) =>
                                                                        setKaminCALData({ ...kaminCALData, analytical_instrument: value })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="UV-Vis" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="UV-Vis">UV-Vis</SelectItem>
                                                                        <SelectItem value="LED">LED</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Timer className="h-4 w-4" />Second time</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="second_time"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.second_time}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg/mL"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><FlaskConical className="h-4 w-4" />Curcuminoid content (Percentage by weight)</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="curcuminoid_percentage"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.curcuminoid_percentage || ""}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="Enter the curcuminoid percentage by weight"
                                                                        className="flex-1"
                                                                    />
                                                                    <div className="w-24">
                                                                        <Select
                                                                            value={kaminCALData.curcuminoid_content}
                                                                            onValueChange={(value) =>
                                                                                setKaminCALData({ ...kaminCALData, curcuminoid_content: value })
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Pass" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Pass">Pass</SelectItem>
                                                                                <SelectItem value="Fail">Fail</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Timer className="h-4 w-4" />Third time</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="third_time"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.third_time}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg/mL"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end mt-6 gap-2">
                                                            <Button
                                                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-800"
                                                                onClick={async () => {
                                                                    try {
                                                                        await harvest_createdata();
                                                                        alert('KaminCAL data saved successfully');
                                                                    } catch (error) {
                                                                        console.error('Error saving KaminCAL data:', error);
                                                                    }
                                                                }}
                                                            >
                                                                Save KaminCAL
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <Label><Calendar className="h-4 w-4" />Harvest Date</Label>
                                                <Input type="datetime-local" name="date" value={harvest_formData.date} onChange={harvest_handleChange} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Tractor className="h-4 w-4" />Harvest Method</Label>
                                                <Select value={harvest_formData.method} onValueChange={(value) => setHarvestFormData({ ...harvest_formData, method: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Harvest Method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Machine Harvesting">
                                                            Machine Harvesting
                                                        </SelectItem>
                                                        <SelectItem value="Manual Harvesting">
                                                            Manual Harvesting
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Package className="h-4 w-4" />Yield Amount</Label>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Input type="number" name="yleld" min={0} placeholder="Enter Yield Amount here ..." value={harvest_formData.yleld} onChange={harvest_handleChange} />
                                                    <Select defaultValue="kg" value={harvest_formData.yleld_unit} onValueChange={(value) => setHarvestFormData({ ...harvest_formData, yleld_unit: value })}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="kg">kg</SelectItem>
                                                            <SelectItem value="g">g</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><FlaskConical className="h-4 w-4" />Curcumin Quality (%)</Label>
                                                <Input type="number" name="curcumin_quality" placeholder="Enter Curcumin Amount here ..." onChange={harvest_handleChange} min={0} max={100} value={harvest_formData.curcumin_quality} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Star className="h-4 w-4" />Quality Grade</Label>
                                                <Select value={harvest_formData.quality_grade} onValueChange={(value) => setHarvestFormData({ ...harvest_formData, quality_grade: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Grade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Grade A">Grade A</SelectItem>
                                                        <SelectItem value="Grade B">Grade B</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1 row-span-2">
                                                <Label><Notebook className="h-4 w-4" />Notes (Optional)</Label>
                                                <Textarea className="h-full" name="note" placeholder="Enter Notes here ... (Optional)" onChange={harvest_handleChange} value={harvest_formData.note} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Settings className="h-4 w-4" />Result Type</Label>
                                                <Select
                                                    value={harvest_formData.result_type}
                                                    onValueChange={(value) =>
                                                        setHarvestFormData({ ...harvest_formData, result_type: value })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Result Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="UV-Vis">UV-Vis</SelectItem>
                                                        <SelectItem value="LED">LED</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Harvest Cost Tracking */}
                                    <div className="border-t pt-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-6 w-6 bg-green-600 rounded-sm flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">฿</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-green-600">Harvest Cost Tracking</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Fill in Harvest Cost Tracking Information</p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <Label>Labor Cost ( THB )</Label>
                                                <Input 
                                                    type="number" 
                                                    name="labor_cost" 
                                                    placeholder="0" 
                                                    min={0} 
                                                    step="0.01"
                                                    value={harvest_formData.labor_cost} 
                                                    onChange={harvest_handleChange} 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>Equipment Cost ( THB )</Label>
                                                <Input 
                                                    type="number" 
                                                    name="equipment_cost" 
                                                    placeholder="0" 
                                                    min={0} 
                                                    step="0.01"
                                                    value={harvest_formData.equipment_cost} 
                                                    onChange={harvest_handleChange} 
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">Total Harvest Cost :</span>
                                                <span className="text-lg font-bold text-green-600">
                                                    {((parseFloat(harvest_formData.labor_cost) || 0) + 
                                                      (parseFloat(harvest_formData.equipment_cost) || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buttons Section - เหลือแค่ Cancel และ Save */}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => {
                                                resetAllForms();
                                                setIsAdding(false);
                                            }}
                                            className="bg-red-500 hover:bg-red-600"
                                        >Cancel</Button>
                                        <Button onClick={() => harvest_createdata()} className="bg-green-600 hover:bg-green-700">Save</Button>
                                    </div>
                                </div>
                            )}
                            {isEditing && (
                                <div className="flex flex-col gap-6 pt-1">
                                    {/* Harvest Record Form */}
                                    <Card className="p-4 space-y-4 shadow-sm">
                                        {/* Updated Header with Tractor Icon และ KaminCAL */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <Tractor className="h-6 w-6 text-green-600" />
                                                    <h2 className="text-lg font-semibold">Edit Harvest Record</h2>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Fill in Edit Harvest Information</p>
                                            </div>

                                            {/* ย้าย KaminCAL มาไว้ที่นี่ */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button className="text-white bg-black hover:bg-gray-800 hover:text-white transition-colors duration-200">
                                                        <Microscope className="h-4 w-4 mr-2" />
                                                        KaminCAL
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent side="left" className="w-[800px] max-h-[600px] overflow-y-auto">
                                                    <div className="p-4">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <Leaf className="h-6 w-6 text-green-600" />
                                                            <h2 className="text-lg font-semibold">KaminCAL</h2>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-4">Fill in Edit Turmeric Information</p>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="flex flex-col gap-1">
                                                                <Label><FileText className="h-4 w-4" />Sample Name</Label>
                                                                <Input
                                                                    name="sample_name"
                                                                    value={kaminCALData.sample_name}
                                                                    onChange={handleKaminCALChange}
                                                                    placeholder="Name"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Scale className="h-4 w-4" />Plant weight</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="plant_weight"
                                                                        type="number"
                                                                        value={kaminCALData.plant_weight}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg"
                                                                        disabled
                                                                        className="w-16 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Beaker className="h-4 w-4" />Solvent volume</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="solvent_volume"
                                                                        type="number"
                                                                        value={kaminCALData.solvent_volume}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mL"
                                                                        disabled
                                                                        className="w-16 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><BarChart3 className="h-4 w-4" />Average OD</Label>
                                                                <Input
                                                                    name="average_od"
                                                                    type="number"
                                                                    step="0.001"
                                                                    value={kaminCALData.average_od}
                                                                    onChange={handleKaminCALChange}
                                                                    placeholder="e.g., 1.2"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Droplets className="h-4 w-4" />Concentration</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="concentration"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.concentration}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Repeat className="h-4 w-4" />Number of replications</Label>
                                                                <Input
                                                                    name="number_of_replications"
                                                                    type="number"
                                                                    value={kaminCALData.number_of_replications}
                                                                    onChange={handleKaminCALChange}
                                                                    placeholder="Enter the number of times the test"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Timer className="h-4 w-4" />First time</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="first_time"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.first_time}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg/mL"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Settings className="h-4 w-4" />Analytical Instrument</Label>
                                                                <Select
                                                                    value={kaminCALData.analytical_instrument}
                                                                    onValueChange={(value) =>
                                                                        setKaminCALData({ ...kaminCALData, analytical_instrument: value })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="UV-Vis" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="UV-Vis">UV-Vis</SelectItem>
                                                                        <SelectItem value="LED">LED</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Timer className="h-4 w-4" />Second time</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="second_time"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.second_time}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg/mL"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><FlaskConical className="h-4 w-4" />Curcuminoid content (Percentage by weight)</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="curcuminoid_percentage"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.curcuminoid_percentage || ""}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="Enter the curcuminoid percentage by weight"
                                                                        className="flex-1"
                                                                    />
                                                                    <div className="w-24">
                                                                        <Select
                                                                            value={kaminCALData.curcuminoid_content}
                                                                            onValueChange={(value) =>
                                                                                setKaminCALData({ ...kaminCALData, curcuminoid_content: value })
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Pass" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Pass">Pass</SelectItem>
                                                                                <SelectItem value="Fail">Fail</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label><Timer className="h-4 w-4" />Third time</Label>
                                                                <div className="flex flex-row gap-2 items-center">
                                                                    <Input
                                                                        name="third_time"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={kaminCALData.third_time}
                                                                        onChange={handleKaminCALChange}
                                                                        placeholder="e.g., 100 mg/mL"
                                                                        className="flex-1"
                                                                    />
                                                                    <Input
                                                                        value="mg/mL"
                                                                        disabled
                                                                        className="w-20 text-center bg-gray-50 text-black font-medium"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end mt-6 gap-2">
                                                            <Button
                                                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-800"
                                                                onClick={async () => {
                                                                    try {
                                                                        await harvest_createdata();
                                                                        alert('KaminCAL data saved successfully');
                                                                    } catch (error) {
                                                                        console.error('Error saving KaminCAL data:', error);
                                                                    }
                                                                }}
                                                            >
                                                                Save KaminCAL
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <Label><Calendar className="h-4 w-4" />Harvest Date</Label>
                                                <Input type="datetime-local" name="date" value={harvest_formData.date} onChange={harvest_handleChange} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Tractor className="h-4 w-4" />Harvest Method</Label>
                                                <Select value={harvest_formData.method} onValueChange={(value) => setHarvestFormData({ ...harvest_formData, method: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Harvest Method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Machine Harvesting">
                                                            Machine Harvesting
                                                        </SelectItem>
                                                        <SelectItem value="Manual Harvesting">
                                                            Manual Harvesting
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Package className="h-4 w-4" />Yield Amount</Label>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Input type="number" name="yleld" min={0} placeholder="Enter Yield Amount here ..." value={harvest_formData.yleld} onChange={harvest_handleChange} />
                                                    <Select defaultValue="kg" value={harvest_formData.yleld_unit} onValueChange={(value) => setHarvestFormData({ ...harvest_formData, yleld_unit: value })}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="kg">kg</SelectItem>
                                                            <SelectItem value="g">g</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><FlaskConical className="h-4 w-4" />Curcumin Quality (%)</Label>
                                                <Input type="number" name="curcumin_quality" placeholder="Enter Curcumin Amount here ..." onChange={harvest_handleChange} min={0} max={100} value={harvest_formData.curcumin_quality} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Star className="h-4 w-4" />Quality Grade</Label>
                                                <Select value={harvest_formData.quality_grade} onValueChange={(value) => setHarvestFormData({ ...harvest_formData, quality_grade: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Grade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Grade A">Grade A</SelectItem>
                                                        <SelectItem value="Grade B">Grade B</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1 row-span-2">
                                                <Label><Notebook className="h-4 w-4" />Notes (Optional)</Label>
                                                <Textarea className="h-full" name="note" placeholder="Enter Notes here ... (Optional)" onChange={harvest_handleChange} value={harvest_formData.note} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label><Settings className="h-4 w-4" />Result Type</Label>
                                                <Select
                                                    value={harvest_formData.result_type}
                                                    onValueChange={(value) =>
                                                        setHarvestFormData({ ...harvest_formData, result_type: value })
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Result Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="UV-Vis">UV-Vis</SelectItem>
                                                        <SelectItem value="LED">LED</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Harvest Cost Tracking */}
                                    <div className="border-t pt-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-6 w-6 bg-green-600 rounded-sm flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">฿</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-green-600">Harvest Cost Tracking</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Fill in Harvest Cost Tracking Information</p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <Label>Labor Cost ( THB )</Label>
                                                <Input 
                                                    type="number" 
                                                    name="labor_cost" 
                                                    placeholder="0" 
                                                    min={0} 
                                                    step="0.01"
                                                    value={harvest_formData.labor_cost} 
                                                    onChange={harvest_handleChange} 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>Equipment Cost ( THB )</Label>
                                                <Input 
                                                    type="number" 
                                                    name="equipment_cost" 
                                                    placeholder="0" 
                                                    min={0} 
                                                    step="0.01"
                                                    value={harvest_formData.equipment_cost} 
                                                    onChange={harvest_handleChange} 
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">Total Harvest Cost :</span>
                                                <span className="text-lg font-bold text-green-600">
                                                    {((parseFloat(harvest_formData.labor_cost) || 0) + 
                                                      (parseFloat(harvest_formData.equipment_cost) || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buttons Section - เหลือแค่ Cancel และ Save */}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditingRecord(null);
                                            }}
                                            className="bg-red-500 hover:bg-red-600"
                                        >Cancel</Button>
                                        <Button onClick={() => handleUpdateHarvestRecord()} className="bg-green-600 hover:bg-green-700">Save</Button>
                                    </div>
                                </div>
                            )}
                            {!isAdding && !isEditing && (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-3 gap-10 w-full max-w-5xl mx-auto pt-1">
                                        <Card className="items-center justify-center">
                                            <CardContent className="p-4 w-full">
                                                <div className="flex flex-row gap-1 justify-between">
                                                    <p className="text-sm text-muted-foreground">Total Yield <br /> ({PlantingBatches.batches_id})</p>
                                                    <ChartSpline className="bg-green-400 text-green-900 p-1 rounded-sm" />
                                                </div>
                                                <h1 className="text-2xl font-bold">
                                                    {PlantingBatches.recent_harvest_record.reduce((total, recent_harvest_record) => total + recent_harvest_record.yleld, 0)}
                                                </h1>
                                                <p className="text-sm text-muted-foreground">Latest Harvest {PlantingBatches.recent_harvest_record.length > 0 ? new Date(PlantingBatches.recent_harvest_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No records available"}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="items-center justify-center">
                                            <CardContent className="p-4 w-full">
                                                <div className="flex flex-row gap-1 justify-between">
                                                    <p className="text-sm text-muted-foreground">Average Quality Grade <br />({PlantingBatches.batches_id})</p>
                                                    <Star className="bg-yellow-400 text-yellow-900 p-1 rounded-sm" />
                                                </div>
                                                <h1 className="text-2xl font-bold">Garde {PlantingBatches.recent_harvest_record.length > 0 ? PlantingBatches.recent_harvest_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].quality_grade : "No records available"}</h1>
                                                <p>
                                                    {Array.isArray(PlantingBatches.recent_harvest_record) && PlantingBatches.recent_harvest_record.length > 0 ? (
                                                        (() => {
                                                            const sortedRecords = PlantingBatches.recent_harvest_record.sort(
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
                                                    <p className="text-sm text-muted-foreground">Pending Lab Reports <br />({PlantingBatches.batches_id})</p>
                                                    <FlaskConical className="bg-blue-400 text-blue-900 p-1 rounded-sm" />
                                                </div>
                                                <h1 className="text-2xl font-bold">{PlantingBatches.lab_submission_record.filter((record) => record.status === "Pending").length}</h1>
                                                <p className="text-sm text-muted-foreground">Updated {(() => {
                                                    if (PlantingBatches.lab_submission_record.length > 0) {
                                                        const latestSubmission = PlantingBatches.lab_submission_record.sort(
                                                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                                                        )[0];
                                                        const lastUpdate = new Date(latestSubmission.date);
                                                        const now = new Date();
                                                        const diffInHours = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));
                                                        if (diffInHours > 24) {
                                                            return `${Math.floor(diffInHours / 24)} days ago`;
                                                        } else if (diffInHours < 1) {
                                                            const diffInMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
                                                            if (diffInMinutes < 1) {
                                                                const diffInSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
                                                                return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
                                                            }
                                                            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
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
                                            {currentHarvestRecords.map((harvest_record) => (
                                                <React.Fragment key={harvest_record.id}>
                                                    <TableRow key={harvest_record.id}>
                                                        <TableCell>{new Date(harvest_record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                                        <TableCell>{harvest_record.yleld}</TableCell>
                                                        <TableCell>{harvest_record.quality_grade}</TableCell>
                                                        <TableCell>{harvest_record.method}</TableCell>
                                                        <TableCell>{harvest_record.curcumin_quality}</TableCell>
                                                        <TableCell className="flex gap-2">
                                                            <Button
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                                onClick={() => {
                                                                    console.log("=== EDIT HARVEST RECORD ===");
                                                                    console.log("Full harvest record:", harvest_record);

                                                                    setIsEditing(true);
                                                                    setHarvestFormData({
                                                                        date: new Date(harvest_record.date).toLocaleString('en-CA', { hour12: false }).replace(', ', 'T'),
                                                                        yleld: harvest_record.yleld.toString(),
                                                                        quality_grade: harvest_record.quality_grade,
                                                                        method: harvest_record.method,
                                                                        note: harvest_record.note || "",
                                                                        result_type: harvest_record.result_type || "UV-Vis",
                                                                        curcumin_quality: harvest_record.curcumin_quality.toString(),
                                                                        yleld_unit: harvest_record.yleld_unit || "kg",
                                                                        labor_cost: harvest_record.labor_cost?.toString() || "",
                                                                        equipment_cost: harvest_record.equipment_cost?.toString() || "",
                                                                    });

                                                                    setKaminCALData({
                                                                        sample_name: harvest_record.kamincal_sample_name || "",
                                                                        plant_weight: harvest_record.kamincal_plant_weight?.toString() || "",
                                                                        solvent_volume: harvest_record.kamincal_solvent_volume?.toString() || "",
                                                                        average_od: harvest_record.kamincal_average_od?.toString() || "",
                                                                        concentration: harvest_record.kamincal_concentration?.toString() || "",
                                                                        number_of_replications: harvest_record.kamincal_number_of_replications?.toString() || "",
                                                                        first_time: harvest_record.kamincal_first_time?.toString() || "",
                                                                        analytical_instrument: harvest_record.kamincal_analytical_instrument || "UV-Vis",
                                                                        second_time: harvest_record.kamincal_second_time?.toString() || "",
                                                                        curcuminoid_content: harvest_record.kamincal_curcuminoid_content || "",
                                                                        curcuminoid_percentage: harvest_record.kamincal_curcuminoid_percentage?.toString() || "",
                                                                        third_time: harvest_record.kamincal_third_time?.toString() || "",
                                                                    });

                                                                    setEditingRecord(harvest_record);
                                                                }}
                                                                disabled={PlantingBatches.status === "Completed Successfully" || PlantingBatches.status === "Completed Past Data"}
                                                            >
                                                                <SquarePen size={16} />
                                                            </Button>

                                                            <Button
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => handleDeleteHarvestRecord(harvest_record.documentId)}
                                                                disabled={PlantingBatches.status === "Completed Successfully" || PlantingBatches.status === "Completed Past Data"}
                                                            >
                                                                <Trash size={16} />
                                                            </Button>

                                                            {/* ปุ่ม Lab to Submission */}
                                                            <Button
                                                                className={
                                                                    harvest_record.lab_status === "Pending"
                                                                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                                                        : "bg-green-600 hover:bg-green-700"
                                                                }
                                                                onClick={() => {
                                                                    if (harvest_record.lab_status !== "Pending") {
                                                                        setLabSubmissionModal({
                                                                            isOpen: true,
                                                                            harvestRecordId: harvest_record.documentId,
                                                                            selectedLab: ""
                                                                        });
                                                                    }
                                                                }}
                                                                disabled={
                                                                    harvest_record.lab_status === "Pending" ||
                                                                    PlantingBatches.status === "Completed Successfully" ||
                                                                    PlantingBatches.status === "Completed Past Data"
                                                                }
                                                            >
                                                                <FlaskConical size={16} />
                                                            </Button>
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
                                                                <div className="p-4">
                                                                    <h1 className="text-green-600 text-xl font-semibold">KaminCAL</h1>
                                                                    <div className="grid grid-cols-4 gap-4 mt-2">
                                                                        <div>
                                                                            <p className="text-gray-500">Sample Name</p>
                                                                            <h1>{harvest_record.kamincal_sample_name || "N/A"}</h1>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-gray-500">Average OD</p>
                                                                            <h1>{harvest_record.kamincal_average_od || "N/A"}</h1>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-gray-500">Curcuminoid Content</p>
                                                                            <h1>{harvest_record.kamincal_curcuminoid_percentage || "N/A"}</h1>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-gray-500">% Accuracy</p>
                                                                            <h1>{harvest_record.kamincal_curcuminoid_content || "N/A"}</h1>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Cost Tracking Section */}
                                                                <div className="p-4 border-t">
                                                                    <h1 className="text-green-600 text-xl font-semibold flex items-center gap-2">
                                                                        Cost Tracking
                                                                    </h1>
                                                                    <div className="grid grid-cols-3 gap-6 mt-4">
                                                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                                            <p className="text-gray-600 text-sm font-medium mb-1">Labor Cost</p>
                                                                            <h1 className="text-2xl font-bold text-blue-700">
                                                                                {harvest_record.labor_cost 
                                                                                    ? `฿${Number(harvest_record.labor_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                    : "฿0.00"
                                                                                }
                                                                            </h1>
                                                                        </div>
                                                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                                            <p className="text-gray-600 text-sm font-medium mb-1">Equipment Cost</p>
                                                                            <h1 className="text-2xl font-bold text-orange-700">
                                                                                {harvest_record.equipment_cost 
                                                                                    ? `฿${Number(harvest_record.equipment_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                    : "฿0.00"
                                                                                }
                                                                            </h1>
                                                                        </div>
                                                                        <div className="bg-green-50 p-3 rounded-lg border border-green-300">
                                                                            <p className="text-gray-600 text-sm font-medium mb-1">Total Harvest Cost</p>
                                                                            <h1 className="text-2xl font-bold text-green-700">
                                                                                {harvest_record.total_harvest_cost 
                                                                                    ? `฿${Number(harvest_record.total_harvest_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                    : `฿${((Number(harvest_record.labor_cost) || 0) + (Number(harvest_record.equipment_cost) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                }
                                                                            </h1>
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

                                    {/* Harvest Pagination Section */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {harvestTotalItems > 0 ? harvestIndexOfFirstItem + 1 : 0} to {Math.min(harvestIndexOfLastItem, harvestTotalItems)} of {harvestTotalItems} results
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Previous Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleHarvestPrevPage}
                                                disabled={harvestCurrentPage === 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft size={16} />
                                            </Button>

                                            {/* Page Numbers */}
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: harvestTotalPages }, (_, i) => i + 1).map((pageNumber) => {
                                                    if (
                                                        pageNumber === 1 ||
                                                        pageNumber === harvestTotalPages ||
                                                        (pageNumber >= harvestCurrentPage - 1 && pageNumber <= harvestCurrentPage + 1)
                                                    ) {
                                                        return (
                                                            <Button
                                                                key={pageNumber}
                                                                variant={harvestCurrentPage === pageNumber ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => handleHarvestPageChange(pageNumber)}
                                                                className={`h-8 w-8 p-0 ${harvestCurrentPage === pageNumber
                                                                    ? "bg-green-600 text-white hover:bg-green-700"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                {pageNumber}
                                                            </Button>
                                                        );
                                                    } else if (
                                                        pageNumber === harvestCurrentPage - 2 ||
                                                        pageNumber === harvestCurrentPage + 2
                                                    ) {
                                                        return (
                                                            <span key={pageNumber} className="px-2 text-muted-foreground">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>

                                            {/* Next Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleHarvestNextPage}
                                                disabled={harvestCurrentPage === harvestTotalPages || harvestTotalPages === 0}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "lab" && (
                        <div className="px-4 py-4 space-y-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <FlaskConical className="text-green-600" />
                                    <h2 className="text-lg font-semibold">Lab Submission History</h2>
                                </div>
                                <p className="text-sm text-muted-foreground">View details of previously submitted samples and lab reports.</p>
                            </div>
                            <div className="flex flex-row gap-4 items-center">
                                <div className="flex flex-row gap-2 items-center">
                                    <Sprout className="text-green-600" />
                                    <p className="text-sm text-muted-foreground">Total Yield:</p>
                                    <h1 className="font-semibold">{PlantingBatches.recent_harvest_record.reduce((total, record) => total + record.yleld, 0)}</h1>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <Calendar className="text-green-600" />
                                    <p className="text-sm text-muted-foreground">Harvest Date:</p>
                                    <h1 className="font-semibold">{PlantingBatches.recent_harvest_record.length > 0 ? new Date(PlantingBatches.recent_harvest_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No records available"}</h1>
                                </div>
                            </div>

                            {/* <div>
                                <div className="flex items-center gap-3">
                                    <FlaskConical className="text-green-600" />
                                    <h2 className="text-lg font-semibold">Lab Submission History</h2>
                                </div>
                                <p className="text-sm text-muted-foreground">View details of previously submitted samples and lab reports.</p>
                            </div> */}


                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lab Name</TableHead>
                                        <TableHead>Test Date</TableHead>
                                        <TableHead>Yield</TableHead>
                                        <TableHead>Quality</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Report</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentLabRecords.map((lab_rec) => {
                                        // หา harvest record ที่ตรงกับ lab submission นี้
                                        const harvestRecord = PlantingBatches?.recent_harvest_record?.find(
                                            harvest => harvest.documentId === lab_rec.harvest_record
                                        );

                                        return (
                                            <React.Fragment key={lab_rec.id}>
                                                <TableRow key={lab_rec.id}>
                                                    <TableCell>{lab_rec.lab_name}</TableCell>
                                                    <TableCell>{new Date(lab_rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                                    <TableCell>
                                                        {harvestRecord ? (
                                                            <span>
                                                                {harvestRecord.yleld} {harvestRecord.yleld_unit || 'kg'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{lab_rec.quality_grade}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${lab_rec.status === 'Pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : lab_rec.status === 'Completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : lab_rec.status === 'Draft'
                                                                    ? 'bg-gray-100 text-gray-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {lab_rec.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            // ⭐ ตรวจสอบ exported status และ submission status
                                                            const isCompleted = lab_rec.status === 'Completed';
                                                            const isExported = lab_rec.exported === true;
                                                            const exportStatus = lab_rec.export_status || 'Unknown';
                                                            const testingMethod = lab_rec.testing_method ;

                                                            if (isCompleted && isExported) {
                                                                // ✅ แสดง View Report เมื่อ Completed และ Exported แล้ว
                                                                return (
                                                                    <Button
                                                                        variant="link"
                                                                        className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                                                                        onClick={() => {
                                                                            // 🔍 เลือกหน้า report ตาม testing method
                                                                            let reportUrl;
                                                                            if (testingMethod === 'HPLC') {
                                                                                // HPLC = หน้า Word format
                                                                                reportUrl = `/hplc-inspection-report/${lab_rec.documentId}`;
                                                                            } else {
                                                                                // NIR/UV-Vis = หน้าโค้ดเดิม
                                                                                reportUrl = `/nir-uv-quality-report/${lab_rec.documentId}`;
                                                                            }
                                                                            router.push(reportUrl);
                                                                        }}
                                                                    >
                                                                        <FileText size={14} />
                                                                        View Report ({testingMethod})
                                                                    </Button>
                                                                );
                                                            } else if (isCompleted && !isExported) {
                                                                // ⏳ แสดงสถานะรอ Export
                                                                return (
                                                                    <div className="flex items-center gap-1 text-orange-600 ">
                                                                        <Clock size={14} />
                                                                        <span className="text-sm">
                                                                            {exportStatus === 'Pending Export' ? 'Awaiting Export' : exportStatus}
                                                                        </span>
                                                                        {/* 💡 แสดง testing method เพื่อให้รู้ว่าจะได้ report แบบไหน */}
                                                                        <span className="text-xs text-gray-500 ml-1">({testingMethod})</span>
                                                                    </div>
                                                                );
                                                            } else if (lab_rec.status === 'Pending') {
                                                                // 🧪 แสดงสถานะกำลังทดสอบ
                                                                return (
                                                                    <div className="flex items-center gap-1 text-yellow-600">
                                                                        <FlaskConical size={14} />
                                                                        <span className="text-sm">Testing in Progress</span>
                                                                        <span className="text-xs text-gray-500 ml-1">({testingMethod})</span>
                                                                    </div>
                                                                );
                                                            } else if (lab_rec.status === 'Draft') {
                                                                // 📝 แสดงสถานะ Draft
                                                                return (
                                                                    <div className="flex items-center gap-1 text-gray-600">
                                                                        <Pencil size={14} />
                                                                        <span className="text-sm">Draft Report</span>
                                                                        <span className="text-xs text-gray-500 ml-1">({testingMethod})</span>
                                                                    </div>
                                                                );
                                                            } else {
                                                                // ❌ ไม่มี Report
                                                                return (
                                                                    <span className="text-gray-400 text-sm">No Report Available</span>
                                                                );
                                                            }
                                                        })()}
                                                    </TableCell>
                                                    <TableCell className="flex gap-2">
                                                        <Button
                                                            className="bg-red-600 hover:bg-red-700"
                                                            onClick={() => handleDeleteLabRecord(lab_rec.documentId, lab_rec.harvest_record)}
                                                        >
                                                            <Trash size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {/* Pagination Section */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {totalItems > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} results
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Previous Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                                            // แสดงเฉพาะหน้าที่อยู่ใกล้กับหน้าปัจจุบัน
                                            if (
                                                pageNumber === 1 ||
                                                pageNumber === totalPages ||
                                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                            ) {
                                                return (
                                                    <Button
                                                        key={pageNumber}
                                                        variant={currentPage === pageNumber ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => handlePageChange(pageNumber)}
                                                        className={`h-8 w-8 p-0 ${currentPage === pageNumber
                                                            ? "bg-green-600 text-white hover:bg-green-700"
                                                            : ""
                                                            }`}
                                                    >
                                                        {pageNumber}
                                                    </Button>
                                                );
                                            } else if (
                                                pageNumber === currentPage - 2 ||
                                                pageNumber === currentPage + 2
                                            ) {
                                                return (
                                                    <span key={pageNumber} className="px-2 text-muted-foreground">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>

                                    {/* Next Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "gap" && (
                        <div className="px-4 py-6 bg-gray-50 min-h-screen">
                            {/* Header with Print Button */}
                            <div className="bg-green-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold">Good Agricultural Practices (GAP) Certification Report</h1>
                                    <p className="text-green-100 mt-2">Comprehensive documentation of farming practices for GAP certification</p>
                                </div>
                                <Button 
                                    onClick={handlePrintGAP}
                                    className="bg-white text-green-600 hover:bg-gray-100 border-2 border-white hover:border-gray-200 font-semibold px-6 py-2"
                                    size="lg"
                                >
                                    <Printer className="w-5 h-5 mr-2" />
                                    Print Report
                                </Button>
                            </div>
                            
                            {/* Report Content */}
                            <div className="bg-white p-8 rounded-b-lg shadow-lg space-y-8">
                                {/* Farmer Information */}
                                <div>
                                    <div className="bg-green-100 p-3 rounded-lg mb-4">
                                        <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                                            <span><User className="text-green-600" /></span> Farmer Information
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Full Name</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentUser?.username || localStorage.getItem("username") || "Kittapas Viriyapipatpoor"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Email Address</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentUser?.email || localStorage.getItem("email") || "farmer@gmail.com"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Contact Number</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentUser?.phone || localStorage.getItem("contactNumber") || "089-123-4567"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Report Date</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Farm Information */}
                                <div>
                                    <div className="bg-green-100 p-3 rounded-lg mb-4">
                                        <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                                            <span><Tractor className="text-green-600"  /></span> Farm Information
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Farm Name</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentFarm?.Farm_Name || PlantingBatches?.location || "Little Farm"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Farm Size</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentFarm ? `${currentFarm.Farm_Size} ${currentFarm.Farm_Size_Unit}` : "10 Rai"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-sm font-medium text-gray-600">Farm Address</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentFarm?.Farm_Address || "123 Moo 5, Mae Rim Luang, Muang 564855, Chiang Rai"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Crop Type</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentFarm?.Crop_Type || "Turmeric"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Cultivation Method</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{currentFarm?.Cultivation_Method || PlantingBatches?.cultivation_method || "Organic Cultivation"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Planting Information */}
                                <div>
                                    <div className="bg-green-100 p-3 rounded-lg mb-4">
                                        <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                                            <span><Leaf className="text-green-600" /></span> Planting Information
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Batch ID</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{PlantingBatches?.batches_id || "T-Batch-001"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Date of Planting</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{PlantingBatches?.planting_date ? new Date(PlantingBatches.planting_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : "05/22/2025"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Plant Variety</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{PlantingBatches?.plant_variety || "curcumalonga"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Cultivation Method</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{PlantingBatches?.cultivation_method || "Organic"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Soil pH</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{PlantingBatches?.soil_pH || "4.0"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Soil Quality</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{PlantingBatches?.soil_quality || "Good"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Water Source</label>
                                            <div className="bg-gray-100 p-3 rounded border">
                                                <p className="font-medium">{PlantingBatches?.water_source || "Rainwater Harvesting"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Planting Cost */}
                                    <div className="mt-6">
                                        <div className="border-l-4 border-green-500 pl-4">
                                            <h4 className="font-semibold text-green-700 mb-3">Planting Cost</h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-gray-50 p-3 rounded">
                                                    <p className="text-sm text-gray-600">Labor Cost ( THB )</p>
                                                    <p className="font-bold">฿{PlantingBatches?.labor_cost }</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded">
                                                    <p className="text-sm text-gray-600">Material Cost ( THB )</p>
                                                    <p className="font-bold">฿{PlantingBatches?.material_cost }</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded">
                                                    <p className="text-sm text-gray-600">Other Cost ( THB )</p>
                                                    <p className="font-bold">฿{PlantingBatches?.other_costs }</p>
                                                </div>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 p-3 rounded mt-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">Total Planting Cost</span>
                                                    <span className="font-bold text-lg">฿{PlantingBatches?.total_planting_cost }</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fertilizer Information */}
                                <div>
                                    <div className="bg-green-100 p-3 rounded-lg mb-4">
                                        <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                                            <span><Sprout className="text-green-600" /></span> Fertilizer Information
                                        </h3>
                                    </div>
                                    {PlantingBatches?.recent_fertilizer_record && PlantingBatches.recent_fertilizer_record.length > 0 ? (
                                        <div>
                                            {/* Summary Statistics */}
                                            <div className="grid grid-cols-3 gap-6 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-600">Total Applications</label>
                                                    <div className="bg-gray-100 p-3 rounded border">
                                                        <p className="font-medium">{PlantingBatches.recent_fertilizer_record.length}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-600">Total Quantity Applied</label>
                                                    <div className="bg-gray-100 p-3 rounded border">
                                                        <p className="font-medium">
                                                            {PlantingBatches.recent_fertilizer_record.reduce((total, record) => total + record.amount, 0)} kg
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-600">Most Recent Application</label>
                                                    <div className="bg-gray-100 p-3 rounded border">
                                                        <p className="font-medium">
                                                            {new Date(PlantingBatches.recent_fertilizer_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* All Fertilizer Records */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-gray-700">Application History</h4>
                                                <div className="grid gap-3">
                                                    {PlantingBatches.recent_fertilizer_record
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                        .map((record, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                            <div className="grid grid-cols-4 gap-4">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Date</p>
                                                                    <p className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Type</p>
                                                                    <p className="font-medium">{record.fertilizer_type}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Quantity</p>
                                                                    <p className="font-medium">{record.amount} {record.unit}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Method</p>
                                                                    <p className="font-medium">{record.method}</p>
                                                                </div>
                                                            </div>
                                                            {record.note && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-gray-500">Notes</p>
                                                                    <p className="text-sm">{record.note}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Fertilizer Cost */}
                                            <div className="mt-6">
                                                <div className="border-l-4 border-green-500 pl-4">
                                                    <h4 className="font-semibold text-green-700 mb-3">Fertilizer Cost</h4>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-sm text-gray-600">Fertilizer Cost ( THB )</p>
                                                            <p className="font-bold">฿{PlantingBatches.recent_fertilizer_record.reduce((total, record) => total + (record.fertilizer_cost || 0), 0).toFixed(0)}</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-sm text-gray-600">Application Labor Cost ( THB )</p>
                                                            <p className="font-bold">฿{PlantingBatches.recent_fertilizer_record.reduce((total, record) => total + (record.application_labor_cost || 0), 0).toFixed(0)}</p>
                                                        </div>
                                                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                                                            <p className="text-sm text-gray-600">Total Fertilizer Cost</p>
                                                            <p className="font-bold">฿{PlantingBatches.recent_fertilizer_record.reduce((total, record) => total + (record.total_fertilizer_cost || 0), 0).toFixed(0)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 text-gray-500">
                                            <p>No fertilizer records available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Harvest Information */}
                                <div>
                                    <div className="bg-green-100 p-3 rounded-lg mb-4">
                                        <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                                            <span><Wrench className="text-green-600" /></span> Harvest Information
                                        </h3>
                                    </div>
                                    {PlantingBatches?.recent_harvest_record && PlantingBatches.recent_harvest_record.length > 0 ? (
                                        <div>
                                            {/* Summary Statistics */}
                                            <div className="grid grid-cols-4 gap-6 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-600">Total Harvests</label>
                                                    <div className="bg-gray-100 p-3 rounded border">
                                                        <p className="font-medium">{PlantingBatches.recent_harvest_record.length}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-600">Total Yield</label>
                                                    <div className="bg-gray-100 p-3 rounded border">
                                                        <p className="font-medium">
                                                            {PlantingBatches.recent_harvest_record.reduce((total, record) => total + record.yleld, 0)} kg
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-600">Average Curcumin Quality</label>
                                                    <div className="bg-gray-100 p-3 rounded border">
                                                        <p className="font-medium">
                                                            {(PlantingBatches.recent_harvest_record.reduce((total, record) => total + parseFloat(record.curcumin_quality), 0) / PlantingBatches.recent_harvest_record.length).toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-600">Latest Harvest</label>
                                                    <div className="bg-gray-100 p-3 rounded border">
                                                        <p className="font-medium">
                                                            {new Date(PlantingBatches.recent_harvest_record.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* All Harvest Records */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-gray-700">Harvest History</h4>
                                                <div className="grid gap-3">
                                                    {PlantingBatches.recent_harvest_record
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                        .map((record, index) => (
                                                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                            <div className="grid grid-cols-4 gap-4">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Date</p>
                                                                    <p className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Yield</p>
                                                                    <p className="font-medium">{record.yleld} {record.yleld_unit}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Quality Grade</p>
                                                                    <p className="font-medium">{record.quality_grade}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Method</p>
                                                                    <p className="font-medium">{record.method}</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 mt-3">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Curcumin Quality</p>
                                                                    <p className="font-medium">{record.curcumin_quality}%</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Result Type</p>
                                                                    <p className="font-medium">{record.result_type || "UV Spectroscopy"}</p>
                                                                </div>
                                                            </div>
                                                            {record.note && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-gray-500">Notes</p>
                                                                    <p className="text-sm">{record.note}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Harvest Cost */}
                                            <div className="mt-6">
                                                <div className="border-l-4 border-green-500 pl-4">
                                                    <h4 className="font-semibold text-green-700 mb-3">Harvest Cost</h4>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-sm text-gray-600">Labor Cost ( THB )</p>
                                                            <p className="font-bold">฿{PlantingBatches.recent_harvest_record.reduce((total, record) => total + (record.labor_cost || 0), 0).toFixed(0)}</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <p className="text-sm text-gray-600">Equipment Cost ( THB )</p>
                                                            <p className="font-bold">฿{PlantingBatches.recent_harvest_record.reduce((total, record) => total + (record.equipment_cost || 0), 0).toFixed(0)}</p>
                                                        </div>
                                                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                                                            <p className="text-sm text-gray-600">Total Harvest Cost</p>
                                                            <p className="font-bold">฿{PlantingBatches.recent_harvest_record.reduce((total, record) => total + (record.total_harvest_cost || 0), 0).toFixed(0)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 text-gray-500">
                                            <p>No harvest records available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </SidebarInset>
            {/* เพิ่ม Dialog ตรงนี้ ก่อนปิด </SidebarProvider> */}
            <Dialog open={labSubmissionModal.isOpen} onOpenChange={(open) => {
                if (!open) {
                    setLabSubmissionModal({
                        isOpen: false,
                        harvestRecordId: null,
                        selectedLab: ""
                    });
                }
            }}>
                <DialogContent className="w-fit">
                    <DialogHeader className="flex flex-col gap-2 items-start">
                        <DialogTitle>Lab to Submission</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 p-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-lg">Lab Name</Label>
                            <Select
                                value={labSubmissionModal.selectedLab}
                                onValueChange={(value) => setLabSubmissionModal(prev => ({
                                    ...prev,
                                    selectedLab: value
                                }))}
                            >
                                <SelectTrigger className="w-full min-w-[250px]">
                                    <SelectValue placeholder="Select Your Lab to Submission" />
                                </SelectTrigger>
                                <SelectContent>
                                    {labdata.map((lab) => (
                                        <SelectItem key={lab.id} value={lab.documentId}>
                                            {lab.Lab_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => setLabSubmissionModal({
                                isOpen: false,
                                harvestRecordId: null,
                                selectedLab: ""
                            })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={handleSubmitSingleToLab}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider >
    );
}