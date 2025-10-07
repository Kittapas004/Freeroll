'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Calendar, Package, Factory as FactoryIcon, Save, Leaf, Scale, Beaker, BarChart3, Droplets, FlaskConical, LucidePackage, LucideCheck, X, Printer, Eye, PackageSearch, Book } from "lucide-react";
import { useRouter } from "next/navigation";

interface BatchInfo {
    batchId: string;
    farmName: string;
    harvestDate: string;
    yield: string;
    quality: string;
    cultivation: string;
    location: string;
    plantVariety: string;
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

export default function RecordDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isReadOnly, setIsReadOnly] = useState(false); // เพิ่ม state สำหรับ read-only mode
    const [userRole, setUserRole] = useState<string>(''); // เพิ่ม state สำหรับบทบาทผู้ใช้

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
    });

    // Raw Material Tracking
    const [rawMaterialType, setRawMaterialType] = useState("Fresh Rhizome");
    const [rawMaterialSource, setRawMaterialSource] = useState("");
    const [batchLotNumber, setBatchLotNumber] = useState("");
    const [incomingWeight, setIncomingWeight] = useState("");

    // Quality Inspection
    const [qualityData, setQualityData] = useState<QualityData>({
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

    // Pesticide Residues
    const [pesticideResidues, setPesticideResidues] = useState("");

    // Processing Details
    const [processingMethod, setProcessingMethod] = useState("Washing");
    const [processingDate, setProcessingDate] = useState("");
    const [duration, setDuration] = useState("");
    const [temperature, setTemperature] = useState("");
    const [equipmentUsed, setEquipmentUsed] = useState("");
    const [operatorProcessor, setOperatorProcessor] = useState("");

    // Output & Waste
    const [finalProductType, setFinalProductType] = useState("Powder");
    const [outputQuantity, setOutputQuantity] = useState("");
    const [outputUnit, setOutputUnit] = useState("kg"); // เพิ่มสำหรับหน่วยการวัด
    const [remainingStock, setRemainingStock] = useState("");
    const [wasteQuantity, setWasteQuantity] = useState("");

    // Compliance & Certification
    const [standardCriteria, setStandardCriteria] = useState("GAP");
    const [certificationStatus, setCertificationStatus] = useState("Pass");
    const [complianceNotes, setComplianceNotes] = useState("");

    // Consumer/Product Grading
    const [productGrade, setProductGrade] = useState("Herbal Grade (5%)");
    const [targetMarket, setTargetMarket] = useState("Food");

    // Processing Status
    const [currentStatus, setCurrentStatus] = useState("Received"); // For read-only display
    const [processingStatus, setProcessingStatus] = useState("Processing"); // For editing with default "Processing"

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem("sidebarOpen", String(!prev));
            return !prev;
        });
    };

    // ฟังก์ชันสำหรับ Print Report
    const handlePrintReport = () => {
        // สร้าง iframe สำหรับ print แทน window.open
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
    <title>Turmeric Factory Processing Report</title>
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
    </style>
</head>
<body>
    <!-- Header สำหรับทุกหน้าในการพิมพ์ -->
    <div class="page-header">
        <h1>Turmeric Factory Processing Report</h1>
        <p>Comprehensive documentation of turmeric processing and quality assurance</p>
        <div class="separator"></div>
    </div>

    <!-- Header สำหรับหน้าจอปกติ -->
    <div class="main-header">
        <h1>Turmeric Factory Processing Report</h1>
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
                <td class="label">Raw Material Weight</td>
                <td class="value">${incomingWeight} kg</td>
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

    <!-- 2. Raw Material Tracking -->
    <div class="section">
        <h2>2. Raw Material Tracking</h2>
        <table>
            <tr>
                <td class="label">Raw Material Type</td>
                <td class="value">${rawMaterialType}</td>
            </tr>
            <tr>
                <td class="label">Farmer Name</td>
                <td class="value">${rawMaterialSource}</td>
            </tr>
            <tr>
                <td class="label">Lot Number</td>
                <td class="value">${batchLotNumber}</td>
            </tr>
            <tr>
                <td class="label">Incoming Weight</td>
                <td class="value">${incomingWeight} kg</td>
            </tr>
            <tr>
                <td class="label">Variety</td>
                <td class="value">${batchInfo.plantVariety}</td>
            </tr>
        </table>
    </div>

    <!-- 3. Processing Details -->
    <div class="section">
        <h2>3. Processing Details</h2>
        <table>
            <tr>
                <td class="label">Processing Method</td>
                <td class="value">${processingMethod}</td>
            </tr>
            <tr>
                <td class="label">Processing Date</td>
                <td class="value">${processingDate ? new Date(processingDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</td>
            </tr>
            <tr>
                <td class="label">Temperature</td>
                <td class="value">${temperature} °C</td>
            </tr>
            <tr>
                <td class="label">Duration</td>
                <td class="value">${duration} hours</td>
            </tr>
            <tr>
                <td class="label">Operator/Processor</td>
                <td class="value">${operatorProcessor}</td>
            </tr>
            <tr>
                <td class="label">Equipment Used</td>
                <td class="value">${equipmentUsed}</td>
            </tr>
        </table>
    </div>

    <!-- 4. Quality Inspection -->
    <div class="section">
        <h2>4. Quality Inspection</h2>
        <div class="subsection-header">Physical & Chemical Tests</div>
        <div class="subsection">
            <table>
                <tr>
                    <td class="label">Moisture</td>
                    <td class="value">${qualityData.moisture}%</td>
                </tr>
                <tr>
                    <td class="label">Curcuminoid Content</td>
                    <td class="value">${qualityData.curcuminoidContent}%</td>
                </tr>
            </table>
        </div>

        <div class="subsection-header">Heavy Metals Test (mg/kg)</div>
        <div class="subsection">
            <table>
                <tr>
                    <td class="label">Lead (Pb)</td>
                    <td class="value">${qualityData.lead}</td>
                </tr>
                <tr>
                    <td class="label">Cadmium (Cd)</td>
                    <td class="value">${qualityData.cadmium}</td>
                </tr>
                <tr>
                    <td class="label">Arsenic (As)</td>
                    <td class="value">${qualityData.arsenic}</td>
                </tr>
                <tr>
                    <td class="label">Mercury (Hg)</td>
                    <td class="value">${qualityData.mercury}</td>
                </tr>
            </table>
        </div>

        <div class="subsection-header">Microbial Tests</div>
        <div class="subsection">
            <table>
                <tr>
                    <td class="label">Total Plate Count</td>
                    <td class="value">${qualityData.totalPlateCount} CFU/g</td>
                </tr>
                <tr>
                    <td class="label">Yeast & Mold</td>
                    <td class="value">${qualityData.yeastMold} CFU/g</td>
                </tr>
                <tr>
                    <td class="label">E. coli</td>
                    <td class="value">${qualityData.eColi}</td>
                </tr>
                <tr>
                    <td class="label">Salmonella</td>
                    <td class="value">${qualityData.salmonella}</td>
                </tr>
                <tr>
                    <td class="label">Pesticide Residues</td>
                    <td class="value">${pesticideResidues || 'Not Detected'}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- 5. Output & Waste -->
    <div class="section">
        <h2>5. Output & Waste</h2>
        <table>
            <tr>
                <td class="label">Final Product Type</td>
                <td class="value">${finalProductType}</td>
            </tr>
            <tr>
                <td class="label">Output Quantity</td>
                <td class="value">${outputQuantity} ${outputUnit}</td>
            </tr>
            <tr>
                <td class="label">Waste Quantity</td>
                <td class="value">${wasteQuantity} kg</td>
            </tr>
            <tr>
                <td class="label">Remaining Stock</td>
                <td class="value">${remainingStock} kg</td>
            </tr>
        </table>
    </div>

    <!-- 6. Product Grading -->
    <div class="section">
        <h2>6. Product Grading</h2>
        <table>
            <tr>
                <td class="label">Grade</td>
                <td class="value">${productGrade}</td>
            </tr>
            <tr>
                <td class="label">Target Market / Usage</td>
                <td class="value">${targetMarket}</td>
            </tr>
        </table>
    </div>

    <!-- 7. Compliance & Certification -->
    <div class="section">
        <h2>7. Compliance & Certification</h2>
        <table>
            <tr>
                <td class="label">Standard Criteria</td>
                <td class="value">${standardCriteria}</td>
            </tr>
            <tr>
                <td class="label">Certification Status</td>
                <td class="value">${certificationStatus}</td>
            </tr>
            <tr>
                <td class="label">Inspector Notes</td>
                <td class="value">${complianceNotes || 'Product meets safety, hygiene, and processing standards.'}</td>
            </tr>
        </table>
    </div>

    <!-- 8. Report Summary -->
    <div class="section">
        <h2>8. Report Summary</h2>
        <div class="cert-box">
            <strong>This report certifies that Batch ${batchInfo.batchId} has been successfully processed under factory Good Manufacturing Practices (GMP). The turmeric material has passed all required inspections, meeting both quality and safety standards.</strong>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    <strong>Prepared by (Processor)</strong>
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    <strong>Reviewed by (Inspector)</strong>
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

    // ฟังก์ชันกำหนดหน่วยเริ่มต้นตามประเภทสินค้า
    const getDefaultUnit = (productType: string): string => {
        switch (productType) {
            case 'Powder':
            case 'Extract':
                return 'kg';
            case 'Capsule':
                return 'packs';
            case 'Tea Bag':
                return 'boxes';
            default:
                return 'kg';
        }
    };

    // ฟังก์ชันเมื่อเปลี่ยนประเภทสินค้า จะอัปเดตหน่วยอัตโนมัติ
    const handleProductTypeChange = (newProductType: string) => {
        const newUnit = getDefaultUnit(newProductType);
        console.log(`🔄 Product type changed: ${finalProductType} → ${newProductType}`);
        console.log(`📏 Unit changed: ${outputUnit} → ${newUnit}`);
        
        setFinalProductType(newProductType);
        setOutputUnit(newUnit);
    };

    // ฟังก์ชันแสดงผลรวมของผลิตภัณฑ์พร้อมหน่วย
    const getFormattedOutput = () => {
        const quantity = parseFloat(outputQuantity) || 0;
        if (quantity === 0) return "0 units";
        return `${quantity} ${outputUnit}`;
    };

    const fetchBatchDetails = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching batch details for ID:', params.id);

            // ตรวจสอบบทบาทผู้ใช้จาก localStorage
            const currentUserRole = localStorage.getItem("userRole") || 'Factory';
            setUserRole(currentUserRole);
            
            // กำหนด Read Only mode สำหรับ Farmer
            if (currentUserRole === 'Farmer') {
                setIsReadOnly(true);
                console.log('👨‍🌾 User is Farmer - Setting Read Only mode');
            }

            // Fetch factory processing record and farms data
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

            const processingData = await processingResponse.json();
            const farmsData = farmsResponse.ok ? await farmsResponse.json() : { data: [] };

            console.log('✅ Processing details fetched:', processingData);
            console.log('✅ Farms data fetched:', farmsData);

            const item = processingData.data;

            // Create a farm lookup map
            const farmMap = new Map();
            if (farmsData.data) {
                farmsData.data.forEach((farm: any) => {
                    farmMap.set(farm.Farm_Name, farm);
                });
            }

            // Get farm information from multiple sources
            let farmLocation = 'Unknown Location';
            let farmName = item.factory_submission?.Farm_Name || 'Unknown Farm';
            let cropType = 'Unknown';
            let plantVariety = 'Unknown';
            let cultivationMethod = 'Unknown';

            // Look up farm data for complete information
            let farmData = null;
            if (farmName && farmMap.has(farmName)) {
                farmData = farmMap.get(farmName);
                farmLocation = farmData.Farm_Address || item.factory_submission?.Farm_Address || farmLocation;
                cropType = farmData.Crop_Type || item.factory_submission?.Crop_Type || cropType;
                plantVariety = farmData.Plant_Variety || item.factory_submission?.batch?.Plant_Variety || item.factory_submission?.Plant_Variety || plantVariety;
                cultivationMethod = farmData.Cultivation_Method || item.factory_submission?.Cultivation_Method || cultivationMethod;
            } else if (item.factory_submission?.Farm_Address) {
                // Fallback to factory submission data
                farmLocation = item.factory_submission.Farm_Address;
                cropType = item.factory_submission.Crop_Type || cropType;
                plantVariety = item.factory_submission.batch?.Plant_Variety || item.factory_submission.Plant_Variety || plantVariety;
                cultivationMethod = item.factory_submission.Cultivation_Method || cultivationMethod;
            }

            // Set batch information with enhanced data
            setBatchInfo({
                batchId: item.Batch_Id || `T-batch-${item.id}`,
                farmName: farmName,
                harvestDate: item.factory_submission?.Date || 'Unknown',
                yield: item.factory_submission?.Yield || 'Unknown',
                quality: item.factory_submission?.Quality_Grade || 'Unknown',
                cultivation: cultivationMethod,
                location: farmLocation,
                plantVariety: plantVariety,
            });

            // Set raw material tracking - load saved data or defaults
            setBatchLotNumber(item.batch_lot_number || item.Batch_Id || `Batch-001`);
            setIncomingWeight(item.incoming_weight?.toString() || item.factory_submission?.Yield || '0.00');
            setRawMaterialSource(item.raw_material_source || item.factory_submission?.Farm_Name || 'Farmer Name');
            
            // Validate and map raw material type to ensure it's one of the allowed values
            const validRawMaterialTypes = ['Fresh Rhizome', 'Dried Slice', 'Powder'];
            let materialType = item.raw_material_type || 'Fresh Rhizome';
            
            // Map common variations to valid values
            if (materialType === 'Fresh Turmeric' || materialType === 'Fresh' || materialType.includes('Fresh')) {
                materialType = 'Fresh Rhizome';
            } else if (materialType === 'Dried' || materialType.includes('Dried')) {
                materialType = 'Dried Slice';
            } else if (materialType.includes('Powder')) {
                materialType = 'Powder';
            } else if (!validRawMaterialTypes.includes(materialType)) {
                materialType = 'Fresh Rhizome'; // Default fallback
            }
            
            console.log('🔍 Original raw material type:', item.raw_material_type);
            console.log('🔍 Setting validated raw material type:', materialType);
            setRawMaterialType(materialType);

            // Set quality data - load saved data or defaults
            setQualityData({
                moisture: item.moisture?.toString() || "",
                curcuminoidContent: item.curcuminoid_content?.toString() || "",
                lead: item.lead_ppm?.toString() || "",
                cadmium: item.cadmium_ppm?.toString() || "",
                arsenic: item.arsenic_ppm?.toString() || "",
                mercury: item.mercury_ppm?.toString() || "",
                totalPlateCount: item.total_plate_count?.toString() || "",
                yeastMold: item.yeast_mold?.toString() || "",
                eColi: item.e_coli || "Not Detected",
                salmonella: item.salmonella || "Not Detected",
                inspectionNotes: item.inspection_notes || "",
            });

            // Set pesticide residues
            setPesticideResidues(item.pesticide_residues || "");

            // Set processing details
            setProcessingMethod(item.processing_method || "Washing");
            setProcessingDate(item.processing_date_custom || "");
            setDuration(item.duration?.toString() || "");
            setTemperature(item.temperature?.toString() || "");
            setEquipmentUsed(item.equipment_used || "");
            setOperatorProcessor(item.operator_processor || "");

            // Set output & waste
            const productType = item.final_product_type || "Powder";
            setFinalProductType(productType);
            setOutputQuantity(item.output_quantity?.toString() || "");
            // กำหนด outputUnit จากข้อมูลที่บันทึกไว้ หรือใช้ค่าเริ่มต้นตามประเภทสินค้า
            setOutputUnit(item.output_unit || getDefaultUnit(productType));
            setRemainingStock(item.remaining_stock?.toString() || "");
            setWasteQuantity(item.waste_quantity?.toString() || "");

            // Set compliance & certification
            setStandardCriteria(item.standard_criteria || "GAP");
            setCertificationStatus(item.certification_status || "Pass");
            setComplianceNotes(item.compliance_notes || "");

            // Set consumer/product grading
            setProductGrade(item.product_grade || "Herbal Grade (5%)");
            setTargetMarket(item.target_market || "Food");

            // Set processing status
            console.log('🔍 Processing status from DB:', item.processing_status);
            console.log('🔍 Processing_Status from DB:', item.Processing_Status);
            console.log('🔍 Full item data:', item);

            const savedStatus = item.Processing_Status || item.processing_status || "Received";
            setCurrentStatus(savedStatus); // For read-only display
            // Keep processingStatus as "Processing" for dropdown default, but if status is already Completed, use that
            setProcessingStatus(savedStatus === "Completed" ? "Completed" : "Processing");

            // Set read-only mode if processing is completed
            setIsReadOnly(savedStatus === "Completed");

        } catch (error) {
            console.error('❌ Error fetching batch details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRecord = async () => {
        try {
            console.log('💾 Saving processing record...');

            // Validate raw material type before saving
            const validRawMaterialTypes = ['Fresh Rhizome', 'Dried Slice', 'Powder'];
            let validatedRawMaterialType = rawMaterialType;
            
            console.log('🔍 Current rawMaterialType before validation:', rawMaterialType);
            
            if (!validRawMaterialTypes.includes(rawMaterialType)) {
                console.warn('⚠️ Invalid raw material type detected, using default:', rawMaterialType);
                validatedRawMaterialType = 'Fresh Rhizome';
            }
            
            console.log('✅ Validated raw material type:', validatedRawMaterialType);

            // Create processing record data - include all fields that exist in Strapi
            const recordData = {
                // Existing fields
                Batch_Id: batchInfo.batchId,

                // Raw Material Tracking
                raw_material_type: validatedRawMaterialType,
                raw_material_source: rawMaterialSource,
                batch_lot_number: batchLotNumber,
                incoming_weight: parseFloat(incomingWeight) || 0,

                // Quality data fields
                moisture: parseFloat(qualityData.moisture) || 0,
                curcuminoid_content: parseFloat(qualityData.curcuminoidContent) || 0,
                lead_ppm: parseFloat(qualityData.lead) || 0,
                cadmium_ppm: parseFloat(qualityData.cadmium) || 0,
                arsenic_ppm: parseFloat(qualityData.arsenic) || 0,
                mercury_ppm: parseFloat(qualityData.mercury) || 0,
                total_plate_count: parseFloat(qualityData.totalPlateCount) || 0,
                yeast_mold: parseFloat(qualityData.yeastMold) || 0,
                e_coli: qualityData.eColi,
                salmonella: qualityData.salmonella,
                inspection_notes: qualityData.inspectionNotes,
                pesticide_residues: pesticideResidues,

                // Processing details
                processing_method: processingMethod,
                processing_date_custom: processingDate || new Date().toISOString().split('T')[0],
                duration: parseFloat(duration) || 0,
                temperature: parseFloat(temperature) || 0,
                equipment_used: equipmentUsed,
                operator_processor: operatorProcessor,

                // Output data
                final_product_type: finalProductType,
                output_quantity: parseFloat(outputQuantity) || 0,
                output_unit: outputUnit, // เพิ่มการบันทึกหน่วยการวัด
                remaining_stock: parseFloat(remainingStock) || 0,
                waste_quantity: parseFloat(wasteQuantity) || 0,

                // Compliance & Certification
                standard_criteria: standardCriteria,
                certification_status: certificationStatus,
                compliance_notes: complianceNotes,

                // Consumer/Product Grading
                product_grade: productGrade,
                target_market: targetMarket,

                // Processing Status (use only uppercase version)
                Processing_Status: processingStatus,

                // User tracking
                user_documentId: localStorage.getItem("userId") || "unknown",
            };

            console.log('📋 Data to be saved:', recordData);
            console.log('🏷️ Output details:', {
                finalProductType,
                outputQuantity,
                outputUnit,
                formattedOutput: getFormattedOutput()
            });

            // Update factory processing record with processing details
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({ data: recordData }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                console.error('❌ Response status:', response.status);
                alert(`Failed to save: ${response.status} - ${errorText}`);
                throw new Error(`Failed to save processing record: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Processing record saved:', result);
            
            // 🔔 Create notification if processing status is "Completed"
            if (processingStatus === 'Completed') {
                try {
                    const notificationResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-notifications`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                        },
                        body: JSON.stringify({
                            data: {
                                Text: `Processing for batch ${batchInfo.batchId} has been completed successfully! Output: ${getFormattedOutput()}`,
                                Date: new Date().toISOString(),
                                Notification_status: "Succeed",
                                user_documentId: localStorage.getItem("userId"),
                                factory_processing: params.id, // Relation to Factory_Processing
                                // Note: batch relation might need batch documentId if available
                            }
                        })
                    });

                    if (notificationResponse.ok) {
                        console.log(`✅ Processing completion notification created for ${batchInfo.batchId}`);
                    } else {
                        console.error(`❌ Failed to create processing notification for ${batchInfo.batchId}`);
                    }
                } catch (notificationError) {
                    console.error(`❌ Error creating processing notification:`, notificationError);
                }
            }
            
            alert('Processing record saved successfully!');
            router.push('/processing-details');

        } catch (error) {
            console.error('❌ Error saving record:', error);
            alert('Failed to save processing record. Please try again.');
        }
    };

    useEffect(() => {
        // ตั้งค่า userRole เริ่มต้นถ้ายังไม่มีใน localStorage
        if (!localStorage.getItem("userRole")) {
            localStorage.setItem("userRole", "Factory"); // ค่าเริ่มต้นเป็น Factory
        }
        fetchBatchDetails();
    }, [params.id]);

    useEffect(() => {
        console.log('🔍 Current rawMaterialType value:', rawMaterialType);
    }, [rawMaterialType]);

    if (loading) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading batch details...</p>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-semibold">Processing Details</h1>
                        {userRole === 'Farmer' && (
                            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                                <Eye className="w-3 h-3 inline mr-1" />
                                View Only - Farmer
                            </span>
                        )}
                        {isReadOnly && userRole !== 'Farmer' && (
                            <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                                Read Only - Completed
                            </span>
                        )}
                    </div>
                    
                    {/* Print Report Button for Farmers */}
                    {userRole === 'Farmer' && (
                        <Button
                            onClick={handlePrintReport}
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print Report
                        </Button>
                    )}
                </header>

                <main className="p-6 max-w-6xl mx-auto space-y-6">{/* Batch Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-green-600"><Leaf className="h-5 w-5" /></span>
                                Batch Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Batch ID</Label>
                                    <Input value={batchInfo.batchId} readOnly className="bg-gray-50" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Farm Name</Label>
                                    <Input value={batchInfo.farmName} readOnly className="bg-gray-50" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Harvest Date</Label>
                                    <Input
                                        value={batchInfo.harvestDate ? new Date(batchInfo.harvestDate).toLocaleDateString() : 'N/A'}
                                        readOnly
                                        className="bg-gray-50"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Quality</Label>
                                    <Input value={batchInfo.quality} readOnly className="bg-gray-50" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Yield</Label>
                                    <Input value={`${batchInfo.yield} kg`} readOnly className="bg-gray-50" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Plant Variety</Label>
                                    <Input value={batchInfo.plantVariety} readOnly className="bg-gray-50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Cultivation</Label>
                                    <Input value={batchInfo.cultivation} readOnly className="bg-gray-50" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                                    <Input value={batchInfo.location} readOnly className="bg-gray-50" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                                    <Input value={currentStatus} readOnly className="bg-gray-50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Processing Status</Label>
                                    {userRole === 'Farmer' ? (
                                        <Input value={currentStatus} readOnly className="bg-gray-50" />
                                    ) : (
                                        <Select value={processingStatus} onValueChange={setProcessingStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Processing">Processing</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Batch & Raw Material Tracking */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-green-600"><Package className="h-5 w-5" /></span>
                                Batch & Raw Material Tracking
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Monitor and track raw materials from source to processing</p>
                        </CardHeader>
                        <CardContent>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label htmlFor="rawMaterialType" className="text-sm font-medium">Raw Material Type</Label>
                                    <Select value={rawMaterialType} onValueChange={setRawMaterialType} disabled={userRole === 'Farmer'}>
                                        <SelectTrigger>
                                            <SelectValue>
                                                {rawMaterialType ? rawMaterialType : "Select raw material type"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Fresh Rhizome">Fresh Rhizome</SelectItem>
                                            <SelectItem value="Dried Slice">Dried Slice</SelectItem>
                                            <SelectItem value="Powder">Powder</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="rawMaterialSource" className="text-sm font-medium">Raw Material Source</Label>
                                    <Input
                                        id="rawMaterialSource"
                                        placeholder="Farmer Name"
                                        value={rawMaterialSource}
                                        onChange={(e) => setRawMaterialSource(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="batchLotNumber" className="text-sm font-medium">Batch / Lot Number</Label>
                                    <Input
                                        id="batchLotNumber"
                                        placeholder="Batch Number"
                                        value={batchLotNumber}
                                        onChange={(e) => setBatchLotNumber(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="incomingWeight" className="text-sm font-medium">Incoming Weight (kg)</Label>
                                    <Input
                                        id="incomingWeight"
                                        type="number"
                                        placeholder="0.00"
                                        value={incomingWeight}
                                        onChange={(e) => setIncomingWeight(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quality Inspection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-green-600"><FlaskConical className="h-5 w-5" /></span>
                                Quality Inspection
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Comprehensive quality testing and inspection records</p>
                        </CardHeader>
                        <CardContent>

                            {/* Physical & Chemical Tests */}
                            <div className="mb-6">
                                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                                    <Beaker className="w-5 h-5 text-green-600" />
                                    Physical & Chemical Tests
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="moisture" className="text-sm font-medium">Moisture (%)</Label>
                                        <Input
                                            id="moisture"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={qualityData.moisture}
                                            onChange={(e) => setQualityData({ ...qualityData, moisture: e.target.value })}
                                            disabled={isReadOnly}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="curcuminoid" className="text-sm font-medium">Curcuminoid Content (%)</Label>
                                        <Input
                                            id="curcuminoid"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={qualityData.curcuminoidContent}
                                            onChange={(e) => setQualityData({ ...qualityData, curcuminoidContent: e.target.value })}
                                            disabled={isReadOnly}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Heavy Metals Test */}
                            <div className="mb-6">
                                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-green-600" />
                                    Heavy Metals Test (mg/kg)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <Label htmlFor="lead" className="text-sm font-medium">Lead (Pb)</Label>
                                        <Input
                                            id="lead"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={qualityData.lead}
                                            onChange={(e) => setQualityData({ ...qualityData, lead: e.target.value })}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cadmium" className="text-sm font-medium">Cadmium (Cd)</Label>
                                        <Input
                                            id="cadmium"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={qualityData.cadmium}
                                            onChange={(e) => setQualityData({ ...qualityData, cadmium: e.target.value })}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="arsenic" className="text-sm font-medium">Arsenic (As)</Label>
                                        <Input
                                            id="arsenic"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={qualityData.arsenic}
                                            onChange={(e) => setQualityData({ ...qualityData, arsenic: e.target.value })}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="mercury" className="text-sm font-medium">Mercury (Hg)</Label>
                                        <Input
                                            id="mercury"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={qualityData.mercury}
                                            onChange={(e) => setQualityData({ ...qualityData, mercury: e.target.value })}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Microbial Tests */}
                            <div className="mb-6">
                                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-green-600" />
                                    Microbial Tests
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <Label htmlFor="totalPlateCount" className="text-sm font-medium">Total Plate Count (CFU/g)</Label>
                                        <Input
                                            id="totalPlateCount"
                                            type="number"
                                            placeholder="1000"
                                            value={qualityData.totalPlateCount}
                                            onChange={(e) => setQualityData({ ...qualityData, totalPlateCount: e.target.value })}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="yeastMold" className="text-sm font-medium">Yeast & Mold (CFU/g)</Label>
                                        <Input
                                            id="yeastMold"
                                            type="number"
                                            placeholder="10"
                                            value={qualityData.yeastMold}
                                            onChange={(e) => setQualityData({ ...qualityData, yeastMold: e.target.value })}
                                            readOnly={userRole === 'Farmer'}
                                            className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="eColi" className="text-sm font-medium">E. coli (CFU/g)</Label>
                                        <Select
                                            value={qualityData.eColi}
                                            onValueChange={(value) => setQualityData({ ...qualityData, eColi: value })}
                                            disabled={userRole === 'Farmer'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Not Detected">Not Detected</SelectItem>
                                                <SelectItem value="Detected">Detected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="salmonella" className="text-sm font-medium">Salmonella</Label>
                                        <Select
                                            value={qualityData.salmonella}
                                            onValueChange={(value) => setQualityData({ ...qualityData, salmonella: value })}
                                            disabled={userRole === 'Farmer'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Not Detected">Not Detected</SelectItem>
                                                <SelectItem value="Detected">Detected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Inspection Notes */}
                            <div>
                                <Label htmlFor="inspectionNotes" className="text-sm font-medium">Inspection Notes</Label>
                                <Textarea
                                    id="inspectionNotes"
                                    placeholder="Specify any other pathogen tests completed..."
                                    value={qualityData.inspectionNotes}
                                    onChange={(e) => setQualityData({ ...qualityData, inspectionNotes: e.target.value })}
                                    className="mt-1"
                                    rows={3}
                                    readOnly={userRole === 'Farmer'}
                                    style={{ backgroundColor: userRole === 'Farmer' ? '#f9fafb' : '' }}
                                />
                            </div>

                            {/* Pesticide Residues */}
                            <div className="mt-6">
                                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                                    <Droplets className="w-5 h-5 text-green-600" />
                                    Pesticide Residues
                                </h3>
                                <div>
                                    <Label htmlFor="pesticideNotes" className="text-sm font-medium">Pesticide Residue Test Results (mg/kg)</Label>
                                    <Textarea
                                        id="pesticideNotes"
                                        placeholder="List pesticide residue test results with specific values..."
                                        value={pesticideResidues}
                                        onChange={(e) => setPesticideResidues(e.target.value)}
                                        className="mt-1"
                                        rows={3}
                                        readOnly={userRole === 'Farmer'}
                                        style={{ backgroundColor: userRole === 'Farmer' ? '#f9fafb' : '' }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Processing Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-green-600"><FactoryIcon className="h-5 w-5" /></span>
                                Processing Details
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Track processing methods and operational parameters</p>
                        </CardHeader>
                        <CardContent>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="processingMethod" className="text-sm font-medium">Processing Method</Label>
                                    <Select value={processingMethod} onValueChange={setProcessingMethod} disabled={userRole === 'Farmer'}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Washing">Washing</SelectItem>
                                            <SelectItem value="Slicing">Slicing</SelectItem>
                                            <SelectItem value="Drying">Drying</SelectItem>
                                            <SelectItem value="Grinding">Grinding</SelectItem>
                                            <SelectItem value="Sieving">Sieving</SelectItem>
                                            <SelectItem value="Extraction">Extraction</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="processingDate" className="text-sm font-medium">Processing Date</Label>
                                    <Input
                                        id="processingDate"
                                        type="date"
                                        value={processingDate}
                                        onChange={(e) => setProcessingDate(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="operatorProcessor" className="text-sm font-medium">Operator/Processor</Label>
                                    <Input
                                        id="operatorProcessor"
                                        placeholder="Enter operator name"
                                        value={operatorProcessor}
                                        onChange={(e) => setOperatorProcessor(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Label htmlFor="temperature" className="text-sm font-medium">Temperature (°C)</Label>
                                    <Input
                                        id="temperature"
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={temperature}
                                        onChange={(e) => setTemperature(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="duration" className="text-sm font-medium">Duration (hours)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="equipmentUsed" className="text-sm font-medium">Equipment Used</Label>
                                    <Input
                                        id="equipmentUsed"
                                        placeholder="Machine/Equipment"
                                        value={equipmentUsed}
                                        onChange={(e) => setEquipmentUsed(e.target.value)}
                                        readOnly={userRole === 'Farmer'}
                                        className={userRole === 'Farmer' ? 'bg-gray-50' : ''}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Output & Waste and Compliance side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Output & Waste */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-green-600"><Package className="h-5 w-5" /></span>
                                    Output & Waste
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="finalProductType" className="text-sm font-medium">Final Product Type</Label>
                                        <Select value={finalProductType} onValueChange={handleProductTypeChange} disabled={isReadOnly}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Powder">Powder</SelectItem>
                                                <SelectItem value="Extract">Extract</SelectItem>
                                                <SelectItem value="Capsule">Capsule</SelectItem>
                                                <SelectItem value="Tea Bag">Tea Bag</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label htmlFor="outputQuantity" className="text-sm font-medium">
                                                Output Quantity ({outputUnit})
                                            </Label>
                                            <Input
                                                id="outputQuantity"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={outputQuantity}
                                                onChange={(e) => setOutputQuantity(e.target.value)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="outputUnit" className="text-sm font-medium">Unit </Label>
                                            <Input
                                                id="outputUnit"
                                                value={outputUnit}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="wasteQuantity" className="text-sm font-medium">Waste Quantity (kg)</Label>
                                        <Input
                                            id="wasteQuantity"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={wasteQuantity}
                                            onChange={(e) => setWasteQuantity(e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="remainingStock" className="text-sm font-medium">Remaining Stock (kg)</Label>
                                        <Input
                                            id="remainingStock"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={remainingStock}
                                            onChange={(e) => setRemainingStock(e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compliance & Certification */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-green-600"><LucideCheck className="h-5 w-5" /></span>
                                    Compliance & Certification
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="standardCriteria" className="text-sm font-medium">Standard Criteria</Label>
                                        <Select value={standardCriteria} onValueChange={setStandardCriteria} disabled={userRole === 'Farmer'}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GAP">GAP</SelectItem>
                                                <SelectItem value="THP">THP</SelectItem>
                                                <SelectItem value="GMP">GMP</SelectItem>
                                                <SelectItem value="Organic">Organic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="certificationStatus" className="text-sm font-medium">Certification Status</Label>
                                        <Select value={certificationStatus} onValueChange={setCertificationStatus} disabled={userRole === 'Farmer'}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pass">Pass</SelectItem>
                                                <SelectItem value="Fail">Fail</SelectItem>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="complianceNotes" className="text-sm font-medium">Inspection Notes</Label>
                                        <Textarea
                                            id="complianceNotes"
                                            placeholder="Additional compliance notes..."
                                            value={complianceNotes}
                                            onChange={(e) => setComplianceNotes(e.target.value)}
                                            rows={3}
                                            readOnly={userRole === 'Farmer'}
                                            style={{ backgroundColor: userRole === 'Farmer' ? '#f9fafb' : '' }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Consumer/Product Grading */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-green-600"><PackageSearch className="h-5 w-5" /></span>
                                Consumer/Product Grading
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Product quality grading and market classification</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="productGrade" className="text-sm font-medium">Product Grade</Label>
                                    <Select value={productGrade} onValueChange={setProductGrade} disabled={userRole === 'Farmer'}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Herbal Grade (5%)">Herbal Grade (5%)</SelectItem>
                                            <SelectItem value="Herbal Grade (6%)">Herbal Grade (6%)</SelectItem>
                                            <SelectItem value="Herbal Grade (7%)">Herbal Grade (7%)</SelectItem>
                                            <SelectItem value="Herbal Grade (8%)">Herbal Grade (8%)</SelectItem>
                                            <SelectItem value="Herbal Grade (9%)">Herbal Grade (9%)</SelectItem>
                                            <SelectItem value="Premium > 9">Premium {">"}9</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="targetMarket" className="text-sm font-medium">Target Market / Usage</Label>
                                    <Select value={targetMarket} onValueChange={setTargetMarket} disabled={userRole === 'Farmer'}>
                                        <SelectTrigger>
                                            <SelectValue />
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
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-2 left-1 bottom-0 w-full p-4 bg-white border-t">
                        {isReadOnly && userRole !== 'Farmer' && (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200 mr-auto">
                                <Package size={16} />
                                <span className="text-sm font-medium">This processing record is completed and cannot be modified</span>
                            </div>
                        )}
                        {userRole === 'Farmer' && (
                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200 mr-auto">
                                <Eye size={16} />
                                <span className="text-sm font-medium">View only mode - Factory processing data</span>
                            </div>
                        )}
                        {/* <Button
                            onClick={() => router.push(userRole === 'Farmer' ? '/factorysubmission' : '/processing-history')}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            {userRole === 'Farmer' ? 'Back to Factory Submission' : (isReadOnly ? 'Back to History' : 'Cancel')}
                        </Button> */}
                        {/* {userRole === 'Farmer' && (
                            <Button
                                onClick={handlePrintReport}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print Report
                            </Button>
                        )} */}
                        {!isReadOnly && userRole !== 'Farmer' && (
                            <Button
                                onClick={handleSaveRecord}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Record
                            </Button>
                        )}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
