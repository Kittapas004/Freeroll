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
    Settings,
    Printer,
    Download
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
    analystName: string;
    reviewerName: string;
    completedDate?: string;
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

const TurmeRicLogo = () => (
    <div className="flex items-center justify-center mb-4">
        <div className="flex flex-col items-center">
            <div className="w-30 h-30 rounded-full flex items-center justify-center mb-8">
                <img src="/MFU.png" alt="TurmeRic Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
                <div className="text-lg font-bold text-gray-800">
                    TurmeRic Laboratory Analysis System
                </div>
                <div className="text-sm text-gray-600">
                    Quality Inspection Report
                </div>
            </div>
        </div>
    </div>
);

// เพิ่มฟังก์ชันเช็คว่ามีข้อมูล KaminCAL หรือไม่
const hasKaminCALData = (kaminCAL: any) => {
    // เช็คว่ามีข้อมูลอย่างน้อย 1 field ที่มีค่า
    return (
        (kaminCAL.sample_name && kaminCAL.sample_name.trim() !== '') ||
        kaminCAL.plant_weight > 0 ||
        kaminCAL.solvent_volume > 0 ||
        kaminCAL.average_od > 0 ||
        kaminCAL.concentration > 0 ||
        kaminCAL.number_of_replications > 0 ||
        kaminCAL.first_time > 0 ||
        kaminCAL.second_time > 0 ||
        kaminCAL.third_time > 0 ||
        kaminCAL.curcuminoid_percentage > 0 ||
        (kaminCAL.analytical_instrument && kaminCAL.analytical_instrument !== 'HPLC') // เช็คว่าไม่ใช่ค่า default
    );
};

export default function QualityInspectionReportView() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [role, setRole] = useState<string | 'loading'>('loading');
    const [isPrintMode, setIsPrintMode] = useState(false);

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

    const fetchData = async () => {
        if (!recordId) return;

        try {
            setLoading(true);
            console.log('🔍 Fetching data for ID:', recordId);

            // ดึงข้อมูล lab submission record พร้อม populate ทุกอย่าง
            const recordUrl = `https://popular-trust-9012d3ebd9.strapiapp.com/api/lab-submission-records/${recordId}?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&populate[Report][populate]=*`;
            console.log('📋 Record URL:', recordUrl);

            const recordRes = await fetch(recordUrl, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            if (!recordRes.ok) {
                console.log('🔄 Direct fetch failed, trying alternative approach...');

                // Alternative: ดึงข้อมูลทั้งหมดแล้วค้นหา พร้อม populate เต็ม
                const allRecordsUrl = `https://popular-trust-9012d3ebd9.strapiapp.com/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&populate[Report][populate]=*`;

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
                        const farmRes = await fetch(`https://popular-trust-9012d3ebd9.strapiapp.com/api/farms?documentId=${localStorage.getItem("userId")}`, {
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
            const farmRes = await fetch(`https://popular-trust-9012d3ebd9.strapiapp.com/api/farms?documentId=${localStorage.getItem("userId")}`, {
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

    const getImageUrl = (imageData: any): string | null => {
        if (!imageData) return null;

        console.log("🖼️ Processing image data:", imageData);

        // ลองหลายรูปแบบของ Strapi structure
        const possibleUrls = [
            imageData.url,                                    // Direct URL
            imageData.data?.attributes?.url,                  // Strapi v4 structure  
            imageData.attributes?.url,                        // Alternative structure
            imageData.data?.url,                              // Another alternative
        ];

        const validUrl = possibleUrls.find(url => url);
        console.log("🔗 Found image URL:", validUrl);

        if (validUrl) {
            // ตรวจสอบว่าเป็น full URL หรือไม่
            if (validUrl.startsWith('http')) {
                return validUrl;
            } else {
                return `https://popular-trust-9012d3ebd9.strapiapp.com${validUrl}`;
            }
        }

        return null;
    };

    const processRecordData = (record: any, farmName: string) => {
        console.log('🔄 Processing record data:', record);

        const attrs = record.attributes || record;

        // Process batch and farm data
        let batchId = 'N/A';
        let actualFarmName = farmName;
        let yield_amount = 0;
        let yield_unit = 'kg';
        let harvest_date = '';
        let resultImage = undefined;

        // หาข้อมูล Batch และ Farm
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

        // ลองหาจาก root level ถ้ายังไม่เจอ
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

        const imageSources = [
            { source: attrs?.result_image, name: 'result_image' },
            { source: attrs?.Report, name: 'Report' },
            { source: attrs?.test_result_file, name: 'test_result_file' },
            { source: attrs?.attachment, name: 'attachment' }
        ];

        for (const { source, name } of imageSources) {
            if (source && !resultImage) {
                console.log(`🔍 Checking ${name}:`, source);

                // Case 1: Data with attributes structure
                if (source.data?.attributes) {
                    const fileData = source.data.attributes;
                    const imageUrl = getImageUrl(fileData);

                    if (imageUrl) {
                        resultImage = {
                            url: imageUrl,
                            name: fileData.name || fileData.filename || `${name}_file`
                        };
                        console.log(`✅ Found image from ${name} (data.attributes):`, resultImage);
                        break;
                    }
                }

                // Case 2: Array of files
                else if (Array.isArray(source.data) && source.data.length > 0) {
                    const fileData = source.data[0].attributes || source.data[0];
                    const imageUrl = getImageUrl(fileData);

                    if (imageUrl) {
                        resultImage = {
                            url: imageUrl,
                            name: fileData.name || fileData.filename || `${name}_file`
                        };
                        console.log(`✅ Found image from ${name} (array):`, resultImage);
                        break;
                    }
                }

                // Case 3: Direct data structure
                else if (source.data) {
                    const fileData = source.data;
                    const imageUrl = getImageUrl(fileData);

                    if (imageUrl) {
                        resultImage = {
                            url: imageUrl,
                            name: fileData.name || fileData.filename || `${name}_file`
                        };
                        console.log(`✅ Found image from ${name} (data):`, resultImage);
                        break;
                    }
                }

                // Case 4: Direct structure (no data wrapper)
                else if (source.url || source.attributes?.url) {
                    const imageUrl = getImageUrl(source);

                    if (imageUrl) {
                        resultImage = {
                            url: imageUrl,
                            name: source.name || source.attributes?.name || source.filename || `${name}_file`
                        };
                        console.log(`✅ Found image from ${name} (direct):`, resultImage);
                        break;
                    }
                }
            }
        }

        if (!resultImage) {
            console.log('⚠️ No result image found in any source');
        }

        const processedData: ReportData = {
            batchId: batchId,
            farmName: actualFarmName,
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
            analystName: attrs?.hplc_analyst_name || '',
            reviewerName: attrs?.hplc_reviewer_name || '',
            completedDate: attrs?.completed_date || attrs?.completedDate || attrs?.updatedAt || attrs?.createdAt || '',
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

    const handlePrint = () => {
        setIsPrintMode(true);
        setTimeout(() => {
            window.print();
            setIsPrintMode(false);
        }, 100);
    };

    const handleDownload = () => {
        // สำหรับการดาวน์โหลดเป็น PDF ในอนาคต
        alert('ฟีเจอร์ดาวน์โหลด PDF กำลังพัฒนา');
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

    const ResultFileDisplay = ({ resultImage }: { resultImage?: { url: string; name: string } }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoaded, setImageLoaded] = useState(false);

        if (!resultImage) {
            return (
                <div className="text-center py-8">
                    <div className="p-4 bg-gray-100 rounded-full mb-4 w-16 h-16 mx-auto flex items-center justify-center">
                        <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">No Result File</p>
                    <p className="text-sm text-gray-400">Test result file not available</p>
                </div>
            );
        }

        const isImageFile = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(resultImage.name);
        const isExcelFile = /\.(xlsx|xls)$/i.test(resultImage.name);
        const isPdfFile = /\.pdf$/i.test(resultImage.name);

        if (isImageFile) {
            return (
                <div className="text-center">
                    {/* แสดง loading placeholder */}
                    {!imageLoaded && !imageError && (
                        <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg border mb-3 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-500">Loading image...</p>
                            </div>
                        </div>
                    )}

                    {/* แสดงรูปภาพจริง */}
                    <img
                        src={resultImage.url}
                        alt="Test Result"
                        className={`w-full max-w-md mx-auto h-auto object-contain rounded-lg border mb-3 ${imageLoaded ? 'block' : 'hidden'
                            }`}
                        onLoad={() => {
                            console.log('✅ Image loaded successfully:', resultImage.url);
                            setImageLoaded(true);
                            setImageError(false);
                        }}
                        onError={(e) => {
                            console.error('❌ Image load error:', resultImage.url);
                            setImageError(true);
                            setImageLoaded(false);
                        }}
                    />

                    {/* แสดง error placeholder */}
                    {imageError && (
                        <div className="w-full max-w-md mx-auto h-64 bg-red-50 rounded-lg border mb-3 flex items-center justify-center">
                            <div className="text-center">
                                <div className="p-3 bg-red-100 rounded-full mb-2 w-12 h-12 mx-auto flex items-center justify-center">
                                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833-.27 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <p className="text-red-600 text-sm font-medium">Failed to load image</p>
                                <p className="text-gray-500 text-xs mt-1">{resultImage.name}</p>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-gray-600 font-medium mb-3">{resultImage.name}</p>
                    <a
                        href={resultImage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
                    >
                        <Download className="h-4 w-4" />
                        Download Image
                    </a>
                </div>
            );
        }

        // แสดงไฟล์อื่นๆ (Excel, PDF, etc.)
        return (
            <div className="text-center py-6">
                <div className="p-4 bg-blue-100 rounded-full mb-4 w-16 h-16 mx-auto flex items-center justify-center">
                    {isExcelFile ? (
                        <svg className="h-10 w-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm0 2h12v10H4V5z" />
                            <path d="M6 7h8v1H6V7zm0 2h8v1H6V9zm0 2h8v1H6v-1z" />
                        </svg>
                    ) : isPdfFile ? (
                        <svg className="h-10 w-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 18h12V6h-4V2H4v16zm8-14v4h4l-4-4z" />
                        </svg>
                    ) : (
                        <FileText className="h-10 w-10 text-blue-600" />
                    )}
                </div>
                <p className="text-lg font-semibold text-gray-800 mb-2">Test Result File</p>
                <p className="text-sm text-gray-600 mb-4">{resultImage.name}</p>
                <a
                    href={resultImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
                >
                    <Download className="h-4 w-4" />
                    Download File
                </a>
            </div>
        );
    };

    const reportContent = (
        <div className="max-w-4xl mx-auto bg-white">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        font-size: 11pt !important;
                        line-height: 1.3 !important;
                    }
                    @page {
                        margin: 0.75in !important;
                        size: A4 !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print-container {
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-bottom: 12px !important;
                    }
                    .print-table td, .print-table th {
                        border: 1px solid #ddd !important;
                        padding: 8px !important;
                        text-align: left !important;
                        font-size: 10pt !important;
                    }
                    .print-table th {
                        background-color: #f5f5f5 !important;
                        font-weight: bold !important;
                    }
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
                    .print-header {
                        text-align: center !important;
                        margin-bottom: 20px !important;
                        border-bottom: 2px solid #000 !important;
                        padding-bottom: 10px !important;
                    }
                    .print-footer {
                        margin-top: 30px !important;
                        text-align: center !important;
                        font-size: 10pt !important;
                        border-top: 1px solid #ddd !important;
                        padding-top: 15px !important;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="text-center mb-8 print-header">
                <TurmeRicLogo />
                <p className="text-sm text-gray-600">
                    Report Generated: {reportData.completedDate ?
                        new Date(reportData.completedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) :
                        'Date not available'
                    }
                </p>
            </div>

            {/* Basic Information Table */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-400 print-table">
                    <thead>
                        <tr>
                            <th className="border border-gray-400 p-3 bg-gray-50 font-bold" colSpan={4}>
                                Basic Information
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-3 font-semibold bg-gray-50 w-1/4">
                                Batch ID:
                            </td>
                            <td className="border border-gray-400 p-3">
                                {reportData.batchId}
                            </td>
                            <td className="border border-gray-400 p-3 font-semibold bg-gray-50 w-1/4">
                                Farm:
                            </td>
                            <td className="border border-gray-400 p-3">
                                {reportData.farmName}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                                Quality Grade:
                            </td>
                            <td className="border border-gray-400 p-3">
                                {reportData.qualityGrade}
                            </td>
                            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                                Test Date:
                            </td>
                            <td className="border border-gray-400 p-3">
                                {reportData.testDate ? new Date(reportData.testDate).toLocaleDateString() : 'N/A'}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                                Date Received:
                            </td>
                            <td className="border border-gray-400 p-3">
                                {reportData.dateReceived ? new Date(reportData.dateReceived).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                                Harvest Date:
                            </td>
                            <td className="border border-gray-400 p-3">
                                {reportData.harvestDate ? new Date(reportData.harvestDate).toLocaleDateString() : 'N/A'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Test Results Summary Table */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-400 print-table">
                    <thead>
                        <tr>
                            <th className="border border-gray-400 p-3 bg-gray-50 font-bold" colSpan={4}>
                                Test Results Summary
                            </th>
                        </tr>
                        <tr>
                            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                                Parameter
                            </th>
                            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                                Result
                            </th>
                            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                                Standard
                            </th>
                            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-3">Curcuminoid Content</td>
                            <td className="border border-gray-400 p-3 text-center">
                                {reportData.curcuminQuality ? `${reportData.curcuminQuality}%` : 'Not tested'}
                            </td>
                            <td className="border border-gray-400 p-3 text-center">≥ 3.0%</td>
                            <td className={`border border-gray-400 p-3 text-center ${reportData.curcuminQuality && reportData.curcuminQuality >= 3
                                ? 'print-result-pass bg-green-100 text-green-800'
                                : 'print-result-fail bg-red-100 text-red-800'
                                }`}>
                                {reportData.curcuminQuality
                                    ? (reportData.curcuminQuality >= 3 ? 'PASS' : 'FAIL')
                                    : 'N/A'}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-3">Moisture Content</td>
                            <td className="border border-gray-400 p-3 text-center">
                                {reportData.moistureQuality ? `${reportData.moistureQuality}%` : 'Not tested'}
                            </td>
                            <td className="border border-gray-400 p-3 text-center">≤ 15.0%</td>
                            <td className={`border border-gray-400 p-3 text-center ${reportData.moistureQuality && reportData.moistureQuality <= 15
                                ? 'print-result-pass bg-green-100 text-green-800'
                                : 'print-result-fail bg-red-100 text-red-800'
                                }`}>
                                {reportData.moistureQuality
                                    ? (reportData.moistureQuality <= 15 ? 'PASS' : 'FAIL')
                                    : 'N/A'}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-3">Testing Method</td>
                            <td className="border border-gray-400 p-3 text-center" colSpan={2}>
                                {reportData.testingMethod}
                            </td>
                            <td className="border border-gray-400 p-3 text-center">-</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-3">Yield Amount</td>
                            <td className="border border-gray-400 p-3 text-center" colSpan={2}>
                                {reportData.yield > 0 ? `${reportData.yield} ${reportData.yieldUnit}` : 'N/A'}
                            </td>
                            <td className="border border-gray-400 p-3 text-center">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* KaminCAL Analysis Details Table */}
            {hasKaminCALData(reportData.kaminCAL) && (
                <div className="mb-8">
                    <table className="w-full border-collapse border border-gray-400 print-table">
                        <thead>
                            <tr>
                                <th className="border border-gray-400 p-3 bg-gray-50 font-bold" colSpan={4}>
                                    KaminCAL Analysis Details
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Sample Information - แสดงเฉพาะเมื่อมีข้อมูล sample */}
                            {((reportData.kaminCAL.sample_name && reportData.kaminCAL.sample_name.trim() !== '') ||
                                reportData.kaminCAL.plant_weight > 0 ||
                                reportData.kaminCAL.solvent_volume > 0 ||
                                reportData.kaminCAL.average_od > 0) && (
                                    <>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-semibold bg-gray-100" colSpan={4}>
                                                Sample Information
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-medium">Sample Name:</td>
                                            <td className="border border-gray-400 p-3">
                                                {reportData.kaminCAL.sample_name || 'N/A'}
                                            </td>
                                            <td className="border border-gray-400 p-3 font-medium">Plant Weight:</td>
                                            <td className="border border-gray-400 p-3">
                                                {reportData.kaminCAL.plant_weight > 0 ? `${reportData.kaminCAL.plant_weight} mg` : 'N/A'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-medium">Solvent Volume:</td>
                                            <td className="border border-gray-400 p-3">
                                                {reportData.kaminCAL.solvent_volume > 0 ? `${reportData.kaminCAL.solvent_volume} mL` : 'N/A'}
                                            </td>
                                            <td className="border border-gray-400 p-3 font-medium">Average OD:</td>
                                            <td className="border border-gray-400 p-3">
                                                {reportData.kaminCAL.average_od > 0 ? reportData.kaminCAL.average_od : 'N/A'}
                                            </td>
                                        </tr>
                                    </>
                                )}

                            {/* Analysis Parameters - แสดงเฉพาะเมื่อมีข้อมูล analysis */}
                            {(reportData.kaminCAL.concentration > 0 ||
                                reportData.kaminCAL.number_of_replications > 0 ||
                                reportData.kaminCAL.curcuminoid_percentage > 0 ||
                                (reportData.kaminCAL.analytical_instrument && reportData.kaminCAL.analytical_instrument !== 'HPLC')) && (
                                    <>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-semibold bg-gray-100" colSpan={4}>
                                                Analysis Parameters
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-medium">Concentration:</td>
                                            <td className="border border-gray-400 p-3">
                                                {reportData.kaminCAL.concentration > 0 ? `${reportData.kaminCAL.concentration} mg/mL` : 'N/A'}
                                            </td>
                                            <td className="border border-gray-400 p-3 font-medium">Replications:</td>
                                            <td className="border border-gray-400 p-3">
                                                {reportData.kaminCAL.number_of_replications > 0 ? reportData.kaminCAL.number_of_replications : 'N/A'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-medium">Instrument:</td>
                                            <td className="border border-gray-400 p-3">
                                                {reportData.kaminCAL.analytical_instrument}
                                            </td>
                                            <td className="border border-gray-400 p-3 font-medium">Curcuminoid %:</td>
                                            <td className="border border-gray-400 p-3 font-bold">
                                                {reportData.kaminCAL.curcuminoid_percentage > 0 ? `${reportData.kaminCAL.curcuminoid_percentage}%` : 'N/A'}
                                            </td>
                                        </tr>
                                    </>
                                )}

                            {/* Time Measurements - แสดงเฉพาะเมื่อมีข้อมูล time measurements */}
                            {(reportData.kaminCAL.first_time > 0 ||
                                reportData.kaminCAL.second_time > 0 ||
                                reportData.kaminCAL.third_time > 0) && (
                                    <>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-semibold bg-gray-100" colSpan={4}>
                                                Time Measurements
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-400 p-3 font-medium">Measurement</td>
                                            <td className="border border-gray-400 p-3 font-medium">First Time</td>
                                            <td className="border border-gray-400 p-3 font-medium">Second Time</td>
                                            <td className="border border-gray-400 p-3 font-medium">Third Time</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-400 p-3">Values (mg/mL)</td>
                                            <td className="border border-gray-400 p-3 text-center">
                                                {reportData.kaminCAL.first_time > 0 ? reportData.kaminCAL.first_time : 'N/A'}
                                            </td>
                                            <td className="border border-gray-400 p-3 text-center">
                                                {reportData.kaminCAL.second_time > 0 ? reportData.kaminCAL.second_time : 'N/A'}
                                            </td>
                                            <td className="border border-gray-400 p-3 text-center">
                                                {reportData.kaminCAL.third_time > 0 ? reportData.kaminCAL.third_time : 'N/A'}
                                            </td>
                                        </tr>
                                    </>
                                )}

                            {/* Content Status - แสดงเสมอถ้ามี KaminCAL data */}
                            <tr>
                                <td className="border border-gray-400 p-3 font-medium">Content Status</td>
                                <td className={`border border-gray-400 p-3 text-center font-medium ${reportData.kaminCAL.curcuminoid_content === 'Pass'
                                    ? 'print-result-pass bg-green-100 text-green-800'
                                    : 'print-result-fail bg-red-100 text-red-800'
                                    }`} colSpan={3}>
                                    {reportData.kaminCAL.curcuminoid_content}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Test Result File Section - ใช้รูปแบบตารางเหมือนส่วนอื่นๆ */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-400 print-table">
                    <thead>
                        <tr>
                            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                                <div className="flex items-center justify-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Test Result File
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-6">
                                <ResultFileDisplay resultImage={reportData.resultImage} />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Inspector Notes (if available) */}
            {reportData.inspectorNotes && (
                <div className="mb-8">
                    <table className="w-full border-collapse border border-gray-400 print-table">
                        <thead>
                            <tr>
                                <th className="border border-gray-400 p-3 bg-yellow-50 font-bold">
                                    Inspector Notes
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-400 p-4">
                                    {reportData.inspectorNotes}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Final Result */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-400 print-table">
                    <thead>
                        <tr>
                            <th className={`border border-gray-400 p-4 font-bold text-center text-xl ${testResult === 'PASSED'
                                ? 'print-result-pass bg-green-100 text-green-800'
                                : 'print-result-fail bg-red-100 text-red-800'
                                }`}>
                                FINAL RESULT
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-8 text-center">
                                <h2 className={`text-3xl font-bold mb-4 ${testResult === 'PASSED' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {testResult}
                                </h2>
                                <p className="text-lg text-gray-700 mb-4">
                                    {testResult === 'PASSED'
                                        ? 'This batch meets all quality standards for turmeric.'
                                        : 'This batch does not meet the required quality standards.'}
                                </p>

                                {/* Test Details */}
                                <div className="bg-gray-50 rounded-lg p-4 mt-4 text-left">
                                    <h3 className="text-sm font-semibold mb-3 text-center">Test Summary:</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Testing Method:</span>
                                            <span className="ml-2">{reportData.testingMethod}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Test Date:</span>
                                            <span className="ml-2">{reportData.testDate ? new Date(reportData.testDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Batch ID:</span>
                                            <span className="ml-2">{reportData.batchId}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Farm:</span>
                                            <span className="ml-2">{reportData.farmName}</span>
                                        </div>
                                    </div>

                                    {/* Quality Parameters */}
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <h4 className="text-xs font-semibold mb-2">Quality Assessment:</h4>
                                        <div className="grid grid-cols-1 gap-2 text-xs">
                                            {reportData.curcuminQuality && (
                                                <div className="flex justify-between">
                                                    <span>Curcuminoid Content:</span>
                                                    <span className={`font-medium ${reportData.curcuminQuality >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {reportData.curcuminQuality}% ({reportData.curcuminQuality >= 3 ? 'PASS' : 'FAIL'})
                                                    </span>
                                                </div>
                                            )}
                                            {reportData.moistureQuality && (
                                                <div className="flex justify-between">
                                                    <span>Moisture Content:</span>
                                                    <span className={`font-medium ${reportData.moistureQuality <= 15 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {reportData.moistureQuality}% ({reportData.moistureQuality <= 15 ? 'PASS' : 'FAIL'})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Signatures */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-400 print-table">
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-8 text-center w-1/2">
                                <div className="h-16 mb-4 border-b border-gray-400"></div>
                                <p className="font-medium">Inspector</p>
                                <p className="text-sm">{reportData.analystName || '(........................)'}</p>
                            </td>
                            <td className="border border-gray-400 p-8 text-center w-1/2">
                                <div className="h-16 mb-4 border-b border-gray-400"></div>
                                <p className="font-medium">Authorized by</p>
                                <p className="text-sm">{reportData.reviewerName || '(........................)'}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600 print-footer">
                <p>This report was generated by TurmeRic Laboratory Analysis System.</p>
                {/* <p className="mt-1">Report ID: {recordId} | Generated: {new Date().toLocaleString()}</p> */}
            </div>
        </div>
    );

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
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
                            onClick={handleDownload}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Download size={16} />
                            Download PDF
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="flex items-center gap-2"
                        >
                            <Printer size={16} />
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

                {/* Main content */}
                <main className={`${isPrintMode ? 'print-container' : 'p-6 max-w-6xl mx-auto'}`}>
                    {reportContent}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}