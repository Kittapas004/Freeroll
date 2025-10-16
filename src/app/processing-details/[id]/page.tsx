'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Package,
    Calendar,
    Weight,
    MapPin,
    Sprout,
    ArrowLeft,
    ArrowRight,
    Save,
    CheckCircle2,
    Factory,
    FlaskConical,
    PackageCheck,
    Award,
    Clock,
    Thermometer,
    User,
    FileText,
    AlertCircle,
    Eye,
    Printer,
    Trash
} from "lucide-react";

// Interfaces
interface BatchInfo {
    batchId: string;
    farmName: string;
    harvestDate: string;
    yield: string;
    quality: string;
    cultivation: string;
    cropType: string;
    location: string;
    plantVariety: string;
    originalWeight: number;
    processedWeight: number;
    remainingBalance: number;
    rawMaterialType?: string;
}

interface QualityData {
    moisture: string;
    curcuminoidContent: string;
    lead: string;
    cadmium: string;
    arsenic: string;
    mercury: string;
    totalPlateCount: string;
    yeastMold: string;
    eColi: string;
    salmonella: string;
    inspectionNotes: string;
}

interface ProcessingStep {
    id: string;
    sessionNumber?: number;
    processingWeight?: string;
    method: string;
    date: string;
    duration: string;
    temperature: string;
    equipment: string;
    operator: string;
    status: string;
    notes: string;
}

export default function ProcessingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Check if this is a read-only view from history page or factory submission
    const isViewFromHistory = searchParams.get('readonly') === 'true';
    const fromPage = searchParams.get('from') || 'history'; // 'history' or 'submission'

    // Workflow State
    const [currentStep, setCurrentStep] = useState(0); // 0 = overview, 1-4 = processing steps
    const [isProcessingMode, setIsProcessingMode] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [userRole, setUserRole] = useState<string>('');

    // Batch Information
    const [batchInfo, setBatchInfo] = useState<BatchInfo>({
        batchId: "",
        farmName: "",
        harvestDate: "",
        yield: "",
        quality: "",
        cultivation: "",
        location: "",
        plantVariety: "",
        cropType: "",
        originalWeight: 0,
        processedWeight: 0,
        remainingBalance: 0,
    });

    // Step 1: Quality Inspection
    const [qualityData, setQualityData] = useState<QualityData>({
        moisture: "",
        curcuminoidContent: "",
        lead: "",
        cadmium: "",
        arsenic: "",
        mercury: "",
        totalPlateCount: "",
        yeastMold: "",
        eColi: "",
        salmonella: "",
        inspectionNotes: "",
    });
    const [inspectorName, setInspectorName] = useState("");
    const [pesticideResidues, setPesticideResidues] = useState("");
    const [inspectionDate, setInspectionDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Step 2: Processing
    const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
    const [processingWeight, setProcessingWeight] = useState("");
    const [processingWeightHistory, setProcessingWeightHistory] = useState<Array<{
        weight: number;
        timestamp: string;
        sessionNumber: number;
    }>>([]);

    // Step 3: Output & Waste (Support multiple outputs per session)
    const [outputRecords, setOutputRecords] = useState<Array<{
        id: string;
        batchLotNumber: string;
        processor: string;
        productType: string;
        quantity: number;
        unit: string;
        wasteQuantity: number;
        productGrade: string;
        targetMarket: string;
        timestamp: string;
    }>>([]);
    const [finalProductType, setFinalProductType] = useState("");
    const [outputQuantity, setOutputQuantity] = useState("");
    const [outputUnit, setOutputUnit] = useState("");
    const [wasteQuantity, setWasteQuantity] = useState("");
    const [batchLotNumber, setBatchLotNumber] = useState("");
    const [processorName, setProcessorName] = useState("");
    const [standardCriteria, setStandardCriteria] = useState("");
    const [certificationStatus, setCertificationStatus] = useState("");
    const [complianceNotes, setComplianceNotes] = useState("");

    // Step 4: Product Grading
    const [productGrade, setProductGrade] = useState("");
    const [targetMarket, setTargetMarket] = useState("");

    // Processing Status
    const [currentStatus, setCurrentStatus] = useState("Received");

    // Steps Configuration
    const steps = [
        { id: 1, title: "Quality Inspection", subtitle: "Raw Material Intake & Quality Check", icon: FlaskConical },
        { id: 2, title: "Processing", subtitle: "Processing Operations & Tracking", icon: Factory },
        { id: 3, title: "Output & Compliance", subtitle: "Output Recording & Certification", icon: PackageCheck },
        { id: 4, title: "Processing Summary", subtitle: "Final Product Classification", icon: Award },
    ];

    // Weight Management Functions
    const calculateAvailableWeight = (): number => {
        // Available = Remaining Balance
        return batchInfo.remainingBalance;
    };

    const canProcessWeight = (weight: number): boolean => {
        // ตรวจสอบว่าน้ำหนักที่ใส่ไม่เกินน้ำหนักต้นทาง (Original Weight)
        return weight > 0 && weight <= batchInfo.originalWeight;
    };

    const updateRemainingBalance = (processedAmount: number) => {
        const newBalance = batchInfo.remainingBalance - processedAmount;
        setBatchInfo(prev => ({
            ...prev,
            processedWeight: prev.processedWeight + processedAmount,
            remainingBalance: Math.max(0, newBalance)
        }));
    };

    // Save Processing Weight
    const saveProcessingWeight = async () => {
        try {
            if (!processingWeight || Number(processingWeight) <= 0) {
                alert('Please enter a valid weight');
                return;
            }

            if (!canProcessWeight(Number(processingWeight))) {
                alert(`Weight exceeds original batch weight (${batchInfo.originalWeight} kg)`);
                return;
            }

            setSaving(true);

            const newHistoryEntry = {
                weight: Number(processingWeight),
                timestamp: new Date().toISOString(),
                sessionNumber: processingWeightHistory.length + 1
            };

            const updatedHistory = [...processingWeightHistory, newHistoryEntry];

            // Update batch info
            const weightToProcess = Number(processingWeight);
            const newProcessedWeight = batchInfo.processedWeight + weightToProcess;
            const newRemainingBalance = batchInfo.originalWeight - newProcessedWeight;

            // Save to API - Only save weight changes, history will be stored in localStorage
            const token = localStorage.getItem('jwt');
            if (!token) {
                throw new Error('No authentication token');
            }

            const updateData: any = {
                processed_weight: newProcessedWeight,
                remaining_stock: newRemainingBalance,
                processing_weight_history: JSON.stringify(updatedHistory) // Save history to database
            };

            console.log('📤 Sending data:', updateData);

            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: updateData }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ API Error:', errorData);
                throw new Error(`Failed to save: ${errorData?.error?.message || 'Unknown error'}`);
            }

            console.log('✅ Save successful');

            // Update local state and save history to both localStorage AND database
            setProcessingWeightHistory(updatedHistory);
            localStorage.setItem(`processing_history_${params.id}`, JSON.stringify(updatedHistory));

            setBatchInfo(prev => ({
                ...prev,
                processedWeight: newProcessedWeight,
                remainingBalance: newRemainingBalance
            }));

            alert('✅ Processing weight saved successfully!');
            setProcessingWeight(""); // Clear input after save

        } catch (error: any) {
            console.error('❌ Error saving processing weight:', error);
            alert(`❌ Error: ${error.message || 'Failed to save processing weight'}`);
        } finally {
            setSaving(false);
        }
    };

    // API Functions
    const fetchBatchDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("jwt");
            if (!token) {
                router.push('/login');
                return;
            }

            // Check user role
            const currentUserRole = localStorage.getItem("userRole") || 'Factory';
            setUserRole(currentUserRole);
            if (currentUserRole === 'Farmer') {
                setIsReadOnly(true);
            }

            // Fetch processing data
            const [processingResponse, farmsResponse] = await Promise.all([
                fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings/${params.id}?populate[factory_submission][populate][batch][populate]=*`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                }),
                fetch('https://api-freeroll-production.up.railway.app/api/farms?populate=*', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                })
            ]);

            if (!processingResponse.ok) {
                throw new Error('Failed to fetch batch details');
            }

            const data = await processingResponse.json();
            const item = data.data;

            // Set batch information
            const submission = item.factory_submission;
            const originalWeight = Number(submission?.Weight || submission?.Yield || item.incoming_weight || 0);
            const processedWeight = Number(item.processed_weight || 0);
            const farmsData = farmsResponse.ok ? await farmsResponse.json() : { data: [] };

            const farmMap = new Map();
            if (farmsData.data) {
                farmsData.data.forEach((farm: any) => {
                    farmMap.set(farm.Farm_Name, farm);
                });
            }

            let farmLocation = 'Unknown Location';
            let cropType = 'Unknown';
            let plantVariety = 'Unknown';
            let cultivationMethod = 'Unknown';
            let farmName = item.factory_submission?.Farm_Name || 'Unknown Farm';

            // ดึง Cultivation Method จาก Batch ก่อน (ข้อมูลที่ถูกต้อง) ถ้าไม่มีค่อย fallback ไปที่ Farm
            cultivationMethod = item.factory_submission?.batch?.Cultivation_Method || 'Unknown';

            let farmData = null;
            if (farmName && farmMap.has(farmName)) {
                farmData = farmMap.get(farmName);
                farmLocation = farmData.Farm_Address || item.factory_submission?.Farm_Address || farmLocation;
                cropType = farmData.Crop_Type || item.factory_submission?.Crop_Type || cropType;
                plantVariety = farmData.Plant_Variety || item.factory_submission?.batch?.Plant_Variety || item.factory_submission?.Plant_Variety || plantVariety;
                // ไม่ override cultivationMethod จาก Farm เพราะควรใช้จาก Batch
            } else if (item.factory_submission?.Farm_Address) {
                // Fallback to factory submission data
                farmLocation = item.factory_submission.Farm_Address;
                cropType = item.factory_submission.Crop_Type || cropType;
                plantVariety = item.factory_submission.batch?.Plant_Variety || item.factory_submission.Plant_Variety || plantVariety;
                // ไม่ override cultivationMethod จาก Farm เพราะควรใช้จาก Batch
            }

            setBatchInfo({
                batchId: item.Batch_Id || `T-Batch-${item.id}`,
                farmName: submission?.Farm_Name || item.raw_material_source || "Unknown Farm",
                harvestDate: submission?.Date || new Date().toISOString().split('T')[0],
                yield: `${originalWeight} kg`,
                quality: submission?.Quality_Grade || "Unknown",
                cultivation: cultivationMethod, // ใช้ตัวแปรที่ดึงมาจาก Farm data
                cropType: cropType, // ใช้ตัวแปรที่ดึงมาจาก Farm data
                location: farmLocation,
                plantVariety: plantVariety,
                originalWeight: originalWeight,
                processedWeight: processedWeight,
                remainingBalance: Number(item.remaining_stock || originalWeight - processedWeight),
                rawMaterialType: item.raw_material_type || "Fresh Rhizome",
            });

            // Set quality data
            setQualityData({
                moisture: String(item.moisture || ""),
                curcuminoidContent: String(item.curcuminoid_content || ""),
                lead: String(item.lead_ppm || ""),
                cadmium: String(item.cadmium_ppm || ""),
                arsenic: String(item.arsenic_ppm || ""),
                mercury: String(item.mercury_ppm || ""),
                totalPlateCount: String(item.total_plate_count || ""),
                yeastMold: String(item.yeast_mold || ""),
                eColi: item.e_coli || "",
                salmonella: item.salmonella || "",
                inspectionNotes: item.inspection_notes || "",
            });

            setInspectorName(item.inspector_name || "");
            setPesticideResidues(item.pesticide_residues || "");
            // Load inspection date from quality_inspection_date field
            if (item.quality_inspection_date) {
                const inspectionDateValue = new Date(item.quality_inspection_date).toISOString().split('T')[0];
                setInspectionDate(inspectionDateValue);
            } else {
                setInspectionDate(new Date().toISOString().split('T')[0]);
            }

            // Set processing steps
            if (item.processing_operations) {
                try {
                    setProcessingSteps(JSON.parse(item.processing_operations));
                } catch (e) {
                    setProcessingSteps([]);
                }
            } else if (item.processing_steps && typeof item.processing_steps === 'string') {
                // Fallback to old field name
                try {
                    setProcessingSteps(JSON.parse(item.processing_steps));
                } catch (e) {
                    setProcessingSteps([]);
                }
            }

            // Don't load processing_weight from database as it's temporary session data
            setProcessingWeight("");

            // Load processing weight history from database first, fallback to localStorage
            if (item.processing_weight_history) {
                try {
                    const historyFromDB = JSON.parse(item.processing_weight_history);
                    setProcessingWeightHistory(historyFromDB);
                    console.log('✅ Loaded processing history from database:', historyFromDB);
                    console.log('📊 Processing history length:', historyFromDB.length);
                } catch (e) {
                    console.error('❌ Error parsing processing_weight_history from database:', e);
                    // Fallback to localStorage
                    const savedHistory = localStorage.getItem(`processing_history_${params.id}`);
                    if (savedHistory) {
                        try {
                            const historyFromLocal = JSON.parse(savedHistory);
                            setProcessingWeightHistory(historyFromLocal);
                            console.log('✅ Loaded processing history from localStorage (fallback):', historyFromLocal);
                            console.log('📊 Processing history length (localStorage):', historyFromLocal.length);
                        } catch (e2) {
                            console.error('❌ Error parsing localStorage history:', e2);
                            setProcessingWeightHistory([]);
                        }
                    } else {
                        console.warn('⚠️ No processing history in localStorage');
                        setProcessingWeightHistory([]);
                    }
                }
            } else {
                // Fallback to localStorage if database field doesn't exist
                console.warn('⚠️ No processing_weight_history field in database');
                const savedHistory = localStorage.getItem(`processing_history_${params.id}`);
                if (savedHistory) {
                    try {
                        const historyFromLocal = JSON.parse(savedHistory);
                        setProcessingWeightHistory(historyFromLocal);
                        console.log('✅ Loaded processing history from localStorage (no DB field):', historyFromLocal);
                        console.log('📊 Processing history length (localStorage):', historyFromLocal.length);
                    } catch (e) {
                        console.error('❌ Error parsing localStorage history:', e);
                        setProcessingWeightHistory([]);
                    }
                } else {
                    console.warn('⚠️ No processing history found anywhere');
                    setProcessingWeightHistory([]);
                }
            }

            // Load output records from database
            if (item.output_records_json) {
                try {
                    setOutputRecords(JSON.parse(item.output_records_json));
                } catch (e) {
                    setOutputRecords([]);
                }
            } else {
                setOutputRecords([]);
            }

            // Set output data (for backward compatibility and current form)
            // setFinalProductType(item.final_product_type || "");
            // setOutputQuantity(String(item.output_quantity || ""));
            // setOutputUnit(item.output_unit || "");
            // setWasteQuantity(String(item.waste_quantity || ""));
            setStandardCriteria(item.standard_criteria || "");
            setCertificationStatus(item.certification_status || "");
            setComplianceNotes(item.compliance_notes || "");

            // Set grading data
            // setProductGrade(item.product_grade || "");
            // setTargetMarket(item.target_market || "");

            // Set workflow state
            const savedStatus = item.Processing_Status || "Received";
            setCurrentStatus(savedStatus);

            // If viewing from history (readonly mode), start at Overview to show Print button
            if (isViewFromHistory) {
                setCurrentStep(0); // Start at Overview (0 = overview page)
                setIsProcessingMode(false); // Start in overview mode, not processing mode
                setIsReadOnly(true); // Make everything read-only
                console.log('👁️ View from History - Read-only mode enabled, starting at Overview');
            } else {
                setCurrentStep(item.workflow_step || 0);
                setIsProcessingMode(item.is_processing_mode || false);
                setIsReadOnly(savedStatus === "Completed");
            }

            console.log('📥 Batch details loaded:', {
                workflow_step: item.workflow_step,
                is_processing_mode: item.is_processing_mode,
                Processing_Status: savedStatus,
                processingStepsCount: processingSteps.length,
                isViewFromHistory: isViewFromHistory
            });

        } catch (error) {
            console.error('Error fetching batch details:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveCurrentStep = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('jwt');
            if (!token) {
                throw new Error('No authentication token');
            }

            // Build update data, only include non-null values
            const updateData: any = {
                workflow_step: currentStep,
                is_processing_mode: isProcessingMode,
                Processing_Status: currentStep === 4 ? "Completed" : "Processing"
            };

            // Quality Inspection Data
            if (qualityData.moisture) updateData.moisture = Number(qualityData.moisture);
            if (qualityData.curcuminoidContent) updateData.curcuminoid_content = Number(qualityData.curcuminoidContent);
            if (qualityData.lead) updateData.lead_ppm = Number(qualityData.lead);
            if (qualityData.cadmium) updateData.cadmium_ppm = Number(qualityData.cadmium);
            if (qualityData.arsenic) updateData.arsenic_ppm = Number(qualityData.arsenic);
            if (qualityData.mercury) updateData.mercury_ppm = Number(qualityData.mercury);
            if (qualityData.totalPlateCount) updateData.total_plate_count = Number(qualityData.totalPlateCount);
            if (qualityData.yeastMold) updateData.yeast_mold = Number(qualityData.yeastMold);
            if (qualityData.eColi) updateData.e_coli = qualityData.eColi;
            if (qualityData.salmonella) updateData.salmonella = qualityData.salmonella;
            if (qualityData.inspectionNotes) updateData.inspection_notes = qualityData.inspectionNotes;
            if (inspectorName) updateData.inspector_name = inspectorName;
            if (pesticideResidues) updateData.pesticide_residues = pesticideResidues;
            // Save inspection date to quality_inspection_date field
            if (inspectionDate) updateData.quality_inspection_date = inspectionDate;

            // Processing Data
            if (processingSteps.length > 0) {
                // Validate and fix dates before saving
                const validatedSteps = processingSteps.map(step => {
                    let validDate = step.date;

                    // Check if date is valid
                    const dateTest = new Date(step.date);
                    if (isNaN(dateTest.getTime()) || step.date.includes('18-11')) {
                        // Invalid date, use today's date
                        const today = new Date();
                        const yyyy = today.getFullYear();
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const dd = String(today.getDate()).padStart(2, '0');
                        validDate = `${yyyy}-${mm}-${dd}`;
                    }

                    return {
                        ...step,
                        date: validDate
                    };
                });

                // Use different field name to avoid conflict with relation
                updateData.processing_operations = JSON.stringify(validatedSteps);
                // Update state with corrected data
                setProcessingSteps(validatedSteps);
            }
            // Don't save processing_weight as it's temporary and managed separately
            if (batchInfo.processedWeight) updateData.processed_weight = batchInfo.processedWeight;

            // Output Data - Save multiple output records as JSON
            console.log('📊 Output Records before save:', outputRecords);
            console.log('📊 Output Records length:', outputRecords.length);
            if (outputRecords.length > 0) {
                updateData.output_records_json = JSON.stringify(outputRecords);
                console.log('✅ output_records_json prepared:', updateData.output_records_json);
            } else {
                console.log('⚠️ No output records to save (array is empty)');
            }
            // OLD FIELDS - Keep for backward compatibility (READ ONLY, don't save new data)
            // if (finalProductType) updateData.final_product_type = finalProductType;
            // if (outputQuantity) updateData.output_quantity = Number(outputQuantity);
            // if (outputUnit) updateData.output_unit = outputUnit;
            // if (wasteQuantity) updateData.waste_quantity = Number(wasteQuantity);
            if (batchInfo.remainingBalance !== undefined) updateData.remaining_stock = batchInfo.remainingBalance;

            // Compliance Data
            if (standardCriteria) updateData.standard_criteria = standardCriteria;
            if (certificationStatus) updateData.certification_status = certificationStatus;
            if (complianceNotes) updateData.compliance_notes = complianceNotes;

            // Grading Data
            if (productGrade) updateData.product_grade = productGrade;
            if (targetMarket) updateData.target_market = targetMarket;

            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: updateData }), // Wrap with "data" for Strapi
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ API Error Response:', errorData);
                console.error('❌ Status:', response.status);
                console.error('❌ Data sent:', updateData);

                // Show detailed error message
                const errorMessage = errorData?.error?.message || 'Unknown error';
                const errorDetails = errorData?.error?.details || {};
                console.error('❌ Error Message:', errorMessage);
                console.error('❌ Error Details:', errorDetails);

                alert(`Error saving data: ${errorMessage}`);
                throw new Error(`Failed to save data: ${JSON.stringify(errorData)}`);
            }

            console.log('✅ Data saved successfully');
        } catch (error) {
            console.error('❌ Error saving data:', error);
            alert('Error saving data. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Auto-save functionality - runs every 60 seconds during processing
    // useEffect(() => {
    //     if (!isProcessingMode || currentStep === 0 || saving) return;

    //     console.log('⏰ Auto-save timer started for Step', currentStep);
    //     console.log('📊 Current Output Records:', outputRecords);

    //     const timer = setTimeout(() => {
    //         console.log('💾 Auto-save triggered!');
    //         saveCurrentStep();
    //     }, 60000); // 60 seconds

    //     return () => {
    //         console.log('⏰ Auto-save timer cleared');
    //         clearTimeout(timer);
    //     };
    // }, [isProcessingMode, currentStep, saving, qualityData, processingSteps, outputQuantity, outputRecords]);

    // Workflow Functions
    const handleProcessRemaining = async () => {
        console.log('🔄 Process Remaining Material clicked');
        console.log('📊 Current state:', {
            currentStep,
            isProcessingMode,
            processingStepsCount: processingSteps.length,
            inspectorName,
            hasMoisture: !!qualityData.moisture
        });

        setIsProcessingMode(true);

        // Determine which step to continue from based on saved workflow_step
        // If workflow_step is 0 or not set, start from step 1
        // Otherwise, continue from the saved step
        const stepToContinue = currentStep > 0 ? currentStep : 1;
        console.log('✅ Will continue from Step:', stepToContinue);

        // Only setCurrentStep if it's different to avoid unnecessary re-render
        if (currentStep !== stepToContinue) {
            setCurrentStep(stepToContinue);
        }

        await saveCurrentStep();
    };

    const handleBackToOverview = async () => {
        console.log('⬅️ Back to Overview clicked');
        console.log('💾 Saving state - Keep current step, set processing mode to false');
        console.log('📊 Current step before back:', currentStep);

        // Set processing mode to false but KEEP the current step
        // This allows user to continue from where they left off
        setIsProcessingMode(false);

        // Save to database - Keep workflow_step, only change is_processing_mode
        try {
            const token = localStorage.getItem('jwt');
            if (token) {
                const updateData = {
                    is_processing_mode: false,
                    workflow_step: currentStep, // Save the current step to DB
                };

                console.log('💾 Saving to database:', updateData);

                await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings/${params.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: updateData }),
                });

                console.log('✅ Saved successfully');
            }
        } catch (error) {
            console.error('❌ Error saving back to overview state:', error);
        }
    };

    // Validation Functions
    const canNavigateToStep = (targetStep: number): boolean => {
        // Can always go to Step 1
        if (targetStep === 1) return true;

        // Check Step 1 completion (must have inspector name and at least some quality data)
        if (targetStep > 1) {
            if (!inspectorName || !qualityData.moisture) {
                return false;
            }
        }

        // Check Step 2 completion (must have at least 1 processing operation and all must be completed)
        if (targetStep > 2) {
            // Must have at least 1 processing step
            if (processingSteps.length === 0) {
                return false;
            }

            // All processing steps must be completed
            const hasIncompleteSteps = processingSteps.some(
                step => step.status === 'Pending' || step.status === 'In Progress'
            );
            if (hasIncompleteSteps) {
                return false;
            }
        }

        // Check Step 3 completion (must have at least 1 output record and certification status must not be Pending)
        if (targetStep > 3) {
            // Must have at least 1 output record (Final Product)
            if (outputRecords.length === 0) {
                return false;
            }

            // Certification Status must not be "Pending"
            if (!certificationStatus || certificationStatus.toLowerCase() === 'pending') {
                return false;
            }
        }

        return true;
    };

    const handleStepNavigation = async (targetStep: number) => {
        if (!canNavigateToStep(targetStep)) {
            if (targetStep > 1 && (!inspectorName || !qualityData.moisture)) {
                alert('⚠️ Please complete Step 1 (Quality Inspection) first!\nFill in Inspector Name and Moisture Content.');
                return;
            }
            if (targetStep > 2) {
                if (processingSteps.length === 0) {
                    alert('⚠️ Please add at least one Processing Operation in Step 2 first!\nClick "Add Processing Step" to create an operation.');
                    return;
                }

                const hasIncompleteSteps = processingSteps.some(
                    step => step.status === 'Pending' || step.status === 'In Progress'
                );
                if (hasIncompleteSteps) {
                    alert('⚠️ Please complete all Processing Operations in Step 2 first!\nAll operations must have status "Completed".');
                    return;
                }
            }
            if (targetStep > 3) {
                if (outputRecords.length === 0) {
                    alert('⚠️ Please add at least one Output Record in Step 3 first!\nClick "Save Output Record" to record your final product.');
                    return;
                }

                if (!certificationStatus || certificationStatus.toLowerCase() === 'pending') {
                    alert('⚠️ Please update Certification Status in Step 3!\nCertification Status cannot be "Pending" to proceed to Step 4.');
                    return;
                }
            }
            return;
        }

        // Save current step before navigating
        await saveCurrentStep();
        setCurrentStep(targetStep);
    };

    const handleNextStep = async () => {
        if (currentStep < 4) {
            // Validate current step before moving to next
            if (!canNavigateToStep(currentStep + 1)) {
                if (currentStep === 1) {
                    alert('⚠️ Please complete Step 1 (Quality Inspection) first!\nFill in Inspector Name and Moisture Content.');
                    return;
                } else if (currentStep === 2) {
                    if (processingSteps.length === 0) {
                        alert('⚠️ Please add at least one Processing Operation in Step 2 first!\nClick "Add Processing Step" to create an operation.');
                        return;
                    }

                    const hasIncompleteSteps = processingSteps.some(
                        step => step.status === 'Pending' || step.status === 'In Progress'
                    );
                    if (hasIncompleteSteps) {
                        alert('⚠️ Please complete all Processing Operations in Step 2 first!\nAll operations must have status "Completed".');
                        return;
                    }
                } else if (currentStep === 3) {
                    if (outputRecords.length === 0) {
                        alert('⚠️ Please add at least one Output Record first!\nClick "Save Output Record" to record your final product.');
                        return;
                    }

                    if (!certificationStatus || certificationStatus.toLowerCase() === 'pending') {
                        alert('⚠️ Please update Certification Status!\nCertification Status cannot be "Pending" to proceed to Step 4.\n\nPlease select "Pass" or "Fail" in the Certification Status dropdown.');
                        return;
                    }
                }
                return;
            }

            // If moving from Step 2 to Step 3, create processing session
            if (currentStep === 2 && processingWeight && processingSteps.length > 0) {
                const weightToProcess = Number(processingWeight);

                // Add session number and weight to the first step in this session
                const sessionNumber = Math.floor(batchInfo.processedWeight / 100) + 1; // Calculate session number
                const updatedSteps = [...processingSteps];
                if (updatedSteps.length > 0) {
                    updatedSteps[0] = {
                        ...updatedSteps[0],
                        sessionNumber: sessionNumber,
                        processingWeight: processingWeight
                    };
                    setProcessingSteps(updatedSteps);
                }

                // Update processed weight
                const newProcessedWeight = batchInfo.processedWeight + weightToProcess;
                const newRemainingBalance = batchInfo.originalWeight - newProcessedWeight;

                setBatchInfo(prev => ({
                    ...prev,
                    processedWeight: newProcessedWeight,
                    remainingBalance: newRemainingBalance
                }));

                // Clear processing weight for next round
                setProcessingWeight("");
            }

            await saveCurrentStep();
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            handleBackToOverview();
        }
    };

    // Save Draft is always allowed in Step 3
    // Output Recording uses separate "Save Output Record" button
    // Save Draft only saves Compliance & Certification data
    const isOutputFormComplete = (): boolean => {
        return true; // Always allow Save Draft
    };

    const handleSaveDraft = async () => {
        await saveCurrentStep();
        alert('Draft saved successfully!');
    };

    const handleCompleteProcessing = async () => {
        try {
            // Check if there's remaining material and ask for confirmation
            if (batchInfo.remainingBalance > 0) {
                const remainingWeight = batchInfo.remainingBalance.toFixed(2);
                const totalProcessingWeight = processingWeightHistory.reduce((sum, h) => sum + h.weight, 0);

                const confirmMessage = `⚠️ Warning: You still have ${remainingWeight} kg of material remaining!\n\n` +
                    `Processed: ${totalProcessingWeight} kg\n` +
                    `Remaining: ${remainingWeight} kg\n\n` +
                    `Once you complete this processing, you will NOT be able to come back and process the remaining material.\n\n` +
                    `Do you want to:\n` +
                    `• Click "OK" to COMPLETE and leave ${remainingWeight} kg unprocessed\n` +
                    `• Click "Cancel" to go back and process the remaining material`;

                const userConfirmed = confirm(confirmMessage);

                if (!userConfirmed) {
                    // User wants to go back and process remaining material
                    return;
                }
            }

            // Save current step data first
            await saveCurrentStep();

            // Get existing sessions to calculate correct session number
            const existingSessions = JSON.parse(localStorage.getItem(`processing_sessions_${params.id}`) || '[]');
            const nextSessionNumber = existingSessions.length + 1;

            // Calculate total processing weight from history
            const totalProcessingWeight = processingWeightHistory.reduce((sum, h) => sum + h.weight, 0);

            // Create Processing Session Record
            const sessionRecord = {
                sessionNumber: nextSessionNumber,
                processingWeight: totalProcessingWeight,
                completedDate: new Date().toISOString(),
                operations: processingSteps,
                outputRecords: outputRecords, // Multiple outputs
                totalOutput: outputRecords.reduce((sum, r) => sum + r.quantity, 0),
                totalWaste: outputRecords.reduce((sum, r) => sum + r.wasteQuantity, 0),
                productGrade: productGrade,
                targetMarket: targetMarket,
                standardCriteria: standardCriteria,
                certificationStatus: certificationStatus,
                status: 'Completed'
            };

            // Save session to localStorage
            existingSessions.push(sessionRecord);
            localStorage.setItem(`processing_sessions_${params.id}`, JSON.stringify(existingSessions));

            // Clear processing weight history for next session
            localStorage.removeItem(`processing_history_${params.id}`);

            // Reset all step data for next session
            setQualityData({
                moisture: "",
                curcuminoidContent: "",
                lead: "",
                cadmium: "",
                arsenic: "",
                mercury: "",
                totalPlateCount: "",
                yeastMold: "",
                eColi: "Not Detected",
                salmonella: "Not Detected",
                inspectionNotes: "",
            });
            setInspectorName("");
            setPesticideResidues("");
            setProcessingSteps([]);
            setProcessingWeightHistory([]);
            setOutputRecords([]); // Clear output records
            setOutputQuantity("");
            setWasteQuantity("");
            setComplianceNotes("");
            setProductGrade("");
            setTargetMarket("");

            // Update status - Always mark as Completed when this function is called
            setCurrentStatus("Completed");
            setIsReadOnly(true);

            if (batchInfo.remainingBalance <= 0) {
                // All material processed
                alert('🎉 Processing completed successfully!\n\nAll material has been processed.');
            } else {
                // Material remaining but user confirmed to complete
                alert(`✅ Processing completed successfully!\n\nProcessed: ${totalProcessingWeight} kg\nRemaining (unprocessed): ${batchInfo.remainingBalance.toFixed(2)} kg\n\nThe remaining material has been left unprocessed as confirmed.`);
            }

            // Reload data to reflect changes
            await fetchBatchDetails();

        } catch (error) {
            console.error('Error completing processing:', error);
            alert('Error completing processing. Please try again.');
        }
    };

    // Print Report Function - รองรับหลาย output records
    const handlePrintReport = () => {
        // ตรวจสอบว่ามี output records หรือไม่
        if (outputRecords.length === 0) {
            alert("⚠️ No output records available for printing");
            return;
        }

        // สร้าง HTML สำหรับ output records แต่ละรายการ
        const outputRecordsHtml = outputRecords.map((record, index) => `
            <div class="subsection">
                <div class="subsection-header">Output Record #${index + 1}</div>
                <table>
                    <tr>
                        <td class="label">Batch Lot Number</td>
                        <td class="value">${record.batchLotNumber}</td>
                    </tr>
                    <tr>
                        <td class="label">Product Type</td>
                        <td class="value">${record.productType}</td>
                    </tr>
                    <tr>
                        <td class="label">Output Quantity</td>
                        <td class="value">${record.quantity} ${record.unit}</td>
                    </tr>
                    <tr>
                        <td class="label">Waste Quantity</td>
                        <td class="value">${record.wasteQuantity} kg</td>
                    </tr>
                    <tr>
                        <td class="label">Product Grade</td>
                        <td class="value">${record.productGrade}</td>
                    </tr>
                    <tr>
                        <td class="label">Target Market</td>
                        <td class="value">${record.targetMarket}</td>
                    </tr>
                    <tr>
                        <td class="label">Processor</td>
                        <td class="value">${record.processor}</td>
                    </tr>
                    <tr>
                        <td class="label">Timestamp</td>
                        <td class="value">${new Date(record.timestamp).toLocaleString('en-GB')}</td>
                    </tr>
                </table>
            </div>
        `).join('');

        // คำนวณยอดรวม
        const totalOutput = outputRecords.reduce((sum, r) => sum + r.quantity, 0);
        const totalWaste = outputRecords.reduce((sum, r) => sum + r.wasteQuantity, 0);

        // สร้าง Processing Steps HTML
        const processingStepsHtml = processingSteps.length > 0 ? processingSteps.map((step, index) => `
            <div class="subsection">
                <div class="subsection-header">Processing Step #${index + 1}</div>
                <table>
                    <tr>
                        <td class="label">Method</td>
                        <td class="value">${step.method}</td>
                    </tr>
                    <tr>
                        <td class="label">Date</td>
                        <td class="value">${new Date(step.date).toLocaleDateString('en-GB')}</td>
                    </tr>
                    <tr>
                        <td class="label">Duration</td>
                        <td class="value">${step.duration} hours</td>
                    </tr>
                    <tr>
                        <td class="label">Temperature</td>
                        <td class="value">${step.temperature} °C</td>
                    </tr>
                    <tr>
                        <td class="label">Equipment</td>
                        <td class="value">${step.equipment}</td>
                    </tr>
                    <tr>
                        <td class="label">Operator</td>
                        <td class="value">${step.operator}</td>
                    </tr>
                    <tr>
                        <td class="label">Status</td>
                        <td class="value">${step.status}</td>
                    </tr>
                    ${step.notes ? `
                    <tr>
                        <td class="label">Notes</td>
                        <td class="value">${step.notes}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        `).join('') : '<p style="text-align: center; color: #666;">No processing steps recorded</p>';

        // สร้าง iframe สำหรับ print
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-1000px';
        printFrame.style.left = '-1000px';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);

        const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Turmeric Factory Processing Report - ${batchInfo.batchId}</title>
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
        .subsection-header {
            background-color: #f1f5f9;
            padding: 5px 10px;
            margin: 15px 0 5px 0;
            font-weight: bold;
            color: #374151;
            page-break-after: avoid;
        }
        .subsection {
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
        .summary-box {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .summary-box strong {
            color: #0369a1;
        }
    </style>
</head>
<body>
    <!-- Header สำหรับทุกหน้าในการพิมพ์ -->
    <div class="page-header">
        <h1> Turmeric Factory Processing Report</h1>
        <p>Batch ID: ${batchInfo.batchId} | Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}</p>
        <div class="separator"></div>
    </div>

    <!-- Header สำหรับหน้าจอปกติ -->
    <div class="main-header">
        <h1> Turmeric Factory Processing Report</h1>
        <p>Comprehensive documentation of turmeric processing and quality assurance</p>
        <div class="separator"></div>
    </div>

    <div class="content">

    <!-- 1. Batch Information -->
    <div class="section">
        <h2>1. Batch Information</h2>
        <table>
            <tr>
                <td class="label">Batch ID</td>
                <td class="value">${batchInfo.batchId}</td>
            </tr>
            <tr>
                <td class="label">Date Received</td>
                <td class="value">${batchInfo.harvestDate ? new Date(batchInfo.harvestDate).toLocaleDateString('en-GB') : 'N/A'}</td>
            </tr>
            <tr>
                <td class="label">Farm Source</td>
                <td class="value">${batchInfo.farmName}</td>
            </tr>
            <tr>
                <td class="label">Location</td>
                <td class="value">${batchInfo.location}</td>
            </tr>
            <tr>
                <td class="label">Raw Material Weight</td>
                <td class="value">${batchInfo.originalWeight} kg</td>
            </tr>
            <tr>
                <td class="label">Processed Weight</td>
                <td class="value">${batchInfo.processedWeight} kg</td>
            </tr>
            <tr>
                <td class="label">Remaining Balance</td>
                <td class="value">${batchInfo.remainingBalance} kg</td>
            </tr>
            <tr>
                <td class="label">Plant Variety</td>
                <td class="value">${batchInfo.plantVariety}</td>
            </tr>
            <tr>
                <td class="label">Cultivation Method</td>
                <td class="value">${batchInfo.cultivation}</td>
            </tr>
            <tr>
                <td class="label">Status</td>
                <td class="value">${currentStatus}</td>
            </tr>
        </table>
    </div>

    <!-- 2. Quality Inspection -->
    <div class="section">
        <h2>2. Quality Inspection</h2>
        <table>
            <tr>
                <td class="label">Inspector Name</td>
                <td class="value">${inspectorName || 'Not specified'}</td>
            </tr>
            <tr>
                <td class="label">Inspection Date</td>
                <td class="value">${inspectionDate ? new Date(inspectionDate).toLocaleDateString('en-GB') : 'Not specified'}</td>
            </tr>
        </table>

        <div class="subsection-header">Physical & Chemical Tests</div>
        <div class="subsection">
            <table>
                <tr>
                    <td class="label">Moisture</td>
                    <td class="value">${qualityData.moisture || '-'}%</td>
                </tr>
                <tr>
                    <td class="label">Curcuminoid Content</td>
                    <td class="value">${qualityData.curcuminoidContent || '-'}%</td>
                </tr>
            </table>
        </div>

        <div class="subsection-header">Heavy Metals Test (mg/kg)</div>
        <div class="subsection">
            <table>
                <tr>
                    <td class="label">Lead (Pb)</td>
                    <td class="value">${qualityData.lead || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Cadmium (Cd)</td>
                    <td class="value">${qualityData.cadmium || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Arsenic (As)</td>
                    <td class="value">${qualityData.arsenic || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Mercury (Hg)</td>
                    <td class="value">${qualityData.mercury || '-'}</td>
                </tr>
            </table>
        </div>

        <div class="subsection-header">Microbial Tests</div>
        <div class="subsection">
            <table>
                <tr>
                    <td class="label">Total Plate Count</td>
                    <td class="value">${qualityData.totalPlateCount || '-'} CFU/g</td>
                </tr>
                <tr>
                    <td class="label">Yeast & Mold</td>
                    <td class="value">${qualityData.yeastMold || '-'} CFU/g</td>
                </tr>
                <tr>
                    <td class="label">E. coli</td>
                    <td class="value">${qualityData.eColi || 'Not Detected'}</td>
                </tr>
                <tr>
                    <td class="label">Salmonella</td>
                    <td class="value">${qualityData.salmonella || 'Not Detected'}</td>
                </tr>
                <tr>
                    <td class="label">Pesticide Residues</td>
                    <td class="value">${pesticideResidues || 'Not Detected'}</td>
                </tr>
            </table>
        </div>

        ${qualityData.inspectionNotes ? `
        <div class="subsection">
            <div class="subsection-header">Inspection Notes</div>
            <table>
                <tr>
                    <td class="value">${qualityData.inspectionNotes}</td>
                </tr>
            </table>
        </div>
        ` : ''}
    </div>

    <!-- 3. Processing Operations -->
    <div class="section">
        <h2>3. Processing Operations</h2>
        ${processingStepsHtml}
    </div>

    <!-- 4. Output Records (หลายรายการ) -->
    <div class="section">
        <h2>4. Output Records</h2>
        ${outputRecordsHtml}
    </div>

    <!-- 5. Compliance & Certification -->
    <div class="section">
        <h2>5. Compliance & Certification</h2>
        <table>
            <tr>
                <td class="label">Standard Criteria</td>
                <td class="value">${standardCriteria || 'Not specified'}</td>
            </tr>
            <tr>
                <td class="label">Certification Status</td>
                <td class="value">${certificationStatus || 'Not specified'}</td>
            </tr>
            ${complianceNotes ? `
            <tr>
                <td class="label">Compliance Notes</td>
                <td class="value">${complianceNotes}</td>
            </tr>
            ` : ''}
        </table>
    </div>

    <!-- 6. Report Summary -->
    <div class="section">
        <h2>6. Report Summary</h2>
        <div class="cert-box">
            <strong>This report certifies that Batch ${batchInfo.batchId} has been successfully processed under factory Good Manufacturing Practices (GMP). The turmeric material has passed all required inspections, meeting both quality and safety standards.</strong>
            <br><br>
            <strong>Summary:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Original Weight: ${batchInfo.originalWeight} kg</li>
                <li>Processed Weight: ${batchInfo.processedWeight} kg</li>
                <li>Total Output Products: ${outputRecords.length} items</li>
                <li>Total Output Quantity: ${totalOutput.toFixed(2)} units</li>
                <li>Total Waste: ${totalWaste.toFixed(2)} kg</li>
                <li>Remaining Balance: ${batchInfo.remainingBalance} kg</li>
            </ul>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    <strong>Prepared by (Processor)</strong><br>
                    ${inspectorName || '___________________'}
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    <strong>Reviewed by (Inspector)</strong><br>
                    Date: ${new Date().toLocaleDateString('en-GB')}
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
            frameDoc.write(reportContent);
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

    // Processing Step Management
    const addProcessingStep = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        // Get the latest session from processing weight history
        const latestSession = processingWeightHistory.length > 0
            ? processingWeightHistory[processingWeightHistory.length - 1]
            : null;

        const newStep: ProcessingStep = {
            id: Date.now().toString(),
            method: "Washing",
            date: formattedDate,
            duration: "",
            temperature: "",
            equipment: "",
            operator: "",
            status: "Pending",
            notes: "",
            sessionNumber: latestSession?.sessionNumber || 1,
            processingWeight: latestSession?.weight.toString() || "0"
        };
        setProcessingSteps([...processingSteps, newStep]);
    };

    const updateProcessingStep = (id: string, field: keyof ProcessingStep, value: string) => {
        setProcessingSteps(steps =>
            steps.map(step =>
                step.id === id ? { ...step, [field]: value } : step
            )
        );
    };

    const removeProcessingStep = async (id: string) => {
        const updatedSteps = processingSteps.filter(step => step.id !== id);
        setProcessingSteps(updatedSteps);

        // Save to database immediately
        await saveProcessingStepsToDatabase(updatedSteps);
    };

    const clearAllProcessingSteps = async () => {
        setProcessingSteps([]);

        // Save empty array to database
        await saveProcessingStepsToDatabase([]);
    };

    // Save processing steps to database immediately
    const saveProcessingStepsToDatabase = async (steps: ProcessingStep[]) => {
        try {
            const token = localStorage.getItem('jwt');
            if (!token) return;

            const updateData: any = {
                processing_operations: JSON.stringify(steps)
            };

            console.log('💾 Saving processing steps to database:', steps);

            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: updateData }),
            });

            if (response.ok) {
                console.log('✅ Processing steps saved successfully');
            } else {
                console.error('❌ Failed to save processing steps');
            }
        } catch (error) {
            console.error('❌ Error saving processing steps:', error);
        }
    };

    // Generate Batch Lot Number - Unique across ALL processing records in system
    const generateBatchLotNumber = async (): Promise<string> => {
        try {
            // Fetch ALL processing records from database to check for existing lot numbers
            const token = localStorage.getItem('jwt');
            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch processing records');
            }

            const data = await response.json();
            console.log('🔍 Fetched all processing records for lot number generation');

            // Collect ALL existing lot numbers from ALL processing records in the system
            const allLotNumbers: string[] = [];

            data.data.forEach((processing: any) => {
                if (processing.output_records_json) {
                    try {
                        const outputRecords = JSON.parse(processing.output_records_json);
                        outputRecords.forEach((record: any) => {
                            if (record.batchLotNumber) {
                                allLotNumbers.push(record.batchLotNumber);
                            }
                        });
                    } catch (e) {
                        console.error('Error parsing output_records_json:', e);
                    }
                }
            });

            // Also include current session's lot numbers
            outputRecords.forEach(r => {
                if (r.batchLotNumber) {
                    allLotNumbers.push(r.batchLotNumber);
                }
            });

            console.log('📋 All existing lot numbers in system:', allLotNumbers);

            const currentYear = new Date().getFullYear();
            const currentYearLotNumbers = allLotNumbers.filter(lot =>
                lot && lot.endsWith(`-${currentYear}`)
            );

            // Extract numbers from existing lot numbers for current year
            const existingNumbers = currentYearLotNumbers.map(lot => {
                const match = lot.match(/LOTNUM(\d+)-/);
                return match ? parseInt(match[1]) : 0;
            });

            // Find the next number (highest + 1)
            const nextNumber = existingNumbers.length > 0
                ? Math.max(...existingNumbers) + 1
                : 1;

            // Format as LOTNUM001-2025
            const lotNumber = `LOTNUM${String(nextNumber).padStart(3, '0')}-${currentYear}`;
            console.log(`✅ Generated unique lot number: ${lotNumber} (next after ${Math.max(...existingNumbers, 0)})`);
            return lotNumber;
        } catch (error) {
            console.error('❌ Error generating lot number:', error);
            // Fallback to timestamp-based unique number if API fails
            const timestamp = Date.now();
            const fallbackNumber = timestamp % 1000;
            return `LOTNUM${String(fallbackNumber).padStart(3, '0')}-${new Date().getFullYear()}`;
        }
    };

    // Auto-generate lot number when product type is selected
    useEffect(() => {
        if (finalProductType && !batchLotNumber && !isReadOnly) {
            // Use async function to generate lot number
            (async () => {
                const newLotNumber = await generateBatchLotNumber();
                setBatchLotNumber(newLotNumber);
            })();
        }
    }, [finalProductType]);

    // Auto-set unit based on product type
    useEffect(() => {
        if (finalProductType && !isReadOnly) {
            let autoUnit = '';
            const productTypeLower = finalProductType.toLowerCase();

            if (productTypeLower.includes('powder')) {
                autoUnit = 'kg';
            } else if (productTypeLower.includes('extract')) {
                autoUnit = 'kg';
            } else if (productTypeLower.includes('capsule')) {
                autoUnit = 'units';
            } else if (productTypeLower.includes('tea bag') || productTypeLower.includes('tea_bag')) {
                autoUnit = 'packs';
            } else {
                autoUnit = 'kg'; // default
            }

            setOutputUnit(autoUnit);
            console.log(`✅ Auto-set unit for ${finalProductType}: ${autoUnit}`);
        }
    }, [finalProductType]);

    // Output Record Management (Multiple outputs per session)
    const addOutputRecord = async () => {
        if (!outputQuantity || Number(outputQuantity) <= 0) {
            alert('Please enter output quantity');
            return;
        }

        if (!finalProductType) {
            alert('Please select product type');
            return;
        }

        if (!outputUnit) {
            alert('Please select unit');
            return;
        }

        if (!productGrade) {
            alert('Please select product grade');
            return;
        }

        if (!targetMarket) {
            alert('Please select target market');
            return;
        }

        if (!processorName || processorName.trim() === "") {
            alert('Please enter processor name');
            return;
        }

        // Generate lot number if not already generated (await async function)
        const lotNumber = batchLotNumber || await generateBatchLotNumber();

        const newRecord = {
            id: Date.now().toString(),
            batchLotNumber: lotNumber,
            processor: processorName.trim(),
            productType: finalProductType,
            quantity: Number(outputQuantity),
            unit: outputUnit,
            wasteQuantity: Number(wasteQuantity || 0),
            productGrade: productGrade,
            targetMarket: targetMarket,
            timestamp: new Date().toISOString()
        };

        const updatedRecords = [...outputRecords, newRecord];
        setOutputRecords(updatedRecords);

        console.log('📦 Adding output record:', newRecord);
        console.log('📦 Total output records:', updatedRecords.length);

        // Immediately save to database
        saveOutputRecordsToDatabase(updatedRecords);

        // Clear form for next output
        setOutputQuantity("");
        setWasteQuantity("");
        setFinalProductType("");
        setOutputUnit("");
        setProductGrade("");
        setTargetMarket("");
        setBatchLotNumber(""); // Clear lot number for next generation
        setProcessorName(""); // Clear processor name

        alert(`✅ Output record added: ${newRecord.quantity} ${newRecord.unit} of ${newRecord.productType} (${newRecord.productGrade})\nProcessor: ${newRecord.processor}\nLot Number: ${lotNumber}`);
    };

    const removeOutputRecord = (id: string) => {
        const updatedRecords = outputRecords.filter(r => r.id !== id);
        setOutputRecords(updatedRecords);

        // Immediately save to database
        saveOutputRecordsToDatabase(updatedRecords);
    };

    // Save output records to database immediately
    const saveOutputRecordsToDatabase = async (records: typeof outputRecords) => {
        try {
            const token = localStorage.getItem('jwt');
            if (!token) return;

            const updateData: any = {
                output_records_json: JSON.stringify(records)
            };

            console.log('💾 Saving output records to database:', records);

            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: updateData }),
            });

            if (response.ok) {
                console.log('✅ Output records saved successfully');
            } else {
                console.error('❌ Failed to save output records');
            }
        } catch (error) {
            console.error('❌ Error saving output records:', error);
        }
    };

    // // Auto-save functionality
    // useEffect(() => {
    //     if (!isProcessingMode || currentStep === 0) return;

    //     const autoSaveInterval = setInterval(() => {
    //         if (isProcessingMode && currentStep > 0 && !saving) {
    //             console.log('🔄 Auto-saving...');
    //             saveCurrentStep();
    //         }
    //     }, 60000); // Auto-save every 60 seconds

    //     return () => clearInterval(autoSaveInterval);
    // }, [isProcessingMode, currentStep, saving, qualityData, processingSteps, outputQuantity]);

    useEffect(() => {
        if (!localStorage.getItem("userRole")) {
            localStorage.setItem("userRole", "Factory");
        }
        fetchBatchDetails();
    }, [params.id]);

    if (loading) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading processing details...</p>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    // Render Functions
    const renderBatchOverview = () => {
        // Determine back button based on where user came from
        const getBackButton = () => {
            if (!isViewFromHistory) return null;

            const backPath = fromPage === 'submission' ? '/factorysubmission' : '/processing-history';
            const backLabel = fromPage === 'submission' ? 'Back to Factory Submission' : 'Back to Processing History';

            return (
                <Button
                    onClick={() => router.push(backPath)}
                    variant="outline"
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {backLabel}
                </Button>
            );
        };

        return (
            <div className="space-y-6">
                {/* Back Button for View Only Mode */}
                {getBackButton()}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Batch Processing Overview</h1>
                        <p className="text-gray-600 mt-1">Monitor and track batch processing status</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Print Button - Show only in View mode (readonly or completed) */}
                        {(isViewFromHistory || currentStatus === 'Completed' || currentStatus === 'Export Success') && outputRecords.length > 0 && (
                            <Button
                                onClick={handlePrintReport}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Report
                            </Button>
                        )}
                        <div className={`px-4 py-2 rounded-lg font-semibold ${currentStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                            currentStatus === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {currentStatus}
                        </div>
                    </div>
                </div>

                {/* Batch Information Card */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Batch Information
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <Label className="text-gray-600 text-sm">Batch ID</Label>
                            <p className="font-semibold text-lg">{batchInfo.batchId}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-600 text-sm flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> Farm Source
                            </Label>
                            <p className="font-semibold">{batchInfo.farmName}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-600 text-sm flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> Farm Location
                            </Label>
                            <p className="font-semibold">{batchInfo.location}</p>
                        </div>
                        <div className="space-y-1" >
                            <Label className="text-gray-600 text-sm">Quality</Label>
                            <p className="font-semibold">{batchInfo.quality}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-600 text-sm flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> Harvest Date
                            </Label>
                            <p className="font-semibold">
                                {batchInfo.harvestDate ? new Date(batchInfo.harvestDate).toLocaleDateString('en-GB') : 'N/A'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-600 text-sm flex items-center gap-1">
                                <Sprout className="w-4 h-4" /> Plant Variety
                            </Label>
                            <p className="font-semibold">{batchInfo.plantVariety}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-600 text-sm">Cultivation Method</Label>
                            <p className="font-semibold text-lg">{batchInfo.cultivation}</p>
                        </div>
                    </div>
                </Card>

                {/* Weight Management Card */}
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Weight className="w-5 h-5 text-green-600" />
                        Weight Management & Processing Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Label className="text-gray-600 text-sm">Original Weight</Label>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {batchInfo.originalWeight.toFixed(2)} <span className="text-lg text-gray-500">kg</span>
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Label className="text-gray-600 text-sm">Processed Weight</Label>
                            <p className="text-3xl font-bold text-blue-600 mt-1">
                                {batchInfo.processedWeight.toFixed(2)} <span className="text-lg text-gray-500">kg</span>
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Label className="text-gray-600 text-sm">Remaining Balance</Label>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                                {batchInfo.remainingBalance.toFixed(2)} <span className="text-lg text-gray-500">kg</span>
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Processing Progress</span>
                            <span className="font-semibold text-gray-900">
                                {((batchInfo.processedWeight / batchInfo.originalWeight) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${(batchInfo.processedWeight / batchInfo.originalWeight) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Action Button */}
                    {isViewFromHistory ? (
                        <div className="mt-6">
                            <Button
                                onClick={() => {
                                    setIsProcessingMode(true);
                                    setCurrentStep(1);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                            >
                                <Eye className="w-5 h-5 mr-2" />
                                View Processing Steps
                            </Button>
                        </div>
                    ) : !isReadOnly && batchInfo.remainingBalance > 0 && (
                        <div className="mt-6">
                            <Button
                                onClick={handleProcessRemaining}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                            >
                                <Factory className="w-5 h-5 mr-2" />
                                Process Remaining Material ({batchInfo.remainingBalance.toFixed(2)} kg)
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Output Records Section - Show when viewing completed batch */}
                {(isViewFromHistory || currentStatus === 'Completed' || currentStatus === 'Export Success') && outputRecords.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <PackageCheck className="w-5 h-5 text-green-600" />
                            Final Products ({outputRecords.length} items)
                        </h2>
                        <div className="space-y-3">
                            {outputRecords.map((record, index) => (
                                <div key={record.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold">
                                                    #{index + 1}
                                                </span>
                                                <span className="font-semibold text-lg">{record.productType}</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                    {record.batchLotNumber}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Quantity</p>
                                                    <p className="font-semibold text-green-700">{record.quantity} {record.unit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Grade</p>
                                                    <p className="font-semibold">{record.productGrade}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Target Market</p>
                                                    <p className="font-semibold">{record.targetMarket}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Processor</p>
                                                    <p className="font-semibold">{record.processor}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                                                <Clock className="inline-block w-4 h-4 text-gray-400 mr-1" /> {new Date(record.timestamp).toLocaleString('en-GB')} • <Trash className="inline-block w-4 h-4 text-gray-400 mr-1" /> Waste: {record.wasteQuantity} kg
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-600">Total Products</p>
                                    <p className="text-xl font-bold text-blue-700">{outputRecords.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">Total Output</p>
                                    <p className="text-xl font-bold text-green-700">
                                        {outputRecords.reduce((sum, r) => sum + r.quantity, 0).toFixed(2)} units
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">Total Waste</p>
                                    <p className="text-xl font-bold text-red-700">
                                        {outputRecords.reduce((sum, r) => sum + r.wasteQuantity, 0).toFixed(2)} kg
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Current Session Operations (if in progress) */}
                {processingSteps.length > 0 && isProcessingMode && (
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Factory className="w-5 h-5 text-blue-600" />
                            Current Session - Processing Operations
                        </h2>
                        <div className="space-y-3">
                            {processingSteps.map((step, index) => (
                                <div key={step.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                        {index + 1}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-lg">{step.method}</p>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            📅 {step.date} • 👤 {step.operator} • 🔧 {step.equipment}
                                        </p>
                                        {step.duration && step.temperature && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                ⏱️ {step.duration} hrs • 🌡️ {step.temperature}°C
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${step.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            step.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {step.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">💡 Operations in Progress:</span> {processingSteps.length} operation(s)
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        );
    };

    const renderStepNavigation = () => (
        <div className="mb-8">
            <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        const canNavigate = canNavigateToStep(step.id);

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <button
                                        onClick={() => handleStepNavigation(step.id)}
                                        disabled={!canNavigate || isReadOnly}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive
                                            ? 'bg-green-600 text-white ring-4 ring-green-200'
                                            : isCompleted
                                                ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                : canNavigate
                                                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            } ${!canNavigate && !isActive && !isCompleted ? 'cursor-not-allowed' : ''}`}
                                        title={!canNavigate ? 'Complete previous steps first' : `Go to ${step.title}`}
                                    >
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                    </button>
                                    <p className={`mt-2 text-sm font-semibold ${isActive ? 'text-green-600' : 'text-gray-600'
                                        }`}>
                                        Step {step.id}
                                    </p>
                                    <p className="text-xs text-gray-500 text-center max-w-[120px]">{step.title}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-16 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                        }`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-green-600" />
                    Quality Inspection - Raw Material
                </h2>

                <div className="space-y-4">
                    {/* Inspector Information */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div>
                            <Label className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Inspector Name
                            </Label>
                            <Input
                                value={inspectorName}
                                onChange={(e) => setInspectorName(e.target.value)}
                                placeholder="Enter inspector name"
                                disabled={isReadOnly}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Inspection Date</Label>
                            <Input
                                type="date"
                                value={inspectionDate}
                                onChange={(e) => setInspectionDate(e.target.value)}
                                disabled={isReadOnly}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Physical & Chemical Tests */}
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">Physical & Chemical Properties</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Moisture Content (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={qualityData.moisture}
                                    onChange={(e) => setQualityData({ ...qualityData, moisture: e.target.value })}
                                    placeholder="e.g., 12.5"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <Label>Curcuminoid Content (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={qualityData.curcuminoidContent}
                                    onChange={(e) => setQualityData({ ...qualityData, curcuminoidContent: e.target.value })}
                                    placeholder="e.g., 5.2"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Heavy Metals */}
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">Heavy Metals (mg/kg)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Lead (Pb)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={qualityData.lead}
                                    onChange={(e) => setQualityData({ ...qualityData, lead: e.target.value })}
                                    placeholder="e.g., 0.05"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <Label>Cadmium (Cd)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={qualityData.cadmium}
                                    onChange={(e) => setQualityData({ ...qualityData, cadmium: e.target.value })}
                                    placeholder="e.g., 0.03"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <Label>Arsenic (As)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={qualityData.arsenic}
                                    onChange={(e) => setQualityData({ ...qualityData, arsenic: e.target.value })}
                                    placeholder="e.g., 0.02"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <Label>Mercury (Hg)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={qualityData.mercury}
                                    onChange={(e) => setQualityData({ ...qualityData, mercury: e.target.value })}
                                    placeholder="e.g., 0.01"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Microbial Tests */}
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">Microbial Testing</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Total Plate Count (CFU/g)</Label>
                                <Input
                                    type="number"
                                    value={qualityData.totalPlateCount}
                                    onChange={(e) => setQualityData({ ...qualityData, totalPlateCount: e.target.value })}
                                    placeholder="e.g., 1000"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <Label>Yeast & Mold (CFU/g)</Label>
                                <Input
                                    type="number"
                                    value={qualityData.yeastMold}
                                    onChange={(e) => setQualityData({ ...qualityData, yeastMold: e.target.value })}
                                    placeholder="e.g., 100"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div>
                                <Label>E. coli</Label>
                                <Select
                                    value={qualityData.eColi}
                                    onValueChange={(value) => setQualityData({ ...qualityData, eColi: value })}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Not Detected">Not Detected</SelectItem>
                                        <SelectItem value="Detected">Detected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Salmonella</Label>
                                <Select
                                    value={qualityData.salmonella}
                                    onValueChange={(value) => setQualityData({ ...qualityData, salmonella: value })}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Not Detected">Not Detected</SelectItem>
                                        <SelectItem value="Detected">Detected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Pesticide Residues */}
                    <div>
                        <Label>Pesticide Residues</Label>
                        <Input
                            value={pesticideResidues}
                            onChange={(e) => setPesticideResidues(e.target.value)}
                            placeholder="e.g., Not Detected"
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Inspection Notes */}
                    <div>
                        <Label className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Inspection Notes
                        </Label>
                        <Textarea
                            value={qualityData.inspectionNotes}
                            onChange={(e) => setQualityData({ ...qualityData, inspectionNotes: e.target.value })}
                            placeholder="Enter any observations or remarks..."
                            rows={4}
                            disabled={isReadOnly}
                            className="mt-1"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Back to Overview Button */}
            <Button
                onClick={handleBackToOverview}
                variant="ghost"
                className="-ml-2"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Overview
            </Button>

            {/* Processing Weight Setup */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Weight className="w-5 h-5 text-blue-600" />
                    Processing Batch Setup
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <Label className="text-gray-600">Available for Processing</Label>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {calculateAvailableWeight().toFixed(2)} <span className="text-lg text-gray-500">kg</span>
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <Label className="text-gray-600">Processing Weight (This Session)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={processingWeight}
                            onChange={(e) => setProcessingWeight(e.target.value)}
                            placeholder="Enter weight to process"
                            disabled={isReadOnly}
                            className="mt-2 text-xl font-semibold"
                        />
                        {processingWeight && !canProcessWeight(Number(processingWeight)) && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Exceeds original batch weight ({batchInfo.originalWeight} kg)
                            </p>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={saveProcessingWeight}
                        disabled={!processingWeight || !canProcessWeight(Number(processingWeight)) || isReadOnly || saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Processing Weight
                            </>
                        )}
                    </Button>
                </div>

                {/* Processing Weight History */}
                {processingWeightHistory.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-700">Processing Weight History</h3>
                            <span className="text-sm text-gray-500">
                                Total Sessions: {processingWeightHistory.length}
                            </span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {processingWeightHistory.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {entry.sessionNumber}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                {new Date(entry.timestamp).toLocaleString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-blue-700">
                                            {entry.weight.toFixed(2)} kg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-300">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Total Weight Used</p>
                                    <p className="text-2xl font-bold text-blue-800">
                                        {processingWeightHistory.reduce((sum, entry) => sum + entry.weight, 0).toFixed(2)} kg
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Processing Steps */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Factory className="w-5 h-5 text-green-600" />
                        Processing Operations
                    </h2>
                    <div className="flex gap-2">
                        {processingSteps.length > 0 && (
                            <Button
                                onClick={clearAllProcessingSteps}
                                variant="outline"
                                disabled={isReadOnly}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                                Clear All
                            </Button>
                        )}
                        <Button
                            onClick={addProcessingStep}
                            variant="outline"
                            disabled={isReadOnly}
                            className="flex items-center gap-2"
                        >
                            <span className="text-lg">+</span>
                            Add Processing Step
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {processingSteps.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Factory className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>No processing steps added yet</p>
                            <p className="text-sm">Click "Add Processing Step" to begin</p>
                        </div>
                    ) : (
                        processingSteps.map((step, index) => (
                            <div key={step.id} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-gray-900">Step {index + 1}</h3>
                                        {step.sessionNumber && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                                                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                    {step.sessionNumber}
                                                </div>
                                                <span className="text-sm font-semibold text-blue-800">
                                                    Session {step.sessionNumber} • {step.processingWeight} kg
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {!isReadOnly && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeProcessingStep(step.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Processing Method</Label>
                                        <Select
                                            value={step.method}
                                            onValueChange={(value) => updateProcessingStep(step.id, 'method', value)}
                                            disabled={isReadOnly}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Washing">Washing</SelectItem>
                                                <SelectItem value="Peeling">Peeling</SelectItem>
                                                <SelectItem value="Slicing">Slicing</SelectItem>
                                                <SelectItem value="Drying">Drying</SelectItem>
                                                <SelectItem value="Grinding">Grinding</SelectItem>
                                                <SelectItem value="Sieving">Sieving</SelectItem>
                                                <SelectItem value="Packaging">Packaging</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Processing Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={step.date}
                                            onChange={(e) => updateProcessingStep(step.id, 'date', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Duration (hours)
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={step.duration}
                                            onChange={(e) => updateProcessingStep(step.id, 'duration', e.target.value)}
                                            placeholder="e.g., 2.5"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1">
                                            <Thermometer className="w-4 h-4" />
                                            Temperature (°C)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={step.temperature}
                                            onChange={(e) => updateProcessingStep(step.id, 'temperature', e.target.value)}
                                            placeholder="e.g., 60"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div>
                                        <Label>Equipment Used</Label>
                                        <Input
                                            value={step.equipment}
                                            onChange={(e) => updateProcessingStep(step.id, 'equipment', e.target.value)}
                                            placeholder="e.g., Dryer #1"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            Operator
                                        </Label>
                                        <Input
                                            value={step.operator}
                                            onChange={(e) => updateProcessingStep(step.id, 'operator', e.target.value)}
                                            placeholder="Operator name"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div>
                                        <Label>Status</Label>
                                        <Select
                                            value={step.status}
                                            onValueChange={(value) => updateProcessingStep(step.id, 'status', value)}
                                            disabled={isReadOnly}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={step.notes}
                                            onChange={(e) => updateProcessingStep(step.id, 'notes', e.target.value)}
                                            placeholder="Additional notes..."
                                            rows={2}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            {/* Back to Overview Button */}
            <Button
                onClick={handleBackToOverview}
                variant="ghost"
                className="-ml-2"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Overview
            </Button>

            {/* Output Recording */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <PackageCheck className="w-5 h-5 text-green-600" />
                        Output Recording
                    </h2>
                    {!isReadOnly && (
                        <Button
                            onClick={addOutputRecord}
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Save Output Record
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                Batch Lot Number
                            </Label>
                            <Input
                                value={batchLotNumber}
                                readOnly
                                disabled
                                placeholder="Auto-generated"
                                className="text-blue-600"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Auto-generated when you select product type
                            </p>
                        </div>
                        <div>
                            <Label className="flex items-center gap-2">
                                Processor Name
                            </Label>
                            <Input
                                value={processorName}
                                onChange={(e) => setProcessorName(e.target.value)}
                                placeholder="Enter processor name"
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Final Product Type</Label>
                            <Select
                                value={finalProductType}
                                onValueChange={setFinalProductType}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select product type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Powder">Powder</SelectItem>
                                    {/* <SelectItem value="Dried Slice">Dried Slice</SelectItem> */}
                                    <SelectItem value="Extract">Extract</SelectItem>
                                    <SelectItem value="Capsule">Capsule</SelectItem>
                                    <SelectItem value="Tea Bag">Tea Bag</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Output Quantity</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={outputQuantity}
                                    onChange={(e) => setOutputQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                    disabled={isReadOnly}
                                    className="flex-grow"
                                />
                                <Select
                                    value={outputUnit}
                                    onValueChange={setOutputUnit}
                                    disabled={true}
                                >
                                    <SelectTrigger className="w-24">
                                        <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="g">g</SelectItem>
                                        <SelectItem value="units">units</SelectItem>
                                        <SelectItem value="packs">packs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Unit is auto-set based on product type
                            </p>
                        </div>
                        <div>
                            <Label>Waste Quantity (kg)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={wasteQuantity}
                                onChange={(e) => setWasteQuantity(e.target.value)}
                                placeholder="Enter waste amount"
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    {/* Product Grading & Classification */}
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-green-600" />
                            Product Grading & Classification
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Product Grade</Label>
                                <Select
                                    value={productGrade}
                                    onValueChange={setProductGrade}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select grade..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Herbal Grade (5%)">Herbal Grade (5%)</SelectItem>
                                        <SelectItem value="Herbal Grade (6%)">Herbal Grade (6%)</SelectItem>
                                        <SelectItem value="Herbal Grade (7%)">Herbal Grade (7%)</SelectItem>
                                        <SelectItem value="Herbal Grade (8%)">Herbal Grade (8%)</SelectItem>
                                        <SelectItem value="Herbal Grade (9%)">Herbal Grade (9%)</SelectItem>
                                        <SelectItem value="Premium > 9%">Premium &gt; 9%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Target Market / Usage</Label>
                                <Select
                                    value={targetMarket}
                                    onValueChange={setTargetMarket}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select market..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Food">Food</SelectItem>
                                        <SelectItem value="Supplement">Supplement</SelectItem>
                                        <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                                        <SelectItem value="Export">Export</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Recorded Outputs List */}
                    {outputRecords.length > 0 && (
                        <div className="mt-6 pt-6 border-t space-y-3">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2"> <PackageCheck className="h-4 w-4 text-green-600" /> Recorded Outputs ({outputRecords.length})</h3>
                            {outputRecords.map((record, index) => (
                                <div key={record.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-gray-900">{record.productType}</p>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                                                    {record.batchLotNumber}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Processor: {record.processor || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-600 items-center flex">
                                                <Package className="inline-block w-4 h-4 text-gray-400 mr-1 text-green-600" /> {record.quantity} {record.unit} • <Trash className="inline-block w-4 h-4 text-gray-400 mr-1 text-green-600" /> Waste: {record.wasteQuantity} kg
                                            </p>
                                            <p className="text-sm text-green-700 font-medium mt-1">
                                                {record.productGrade} • {record.targetMarket} Market
                                            </p>
                                        </div>
                                    </div>
                                    {!isReadOnly && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOutputRecord(record.id)}
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Compliance & Certification */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    Compliance & Certification
                </h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Standard Criteria</Label>
                            <Select
                                value={standardCriteria}
                                onValueChange={setStandardCriteria}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select standard..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GAP">GAP (Good Agricultural Practice)</SelectItem>
                                    <SelectItem value="GMP">GMP (Good Manufacturing Practice)</SelectItem>
                                    <SelectItem value="HACCP">HACCP</SelectItem>
                                    <SelectItem value="Organic">Organic Certification</SelectItem>
                                    <SelectItem value="ISO 22000">ISO 22000</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Certification Status</Label>
                            <Select
                                value={certificationStatus}
                                onValueChange={setCertificationStatus}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pass">Pass</SelectItem>
                                    <SelectItem value="Fail">Fail</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label>Compliance Notes</Label>
                        <Textarea
                            value={complianceNotes}
                            onChange={(e) => setComplianceNotes(e.target.value)}
                            placeholder="Enter compliance notes and observations..."
                            rows={4}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            {/* Back to Overview Button */}
            <Button
                onClick={handleBackToOverview}
                variant="ghost"
                className="-ml-2"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Overview
            </Button>


            {/* Final Summary */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Processing Summary
                </h2>

                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Batch ID:</span>
                        <span className="font-semibold">{batchInfo.batchId}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Original Weight:</span>
                        <span className="font-semibold">{batchInfo.originalWeight.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Total Processed:</span>
                        <span className="font-semibold text-blue-600">{batchInfo.processedWeight.toFixed(2)} kg</span>
                    </div>

                    {/* Final Products - Show as list if multiple outputs */}
                    <div className="p-3 bg-white rounded-lg">
                        <div className="text-gray-600 mb-2">Final Products:</div>
                        {outputRecords.length > 0 ? (
                            <div className="space-y-2">
                                {outputRecords.map((record, index) => (
                                    <div key={record.id} className="flex items-start gap-2 pl-2">
                                        <span className="font-semibold text-gray-500 min-w-[20px]">{index + 1}.</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900">{record.productType}</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                                                    {record.batchLotNumber}
                                                </span>
                                            </div>
                                            <span className="text-gray-600"> {record.quantity} {record.unit}</span>
                                            <div className="text-sm text-gray-600 mt-0.5 items-center flex">
                                                <User className="inline-block w-4 h-4 text-gray-400 mr-1 " /> Processor: {record.processor || 'N/A'}
                                            </div>
                                            <div className="text-sm text-green-600 mt-1">
                                                {record.productGrade} • {record.targetMarket} Market
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="font-semibold text-gray-400">No output recorded</span>
                        )}
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Certification:</span>
                        <span className={`font-semibold ${certificationStatus === 'Pass' ? 'text-green-600' :
                            certificationStatus === 'Fail' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                            {certificationStatus}
                        </span>
                    </div>
                </div>

                {/* {!isReadOnly && (
                    <div className="mt-6">
                        <Button
                            onClick={handleCompleteProcessing}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                        >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Complete Processing & Lock Record
                        </Button>
                    </div>
                )} */}
            </Card>
        </div>
    );

    const renderStepNavButtons = () => {
        // If in read-only mode from history, show simplified navigation
        if (isViewFromHistory) {
            return (
                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (currentStep > 1) {
                                setCurrentStep(currentStep - 1);
                            } else {
                                // Go back to overview but stay in readonly mode
                                setIsProcessingMode(false);
                            }
                        }}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {currentStep === 1 ? 'Back to Overview' : 'Previous Step'}
                    </Button>

                    <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                        👁️ View Only Mode - No changes can be made
                    </div>

                    {currentStep < 4 && (
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="flex items-center gap-2"
                        >
                            Next Step
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    )}
                    {currentStep === 4 && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                const backPath = fromPage === 'submission' ? '/factorysubmission' : '/processing-history';
                                router.push(backPath);
                            }}
                            className="flex items-center gap-2"
                        >
                            {fromPage === 'submission' ? 'Back to Factory Submission' : 'Back to Processing History'}
                        </Button>
                    )}
                </div>
            );
        }

        // Normal editing mode navigation
        return (
            <div className="flex justify-between mt-8">
                <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="flex items-center gap-2"
                    disabled={saving}
                >
                    <ArrowLeft className="w-4 h-4" />
                    {currentStep === 1 ? 'Back to Overview' : 'Previous'}
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saving || isReadOnly || !isOutputFormComplete()}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>

                    {currentStep < 4 ? (
                        <Button
                            onClick={handleNextStep}
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            disabled={saving}
                        >
                            Next Step
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleCompleteProcessing}
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            disabled={saving || isReadOnly}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2 flex-1">
                        <h2 className="text-lg font-semibold">
                            {isProcessingMode ? `Step ${currentStep}: ${steps[currentStep - 1]?.title}` : 'Batch Overview'}
                        </h2>
                        {isViewFromHistory && (
                            <span className="ml-auto text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                👁️ View Only
                            </span>
                        )}
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4">
                    {!isProcessingMode ? (
                        renderBatchOverview()
                    ) : (
                        <>
                            {renderStepNavigation()}
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                            {currentStep === 4 && renderStep4()}
                            {renderStepNavButtons()}
                        </>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
