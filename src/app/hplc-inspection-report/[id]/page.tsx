'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, FileText } from "lucide-react";

interface ReportData {
  id: string;
  batchId: string;
  farmName: string;
  reportNumber: string;
  reportDate: string;
  requestNumber: string;
  sampleReceiver: string;
  contactInfo: string;
  receiveDate: string;
  testStartDate: string;
  sampleId: string;
  sampleName: string;
  scientificName: string;
  sampleCode: string;
  sampleType: string;
  quantity: string;
  weight: string;
  temperature: string;
  bdmcResult: string;
  dmcResult: string;
  curResult: string;
  totalCurcuminoids: string;
  methodReference: string;
  methodDetails: string;
  analystName: string;
  reviewerName: string;
  laboratory: string;
  laboratoryAddress: string;
  laboratoryPhone: string;
  moistureQuantity?: string;
  qualityAssessment?: string;
  certificateNumber?: string;
  // เพิ่มข้อมูลจากโค้ดเดิม
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

const MPICLogo = () => (
  <div className="flex items-center justify-center mb-4">
    <div className="flex flex-col items-center">
      <div className="w-30 h-30 rounded-full flex items-center justify-center mb-8">
        <img src="/MFU.png" alt="TurmeRic Logo" className="w-full h-full object-contain" />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-800">
          ศูนย์นวัตกรรมยาสมุนไพรภาคเหนือ
        </div>
        <div className="text-xs text-gray-600">
          มหาวิทยาลัยแม่ฟ้าหลวง
        </div>
      </div>
    </div>
  </div>
);

export default function QualityInspectionReportPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [role, setRole] = useState<string | 'loading'>('loading');

  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  // ตรวจสอบ Role
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setRole(userRole || '');
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Fetching Report Data ===');
      console.log('Record ID:', recordId);
      console.log('User Role:', role);

      // ดึงข้อมูล record โดยตรงก่อน
      const recordUrl = `https://api-freeroll-production.up.railway.app/api/lab-submission-records/${recordId}?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&populate[Report][populate]=*`;

      const recordRes = await fetch(recordUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!recordRes.ok) {
        console.log('🔄 Direct fetch failed, trying alternative approach...');

        // Alternative: ดึงข้อมูลทั้งหมดแล้วค้นหา
        const allRecordsUrl = `https://api-freeroll-production.up.railway.app/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&populate[Report][populate]=*`;

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

            // สำหรับ Farmer ต้องตรวจสอบสิทธิ์เข้าถึง
            if (role === 'Farmer') {
              const farmRes = await fetch(`https://api-freeroll-production.up.railway.app/api/farms?documentId=${localStorage.getItem("userId")}`, {
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
            }

            processRecordData(targetRecord);
            return;
          }
        }

        throw new Error(`Record with ID ${recordId} not found or not accessible`);
      }

      const recordResponse = await recordRes.json();
      const record = recordResponse.data;

      console.log('Record data:', record);

      // สำหรับ Farmer ต้องตรวจสอบสิทธิ์เข้าถึง
      if (role === 'Farmer') {
        const farmRes = await fetch(`https://api-freeroll-production.up.railway.app/api/farms?documentId=${localStorage.getItem("userId")}`, {
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
        const recordFarmId = record.attributes?.batch?.data?.attributes?.Farm?.data?.documentId;
        if (userFarmId && recordFarmId && recordFarmId !== userFarmId) {
          throw new Error('This record does not belong to your farm');
        }
      }

      processRecordData(record);

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(`Error loading report: ${err instanceof Error ? err.message : String(err)}`);
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
        return `https://api-freeroll-production.up.railway.app${validUrl}`;
      }
    }

    return null;
  };

  const processRecordData = (record: any) => {
    console.log('🔄 Processing record data:', record);

    const attrs = record.attributes || record;

    // Extract batch and farm info
    let batchId = 'N/A';
    let farmName = 'Unknown Farm';
    let yield_amount = 0;
    let yield_unit = 'kg';
    let harvest_date = '';

    // Process batch and farm data - ใช้วิธีเดียวกับโค้ดเดิม
    if (attrs?.batch?.data?.attributes) {
      const batchData = attrs.batch.data.attributes;
      batchId = batchData?.Batch_id || batchData?.batch_id || batchData?.Batch_Id || `Batch-${record.id}`;

      if (batchData?.Farm?.data?.attributes) {
        const farmData = batchData.Farm.data.attributes;
        farmName = farmData?.Farm_Name || farmData?.farm_name || farmData?.Farm_name || 'Unknown Farm';
      }
    } else if (attrs?.batch?.data) {
      const batchData = attrs.batch.data;
      batchId = batchData?.Batch_id || batchData?.batch_id || batchData?.Batch_Id || batchData?.attributes?.Batch_id || `Batch-${record.id}`;

      if (batchData?.Farm?.data?.attributes) {
        const farmData = batchData.Farm.data.attributes;
        farmName = farmData?.Farm_Name || farmData?.farm_name || farmData?.Farm_name || 'Unknown Farm';
      }
    } else if (attrs?.batch) {
      const batchData = attrs.batch;
      batchId = batchData?.Batch_id || batchData?.batch_id || batchData?.Batch_Id || `Batch-${record.id}`;

      if (batchData?.Farm?.Farm_Name) {
        farmName = batchData.Farm.Farm_Name;
      }
    }

    // Process harvest record - ใช้วิธีเดียวกับโค้ดเดิม
    if (attrs?.harvest_record?.data?.attributes) {
      const harvestData = attrs.harvest_record.data.attributes;
      yield_amount = parseFloat(harvestData?.yleld) || parseFloat(harvestData?.yield) || parseFloat(harvestData?.Yield) || 0;
      yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || harvestData?.Yield_unit || 'kg';
      harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.date || '';
    } else if (attrs?.harvest_record?.data) {
      const harvestData = attrs.harvest_record.data;
      yield_amount = parseFloat(harvestData?.yleld) || parseFloat(harvestData?.yield) || parseFloat(harvestData?.Yield) || 0;
      yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || harvestData?.Yield_unit || 'kg';
      harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.date || harvestData?.attributes?.Date || '';
    } else if (attrs?.harvest_record) {
      const harvestData = attrs.harvest_record;
      yield_amount = parseFloat(harvestData?.yleld) || parseFloat(harvestData?.yield) || parseFloat(harvestData?.Yield) || 0;
      yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || harvestData?.Yield_unit || 'kg';
      harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.date || '';
    }

    // Process result image - ใช้วิธีเดียวกับโค้ดเดิม
    let resultImage = undefined;
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

    // Process the data for the report
    const processedData: ReportData = {
      id: record.id,
      batchId: batchId,
      farmName: farmName,
      reportNumber: attrs?.hplc_report_code || '',
      reportDate: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      requestNumber: attrs?.hplc_testing_no || '',
      sampleReceiver: attrs?.hplc_analyst_name,
      contactInfo: 'สวนพฤกษศาสตร์ มหาวิทยาลัยแม่ฟ้าหลวง\nเลขที่ 333 หมู่ 1 ต.ท่าสุด อ.เมือง\nจ.เชียงราย 57100 โทร 0-5391-7034',
      receiveDate: attrs?.Date ? new Date(attrs.Date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',
      testStartDate: attrs?.test_date ? new Date(attrs.test_date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',
      sampleId: attrs?.hplc_sample_code || 'MPIC-TS25-597',
      sampleName: attrs?.hplc_sample_name || 'ขมิ้นชัน',
      scientificName: attrs?.hplc_scientific_name || 'Curcuma longa L.',
      sampleCode: attrs?.hplc_sample_preparation || 'T68-AJL-01',
      sampleType: attrs?.hplc_sample_condition || 'ผง/แห้ง',
      quantity: attrs?.hplc_quantity || '1 ถุง',
      weight: attrs?.hplc_sample_amount || '10 กรัม',
      temperature: attrs?.hplc_temperature || 'อุณหภูมิห้อง, สภาพปกติ',
      bdmcResult: attrs?.hplc_bdmc_result || '12.3 ± 1.8',
      dmcResult: attrs?.hplc_dmc_result || '10.4 ± 3.5',
      curResult: attrs?.hplc_cur_result || '27.2 ± 8.4',
      totalCurcuminoids: attrs?.hplc_total_curcuminoids || '49.9',
      methodReference: attrs?.hplc_method_reference || 'In-house Method: WI 702 – 204.01 based on Journal AOAC International',
      methodDetails: attrs?.hplc_method_details || 'Vol.101, No.4, 2018, pages 1232 – 1234',
      analystName: attrs?.hplc_analyst_name || '',
      reviewerName: attrs?.hplc_reviewer_name || '',
      laboratory: attrs?.hplc_laboratory || 'ศูนย์นวัตกรรมยาสมุนไพรภาคเหนือ มหาวิทยาลัยแม่ฟ้าหลวง',
      laboratoryAddress: attrs?.hplc_laboratory_address || '333 หมู่ 1 ต.ท่าสุด อ.เมือง จ.เชียงราย 57100',
      laboratoryPhone: attrs?.hplc_laboratory_phone || 'โทรศัพท์ 053917416',
      moistureQuantity: attrs?.hplc_moisture_quantity || '',
      qualityAssessment: attrs?.hplc_quality_assessment || '',
      certificateNumber: attrs?.hplc_certificate_number || '',
      // เพิ่มข้อมูลจากโค้ดเดิม
      dateReceived: attrs?.Date || attrs?.date || attrs?.createdAt || '',
      harvestDate: harvest_date,
      qualityGrade: attrs?.Quality_grade || attrs?.quality_grade || 'Not Graded',
      yield: yield_amount,
      yieldUnit: yield_unit,
      status: attrs?.Submission_status || attrs?.submission_status || 'Draft',
      curcuminQuality: parseFloat(attrs?.curcumin_quality) || undefined,
      moistureQuality: parseFloat(attrs?.moisture_quality) || undefined,
      testDate: attrs?.test_date || attrs?.testDate || attrs?.createdAt || '',
      testingMethod: attrs?.testing_method || attrs?.testingMethod || 'HPLC',
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
    setReportData(processedData);
  };

  useEffect(() => {
    if (role === 'loading') return;

    if (recordId) {
      fetchReportData();
    }
  }, [recordId, role]);

  const determineTestResultEnhanced = (reportData: ReportData): { status: 'PASSED' | 'FAILED'; details: string[] } => {
    console.log('🔍 === REPORT QUALITY ASSESSMENT ===');
    console.log('Report Data for Assessment:', {
      batchId: reportData.batchId,
      testingMethod: reportData.testingMethod,
      curcuminQuality: reportData.curcuminQuality,
      moistureQuality: reportData.moistureQuality,
      totalCurcuminoids: reportData.totalCurcuminoids,
      moistureQuantity: reportData.moistureQuantity
    });

    const curcuminThreshold = 3.0; // minimum 3% curcumin
    const moistureThreshold = 15.0; // maximum 15% moisture

    let curcuminValue: number | null = null;
    let moistureValue: number | null = null;
    const details: string[] = [];

    // ✅ ตรวจสอบตาม testing method
    if (reportData.testingMethod === 'HPLC') {
      console.log('📊 Using HPLC assessment...');

      // สำหรับ HPLC ใช้ total curcuminoids แปลงจาก mg/g เป็น %
      if (reportData.totalCurcuminoids) {
        curcuminValue = parseFloat(reportData.totalCurcuminoids) / 10; // mg/g to %
        console.log(`HPLC Curcumin: ${reportData.totalCurcuminoids} mg/g → ${curcuminValue}%`);
        details.push(`Total Curcuminoids: ${reportData.totalCurcuminoids} mg/g (${curcuminValue.toFixed(1)}%)`);
      }

      if (reportData.moistureQuantity) {
        moistureValue = parseFloat(reportData.moistureQuantity);
        console.log(`HPLC Moisture: ${moistureValue}%`);
        details.push(`Moisture: ${moistureValue}%`);
      }
    } else {
      console.log('📊 Using standard (NIR/UV-Vis) assessment...');

      // สำหรับ NIR/UV-Vis ใช้ข้อมูลเดิม
      curcuminValue = reportData.curcuminQuality || null;
      moistureValue = reportData.moistureQuality || null;

      if (curcuminValue) {
        console.log(`Standard Curcumin: ${curcuminValue}%`);
        details.push(`Curcumin: ${curcuminValue}%`);
      }

      if (moistureValue) {
        console.log(`Standard Moisture: ${moistureValue}%`);
        details.push(`Moisture: ${moistureValue}%`);
      }
    }

    // ✅ ตรวจสอบเกณฑ์
    console.log('=== CRITERIA CHECK ===');
    console.log(`Curcumin threshold: ≥ ${curcuminThreshold}%`);
    console.log(`Moisture threshold: ≤ ${moistureThreshold}%`);

    let curcuminPass = true;
    let moisturePass = true;

    if (curcuminValue !== null) {
      curcuminPass = curcuminValue >= curcuminThreshold;
      console.log(`Curcumin: ${curcuminValue}% ${curcuminPass ? '≥' : '<'} ${curcuminThreshold}% = ${curcuminPass ? 'PASS' : 'FAIL'}`);
      details.push(`Curcumin requirement (≥${curcuminThreshold}%): ${curcuminPass ? 'PASSED' : 'FAILED'}`);
    } else {
      console.log('Curcumin: No data available = PASS (default)');
      details.push('Curcumin: No data available');
    }

    if (moistureValue !== null) {
      moisturePass = moistureValue <= moistureThreshold;
      console.log(`Moisture: ${moistureValue}% ${moisturePass ? '≤' : '>'} ${moistureThreshold}% = ${moisturePass ? 'PASS' : 'FAIL'}`);
      details.push(`Moisture requirement (≤${moistureThreshold}%): ${moisturePass ? 'PASSED' : 'FAILED'}`);
    } else {
      console.log('Moisture: No data available = PASS (default)');
      details.push('Moisture: No data available');
    }

    const finalStatus = curcuminPass && moisturePass ? 'PASSED' : 'FAILED';

    console.log('=== FINAL RESULT ===');
    console.log(`Curcumin: ${curcuminPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Moisture: ${moisturePass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`OVERALL: ${finalStatus}`);
    console.log('========================\n');

    return { status: finalStatus, details };
  };

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
          <header className="flex h-16 items-center gap-2 px-4 border-b bg-white">
            <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
            <h1 className="text-2xl font-semibold">Quality Inspection Report</h1>
          </header>
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading report...</p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 px-4 border-b bg-white">
            <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
            <h1 className="text-2xl font-semibold">Quality Inspection Report</h1>
          </header>
          <main className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!reportData) {
    return (
      <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <main className="p-6">
            <div className="text-center">
              <p className="text-gray-600">No report data found</p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const reportContent = (<div className="max-w-4xl mx-auto bg-white">
    {/* Enhanced Print Styles */}
    <style jsx global>{`
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          font-size: 12pt !important;
          line-height: 1.4 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        @page {
          margin: 0.75in !important;
          size: A4 !important;
        }
        
        .print\\:hidden {
          display: none !important;
        }
        
        /* Main container */
        .print-container {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        
        /* Header section */
        .print-header {
          text-align: center !important;
          margin-bottom: 20px !important;
          page-break-inside: avoid !important;
        }
        
        .print-header img {
          max-width: 80px !important;
          height: auto !important;
        }
        
        .print-header h1 {
          font-size: 16pt !important;
          font-weight: bold !important;
          margin: 10px 0 !important;
          line-height: 1.2 !important;
        }
        
        .print-header p {
          font-size: 14pt !important;
          margin: 5px 0 !important;
        }
        
        /* Table styles */
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-bottom: 16px !important;
          page-break-inside: auto !important;
        }
        
        .print-table td, 
        .print-table th {
          border: 1px solid #333 !important;
          padding: 8px 6px !important;
          text-align: left !important;
          font-size: 11pt !important;
          line-height: 1.3 !important;
          vertical-align: top !important;
        }
        
        .print-table th {
          background-color: #f0f0f0 !important;
          font-weight: bold !important;
          font-size: 12pt !important;
        }
        
        .print-table .bg-gray-50 {
          background-color: #f8f8f8 !important;
        }
        
        .print-table .bg-blue-50 {
          background-color: #e6f3ff !important;
        }
        
        .print-table .bg-green-50 {
          background-color: #e6ffe6 !important;
        }
        
        .print-table .bg-purple-50 {
          background-color: #f0e6ff !important;
        }
        
        .print-table .bg-yellow-50 {
          background-color: #fffbe6 !important;
        }
        
        /* Result status styles */
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
        
        /* Specific section breaks */
        .print-section {
          page-break-inside: avoid !important;
          margin-bottom: 16px !important;
        }
        
        .print-section-title {
          font-size: 13pt !important;
          font-weight: bold !important;
          margin-bottom: 8px !important;
        }
        
        /* Final result section */
        .print-final-result {
          page-break-before: auto !important;
          page-break-inside: avoid !important;
          margin: 20px 0 !important;
        }
        
        .print-final-result h2 {
          font-size: 18pt !important;
          margin: 10px 0 !important;
        }
        
        /* Test result file section */
        .print-file-section {
          page-break-inside: avoid !important;
          text-align: center !important;
        }
        
        .print-file-section img {
          max-width: 400px !important;
          max-height: 300px !important;
          object-fit: contain !important;
        }
        
        /* Signatures section */
        .print-signatures {
          page-break-inside: avoid !important;
          margin-top: 30px !important;
        }
        
        .print-signature-line {
          border-bottom: 1px solid #333 !important;
          height: 60px !important;
          margin-bottom: 10px !important;
        }
        
        /* Footer */
        .print-footer {
          margin-top: 20px !important;
          text-align: center !important;
          font-size: 10pt !important;
          border-top: 1px solid #ddd !important;
          padding-top: 10px !important;
        }
        
        /* Whitespace preservation */
        .whitespace-pre-line {
          white-space: pre-line !important;
        }
        
        /* Force page breaks where needed */
        .page-break-before {
          page-break-before: always !important;
        }
        
        .page-break-after {
          page-break-after: always !important;
        }
        
        /* Prevent orphans and widows */
        p, td, th {
          orphans: 2 !important;
          widows: 2 !important;
        }
        
        /* List styles */
        ul {
          margin: 8px 0 !important;
          padding-left: 20px !important;
        }
        
        li {
          margin: 4px 0 !important;
          line-height: 1.3 !important;
        }
        
        /* Text alignment helpers */
        .text-center {
          text-align: center !important;
        }
        
        .text-left {
          text-align: left !important;
        }
        
        .font-bold {
          font-weight: bold !important;
        }
        
        .italic {
          font-style: italic !important;
        }
        
        /* Color preservation for important elements */
        .text-green-600 {
          color: #16a34a !important;
        }
        
        .text-red-600 {
          color: #dc2626 !important;
        }
        
        .text-green-800 {
          color: #166534 !important;
        }
        
        .text-red-800 {
          color: #991b1b !important;
        }
        
        .bg-green-100 {
          background-color: #dcfce7 !important;
        }
        
        .bg-red-100 {
          background-color: #fee2e2 !important;
        }
      }
    `}</style>
    {/* Header - เพิ่ม class สำหรับ print */}
    <div className="text-center mb-8 print-header print-section">
      <MPICLogo />
      <h1 className="text-xl font-bold mb-2">
        รายงานผลการวิเคราะห์ปริมาณสารเคอร์คูมินอยด์ ด้วย HPLC
      </h1>
      <p className="text-lg font-semibold">
        เลขที่รับเรื่อง {reportData.requestNumber}
      </p>
    </div>

    {/* Report Information Table */}
    <div className="mb-8 print-section">
      <table className="w-full border-collapse border border-gray-400 print-table">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50 w-1/3">
              เลขที่รายงานผล
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              {reportData.reportNumber}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              วันที่ออกรายงานผล
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              {reportData.reportDate}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              ชื่อผู้ส่งตัวอย่าง
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              {reportData.sampleReceiver}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              ข้อมูลติดต่อผู้ส่งตัวอย่าง
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              <div className="whitespace-pre-line">{reportData.contactInfo}</div>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              วันที่รับตัวอย่าง
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              {reportData.receiveDate}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              วันที่เริ่มทดสอบ
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              {reportData.testStartDate}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Sample Information Table */}
    <div className="mb-8 print-section">
      <table className="w-full border-collapse border border-gray-400 print-table">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50 w-1/3">
              ข้อมูลตัวอย่างทดสอบ
            </td>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50 w-1/4">
              รหัสตัวอย่างวิเคราะห์
            </td>
            <td className="border border-gray-400 p-3 font-bold">
              {reportData.sampleId}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              ชื่อตัวอย่าง
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              {reportData.sampleName}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              ชื่อวิทยาศาสตร์ / ชื่อวงศ์ (ถ้ามี)
            </td>
            <td className="border border-gray-400 p-3 italic" colSpan={2}>
              {reportData.scientificName}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              รหัสวัตถุดิบ/ตัวอย่าง
            </td>
            <td className="border border-gray-400 p-3" colSpan={2}>
              ตัวอย่างที่ 1<br />({reportData.sampleCode})
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50" rowSpan={2}>
              ลักษณะและสภาพตัวอย่าง
            </td>
            <td className="border border-gray-400 p-3">
              ประเภทตัวอย่าง: {reportData.sampleType}
            </td>
            <td className="border border-gray-400 p-3">
              จำนวน: {reportData.quantity}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3">
              น้ำหนัก/ปริมาณ: {reportData.weight}
            </td>
            <td className="border border-gray-400 p-3">
              อุณหภูมิขณะรับ: {reportData.temperature}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Test Results Table */}
    <div className="mb-8 print-section">
      <table className="w-full border-collapse border border-gray-400 print-table">
        <thead>
          <tr>
            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
              รายการทดสอบ
            </th>
            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
              ผลการทดสอบ
            </th>
            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
              หน่วย
            </th>
            <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
              วิธีทดสอบอ้างอิง
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 font-bold" colSpan={4}>
              Curcuminoids
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3">
              Bisdemethoxycurcumin (BDMC)
            </td>
            <td className="border border-gray-400 p-3 text-center">
              {reportData.bdmcResult}
            </td>
            <td className="border border-gray-400 p-3 text-center">mg/g</td>
            <td className="border border-gray-400 p-3" rowSpan={4}>
              {reportData.methodReference}<br />
              {reportData.methodDetails}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3">
              Desmethoxycurcumin (DMC)
            </td>
            <td className="border border-gray-400 p-3 text-center">
              {reportData.dmcResult}
            </td>
            <td className="border border-gray-400 p-3 text-center">mg/g</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3">
              Curcumin (CUR)
            </td>
            <td className="border border-gray-400 p-3 text-center">
              {reportData.curResult}
            </td>
            <td className="border border-gray-400 p-3 text-center">mg/g</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-bold">
              Total Curcuminoids
            </td>
            <td className="border border-gray-400 p-3 text-center font-bold">
              {reportData.totalCurcuminoids}*
            </td>
            <td className="border border-gray-400 p-3 text-center">mg/g</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Additional Information - Batch & Farm Details */}
    <div className="mb-8 print-section">
      <table className="w-full border-collapse border border-gray-400 print-table">
        <thead>
          <tr>
            <th className="border border-gray-400 p-3 bg-blue-50 font-bold" colSpan={4}>
              ข้อมูลเพิ่มเติม - รายละเอียดแบทช์และฟาร์ม
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              Batch ID
            </td>
            <td className="border border-gray-400 p-3">
              {reportData.batchId}
            </td>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              ฟาร์ม
            </td>
            <td className="border border-gray-400 p-3">
              {reportData.farmName}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              คุณภาพ
            </td>
            <td className="border border-gray-400 p-3">
              {reportData.qualityGrade}
            </td>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              ผลผลิต
            </td>
            <td className="border border-gray-400 p-3">
              {reportData.yield > 0 ? `${reportData.yield} ${reportData.yieldUnit}` : 'N/A'}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              วันที่เก็บเกี่ยว
            </td>
            <td className="border border-gray-400 p-3">
              {reportData.harvestDate ? new Date(reportData.harvestDate).toLocaleDateString('th-TH') : 'N/A'}
            </td>
            <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
              สถานะการส่งตัวอย่าง
            </td>
            <td className="border border-gray-400 p-3">
              {reportData.status}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Standard Test Results (if available) */}
    {(reportData.curcuminQuality || reportData.moistureQuality) && (
      <div className="mb-8 print-section">
        <table className="w-full border-collapse border border-gray-400 print-table">
          <thead>
            <tr>
              <th className="border border-gray-400 p-3 bg-green-50 font-bold" colSpan={4}>
                ผลการทดสอบมาตรฐาน (NIR/UV-Vis)
              </th>
            </tr>
            <tr>
              <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                พารามิเตอร์การทดสอบ
              </th>
              <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                ผลการทดสอบ
              </th>
              <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                เกณฑ์มาตรฐาน
              </th>
              <th className="border border-gray-400 p-3 bg-gray-50 font-bold">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody>
            {reportData.curcuminQuality && (
              <tr>
                <td className="border border-gray-400 p-3">
                  ปริมาณเคอร์คูมินอยด์ (วิธีมาตรฐาน)
                </td>
                <td className="border border-gray-400 p-3 text-center">
                  {reportData.curcuminQuality}%
                </td>
                <td className="border border-gray-400 p-3 text-center">
                  ≥ 3.0%
                </td>
                <td className="border border-gray-400 p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${reportData.curcuminQuality >= 3 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {reportData.curcuminQuality >= 3 ? 'ผ่าน' : 'ไม่ผ่าน'}
                  </span>
                </td>
              </tr>
            )}
            {reportData.moistureQuality && (
              <tr>
                <td className="border border-gray-400 p-3">
                  ปริมาณความชื้น
                </td>
                <td className="border border-gray-400 p-3 text-center">
                  {reportData.moistureQuality}%
                </td>
                <td className="border border-gray-400 p-3 text-center">
                  ≤ 15.0%
                </td>
                <td className="border border-gray-400 p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${reportData.moistureQuality <= 15 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {reportData.moistureQuality <= 15 ? 'ผ่าน' : 'ไม่ผ่าน'}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {/* KaminCAL Analysis (if available) */}
    {reportData.kaminCAL && (reportData.kaminCAL.sample_name || reportData.kaminCAL.plant_weight > 0) && (
      <div className="mb-8 print-section">
        <table className="w-full border-collapse border border-gray-400 print-table">
          <thead>
            <tr>
              <th className="border border-gray-400 p-3 bg-purple-50 font-bold" colSpan={4}>
                การวิเคราะห์ KaminCAL
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                ชื่อตัวอย่าง
              </td>
              <td className="border border-gray-400 p-3">
                {reportData.kaminCAL.sample_name || 'N/A'}
              </td>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                น้ำหนักพืช
              </td>
              <td className="border border-gray-400 p-3">
                {reportData.kaminCAL.plant_weight > 0 ? `${reportData.kaminCAL.plant_weight} mg` : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                ปริมาตรตัวทำละลาย
              </td>
              <td className="border border-gray-400 p-3">
                {reportData.kaminCAL.solvent_volume > 0 ? `${reportData.kaminCAL.solvent_volume} mL` : 'N/A'}
              </td>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                ค่า OD เฉลี่ย
              </td>
              <td className="border border-gray-400 p-3">
                {reportData.kaminCAL.average_od > 0 ? reportData.kaminCAL.average_od : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                ความเข้มข้น
              </td>
              <td className="border border-gray-400 p-3">
                {reportData.kaminCAL.concentration > 0 ? `${reportData.kaminCAL.concentration} mg/mL` : 'N/A'}
              </td>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                จำนวนครั้งที่ทำซ้ำ
              </td>
              <td className="border border-gray-400 p-3">
                {reportData.kaminCAL.number_of_replications > 0 ? reportData.kaminCAL.number_of_replications : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                เครื่องมือวิเคราะห์
              </td>
              <td className="border border-gray-400 p-3">
                {reportData.kaminCAL.analytical_instrument}
              </td>
              <td className="border border-gray-400 p-3 font-semibold bg-gray-50">
                เปอร์เซ็นต์เคอร์คูมินอยด์
              </td>
              <td className="border border-gray-400 p-3 font-bold">
                {reportData.kaminCAL.curcuminoid_percentage > 0 ? `${reportData.kaminCAL.curcuminoid_percentage}%` : 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Inspector Notes (if available) */}
   {reportData.inspectorNotes && (
      <div className="mb-8 print-section">
        <table className="w-full border-collapse border border-gray-400 print-table">
          <thead>
            <tr>
              <th className="border border-gray-400 p-3 bg-yellow-50 font-bold">
                หมายเหตุจากผู้ตรวจสอบ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-3">
                {reportData.inspectorNotes}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Final Result Summary */}
     <div className="mb-8 print-final-result print-section">
      {(() => {
        // ✅ ใช้ enhanced assessment function
        const assessmentResult = determineTestResultEnhanced(reportData);
        const status = assessmentResult.status;
        const details = assessmentResult.details;

        return (
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className={`border border-gray-400 p-3 font-bold text-center ${status === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  สรุปผลการทดสอบ
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-6 text-center">
                  <div className="mb-4">
                    <h2 className={`text-2xl font-bold ${status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                      {status === 'PASSED' ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    {status === 'PASSED'
                      ? 'ตัวอย่างขมิ้นชันนี้ผ่านเกณฑ์มาตรฐานคุณภาพทุกด้าน'
                      : 'ตัวอย่างขมิ้นชันนี้ไม่ผ่านเกณฑ์มาตรฐานคุณภาพที่กำหนด'}
                  </p>

                  {/* ✅ เพิ่มรายละเอียดการประเมิน */}
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <h3 className="text-sm font-semibold mb-2">รายละเอียดการประเมิน:</h3>
                    <ul className="text-xs text-left space-y-1">
                      {details.map((detail, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 text-xs text-gray-600">
                    <p>วิธีการทดสอบ: {reportData.testingMethod}</p>
                    <p>วันที่ทดสอบ: {reportData.testDate ? new Date(reportData.testDate).toLocaleDateString('th-TH') : 'N/A'}</p>
                    <p>Batch ID: {reportData.batchId}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        );
      })()}
    </div>

    {/* Note */}
    <div className="mb-8">
      <p className="text-sm">
        <strong>หมายเหตุ:</strong> *สามารถเปลี่ยนหน่วยเป็น %w/w เมื่อนำผลการทดสอบดังกล่าวหารด้วย 10,
        ที่ระดับความเชื่อมั่น 95% k = 2
      </p>
    </div>

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

    {/* Signatures Section */}
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div className="text-center">
        <div className="border-b border-gray-400 mb-2 h-16"></div>
        <p className="text-sm">ผู้วิเคราะห์</p>
        <p className="text-sm">{reportData.analystName || '(........................)'}</p>
      </div>
      <div className="text-center">
        <div className="border-b border-gray-400 mb-2 h-16"></div>
        <p className="text-sm">ผู้ตรวจสอบ</p>
        <p className="text-sm">{reportData.reviewerName || '(........................)'}</p>
      </div>
    </div>

    {/* Laboratory Information */}
    <div className="text-center text-sm text-gray-600 border-t pt-4">
      <p className="font-semibold">{reportData.laboratory}</p>
      <p>{reportData.laboratoryAddress}</p>
      <p>{reportData.laboratoryPhone}</p>
    </div>

    {/* End of Report */}
    <div className="text-center mt-8">
      <p className="text-sm font-semibold">-สิ้นสุดการรายงาน-</p>
    </div>
  </div>
  );

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        {!isPrintMode && (
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
            </div>
          </header>
        )}

        <main className={`${isPrintMode ? 'p-8' : 'p-6'} print:p-8`}>
          <style jsx global>{`
            @media print {
              body { margin: 0; }
              .print\\:hidden { display: none !important; }
              .print\\:p-8 { padding: 2rem !important; }
              @page { 
                margin: 1cm; 
                size: A4;
              }
            }
          `}</style>
          {reportContent}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}