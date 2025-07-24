'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    FlaskConical,
    User,
    MapPin,
    Package,
    Star,
    FileText,
    Beaker,
    Scale,
    BarChart3,
    Droplets,
    Timer,
    Settings
} from "lucide-react";

interface ReportData {
    batchId: string;
    farmName: string;
    dateReceived: string;
    harvestDate: string;
    qualityGrade: string;
    yield: number;
    yieldUnit: string;
    status: string;
    curcuminQuality?: number;
    moistureQuality?: number;
    testDate: string;
    testingMethod: string;
    inspectorNotes: string;
    kaminCAL: {
        sample_name: string;
        plant_weight: number;
        solvent_volume: number;
        average_od: number;
        concentration: number;
        number_of_replications: number;
        first_time: number;
        analytical_instrument: string;
        second_time: number;
        curcuminoid_content: string;
        curcuminoid_percentage: number;
        third_time: number;
    };
    resultImage?: {
        url: string;
        name: string;
    };
}

export default function QualityInspectionReportView() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [role, setRole] = useState<string | 'loading'>('loading');

    const router = useRouter();
    const params = useParams();
    const recordId = params.id as string;

    const ALLOWED_ROLES = ['Farmer'];

    // ตรวจสอบ Role
    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        setRole(userRole || '');
    }, []);

    useEffect(() => {
        if (role === 'loading') return;
        
        if (!ALLOWED_ROLES.includes(role)) {
            router.push('/unauthorized');
            return;
        }
        
        // ดึงข้อมูลเมื่อ role ถูกต้อง
        fetchData();
    }, [role, recordId]);

    // ฟังก์ชัน fetchData и processRecordData เหมือนเดิม
    const fetchData = async () => {
        if (!recordId) return;

        try {
            setLoading(true);
            console.log('🔍 Fetching data for ID:', recordId);

            // ดึงข้อมูล lab submission record พร้อม populate ทุกอย่าง
            const recordUrl = `http://localhost:1337/api/lab-submission-records/${recordId}?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&populate[Report][populate]=*`;
            console.log('📋 Record URL:', recordUrl);

            const recordRes = await fetch(recordUrl, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            if (!recordRes.ok) {
                console.log('🔄 Direct fetch failed, trying alternative approach...');
                
                // Alternative: ดึงข้อมูลทั้งหมดแล้วค้นหา พร้อม populate เต็ม
                const allRecordsUrl = `http://localhost:1337/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&populate[Report][populate]=*`;
                
                const allRecordsRes = await fetch(allRecordsUrl, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                    },
                });

                if (allRecordsRes.ok) {
                    const allRecordsData = await allRecordsRes.json();
                    console.log('📊 All records:', allRecordsData);

                    // หา record ที่ตรงกับ ID
                    const targetRecord = allRecordsData.data?.find((record: any) => {
                        return record.id.toString() === recordId.toString();
                    });

                    if (targetRecord) {
                        console.log('✅ Found target record:', targetRecord);
                        console.log('🔍 Target record batch:', targetRecord.attributes?.batch);
                        console.log('🔍 Target record harvest:', targetRecord.attributes?.harvest_record);
                        
                        // ดึงข้อมูล Farm ของ User เพื่อเปรียบเทียบสิทธิ์เข้าถึง
                        const farmRes = await fetch(`http://localhost:1337/api/farms?documentId=${localStorage.getItem("userId")}`, {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                            },
                        });

                        let userFarmId = '';
                        if (farmRes.ok) {
                            const farmData = await farmRes.json();
                            userFarmId = farmData.data[0]?.documentId || '';
                        }
                        
                        // ตรวจสอบว่า record นี้เป็นของ Farm ที่ user สามารถเข้าถึงได้หรือไม่
                        const recordFarmId = targetRecord.attributes?.batch?.data?.attributes?.Farm?.data?.documentId;
                        if (userFarmId && recordFarmId && recordFarmId !== userFarmId) {
                            throw new Error('This record does not belong to your farm');
                        }
                        
                        // ส่งชื่อ farm จาก record แทนจาก user farm
                        const farmNameFromRecord = targetRecord.attributes?.batch?.data?.attributes?.Farm?.data?.attributes?.Farm_Name || 'Unknown Farm';
                        processRecordData(targetRecord, farmNameFromRecord);
                        return;
                    }
                }

                throw new Error(`Record with ID ${recordId} not found or not accessible`);
            }

            const recordData = await recordRes.json();
            console.log('📋 Record data:', recordData);

            // ดึงข้อมูล Farm ของ User เพื่อเปรียบเทียบสิทธิ์เข้าถึง
            const farmRes = await fetch(`http://localhost:1337/api/farms?documentId=${localStorage.getItem("userId")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            let userFarmId = '';
            if (farmRes.ok) {
                const farmData = await farmRes.json();
                userFarmId = farmData.data[0]?.documentId || '';
            }

            // ตรวจสอบว่า record นี้เป็นของ Farm ที่ user สามารถเข้าถึงได้หรือไม่
            const recordFarmId = recordData.data?.attributes?.batch?.data?.attributes?.Farm?.data?.documentId;
            if (userFarmId && recordFarmId && recordFarmId !== userFarmId) {
                throw new Error('This record does not belong to your farm');
            }

            // ส่งชื่อ farm จาก record แทนจาก user farm
            const farmNameFromRecord = recordData.data?.attributes?.batch?.data?.attributes?.Farm?.data?.attributes?.Farm_Name || 'Unknown Farm';
            processRecordData(recordData.data, farmNameFromRecord);

        } catch (err) {
            console.error('❌ Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const processRecordData = (record: any, farmName: string) => {
        console.log('🔄 Processing record data:', record);
        
        const attrs = record.attributes || record;
        
        // Debug: ดู field ทั้งหมด
        console.log('📊 Available attributes:', Object.keys(attrs || {}));
        console.log('🧪 Test data debug:', {
            curcumin_quality: attrs?.curcumin_quality,
            moisture_quality: attrs?.moisture_quality,
            testing_method: attrs?.testing_method,
            kamincal_sample_name: attrs?.kamincal_sample_name,
            kamincal_plant_weight: attrs?.kamincal_plant_weight,
            kamincal_curcuminoid_percentage: attrs?.kamincal_curcuminoid_percentage
        });

        console.log('🔍 Batch data debug:', {
            batch: attrs?.batch,
            batch_data: attrs?.batch?.data,
            batch_attributes: attrs?.batch?.data?.attributes
        });

        console.log('🔍 Harvest data debug:', {
            harvest_record: attrs?.harvest_record,
            harvest_data: attrs?.harvest_record?.data,
            harvest_attributes: attrs?.harvest_record?.data?.attributes
        });

        // ดึงข้อมูล batch และ farm จาก Console structure
        let batchId = 'N/A';
        let actualFarmName = farmName;
        let yield_amount = 0;
        let yield_unit = 'kg';
        let harvest_date = '';

        // หาข้อมูล Batch และ Farm จากหลาย path
        if (attrs?.batch?.data?.attributes) {
            const batchData = attrs.batch.data.attributes;
            
            // หา Batch ID
            batchId = batchData?.Batch_id || batchData?.batch_id || batchData?.Batch_Id || `Batch-${record.id}`;
            console.log('✅ Found batch ID from path 1:', batchId);

            // หาข้อมูล Farm จาก Batch relation
            if (batchData?.Farm?.data?.attributes) {
                const farmData = batchData.Farm.data.attributes;
                actualFarmName = farmData?.Farm_Name || farmData?.farm_name || farmData?.Farm_name || farmName;
                console.log('✅ Found farm name from batch relation:', actualFarmName);
            } else if (batchData?.Farm?.data) {
                // ลอง path อื่น
                const farmData = batchData.Farm.data;
                actualFarmName = farmData?.Farm_Name || farmData?.farm_name || farmData?.Farm_name || farmName;
                console.log('✅ Found farm name from batch direct:', actualFarmName);
            }
        } else if (attrs?.batch?.data) {
            // ลองดูข้อมูลใน data ตรงๆ
            const batchData = attrs.batch.data;
            batchId = batchData?.Batch_id || batchData?.batch_id || batchData?.Batch_Id || batchData?.attributes?.Batch_id || `Batch-${record.id}`;
            console.log('✅ Found batch ID from path 2:', batchId);

            // ลองหา Farm data
            if (batchData?.Farm?.data?.attributes) {
                const farmData = batchData.Farm.data.attributes;
                actualFarmName = farmData?.Farm_Name || farmData?.farm_name || farmData?.Farm_name || farmName;
                console.log('✅ Found farm name from path 2:', actualFarmName);
            }
        } else if (attrs?.batch) {
            // ลองดูข้อมูลใน batch ตรงๆ
            const batchData = attrs.batch;
            batchId = batchData?.Batch_id || batchData?.batch_id || batchData?.Batch_Id || `Batch-${record.id}`;
            console.log('✅ Found batch ID from path 3:', batchId);

            // ลองหา Farm data
            if (batchData?.Farm?.Farm_Name) {
                actualFarmName = batchData.Farm.Farm_Name;
                console.log('✅ Found farm name from path 3:', actualFarmName);
            }
        }

        // ลองหาจาก root level ถ้ายังไม่เจอ (จาก Console structure)
        if (batchId === 'N/A' || batchId.includes('Batch-')) {
            // ดูจาก record ระดับบนสุด
            if (record?.batch_attributes?.Batch_id) {
                batchId = record.batch_attributes.Batch_id;
                console.log('✅ Found batch ID from root level:', batchId);
            }
        }

        if (actualFarmName === farmName || actualFarmName === 'Unknown Farm') {
            // ลองหาจาก root level
            if (record?.batch_data?.Farm?.Farm_Name) {
                actualFarmName = record.batch_data.Farm.Farm_Name;
                console.log('✅ Found farm name from root level:', actualFarmName);
            }
        }

        // หาข้อมูล Harvest - ลองหลายทาง
        if (attrs?.harvest_record?.data?.attributes) {
            const harvestData = attrs.harvest_record.data.attributes;
            yield_amount = parseFloat(harvestData?.yleld) || parseFloat(harvestData?.yield) || parseFloat(harvestData?.Yield) || 0;
            yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || harvestData?.Yield_unit || 'kg';
            harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.date || '';
            console.log('✅ Found harvest data from path 1:', { yield_amount, yield_unit, harvest_date });
        } else if (attrs?.harvest_record?.data) {
            // ลองดูข้อมูลใน data ตรงๆ
            const harvestData = attrs.harvest_record.data;
            yield_amount = parseFloat(harvestData?.yleld) || parseFloat(harvestData?.yield) || parseFloat(harvestData?.Yield) || 0;
            yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || harvestData?.Yield_unit || 'kg';
            harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.date || harvestData?.attributes?.Date || '';
            console.log('✅ Found harvest data from path 2:', { yield_amount, yield_unit, harvest_date });
        } else if (attrs?.harvest_record) {
            // ลองดูข้อมูลใน harvest_record ตรงๆ
            const harvestData = attrs.harvest_record;
            yield_amount = parseFloat(harvestData?.yleld) || parseFloat(harvestData?.yield) || parseFloat(harvestData?.Yield) || 0;
            yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || harvestData?.Yield_unit || 'kg';
            harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.date || '';
            console.log('✅ Found harvest data from path 3:', { yield_amount, yield_unit, harvest_date });
        }

        // ลองหาจาก root level ของ record
        if (yield_amount === 0) {
            if (record?.harvest_data?.yield || record?.harvest_data?.yleld) {
                yield_amount = parseFloat(record.harvest_data.yield) || parseFloat(record.harvest_data.yleld) || 0;
                yield_unit = record.harvest_data.yield_unit || record.harvest_data.Yleld_unit || 'kg';
                harvest_date = record.harvest_data.harvest_date || record.harvest_data.Date || '';
                console.log('✅ Found harvest data from root level:', { yield_amount, yield_unit, harvest_date });
            }
        }

        // ดึงข้อมูลรูปภาพ/ไฟล์ผลลัพธ์
        let resultImage = undefined;
        
        // ลองหาจาก result_image field หลายรูปแบับ
        if (attrs?.result_image?.data) {
            const imageData = attrs.result_image.data;
            console.log('✅ Found result_image from data:', imageData);
            resultImage = {
                url: `http://localhost:1337${imageData.attributes?.url || imageData.url}`,
                name: imageData.attributes?.name || imageData.name || 'Test Result'
            };
        } else if (attrs?.result_image) {
            // ลองดูแบบ direct access
            const imageData = attrs.result_image;
            console.log('✅ Found result_image direct:', imageData);
            if (imageData.url) {
                resultImage = {
                    url: `http://localhost:1337${imageData.url}`,
                    name: imageData.name || 'Test Result'
                };
            }
        } else if (attrs?.Report?.data) {
            // Fallback ไป Report field
            const reportData = attrs.Report.data;
            console.log('✅ Found Report data:', reportData);
            resultImage = {
                url: `http://localhost:1337${reportData.attributes?.url || reportData.url}`,
                name: reportData.attributes?.name || reportData.name || 'Lab Report'
            };
        } else if (attrs?.Report) {
            // ลองดูแบบ direct access สำหรับ Report
            const reportData = attrs.Report;
            console.log('✅ Found Report direct:', reportData);
            if (reportData.url) {
                resultImage = {
                    url: `http://localhost:1337${reportData.url}`,
                    name: reportData.name || 'Lab Report'
                };
            }
        }

        // Debug: แสดงข้อมูลที่เกี่ยวข้องกับไฟล์
        console.log('🔍 Image/File debug:', {
            result_image: attrs?.result_image,
            Report: attrs?.Report,
            final_resultImage: resultImage
        });

        const processedData: ReportData = {
            batchId: batchId,
            farmName: actualFarmName, // ใช้ชื่อ Farm ที่ถูกต้อง
            dateReceived: attrs?.Date || attrs?.date || attrs?.createdAt || '',
            harvestDate: harvest_date,
            qualityGrade: attrs?.Quality_grade || attrs?.quality_grade || 'Not Graded',
            yield: yield_amount,
            yieldUnit: yield_unit,
            status: attrs?.Submission_status || attrs?.submission_status || 'Draft',
            curcuminQuality: parseFloat(attrs?.curcumin_quality) || undefined,
            moistureQuality: parseFloat(attrs?.moisture_quality) || undefined,
            testDate: attrs?.test_date || attrs?.testDate || attrs?.createdAt || '',
            testingMethod: attrs?.testing_method || attrs?.testingMethod || 'NIR Spectroscopy',
            inspectorNotes: attrs?.inspector_notes || attrs?.inspectorNotes || '',
            kaminCAL: {
                sample_name: attrs?.kamincal_sample_name || '',
                plant_weight: parseFloat(attrs?.kamincal_plant_weight) || 0,
                solvent_volume: parseFloat(attrs?.kamincal_solvent_volume) || 0,
                average_od: parseFloat(attrs?.kamincal_average_od) || 0,
                concentration: parseFloat(attrs?.kamincal_concentration) || 0,
                number_of_replications: parseInt(attrs?.kamincal_number_of_replications) || 0,
                first_time: parseFloat(attrs?.kamincal_first_time) || 0,
                analytical_instrument: attrs?.kamincal_analytical_instrument || 'HPLC',
                second_time: parseFloat(attrs?.kamincal_second_time) || 0,
                curcuminoid_content: attrs?.kamincal_curcuminoid_content || 'Pass',
                curcuminoid_percentage: parseFloat(attrs?.kamincal_curcuminoid_percentage) || 0,
                third_time: parseFloat(attrs?.kamincal_third_time) || 0,
            },
            resultImage: resultImage
        };

        console.log('✅ Final processed data:', processedData);
        console.log('📋 Key fields summary:', {
            batchId: processedData.batchId,
            farmName: processedData.farmName,
            yield: processedData.yield,
            harvestDate: processedData.harvestDate
        });
        setReportData(processedData);
        setError(null);
    };

    const determineTestResult = (curcumin?: number, moisture?: number) => {
        const curcuminThreshold = 3.0;
        const moistureThreshold = 15.0;

        const curcuminPass = !curcumin || curcumin >= curcuminThreshold;
        const moisturePass = !moisture || moisture <= moistureThreshold;

        return curcuminPass && moisturePass ? 'PASSED' : 'FAILED';
    };

    if (role === 'loading' || loading) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading quality inspection report...</p>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (error || !reportData) {
        return (
            <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="text-red-500 mb-4">
                                <FlaskConical className="w-12 h-12 mx-auto" />
                            </div>
                            <p className="text-red-600 font-medium mb-2">Error loading report</p>
                            <p className="text-gray-500 mb-4">{error || 'Report not found'}</p>
                            <Button onClick={() => router.back()} variant="outline">
                                Go Back
                            </Button>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    const testResult = determineTestResult(reportData.curcuminQuality, reportData.moistureQuality);

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                {/* เพิ่ม CSS สำหรับ Print */}
                <style jsx global>{`
                    @media print {
                        /* ซ่อน elements ที่ไม่ต้องการในการพิมพ์ */
                        .print\\:hidden {
                            display: none !important;
                        }
                        
                        /* Reset สำหรับการพิมพ์ */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        /* Layout สำหรับการพิมพ์ */
                        body {
                            font-size: 11pt !important;
                            line-height: 1.3 !important;
                            color: #000 !important;
                        }
                        
                        /* ปรับ margin */
                        @page {
                            margin: 0.75in !important;
                            size: A4 !important;
                        }
                        
                        /* ปรับ container สำหรับ print */
                        .print-container {
                            max-width: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* Header สำหรับ print */
                        .print-header {
                            margin-bottom: 20px !important;
                            padding-bottom: 10px !important;
                            border-bottom: 2px solid #000 !important;
                        }
                        
                        /* Grid layout สำหรับ print */
                        .print-grid {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 15px !important;
                            margin-bottom: 15px !important;
                        }
                        
                        .print-grid-full {
                            grid-column: 1 / -1 !important;
                        }
                        
                        /* Card styling สำหรับ print */
                        .print-card {
                            border: 1px solid #ddd !important;
                            border-radius: 4px !important;
                            padding: 12px !important;
                            margin-bottom: 12px !important;
                            break-inside: avoid !important;
                            background: white !important;
                        }
                        
                        .print-card-header {
                            font-weight: bold !important;
                            font-size: 12pt !important;
                            margin-bottom: 8px !important;
                            color: #000 !important;
                            border-bottom: 1px solid #ccc !important;
                            padding-bottom: 4px !important;
                        }
                        
                        /* Table styling */
                        .print-table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            margin-bottom: 12px !important;
                        }
                        
                        .print-table td, .print-table th {
                            border: 1px solid #ddd !important;
                            padding: 6px !important;
                            text-align: left !important;
                            font-size: 10pt !important;
                        }
                        
                        .print-table th {
                            background-color: #f5f5f5 !important;
                            font-weight: bold !important;
                        }
                        
                        /* Result styling */
                        .print-result-pass {
                            background-color: #d4edda !important;
                            color: #155724 !important;
                            font-weight: bold !important;
                        }
                        
                        .print-result-fail {
                            background-color: #f8d7da !important;
                            color: #721c24 !important;
                            font-weight: bold !important;
                        }
                        
                        /* Image styling */
                        .print-image {
                            max-width: 200px !important;
                            max-height: 150px !important;
                            object-fit: contain !important;
                            border: 1px solid #ddd !important;
                        }
                        
                        /* Footer */
                        .print-footer {
                            margin-top: 30px !important;
                            padding-top: 15px !important;
                            border-top: 2px solid #000 !important;
                            text-align: center !important;
                            font-size: 10pt !important;
                        }
                        
                        /* Screen content ซ่อนเมื่อ print */
                        .screen-only {
                            display: none !important;
                        }
                    }
                    
                    /* Screen only - ซ่อนเมื่อไม่ได้ print */
                    @media screen {
                        .print-only {
                            display: none !important;
                        }
                    }
                `}</style>

                {/* Header - ซ่อนเมื่อ print */}
                <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white print:hidden">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                        <h1 className="text-2xl font-semibold">Quality Inspection Report</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="flex items-center gap-2"
                        >
                            <FileText size={16} />
                            Print Report
                        </Button>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${testResult === 'PASSED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {testResult}
                        </div>
                    </div>
                </header>

                {/* Print Header - แสดงเฉพาะเมื่อ print */}
                <div className="print-only print-header">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-2">QUALITY INSPECTION REPORT</h1>
                        <p className="text-sm">TurmeRic Laboratory Analysis System</p>
                        <p className="text-xs">Report Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>

                {/* Main content */}
                <main className="p-6 max-w-6xl mx-auto space-y-6 print-container">
                    
                    {/* Print Version - แสดงเฉพาะเมื่อ print */}
                    <div className="print-only">
                        {/* Basic Information - Print Version */}
                        <div className="print-card">
                            <div className="print-card-header">Basic Information</div>
                            <table className="print-table">
                                <tbody>
                                    <tr>
                                        <td><strong>Batch ID:</strong></td>
                                        <td>{reportData.batchId}</td>
                                        <td><strong>Farm:</strong></td>
                                        <td>{reportData.farmName}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Quality Grade:</strong></td>
                                        <td>{reportData.qualityGrade}</td>
                                        <td><strong>Test Date:</strong></td>
                                        <td>{reportData.testDate ? new Date(reportData.testDate).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Date Received:</strong></td>
                                        <td>{reportData.dateReceived ? new Date(reportData.dateReceived).toLocaleDateString() : 'N/A'}</td>
                                        <td><strong>Harvest Date:</strong></td>
                                        <td>{reportData.harvestDate ? new Date(reportData.harvestDate).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Test Results Summary - Print Version */}
                        <div className="print-card">
                            <div className="print-card-header">Test Results Summary</div>
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th>Parameter</th>
                                        <th>Result</th>
                                        <th>Standard</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Curcuminoid Content</td>
                                        <td>{reportData.curcuminQuality ? `${reportData.curcuminQuality}%` : 'Not tested'}</td>
                                        <td>≥ 3.0%</td>
                                        <td className={reportData.curcuminQuality && reportData.curcuminQuality >= 3 ? 'print-result-pass' : 'print-result-fail'}>
                                            {reportData.curcuminQuality ? (reportData.curcuminQuality >= 3 ? 'PASS' : 'FAIL') : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Moisture Content</td>
                                        <td>{reportData.moistureQuality ? `${reportData.moistureQuality}%` : 'Not tested'}</td>
                                        <td>≤ 15.0%</td>
                                        <td className={reportData.moistureQuality && reportData.moistureQuality <= 15 ? 'print-result-pass' : 'print-result-fail'}>
                                            {reportData.moistureQuality ? (reportData.moistureQuality <= 15 ? 'PASS' : 'FAIL') : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Testing Method</td>
                                        <td colSpan={2}>{reportData.testingMethod}</td>
                                        <td>-</td>
                                    </tr>
                                    <tr>
                                        <td>Yield Amount</td>
                                        <td colSpan={2}>{reportData.yield > 0 ? `${reportData.yield} ${reportData.yieldUnit}` : 'N/A'}</td>
                                        <td>-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Result Image - Print Version */}
                        {reportData.resultImage && (
                            <div className="print-card">
                                <div className="print-card-header">Test Result File</div>
                                {reportData.resultImage.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(reportData.resultImage.name) ? (
                                    <div className="text-center">
                                        <img
                                            src={reportData.resultImage.url}
                                            alt="Test Result"
                                            className="print-image mx-auto"
                                        />
                                        <p className="text-xs mt-2">{reportData.resultImage.name}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p><strong>File:</strong> {reportData.resultImage.name}</p>
                                        <p className="text-xs text-gray-600">File available for download in digital version</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* KaminCAL Analysis - Print Version */}
                        <div className="print-card">
                            <div className="print-card-header">KaminCAL Analysis Details</div>
                            <div className="print-grid">
                                <div>
                                    <h4 className="font-semibold mb-2">Sample Information</h4>
                                    <table className="print-table">
                                        <tbody>
                                            <tr>
                                                <td>Sample Name:</td>
                                                <td>{reportData.kaminCAL.sample_name || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td>Plant Weight:</td>
                                                <td>{reportData.kaminCAL.plant_weight > 0 ? `${reportData.kaminCAL.plant_weight} mg` : 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td>Solvent Volume:</td>
                                                <td>{reportData.kaminCAL.solvent_volume > 0 ? `${reportData.kaminCAL.solvent_volume} mL` : 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td>Average OD:</td>
                                                <td>{reportData.kaminCAL.average_od > 0 ? reportData.kaminCAL.average_od : 'N/A'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Analysis Parameters</h4>
                                    <table className="print-table">
                                        <tbody>
                                            <tr>
                                                <td>Concentration:</td>
                                                <td>{reportData.kaminCAL.concentration > 0 ? `${reportData.kaminCAL.concentration} mg/mL` : 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td>Replications:</td>
                                                <td>{reportData.kaminCAL.number_of_replications > 0 ? reportData.kaminCAL.number_of_replications : 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td>Instrument:</td>
                                                <td>{reportData.kaminCAL.analytical_instrument}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Curcuminoid %:</strong></td>
                                                <td><strong>{reportData.kaminCAL.curcuminoid_percentage > 0 ? `${reportData.kaminCAL.curcuminoid_percentage}%` : 'N/A'}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="print-grid-full">
                                <h4 className="font-semibold mb-2">Time Measurements</h4>
                                <table className="print-table">
                                    <thead>
                                        <tr>
                                            <th>Measurement</th>
                                            <th>First Time</th>
                                            <th>Second Time</th>
                                            <th>Third Time</th>
                                            <th>Content Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Values (mg/mL)</td>
                                            <td>{reportData.kaminCAL.first_time > 0 ? reportData.kaminCAL.first_time : 'N/A'}</td>
                                            <td>{reportData.kaminCAL.second_time > 0 ? reportData.kaminCAL.second_time : 'N/A'}</td>
                                            <td>{reportData.kaminCAL.third_time > 0 ? reportData.kaminCAL.third_time : 'N/A'}</td>
                                            <td className={reportData.kaminCAL.curcuminoid_content === 'Pass' ? 'print-result-pass' : 'print-result-fail'}>
                                                {reportData.kaminCAL.curcuminoid_content}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Inspector Notes - Print Version */}
                        {reportData.inspectorNotes && (
                            <div className="print-card">
                                <div className="print-card-header">Inspector Notes</div>
                                <p className="text-sm">{reportData.inspectorNotes}</p>
                            </div>
                        )}

                        {/* Final Result - Print Version */}
                        <div className={`print-card text-center ${testResult === 'PASSED' ? 'print-result-pass' : 'print-result-fail'}`}>
                            <div className="print-card-header">FINAL RESULT</div>
                            <h2 className="text-2xl font-bold mb-2">{testResult}</h2>
                            <p className="text-sm">
                                {testResult === 'PASSED'
                                    ? 'This batch meets all quality standards for turmeric.'
                                    : 'This batch does not meet the required quality standards.'}
                            </p>
                        </div>

                        {/* Print Footer */}
                        <div className="print-footer">
                            <div className="print-grid">
                                <div className="text-left">
                                    <p><strong>Inspector:</strong> _____________________</p>
                                    <p>Date: _____________________</p>
                                </div>
                                <div className="text-right">
                                    <p><strong>Authorized by:</strong> _____________________</p>
                                    <p>Date: _____________________</p>
                                </div>
                            </div>
                            <p className="text-xs mt-4">
                                This report was generated by TurmeRic Laboratory Analysis System.<br/>
                                Report ID: {recordId} | Generated: {new Date().toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Screen Version - แสดงเฉพาะบนหน้าจอ */}
                    <div className="screen-only">
                        {/* Header Summary */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="flex items-center gap-3 min-h-[60px]">
                                        <Package className="h-8 w-8 text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-500 font-medium">Batch ID</p>
                                            <p className="font-semibold text-gray-900 truncate">{reportData.batchId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-h-[60px]">
                                        <MapPin className="h-8 w-8 text-green-600 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-500 font-medium">Farm</p>
                                            <p className="font-semibold text-gray-900 truncate">{reportData.farmName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-h-[60px]">
                                        <Star className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-500 font-medium">Quality Grade</p>
                                            <p className="font-semibold text-gray-900 truncate">{reportData.qualityGrade}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-h-[60px]">
                                        <Calendar className="h-8 w-8 text-purple-600 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-500 font-medium">Test Date</p>
                                            <p className="font-semibold text-gray-900 truncate">
                                                {reportData.testDate ? new Date(reportData.testDate).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Test Results */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FlaskConical className="h-5 w-5" />
                                        Test Results Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="grid gap-4 h-full">
                                        {/* Curcuminoid Content */}
                                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                                            <span className="font-medium text-gray-700">Curcuminoid Content</span>
                                            <div className="text-right">
                                                {reportData.curcuminQuality && reportData.curcuminQuality > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-xl font-bold ${reportData.curcuminQuality >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {reportData.curcuminQuality}%
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${reportData.curcuminQuality >= 3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {reportData.curcuminQuality >= 3 ? 'PASS' : 'FAIL'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">Not tested</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Moisture Content */}
                                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <span className="font-medium text-gray-700">Moisture Content</span>
                                            <div className="text-right">
                                                {reportData.moistureQuality && reportData.moistureQuality > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-xl font-bold ${reportData.moistureQuality <= 15 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {reportData.moistureQuality}%
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${reportData.moistureQuality <= 15 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {reportData.moistureQuality <= 15 ? 'PASS' : 'FAIL'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">Not tested</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Testing Method */}
                                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="font-medium text-gray-700">Testing Method</span>
                                            <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded border">{reportData.testingMethod}</span>
                                        </div>

                                        {/* Yield Amount */}
                                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                                            <span className="font-medium text-gray-700">Yield Amount</span>
                                            <span className="font-bold text-green-700 text-lg">
                                                {reportData.yield > 0 ? `${reportData.yield} ${reportData.yieldUnit}` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Result Image or Placeholder */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Test Result File
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {reportData.resultImage ? (
                                        <div className="border rounded-lg p-4 bg-gray-50 h-full flex flex-col">
                                            {/* ตรวจสอบว่าเป็นไฟล์ภาพหรือไม่ */}
                                            {reportData.resultImage.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(reportData.resultImage.name) ? (
                                                // แสดงรูปภาพ
                                                <>
                                                    <img
                                                        src={reportData.resultImage.url}
                                                        alt="Test Result"
                                                        className="w-full flex-1 object-cover rounded-lg min-h-[200px]"
                                                        onError={(e) => {
                                                            console.error('Image load error:', e);
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                    <p className="text-sm text-gray-600 mt-3 text-center font-medium">{reportData.resultImage.name}</p>
                                                </>
                                            ) : (
                                                // แสดงไฟล์อื่นๆ (Excel, PDF, etc.)
                                                <div className="h-full flex flex-col items-center justify-center text-center">
                                                    <div className="p-6 bg-blue-100 rounded-full mb-4">
                                                        {reportData.resultImage.name?.toLowerCase().includes('.xlsx') || reportData.resultImage.name?.toLowerCase().includes('.xls') ? (
                                                            <svg className="h-12 w-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm0 2h12v10H4V5z"/>
                                                                <path d="M6 7h8v1H6V7zm0 2h8v1H6V9zm0 2h8v1H6v-1z"/>
                                                            </svg>
                                                        ) : reportData.resultImage.name?.toLowerCase().includes('.pdf') ? (
                                                            <svg className="h-12 w-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M4 18h12V6h-4V2H4v16zm8-14v4h4l-4-4z"/>
                                                            </svg>
                                                        ) : (
                                                            <FileText className="h-12 w-12 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-lg font-semibold text-gray-800 mb-2">Test Result File</p>
                                                    <p className="text-sm text-gray-600 mb-4 px-4">{reportData.resultImage.name}</p>
                                                    <a
                                                        href={reportData.resultImage.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Download File
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 bg-gray-50 h-full flex flex-col items-center justify-center text-center">
                                            <FileText className="h-12 w-12 text-gray-400 mb-4" />
                                            <p className="text-gray-500 font-medium mb-2">No Result File</p>
                                            <p className="text-sm text-gray-400">Test result file not available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* KaminCAL Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Beaker className="h-5 w-5" />
                                    KaminCAL Analysis Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Time Measurements</h4>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[50px]">
                                            <div className="flex items-center gap-2">
                                                <Timer className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-medium">First Time:</span>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {reportData.kaminCAL.first_time > 0 ? `${reportData.kaminCAL.first_time} mg/mL` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[50px]">
                                            <div className="flex items-center gap-2">
                                                <Timer className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-medium">Second Time:</span>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {reportData.kaminCAL.second_time > 0 ? `${reportData.kaminCAL.second_time} mg/mL` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[50px]">
                                            <div className="flex items-center gap-2">
                                                <Timer className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-medium">Third Time:</span>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {reportData.kaminCAL.third_time > 0 ? `${reportData.kaminCAL.third_time} mg/mL` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 min-h-[50px]">
                                            <div className="flex items-center gap-2">
                                                <FlaskConical className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium">Content Status:</span>
                                            </div>
                                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${reportData.kaminCAL.curcuminoid_content === 'Pass'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {reportData.kaminCAL.curcuminoid_content}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inspector Notes */}
                        {reportData.inspectorNotes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Inspector Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-700">{reportData.inspectorNotes}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Test Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-3">Quality Standards</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Minimum Curcuminoid Content:</span>
                                                <span className="text-sm font-semibold">3.0%</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Maximum Moisture Content:</span>
                                                <span className="text-sm font-semibold">15.0%</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Testing Method:</span>
                                                <span className="text-sm font-semibold">{reportData.testingMethod}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-3">Sample Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Date Received:</span>
                                                <span className="text-sm font-semibold">
                                                    {reportData.dateReceived ? new Date(reportData.dateReceived).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Harvest Date:</span>
                                                <span className="text-sm font-semibold">
                                                    {reportData.harvestDate ? new Date(reportData.harvestDate).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Sample Weight:</span>
                                                <span className="text-sm font-semibold">
                                                    {reportData.kaminCAL.plant_weight > 0 ? `${reportData.kaminCAL.plant_weight} mg` : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`mt-6 p-4 rounded-lg text-center ${testResult === 'PASSED'
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                    }`}>
                                    <h3 className={`text-lg font-bold ${testResult === 'PASSED' ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        Final Result: {testResult}
                                    </h3>
                                    <p className={`text-sm mt-1 ${testResult === 'PASSED' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {testResult === 'PASSED'
                                            ? 'This batch meets all quality standards for turmeric.'
                                            : 'This batch does not meet the required quality standards.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}