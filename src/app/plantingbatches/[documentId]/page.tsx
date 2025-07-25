'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Sprout, Leaf, Plus, Wrench, FlaskConical, Notebook, Check, ChartSpline, Star, SquarePen, Trash, Circle, ChevronDown, ChevronUp, Pencil, EllipsisVertical, Tractor, Settings, Package, BarChart, FileText, Scale, Beaker, BarChart3, Droplets, RotateCcw, Timer, Repeat, History, ChevronRight, ChevronLeft, SprayCan, Microscope } from "lucide-react";
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
        { name: "Lab History", icon: <History size={16} />, key: "lab" }
    ];

    const [PlantingBatches, setPlantingBatches] = useState<Batches | null>(null);
    const [farmdata, setFarmdata] = useState<Farm[]>([]);
    const [labdata, setLabdata] = useState<any[]>([]);

    const fetchLabData = async () => {
        try {
            const response = await fetch(`http://localhost:1337/api/labs?populate=*`, {
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
            console.log("Fetching data for documentId:", documentId);
            const res = await fetch(`http://localhost:1337/api/batches/${documentId}?populate[Farm][populate]=*&populate[Batch_image][populate]=*&populate[lab_submission_records][populate]=*&populate[harvest_records][populate]=*&populate[fertilizer_records][populate]=*`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (!res.ok) throw new Error("Failed to fetch data");

            const data = await res.json();
            console.log("Fetched data:", data);
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
                image: batch.Batch_image?.url ? `http://localhost:1337${batch.Batch_image.url}`
                    : "",
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
                    kamincal_curcuminoid_content: record.kamincal_curcuminoid_content || "Pass",
                    kamincal_curcuminoid_percentage: record.kamincal_curcuminoid_percentage || 0,
                    kamincal_third_time: record.kamincal_third_time || 0,
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
                        ? `http://localhost:1337${record.Report[0].url}`
                        : "",
                })),
            });
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

            const res = await fetch(`http://localhost:1337/api/fertilizer-records`, {
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
                        batch: documentId,
                    }
                })
            });
            try {
                const res_notification = await fetch(`http://localhost:1337/api/notifications`, {
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
                const update_status_res = await fetch(`http://localhost:1337/api/farms/${PlantingBatches?.farm_id}`, {
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

            const res = await fetch(`http://localhost:1337/api/harvest-records`, {
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
                        kamincal_curcuminoid_content: kaminCALData.curcuminoid_content || "Pass",
                        kamincal_curcuminoid_percentage: parseFloat(kaminCALData.curcuminoid_percentage) || 0,
                        kamincal_third_time: parseFloat(kaminCALData.third_time) || 0,
                    }
                })
            });
            try {
                const res_notification = await fetch(`http://localhost:1337/api/notifications`, {
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

            const update_status_res = await fetch(`http://localhost:1337/api/farms/${PlantingBatches?.farm_id}`, {
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

                    const res = await fetch(`http://localhost:1337/api/lab-submission-records`, {
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
                    const updateRes = await fetch(`http://localhost:1337/api/harvest-records/${sampleId}`, {
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
                        const submitted_notification = await fetch(`http://localhost:1337/api/notifications`, {
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

            const res = await fetch(`http://localhost:1337/api/lab-submission-records/${recordId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
            });
            if (res.ok) {
                const updateRes = await fetch(`http://localhost:1337/api/harvest-records/${harvest_record}`, {
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

            const res = await fetch(`http://localhost:1337/api/harvest-records/${recordId}`, {
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

            const res = await fetch(`http://localhost:1337/api/fertilizer-records/${recordId}`, {
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

            const res = await fetch(`http://localhost:1337/api/batches/${documentId}`, {
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

            const res = await fetch(`http://localhost:1337/api/fertilizer-records/${editingRecord.documentId}`, {
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
                    },
                }),
            });

            if (!res.ok) throw new Error("Failed to update fertilizer record");

            alert("Fertilizer record updated successfully!");
            setIsEditing(false);
            setEditingRecord(null);
            await fetchPlantingBatches(); // Refresh the data
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

                const uploadRes = await fetch("http://localhost:1337/api/upload", {
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

            // Prepare the updated data
            const updatedData: any = {
                Date_of_Planting: PlantingBatches.planting_date,
                Plant_Variety: PlantingBatches.plant_variety,
                Cultivation_Method: PlantingBatches.cultivation_method,
                Farm: PlantingBatches.farm_id,
            };

            // Include the uploaded image ID if available
            if (imageId) {
                updatedData.Batch_image = imageId;
            }

            const res = await fetch(`http://localhost:1337/api/batches/${documentId}`, {
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
                throw new Error("Failed to update batch");
            }

            alert("Batch updated successfully!");
            setIsDialogOpen(false);
            await fetchPlantingBatches(); // Refresh the data
        } catch (error) {
            console.error("Error updating batch:", error);
            alert("Failed to update batch. Please try again.");
        }
    };

    const handleUpdateHarvestRecord = async () => {
        try {
            if (!editingRecord) {
                alert("No record selected for editing.");
                return;
            }

            const res = await fetch(`http://localhost:1337/api/harvest-records/${editingRecord.documentId}`, {
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
                        kamincal_curcuminoid_content: kaminCALData.curcuminoid_content || "Pass",
                        kamincal_curcuminoid_percentage: parseFloat(kaminCALData.curcuminoid_percentage) || 0,
                        kamincal_third_time: parseFloat(kaminCALData.third_time) || 0,
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
    }
        , []);
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

    const handleMarkAsComplete = async () => {
        try {
            if (!PlantingBatches) {
                alert("PlantingBatches data is not available.");
                return;
            }

            // Update Batch_Status to "Completed Successfully"
            const res = await fetch(`http://localhost:1337/api/batches/${documentId}`, {
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

            const groupedHarvestRecords = PlantingBatches.recent_harvest_record.reduce((acc: { [key: string]: { quality_grade: string; total_yield: number; records: string[] } }, record) => {
                if (!acc[record.quality_grade]) {
                    acc[record.quality_grade] = { quality_grade: record.quality_grade, total_yield: 0, records: [] };
                }
                acc[record.quality_grade].total_yield += record.yleld;
                acc[record.quality_grade].records.push(record.documentId);
                return acc;
            }, {});

            // Create factory submissions for each Quality_Grade
            for (const grade in groupedHarvestRecords) {
                const { quality_grade, total_yield, records } = groupedHarvestRecords[grade];
                console.log("Creating factory submission:", {
                    Farm_Name: PlantingBatches.location,
                    Batch_id: PlantingBatches.batches_id,
                    Test_Type: "Curcuminoid",
                    Quality_Grade: quality_grade,
                    Yield: total_yield,
                    Date: new Date().toISOString(),
                    Submission_status: "Waiting",
                    batch: documentId,
                    harvest_records: records,
                });
                const fac_submission_res = await fetch(`http://localhost:1337/api/factory-submissions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify({
                        data: {
                            Farm_Name: PlantingBatches.location,
                            Batch_id: PlantingBatches.batches_id,
                            Test_Type: "Curcuminoid",
                            Quality_Grade: quality_grade,
                            Yield: total_yield,
                            Date: new Date().toISOString(),
                            Submission_status: "Waiting",
                            batch: documentId,
                            harvest_records: records,
                            user_documentId: localStorage.getItem("userId"),
                        },
                    }),
                });

                if (!fac_submission_res.ok) {
                    throw new Error(`Failed to create factory submission for Quality Grade: ${quality_grade}`);
                }
            }

            if (!res.ok) throw new Error("Failed to update Batch_Status to Completed Successfully");

            const farm_res = await fetch(`http://localhost:1337/api/farms/${PlantingBatches.farm_id}`, {
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

            if (!farm_res.ok) throw new Error("Failed to update Farm Batch_Status to End Planted");

            const notification_res = await fetch(`http://localhost:1337/api/notifications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({
                    data: {
                        Text: `Batch marked as completed successfully`,
                        Date: new Date().toISOString(),
                        Notification_status: "General",
                        batch: documentId,
                        user_documentId: localStorage.getItem("userId"),
                    }
                })
            });
            if (!notification_res.ok) throw new Error("Failed to create notification record");

            alert("Batch marked as Completed Successfully!");

            // Automatically update Batch_Status to "Completed Past Data" after 10 minutes
            setTimeout(async () => {
                try {
                    const updateRes = await fetch(`http://localhost:1337/api/batches/${documentId}`, {
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

                    if (!updateRes.ok) throw new Error("Failed to update Batch_Status to Completed Past Data");

                    console.log("Batch_Status updated to Completed Past Data after 10 minutes.");
                    await fetchPlantingBatches(); // Refresh the data
                } catch (error) {
                    console.error("Error updating Batch_Status to Completed Past Data:", error);
                }
            }, 10 * 60 * 1000); // 10 minutes in milliseconds

            await fetchPlantingBatches(); // Refresh the data
        } catch (error) {
            console.error("Error marking batch as complete:", error);
            alert("Failed to mark batch as complete. Please try again.");
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

            const res = await fetch(`http://localhost:1337/api/lab-submission-records`, {
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
            const updateRes = await fetch(`http://localhost:1337/api/harvest-records/${labSubmissionModal.harvestRecordId}`, {
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
                await fetch(`http://localhost:1337/api/notifications`, {
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
    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
    };

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
            result_type: ""
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
                                                setImagePreview(PlantingBatches?.image || null);
                                            }}
                                        >
                                            Edit
                                        </div>
                                        <DialogContent className="w-fit">
                                            <DialogHeader className="flex flex-col gap-2 items-start">
                                                <DialogTitle>Edit Batch</DialogTitle>
                                            </DialogHeader>
                                            <div className="flex flex-col gap-4 p-4">
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
                                                    {/* <div>
                                                        <Label htmlFor="status" className="text-sm font-medium">
                                                            Status
                                                        </Label>
                                                        <Select
                                                            value={PlantingBatches?.Farm_Status || ""}
                                                            onValueChange={(value) =>
                                                                setPlantingBatches((prev) =>
                                                                    prev ? { ...prev, status: value } : prev
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Planted">Planted</SelectItem>
                                                                <SelectItem value="End Planted">End Planted</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div> */}
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
                                                <Button
                                                    variant="outline"
                                                    className="bg-red-600 text-white"
                                                    onClick={() => setIsDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="bg-green-600 text-white"
                                                    onClick={() => handleUpdateBatch()}
                                                >
                                                    Save
                                                </Button>
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
                    <div className="h-full max-h-[240px] w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${PlantingBatches.image})` }} />


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
                                    <Button onClick={() => setIsAdding(true)} className="bg-green-600 hover:bg-green-700" disabled={PlantingBatches.status === "Completed Successfully" || PlantingBatches.status === "Completed Past Data"}>
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
                                                                            setIsEditing(true);
                                                                            setfertilizerFormData({
                                                                                date: rec.date,
                                                                                amount: rec.amount.toString(),
                                                                                size: rec.size.toString(),
                                                                                fertilizer_type: rec.fertilizer_type,
                                                                                method: rec.method,
                                                                                note: rec.note || "",
                                                                                unit: rec.unit,
                                                                            });
                                                                            setEditingRecord(rec);
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

                                    {/* Buttons Section - เหลือแค่ Cancel และ Save */}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditingRecord(null);
                                            }}
                                            className="bg-red-500 hover:bg-red-600"
                                        >Cancel</Button>
                                        <Button onClick={() => harvest_createdata()} className="bg-green-600 hover:bg-green-700">Save</Button>
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
                                                                        curcuminoid_content: harvest_record.kamincal_curcuminoid_content || "Pass",
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
                                                        {lab_rec.status === 'Completed' ? (
                                                            <Button
                                                                variant="link"
                                                                className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                                                                onClick={() => {
                                                                    // เปิดในแท็บเดิม - ใช้ router.push แทน window.open
                                                                    const reportUrl = `/quality-inspection-report/${lab_rec.documentId}`;
                                                                    router.push(reportUrl);
                                                                }}
                                                            >
                                                                <FileText size={14} />
                                                                View Report
                                                            </Button>
                                                        ) : lab_rec.report ? (
                                                            <Button
                                                                variant="link"
                                                                className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                                                                onClick={() => {
                                                                    if (typeof lab_rec.report === "string" && lab_rec.report.startsWith("http")) {
                                                                        // สำหรับไฟล์ดาวน์โหลด ให้เปิดแท็บใหม่
                                                                        window.open(lab_rec.report, '_blank', 'noopener,noreferrer');
                                                                    }
                                                                }}
                                                            >
                                                                <FileText size={14} />
                                                                Download Report
                                                            </Button>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">No Report</span>
                                                        )}
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