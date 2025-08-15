'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Save, ArrowLeft, X, ImageIcon, Table, FileText, FlaskConical, LucideMicroscope, Notebook, SquarePen, LucidePackage, LucideNotebook } from "lucide-react";

interface InspectionRecord {
  id: string;
  batch_id: string;
  farm_name: string;
  Date: string;
  Quality_grade: string;
  Submission_status: string;
  yield: number;
  yield_unit: string;
  curcumin_quality?: number;
  moisture_quality?: number;
  test_date?: string;
  inspector_notes?: string;
  harvest_date?: string;
  result_image?: {
    id: number;
    url: string;
    name: string;
    [key: string]: any;
  };
}

interface FilePreview {
  type: 'image' | 'csv' | 'excel';
  content?: string | any[][];
  name: string;
  size: number;
}

const generateReportNumber = async () => {
  try {
    console.log('🔢 Generating report number...');
    const currentYear = new Date().getFullYear();

    // ดึงข้อมูล Lab ID ก่อน
    const labRes = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (!labRes.ok) {
      throw new Error('Cannot get lab information');
    }

    const labData = await labRes.json();
    const labId = labData.data[0]?.documentId;

    if (!labId) {
      throw new Error('Lab ID not found');
    }

    // ดึงจำนวน reports ที่มีอยู่ในปีปัจจุบันสำหรับ lab นี้
    const reportsCountUrl = `http://localhost:1337/api/lab-submission-records?filters[lab][documentId][$eq]=${labId}&filters[hplc_report_code][$startsWith]=RP ${currentYear}-&pagination[pageSize]=1000`;

    console.log('📊 Fetching existing reports:', reportsCountUrl);

    const reportsRes = await fetch(reportsCountUrl, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (reportsRes.ok) {
      const reportsData = await reportsRes.json();
      console.log('📋 Existing reports data:', reportsData);

      // นับจำนวน reports ที่มีอยู่และหาหมายเลขสูงสุด
      const existingReports = reportsData.data || [];
      let maxNumber = 0;

      existingReports.forEach((report: any) => {
        const reportCode = report.attributes?.hplc_report_code || report.hplc_report_code;
        if (reportCode) {
          const match = reportCode.match(new RegExp(`RP ${currentYear}-(\\d+)`));
          if (match) {
            const number = parseInt(match[1]);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const newReportNumber = `RP ${currentYear}-${nextNumber}`;

      console.log('✅ Generated report number:', newReportNumber);
      return newReportNumber;
    } else {
      console.warn('⚠️ Cannot fetch existing reports, using fallback');
      return `RP ${currentYear}-1`;
    }
  } catch (error) {
    console.error('❌ Error generating report number:', error);
    const currentYear = new Date().getFullYear();
    return `RP ${currentYear}-1`;
  }
};

const generateRequestNumber = async () => {
  try {
    console.log('🔢 Generating request number...');
    const currentYear = new Date().getFullYear().toString().slice(-2); // ปี 2 หลัก

    const labRes = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (!labRes.ok) {
      throw new Error('Cannot get lab information');
    }

    const labData = await labRes.json();
    const labId = labData.data[0]?.documentId;

    if (!labId) {
      throw new Error('Lab ID not found');
    }

    // ดึงจำนวน requests ที่มีอยู่ในปีปัจจุบัน
    const requestsCountUrl = `http://localhost:1337/api/lab-submission-records?filters[lab][documentId][$eq]=${labId}&filters[hplc_testing_no][$startsWith]=MPIC006-ACK${currentYear}-&pagination[pageSize]=1000`;

    const requestsRes = await fetch(requestsCountUrl, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (requestsRes.ok) {
      const requestsData = await requestsRes.json();
      const existingRequests = requestsData.data || [];
      let maxNumber = 0;

      existingRequests.forEach((request: any) => {
        const requestCode = request.attributes?.hplc_testing_no || request.hplc_testing_no;
        if (requestCode) {
          const match = requestCode.match(new RegExp(`MPIC006-ACK${currentYear}-(\\d+)`));
          if (match) {
            const number = parseInt(match[1]);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const newRequestNumber = `MPIC006-ACK${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

      console.log('✅ Generated request number:', newRequestNumber);
      return newRequestNumber;
    } else {
      return `MPIC006-ACK${currentYear}-001`;
    }
  } catch (error) {
    console.error('❌ Error generating request number:', error);
    const currentYear = new Date().getFullYear().toString().slice(-2);
    return `MPIC006-ACK${currentYear}-001`;
  }
};

// ฟังก์ชันสร้าง Sample ID อัตโนมัติ
const generateSampleId = async () => {
  try {
    console.log('🔢 Generating sample ID...');
    const currentYear = new Date().getFullYear().toString().slice(-2); // ปี 2 หลัก

    const labRes = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (!labRes.ok) {
      throw new Error('Cannot get lab information');
    }

    const labData = await labRes.json();
    const labId = labData.data[0]?.documentId;

    if (!labId) {
      throw new Error('Lab ID not found');
    }

    // ดึงจำนวน samples ที่มีอยู่ในปีปัจจุบัน
    const samplesCountUrl = `http://localhost:1337/api/lab-submission-records?filters[lab][documentId][$eq]=${labId}&filters[hplc_sample_code][$startsWith]=MPIC-TS${currentYear}-&pagination[pageSize]=1000`;

    const samplesRes = await fetch(samplesCountUrl, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (samplesRes.ok) {
      const samplesData = await samplesRes.json();
      const existingSamples = samplesData.data || [];
      let maxNumber = 0;

      existingSamples.forEach((sample: any) => {
        const sampleCode = sample.attributes?.hplc_sample_code || sample.hplc_sample_code;
        if (sampleCode) {
          const match = sampleCode.match(new RegExp(`MPIC-TS${currentYear}-(\\d+)`));
          if (match) {
            const number = parseInt(match[1]);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const newSampleId = `MPIC-TS${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

      console.log('✅ Generated sample ID:', newSampleId);
      return newSampleId;
    } else {
      return `MPIC-TS${currentYear}-001`;
    }
  } catch (error) {
    console.error('❌ Error generating sample ID:', error);
    const currentYear = new Date().getFullYear().toString().slice(-2);
    return `MPIC-TS${currentYear}-001`;
  }
};

// ฟังก์ชันสร้าง Sample Code อัตโนมัติ
const generateSampleCode = async () => {
  try {
    console.log('🔢 Generating sample code...');
    const currentYear = new Date().getFullYear().toString().slice(-2); // ปี 2 หลัก

    const labRes = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (!labRes.ok) {
      throw new Error('Cannot get lab information');
    }

    const labData = await labRes.json();
    const labId = labData.data[0]?.documentId;

    if (!labId) {
      throw new Error('Lab ID not found');
    }

    // ดึงจำนวน sample codes ที่มีอยู่ในปีปัจจุบัน
    const codesCountUrl = `http://localhost:1337/api/lab-submission-records?filters[lab][documentId][$eq]=${labId}&filters[hplc_sample_preparation][$startsWith]=T${currentYear}-&pagination[pageSize]=1000`;

    const codesRes = await fetch(codesCountUrl, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    });

    if (codesRes.ok) {
      const codesData = await codesRes.json();
      const existingCodes = codesData.data || [];
      let maxNumber = 0;

      existingCodes.forEach((code: any) => {
        const sampleCode = code.attributes?.hplc_sample_preparation || code.hplc_sample_preparation;
        if (sampleCode) {
          const match = sampleCode.match(new RegExp(`T${currentYear}-([A-Z]{3})-(\\d+)`));
          if (match) {
            const number = parseInt(match[2]);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase(); // สุ่ม 3 ตัวอักษร
      const newSampleCode = `T${currentYear}-${randomChars}-${nextNumber.toString().padStart(2, '0')}`;

      console.log('✅ Generated sample code:', newSampleCode);
      return newSampleCode;
    } else {
      const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `T${currentYear}-${randomChars}-01`;
    }
  } catch (error) {
    console.error('❌ Error generating sample code:', error);
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `T${currentYear}-${randomChars}-01`;
  }
};


export default function QualityInspectionPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [role, setRole] = useState<string | 'loading'>('loading');

  // File upload states - อัพเดทจาก image upload
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [testParameters, setTestParameters] = useState({
    curcuminoidTest: false,
    moistureContent: false,
    testingMethod: 'NIR Spectroscopy'
  });

  const [testResults, setTestResults] = useState({
    curcuminoidQuality: '',
    moistureQuality: '',
    testDate: '',
    status: 'Draft',
    inspectorNotes: '',
    uploadedFile: null as File | null // เปลี่ยนจาก csvFile
  });

  // KaminCAL states
  const [kaminCALData, setKaminCALData] = useState({
    sample_name: '',
    plant_weight: '',
    solvent_volume: '',
    average_od: '',
    concentration: '',
    number_of_replications: '',
    first_time: '',
    analytical_instrument: 'HPLC',
    second_time: '',
    curcuminoid_content: 'Pass',
    curcuminoid_percentage: '',
    third_time: ''
  });

  const handleHPLCChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Helper function to extract numeric value
    const extractNumericValue = (str: string): number => {
      if (!str || str.trim() === '') return 0;
      const matchWithDeviation = str.match(/^(\d+\.?\d*)\s*[±]\s*(\d+\.?\d*)/);
      if (matchWithDeviation) {
        return parseFloat(matchWithDeviation[1]) || 0;
      }
      const matchSimple = str.match(/^(\d+\.?\d*)/);
      if (matchSimple) {
        return parseFloat(matchSimple[1]) || 0;
      }
      return 0;
    };

    // 🔥 แปลง field name จาก hplc_xxx เป็น xxx เพื่อให้ตรงกับ state
    const cleanFieldName = name.startsWith('hplc_') ? name.replace('hplc_', '') : name;

    // Update the specific field first
    const updatedData = { ...hplcData, [cleanFieldName]: value };

    // Calculate total curcuminoids when any of the curcuminoid results change
    if (cleanFieldName === 'bdmc_result' || cleanFieldName === 'dmc_result' || cleanFieldName === 'cur_result') {
      const bdmc = extractNumericValue(updatedData.bdmc_result);
      const dmc = extractNumericValue(updatedData.dmc_result);
      const cur = extractNumericValue(updatedData.cur_result);
      const total = bdmc + dmc + cur;

      updatedData.total_curcuminoids = total > 0 ? total.toFixed(1) : '';
      console.log('🧮 Total calculated:', total);
    }

    setHplcData(updatedData);
  };

  const [hplcData, setHplcData] = useState({
    report_code: '',
    testing_no: '',
    sample_code: '',
    sample_name: '',
    scientific_name: '',
    sample_preparation: '',
    sample_condition: '',
    quantity: '',        // เพิ่มใหม่
    sample_amount: '',
    temperature: '',     // เพิ่มใหม่
    bdmc_result: '',
    dmc_result: '',
    cur_result: '',
    total_curcuminoids: '',
    moisture_quantity: '',
    test_date: '',
    method_reference: 'In-house Method: WI 702 – 204.01 based on Journal AOAC International',
    method_details: 'Vol.101, No.4, 2018, pages 1232 – 1234',
    quality_assessment: 'Pass',
    analyst_name: '',
    reviewer_name: '',
    laboratory: 'ศูนย์นวัตกรรมยาสมุนไพรภาคเหนือ มหาวิทยาลัยแม่ฟ้าหลวง',
    laboratory_address: '333 หมู่ 1 ต.ท่าสุด อ.เมือง จ.เชียงราย 57100',
    laboratory_phone: 'โทรศัพท์ 053917416',
    certificate_number: ''
  });

  const TotalCurcuminoidsDisplay = () => {
    const extractNumericValue = (str: string): number => {
      if (!str || str.trim() === '') return 0;
      const matchWithDeviation = str.match(/^(\d+\.?\d*)\s*[±]\s*(\d+\.?\d*)/);
      if (matchWithDeviation) {
        return parseFloat(matchWithDeviation[1]) || 0;
      }
      const matchSimple = str.match(/^(\d+\.?\d*)/);
      if (matchSimple) {
        return parseFloat(matchSimple[1]) || 0;
      }
      return 0;
    };

    const bdmc = extractNumericValue(hplcData.bdmc_result);
    const dmc = extractNumericValue(hplcData.dmc_result);
    const cur = extractNumericValue(hplcData.cur_result);
    const total = bdmc + dmc + cur;

    return (
      <div className="bg-green-100 border border-green-300 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-green-800">Total Curcuminoids:</span>
          <span className="text-2xl font-bold text-green-800">
            {total > 0 ? total.toFixed(1) : '0.0'} mg/g
          </span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Note: Can be converted to %w/w by dividing by 10, at 95% confidence level k = 2
        </p>
        {total > 0 && (
          <div className="text-xs text-gray-600 mt-2">
            Calculation: {bdmc.toFixed(1)} + {dmc.toFixed(1)} + {cur.toFixed(1)} = {total.toFixed(1)} mg/g
          </div>
        )}
      </div>
    );
  };



  const handleTestingMethodChange = async (newMethod: string) => {
    setTestParameters({ ...testParameters, testingMethod: newMethod });

    if (newMethod === 'HPLC') {
      // สร้างรหัสต่างๆ อัตโนมัติ
      const [autoReportNumber, autoRequestNumber, autoSampleId, autoSampleCode] = await Promise.all([
        generateReportNumber(),
        generateRequestNumber(),
        generateSampleId(),
        generateSampleCode()
      ]);

      setHplcData(prev => ({
        ...prev,
        report_code: autoReportNumber,
        testing_no: autoRequestNumber,
        sample_code: autoSampleId,
        sample_preparation: autoSampleCode
      }));
    }
  };
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const ALLOWED_ROLES = ['Quality Inspection'];

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  // Enhanced file processing with CSV/Excel support
  const handleFile = async (file: File) => {
    // Validate file type - เพิ่มรองรับ CSV และ Excel
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'text/csv', 'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a valid file (PNG, JPG, JPEG, GIF, CSV, XLS, XLSX)');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    setProcessingFile(true);

    try {
      // Update state with selected file
      setTestResults((prev) => ({ ...prev, uploadedFile: file }));

      // Process file based on type
      if (file.type.startsWith('image/')) {
        await processImageFile(file);
      } else if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
        await processCSVFile(file);
      } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
        await processExcelFile(file);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setProcessingFile(false);
    }
  };

  // ฟังก์ชันประมวลผลรูปภาพ
  const processImageFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview({
          type: 'image',
          content: e.target?.result as string,
          name: file.name,
          size: file.size
        });
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ฟังก์ชันประมวลผล CSV
  const processCSVFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const data = lines.map(line => {
            // Simple CSV parsing - handle commas in quotes
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          });

          setFilePreview({
            type: 'csv',
            content: data,
            name: file.name,
            size: file.size
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // ฟังก์ชันประมวลผล Excel
  const processExcelFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Note: ในการใช้งานจริง ต้องใช้ library เช่น xlsx
          // สำหรับตอนนี้จะแสดงข้อมูลพื้นฐาน
          setFilePreview({
            type: 'excel',
            content: [['Excel file preview requires XLSX library']],
            name: file.name,
            size: file.size
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Clear file - เปลี่ยนจาก clearImage
  const clearFile = () => {
    setFilePreview(null);
    setTestResults((prev) => ({ ...prev, uploadedFile: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ฟังก์ชันแสดงตัวอย่างไฟล์
  const renderFilePreview = () => {
    if (!filePreview) return null;

    switch (filePreview.type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={filePreview.content as string}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearFile}
            >
              <X size={16} />
            </Button>
          </div>
        );

      case 'csv':
        const csvData = filePreview.content as string[][];
        return (
          <div className="relative border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Table size={16} className="text-green-600" />
                <span className="text-sm font-medium">CSV Preview</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearFile}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {filePreview.name} ({(filePreview.size / 1024).toFixed(1)} KB)
            </div>
            <div className="overflow-auto max-h-32 border rounded">
              <table className="text-xs w-full">
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className={i === 0 ? 'bg-gray-50 font-medium' : ''}>
                      {row.slice(0, 4).map((cell, j) => (
                        <td key={j} className="border p-1 max-w-20 truncate">
                          {cell}
                        </td>
                      ))}
                      {row.length > 4 && (
                        <td className="border p-1 text-gray-400">
                          +{row.length - 4} more
                        </td>
                      )}
                    </tr>
                  ))}
                  {csvData.length > 5 && (
                    <tr>
                      <td colSpan={5} className="border p-1 text-center text-gray-400">
                        +{csvData.length - 5} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'excel':
        return (
          <div className="relative border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <span className="text-sm font-medium">Excel File</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearFile}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {filePreview.name} ({(filePreview.size / 1024).toFixed(1)} KB)
            </div>
            <p className="text-sm text-gray-600">
              Excel file uploaded successfully. Preview requires XLSX library integration.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Handle KaminCAL data changes
  const handleKaminCALChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setKaminCALData({ ...kaminCALData, [name]: value });
  };

  const toggleSidebar = () => {
    localStorage.setItem('sidebarOpen', String(!isSidebarOpen));
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Form validation function
  const validateForm = (): boolean => {
    if (testParameters.testingMethod === 'HPLC') {
      // HPLC validation
      if (!hplcData.test_date) {
        alert('Please select Test Date for HPLC analysis');
        return false;
      }

      if (!hplcData.bdmc_result && !hplcData.dmc_result && !hplcData.cur_result) {
        alert('Please enter at least one curcuminoid result for HPLC analysis');
        return false;
      }

      return true;
    } else {
      // Standard validation for NIR/UV-Vis
      if (!testParameters.curcuminoidTest && !testParameters.moistureContent) {
        alert('Please select at least one test parameter (Curcuminoid Test or Moisture Content)');
        return false;
      }

      if (testParameters.curcuminoidTest) {
        if (!testResults.curcuminoidQuality || testResults.curcuminoidQuality.trim() === '') {
          alert('Please enter Curcuminoid Quality value');
          return false;
        }

        const curcuminValue = parseFloat(testResults.curcuminoidQuality);
        if (isNaN(curcuminValue) || curcuminValue < 0 || curcuminValue > 100) {
          alert('Curcuminoid Quality must be a number between 0 and 100');
          return false;
        }
      }

      if (testParameters.moistureContent) {
        if (!testResults.moistureQuality || testResults.moistureQuality.trim() === '') {
          alert('Please enter Moisture Quality value');
          return false;
        }

        const moistureValue = parseFloat(testResults.moistureQuality);
        if (isNaN(moistureValue) || moistureValue < 0 || moistureValue > 100) {
          alert('Moisture Quality must be a number between 0 and 100');
          return false;
        }
      }

      if (!testResults.testDate) {
        alert('Please select Test Date');
        return false;
      }

      const selectedDate = new Date(testResults.testDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate > today) {
        alert('Test Date cannot be in the future');
        return false;
      }

      return true;
    }
  };

  // แก้ไขฟังก์ชัน uploadFileToStrapi
  const uploadFileToStrapi = async (file: File): Promise<number | null> => {
    if (!file) {
      console.log('No file provided');
      return null;
    }

    try {
      console.log('🚀 Starting upload process...');
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const formData = new FormData();
      formData.append("files", file);

      console.log('🌐 Sending upload request to: http://localhost:1337/api/upload');
      console.log('🔑 Using JWT:', localStorage.getItem("jwt")?.substring(0, 20) + '...');

      const uploadRes = await fetch('http://localhost:1337/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: formData
      });

      console.log("🔁 Upload Response Status:", uploadRes.status);
      console.log("🔁 Upload Response Headers:", Object.fromEntries(uploadRes.headers.entries()));

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("❌ Upload Error Response:", errorText);
        throw new Error(`Upload failed with status ${uploadRes.status}: ${errorText}`);
      } else {
        console.error('File upload failed:', uploadRes.status);
        const errorText = await uploadRes.text();
        console.error('Upload error details:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };


  const fetchRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== DEBUG: Fetching Record ===');
      console.log('Record ID:', recordId);

      // Use the same API approach as Inspection Details page
      console.log('Step 1: Getting lab info...');
      const labRes = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      console.log('Lab API Response Status:', labRes.status);
      const labData = await labRes.json();
      console.log('Lab Data:', labData);

      if (!labData.data || labData.data.length === 0) {
        throw new Error('No lab found for this user.');
      }

      const labId = labData.data[0].documentId;
      console.log('Lab ID:', labId);

      // Step 2: Get lab submission records using simple populate first
      console.log('Step 2: Getting lab submission records...');
      const recordsUrl = `http://localhost:1337/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&populate[result_image][populate]=*&filters[lab][documentId][$eq]=${labId}`;
      console.log('Records API URL:', recordsUrl);

      const recordsRes = await fetch(recordsUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      console.log('Records API Response Status:', recordsRes.status);

      if (!recordsRes.ok) {
        const errorText = await recordsRes.text();
        console.error('Records API Error Response:', errorText);
        throw new Error(`Failed to load records: ${recordsRes.status} - ${errorText}`);
      }

      const recordsData = await recordsRes.json();
      console.log('Records API Response Data:', recordsData);

      if (!recordsData.data || recordsData.data.length === 0) {
        throw new Error('No lab submission records found');
      }

      // Find the specific record we want
      interface LabRecord {
        id: number;
        documentId: string;
        [key: string]: any;
      }

      interface LabApiResponse {
        data: LabRecord[];
        [key: string]: any;
      }

      interface BatchAttributes {
        Batch_id?: string;
        Farm?: {
          data?: {
            attributes?: {
              Farm_Name?: string;
              [key: string]: any;
            };
            [key: string]: any;
          };
          [key: string]: any;
        };
        [key: string]: any;
      }

      interface HarvestRecordAttributes {
        yleld?: number;
        yield?: number;
        Yleld_unit?: string;
        yield_unit?: string;
        harvest_date?: string;
        Date?: string;
        createdAt?: string;
        [key: string]: any;
      }

      interface RecordAttributes {
        batch?: {
          data?: {
            attributes?: BatchAttributes;
            [key: string]: any;
          };
          [key: string]: any;
        };
        harvest_record?: {
          data?: {
            attributes?: HarvestRecordAttributes;
            [key: string]: any;
          } | HarvestRecordAttributes;
          [key: string]: any;
        };
        Date?: string;
        date?: string;
        createdAt?: string;
        Quality_grade?: string;
        Submission_status?: string;
        curcumin_quality?: number;
        moisture_quality?: number;
        test_date?: string;
        inspector_notes?: string;
        [key: string]: any;
      }

      interface LabSubmissionRecord {
        id: string | number;
        attributes?: RecordAttributes;
        batch?: {
          Batch_id?: string;
          Farm?: {
            Farm_Name?: string;
            [key: string]: any;
          };
          [key: string]: any;
        };
        harvest_record?: HarvestRecordAttributes;
        Date?: string;
        createdAt?: string;
        Quality_grade?: string;
        Submission_status?: string;
        curcumin_quality?: number;
        moisture_quality?: number;
        test_date?: string;
        inspector_notes?: string;
        [key: string]: any;
      }

      interface LabSubmissionRecordsApiResponse {
        data: LabSubmissionRecord[];
        [key: string]: any;
      }

      const targetRecord: LabSubmissionRecord | undefined = (recordsData as LabSubmissionRecordsApiResponse).data.find(
        (item: LabSubmissionRecord) => item.id.toString() === recordId.toString()
      );

      if (!targetRecord) {
        const availableIds: string = (recordsData.data as Array<{ id: string | number }>).map((item: { id: string | number }) => item.id).join(', ');
        throw new Error(`Record with ID ${recordId} not found. Available IDs: ${availableIds}`);
      }

      console.log('Found target record:', targetRecord);

      // Fix: The data is directly in targetRecord, not in targetRecord.attributes
      const attrs = targetRecord.attributes || targetRecord;

      console.log('=== DEBUGGING DATA ACCESS ===');
      console.log('targetRecord.attributes:', targetRecord.attributes);
      console.log('targetRecord (direct):', targetRecord);
      console.log('attrs (final):', attrs);
      console.log('Quality_grade from attrs:', attrs?.Quality_grade);
      console.log('Quality_grade from targetRecord direct:', targetRecord?.Quality_grade);

      // Process the record using the same logic as Inspection Details
      let batchId = 'N/A';
      let farmName = 'Unknown Farm';
      let yield_amount = 0;
      let yield_unit = 'kg';
      let harvest_date = '';
      let received_date = '';

      console.log('=== DEBUGGING BATCH AND FARM DATA ===');
      console.log('attrs.batch:', attrs?.batch);
      console.log('targetRecord.batch:', targetRecord?.batch);

      if (attrs?.batch?.data?.attributes) {
        const batchData = attrs.batch.data.attributes;
        batchId = batchData?.Batch_id || 'N/A';
        console.log('Batch ID from relation:', batchId);

        if (batchData?.Farm?.data?.attributes) {
          const farmData = batchData.Farm.data.attributes;
          farmName = farmData?.Farm_Name || 'Unknown Farm';
          console.log('Farm name from relation:', farmName);
        }
      }

      // Fallback to the same method as Inspection Details
      if (batchId === 'N/A') {
        batchId = attrs?.batch?.data?.attributes?.Batch_id ||
          targetRecord.batch?.Batch_id ||
          'N/A';
        console.log('Batch ID from fallback:', batchId);
      }


      if (farmName === 'Unknown Farm') {
        farmName = attrs?.batch?.data?.attributes?.Farm?.data?.attributes?.Farm_Name ||
          targetRecord.batch?.Farm?.Farm_Name ||
          'Unknown Farm';
        console.log('Farm name from fallback:', farmName);
      }


      // Extract harvest record info with better date handling
      if (attrs?.harvest_record?.data?.attributes) {
        const harvestData = attrs.harvest_record.data.attributes;
        yield_amount = harvestData?.yleld || harvestData?.yield || 0;
        yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
        harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.createdAt || '';
        console.log('Harvest data from attributes:', harvestData);
      } else if (attrs?.harvest_record?.data) {
        const harvestData = attrs.harvest_record.data;
        yield_amount = harvestData?.yleld || harvestData?.yield || 0;
        yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
        harvest_date = harvestData?.harvest_date || harvestData?.Date || harvestData?.createdAt || '';
        console.log('Harvest data direct:', harvestData);
      } else if (targetRecord.harvest_record) {
        yield_amount = targetRecord.harvest_record.yleld || 0;
        yield_unit = targetRecord.harvest_record.Yleld_unit || 'kg';
        harvest_date = targetRecord.harvest_record.harvest_date || targetRecord.harvest_record.Date || '';
      }

      // Extract Date Received with multiple fallback options
      received_date = attrs?.Date || attrs?.date || attrs?.createdAt ||
        targetRecord.Date || targetRecord.createdAt || '';

      console.log('Extracted values:');
      console.log('Batch ID:', batchId);
      console.log('Farm Name:', farmName);
      console.log('Yield:', yield_amount, yield_unit);
      console.log('Harvest Date:', harvest_date);
      console.log('Received Date:', received_date);
      console.log('Quality Grade from data:', attrs?.Quality_grade || targetRecord?.Quality_grade);
      console.log('Submission Status from data:', attrs?.Submission_status || targetRecord?.Submission_status);


      const mappedRecord: InspectionRecord = {
        id: targetRecord.id.toString(),
        batch_id: batchId,
        farm_name: farmName,
        Date: received_date,
        Quality_grade: attrs?.Quality_grade || targetRecord?.Quality_grade || 'Not Graded',
        Submission_status: attrs?.Submission_status || targetRecord?.Submission_status || 'Draft',
        yield: yield_amount,
        yield_unit: yield_unit,
        curcumin_quality: attrs?.curcumin_quality || targetRecord?.curcumin_quality,
        moisture_quality: attrs?.moisture_quality || targetRecord?.moisture_quality,
        test_date: attrs?.test_date || targetRecord?.test_date,
        inspector_notes: attrs?.inspector_notes || targetRecord?.inspector_notes,
        harvest_date: harvest_date,
        result_image: attrs?.result_image?.data || targetRecord?.result_image?.data || attrs?.result_image || targetRecord?.result_image
      };

      console.log('=== DEBUGGING IMAGE DATA ===');
      console.log('attrs.result_image:', attrs?.result_image);
      console.log('targetRecord.result_image:', targetRecord?.result_image);
      console.log('attrs.result_image.data:', attrs?.result_image?.data);
      console.log('targetRecord.result_image.data:', targetRecord?.result_image?.data);
      console.log('Final result_image:', mappedRecord.result_image);

      console.log('=== DEBUGGING QUALITY GRADE ===');
      console.log('attrs.Quality_grade:', attrs?.Quality_grade);
      console.log('targetRecord.Quality_grade:', targetRecord?.Quality_grade);
      console.log('Final Quality_grade:', mappedRecord.Quality_grade);
      console.log('=== DEBUGGING SUBMISSION STATUS ===');
      console.log('attrs.Submission_status:', attrs?.Submission_status);
      console.log('targetRecord.Submission_status:', targetRecord?.Submission_status);
      console.log('Final Submission_status:', mappedRecord.Submission_status);

      console.log('Final mapped record:', mappedRecord);
      setRecord(mappedRecord);

      const testingMethod = attrs?.testing_method || targetRecord?.testing_method || 'NIR Spectroscopy';

      if (testingMethod === 'HPLC') {
        // Load HPLC data
        console.log('Loading HPLC data...');

        setTestParameters({
          curcuminoidTest: false, // Hidden for HPLC
          moistureContent: false, // Hidden for HPLC
          testingMethod: 'HPLC'
        });

        setHplcData({
          // Basic Information
          report_code: attrs?.hplc_report_code || targetRecord?.hplc_report_code || '',
          testing_no: attrs?.hplc_testing_no || targetRecord?.hplc_testing_no || '',
          sample_code: attrs?.hplc_sample_code || targetRecord?.hplc_sample_code || '',
          sample_name: attrs?.hplc_sample_name || targetRecord?.hplc_sample_name || '',
          scientific_name: attrs?.hplc_scientific_name || targetRecord?.hplc_scientific_name || 'Curcuma longa',
          sample_preparation: attrs?.hplc_sample_preparation || targetRecord?.hplc_sample_preparation || '',
          sample_condition: attrs?.hplc_sample_condition || targetRecord?.hplc_sample_condition || '',
          quantity: attrs?.hplc_quantity || targetRecord?.hplc_quantity || '',
          sample_amount: attrs?.hplc_sample_amount?.toString() || targetRecord?.hplc_sample_amount?.toString() || '',
          temperature: attrs?.hplc_temperature || targetRecord?.hplc_temperature || '',

          // HPLC Results
          bdmc_result: attrs?.hplc_bdmc_result || targetRecord?.hplc_bdmc_result || '',
          dmc_result: attrs?.hplc_dmc_result || targetRecord?.hplc_dmc_result || '',
          cur_result: attrs?.hplc_cur_result || targetRecord?.hplc_cur_result || '',
          total_curcuminoids: attrs?.hplc_total_curcuminoids || targetRecord?.hplc_total_curcuminoids || '',
          moisture_quantity: attrs?.hplc_moisture_quantity || targetRecord?.hplc_moisture_quantity || '',
          test_date: attrs?.test_date || targetRecord?.test_date || new Date().toISOString().split('T')[0],

          // Method Information
          method_reference: attrs?.hplc_method_reference || targetRecord?.hplc_method_reference || 'In-house Method: WI 702 – 204.01 based on Journal AOAC International',
          method_details: attrs?.hplc_method_details || targetRecord?.hplc_method_details || 'Vol.101, No.4, 2018, pages 1232 – 1234',

          // Quality Assessment
          quality_assessment: attrs?.hplc_quality_assessment || targetRecord?.hplc_quality_assessment || 'Pass',
          analyst_name: attrs?.hplc_analyst_name || targetRecord?.hplc_analyst_name || '',
          reviewer_name: attrs?.hplc_reviewer_name || targetRecord?.hplc_reviewer_name || '',

          // Certificate Information
          laboratory: attrs?.hplc_laboratory || targetRecord?.hplc_laboratory || 'ศูนย์นวัตกรรมยาสมุนไพรภาคเหนือ มหาวิทยาลัยแม่ฟ้าหลวง',
          laboratory_address: attrs?.hplc_laboratory_address || targetRecord?.hplc_laboratory_address || '333 หมู่ 1 ต.ท่าสุด อ.เมือง จ.เชียงราย 57100',
          laboratory_phone: attrs?.hplc_laboratory_phone || targetRecord?.hplc_laboratory_phone || 'โทรศัพท์ 053917416',
          certificate_number: attrs?.hplc_certificate_number || targetRecord?.hplc_certificate_number || ''
        });

        setTestResults(prev => ({
          ...prev,
          testDate: attrs?.test_date || targetRecord?.test_date || new Date().toISOString().split('T')[0],
          status: mappedRecord.Submission_status,
          inspectorNotes: mappedRecord.inspector_notes || '',
          uploadedFile: null
        }));

        console.log('HPLC data loaded successfully');

      } else {
        // Load standard NIR/UV-Vis data
        console.log('Loading standard test data...');

        if (mappedRecord.curcumin_quality || mappedRecord.moisture_quality) {
          setTestParameters({
            curcuminoidTest: !!mappedRecord.curcumin_quality,
            moistureContent: !!mappedRecord.moisture_quality,
            testingMethod: testingMethod
          });

          setTestResults({
            curcuminoidQuality: mappedRecord.curcumin_quality?.toString() || '',
            moistureQuality: mappedRecord.moisture_quality?.toString() || '',
            testDate: mappedRecord.test_date || new Date().toISOString().split('T')[0],
            status: mappedRecord.Submission_status,
            inspectorNotes: mappedRecord.inspector_notes || '',
            uploadedFile: null
          });

          // Pre-fill KaminCAL data
          setKaminCALData({
            sample_name: attrs?.kamincal_sample_name || targetRecord?.kamincal_sample_name || '',
            plant_weight: attrs?.kamincal_plant_weight?.toString() || targetRecord?.kamincal_plant_weight?.toString() || '',
            solvent_volume: attrs?.kamincal_solvent_volume?.toString() || targetRecord?.kamincal_solvent_volume?.toString() || '',
            average_od: attrs?.kamincal_average_od?.toString() || targetRecord?.kamincal_average_od?.toString() || '',
            concentration: attrs?.kamincal_concentration?.toString() || targetRecord?.kamincal_concentration?.toString() || '',
            number_of_replications: attrs?.kamincal_number_of_replications?.toString() || targetRecord?.kamincal_number_of_replications?.toString() || '',
            first_time: attrs?.kamincal_first_time?.toString() || targetRecord?.kamincal_first_time?.toString() || '',
            analytical_instrument: attrs?.kamincal_analytical_instrument || targetRecord?.kamincal_analytical_instrument || 'HPLC',
            second_time: attrs?.kamincal_second_time?.toString() || targetRecord?.kamincal_second_time?.toString() || '',
            curcuminoid_content: attrs?.kamincal_curcuminoid_content || targetRecord?.kamincal_curcuminoid_content || 'Pass',
            curcuminoid_percentage: attrs?.kamincal_curcuminoid_percentage?.toString() || targetRecord?.kamincal_curcuminoid_percentage?.toString() || '',
            third_time: attrs?.kamincal_third_time?.toString() || targetRecord?.kamincal_third_time?.toString() || ''
          });
        } else {
          setTestParameters(prev => ({
            ...prev,
            testingMethod: testingMethod
          }));

          setTestResults(prev => ({
            ...prev,
            testDate: new Date().toISOString().split('T')[0],
            status: mappedRecord.Submission_status
          }));
        }

        console.log('Standard test data loaded successfully');
      }
      // Load existing file preview if available - อัพเดทการตรวจสอบประเภทไฟล์
      if (mappedRecord.result_image) {
        console.log('🖼️ Loading existing file preview:', mappedRecord.result_image);
        let fileUrl = '';

        if (mappedRecord.result_image.url) {
          fileUrl = `http://localhost:1337${mappedRecord.result_image.url}`;
        } else if (mappedRecord.result_image.attributes?.url) {
          fileUrl = `http://localhost:1337${mappedRecord.result_image.attributes.url}`;
        }

        if (fileUrl) {
          // Check if it's an image file
          const fileName = mappedRecord.result_image.name || mappedRecord.result_image.attributes?.name || '';
          const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
          const isCSV = /\.csv$/i.test(fileName);
          const isExcel = /\.(xls|xlsx)$/i.test(fileName);

          if (isImage) {
            setFilePreview({
              type: 'image',
              content: fileUrl,
              name: fileName,
              size: mappedRecord.result_image.size || 0
            });
          } else if (isCSV) {
            setFilePreview({
              type: 'csv',
              content: [['Existing CSV file preview not available']],
              name: fileName,
              size: mappedRecord.result_image.size || 0
            });
          } else if (isExcel) {
            setFilePreview({
              type: 'excel',
              content: [['Existing Excel file preview not available']],
              name: fileName,
              size: mappedRecord.result_image.size || 0
            });
          }
        }
      }

    } catch (err) {
      console.error('Error fetching record:', err);
      setError(
        `Error loading record: ${err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!record) return;

    // Validate form before saving
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      console.log('=== DEBUG SAVE WITH FILE ===');
      console.log('📁 File to upload:', testResults.uploadedFile);

      let resultFileId: number | null = null;

      // Upload file first if exists
      if (testResults.uploadedFile) {
        console.log('📦 Starting upload process...');
        resultFileId = await uploadFileToStrapi(testResults.uploadedFile);

        if (!resultFileId) {
          const shouldContinue = confirm('Warning: File upload failed. Do you want to continue saving without the file?');
          if (!shouldContinue) {
            setSaving(false);
            return;
          }
        }
      }

      console.log('=== DEBUG SAVE ===');
      console.log('Record ID from URL:', recordId);
      console.log('Record ID from record object:', record.id);
      console.log('Test results to save:', testResults);
      console.log('Test parameters:', testParameters);

      // First, let's get the record details to understand the structure
      const checkUrl = `http://localhost:1337/api/lab-submission-records/${record.id}?populate=*`;
      console.log('Checking record URL:', checkUrl);

      const checkRes = await fetch(checkUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      console.log('Check record status:', checkRes.status);

      if (!checkRes.ok) {
        // If record not found, try alternative approach - check if it's a documentId issue
        console.log('Record not found with regular ID, trying alternative approaches...');

        // Try to find the record by searching all records and matching
        const labRes = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });

        if (labRes.ok) {
          const labData = await labRes.json();
          const labId = labData.data[0]?.documentId;

          if (labId) {
            // Get all records and find the one we want
            const allRecordsUrl = `http://localhost:1337/api/lab-submission-records?populate=*&filters[lab][documentId][$eq]=${labId}`;
            const allRecordsRes = await fetch(allRecordsUrl, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt')}`,
              },
            });

            if (allRecordsRes.ok) {
              const allRecordsData = await allRecordsRes.json();
              interface AllRecordsItem {
                id: string | number;
                documentId?: string;
                [key: string]: any;
              }

              interface AllRecordsData {
                data: AllRecordsItem[];
                [key: string]: any;
              }

              const targetRecord: AllRecordsItem | undefined = (allRecordsData as AllRecordsData).data.find(
                (item: AllRecordsItem) =>
                  item.id.toString() === recordId.toString() ||
                  item.documentId === recordId
              );

              if (targetRecord) {
                // Use the documentId if available, otherwise use id
                const saveId = targetRecord.documentId || targetRecord.id;
                await performSave(saveId);
                return;
              }
            }
          }
        }

        throw new Error(`Record ID ${recordId} not found in the system. Please try with a different record or contact administrator.`);
      }

      // If record found, proceed with save using the ID
      await performSave(record.id);

    } catch (err) {
      console.error('Error saving:', err);
      alert(`Failed to save inspection results: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const performSave = async (saveId: string | number): Promise<void> => {
    let resultImageId: number | null = null;

    // Upload file first if exists
    if (testResults.uploadedFile) {

      try {
        const formData = new FormData();
        formData.append("files", testResults.uploadedFile);

        const uploadRes = await fetch("http://localhost:1337/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
          body: formData,
        });

        console.log("🔁 Upload Status:", uploadRes.status);

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        resultImageId = uploadData[0]?.id;
        console.log('✅ Image uploaded with ID:', resultImageId);

      } catch (uploadError) {
        console.error('❌ Upload Error:', uploadError);
        const shouldContinue = confirm('Warning: Image upload failed. Do you want to continue saving without the image?');
        if (!shouldContinue) {
          setSaving(false);
          return;
        }
      }
    }

    let updateData;

    if (testParameters.testingMethod === 'HPLC') {
      // HPLC data structure
      updateData = {
        data: {
          testing_method: 'HPLC',
          test_date: hplcData.test_date || null,
          inspector_notes: testResults.inspectorNotes || null,
          Submission_status: testResults.status || 'Draft',

          // HPLC specific data
          hplc_report_code: hplcData.report_code || null,
          hplc_testing_no: hplcData.testing_no || null,
          hplc_sample_code: hplcData.sample_code || null,
          hplc_sample_name: hplcData.sample_name || null,
          hplc_scientific_name: hplcData.scientific_name || null,
          hplc_sample_preparation: hplcData.sample_preparation || null,
          hplc_sample_condition: hplcData.sample_condition || null,
          hplc_quantity: hplcData.quantity || null,
          hplc_sample_amount: hplcData.sample_amount || null,
          hplc_temperature: hplcData.temperature || null,

          // HPLC Results (store as text with ± values)
          hplc_bdmc_result: hplcData.bdmc_result || null,
          hplc_dmc_result: hplcData.dmc_result || null,
          hplc_cur_result: hplcData.cur_result || null,
          hplc_total_curcuminoids: hplcData.total_curcuminoids || null,
          hplc_moisture_quantity: hplcData.moisture_quantity || null,

          // Method Information
          hplc_method_reference: hplcData.method_reference || null,
          hplc_method_details: hplcData.method_details || null,

          // Quality Assessment
          hplc_quality_assessment: hplcData.quality_assessment || null,
          hplc_analyst_name: hplcData.analyst_name || null,
          hplc_reviewer_name: hplcData.reviewer_name || null,

          // Certificate Information
          hplc_laboratory: hplcData.laboratory || null,
          hplc_laboratory_address: hplcData.laboratory_address || null,
          hplc_laboratory_phone: hplcData.laboratory_phone || null,
          hplc_certificate_number: hplcData.certificate_number || null,

          // Clear standard test results when using HPLC
          curcumin_quality: null,
          moisture_quality: null,

          // Result file
          ...(resultImageId && {
            result_image: resultImageId
          })
        }
      };
    } else {
      // Standard NIR/UV-Vis data structure
      updateData = {
        data: {
          curcumin_quality: testParameters.curcuminoidTest ? parseFloat(testResults.curcuminoidQuality) || null : null,
          moisture_quality: testParameters.moistureContent ? parseFloat(testResults.moistureQuality) || null : null,
          test_date: testResults.testDate || null,
          inspector_notes: testResults.inspectorNotes || null,
          Submission_status: testResults.status,
          testing_method: testParameters.testingMethod || null,

          // KaminCAL data (only for standard methods)
          kamincal_sample_name: kaminCALData.sample_name || null,
          kamincal_plant_weight: parseFloat(kaminCALData.plant_weight) || null,
          kamincal_solvent_volume: parseFloat(kaminCALData.solvent_volume) || null,
          kamincal_average_od: parseFloat(kaminCALData.average_od) || null,
          kamincal_concentration: parseFloat(kaminCALData.concentration) || null,
          kamincal_number_of_replications: parseInt(kaminCALData.number_of_replications) || null,
          kamincal_first_time: parseFloat(kaminCALData.first_time) || null,
          kamincal_analytical_instrument: kaminCALData.analytical_instrument || null,
          kamincal_second_time: parseFloat(kaminCALData.second_time) || null,
          kamincal_curcuminoid_content: kaminCALData.curcuminoid_content || null,
          kamincal_curcuminoid_percentage: parseFloat(kaminCALData.curcuminoid_percentage) || null,
          kamincal_third_time: parseFloat(kaminCALData.third_time) || null,

          // Clear HPLC data when using standard methods
          hplc_report_code: null,
          hplc_testing_no: null,
          hplc_sample_code: null,
          hplc_sample_name: null,
          hplc_bdmc_result: null,
          hplc_dmc_result: null,
          hplc_cur_result: null,
          hplc_total_curcuminoids: null,

          // Result file
          ...(resultImageId && {
            result_image: resultImageId
          })
        }
      };
    }

    console.log('📤 Update data to send:', updateData);

    const saveUrl = `http://localhost:1337/api/lab-submission-records/${saveId}`;
    const res = await fetch(saveUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
      body: JSON.stringify(updateData)
    });

    console.log('🔁 Save API Response Status:', res.status);

    if (res.ok) {
      const saveResponse = await res.json();
      console.log('✅ Save API Response:', saveResponse);

      let successMessage = 'Quality inspection results saved successfully!\n\nSaved data:\n';

      if (testParameters.testingMethod === 'HPLC') {
        // HPLC success message
        successMessage += `• Testing Method: HPLC\n`;
        if (updateData.data.hplc_report_code) {
          successMessage += `• Report Code: ${updateData.data.hplc_report_code}\n`;
        }
        if (updateData.data.hplc_sample_code) {
          successMessage += `• Sample Code: ${updateData.data.hplc_sample_code}\n`;
        }
        if (updateData.data.hplc_total_curcuminoids) {
          successMessage += `• Total Curcuminoids: ${updateData.data.hplc_total_curcuminoids} mg/g\n`;
        }

        // ✅ แก้ไขด้วยการเช็คจาก hplcData โดยตรง
        if (hplcData.quality_assessment) {
          successMessage += `• Quality Assessment: ${hplcData.quality_assessment}\n`;
        }
        if (hplcData.analyst_name) {
          successMessage += `• Analyst: ${hplcData.analyst_name}\n`;
        }
        if (hplcData.reviewer_name) {
          successMessage += `• Reviewer: ${hplcData.reviewer_name}\n`;
        }
      } else {
        // Standard test success message
        if (updateData.data.curcumin_quality !== null) {
          successMessage += `• Curcumin Quality: ${updateData.data.curcumin_quality}%\n`;
        }
        if (updateData.data.moisture_quality !== null) {
          successMessage += `• Moisture Quality: ${updateData.data.moisture_quality}%\n`;
        }
        successMessage += `• Testing Method: ${updateData.data.testing_method}\n`;
      }

      successMessage += `• Test Date: ${updateData.data.test_date}\n`;
      successMessage += `• Status: ${updateData.data.Submission_status}`;

      if (updateData.data.inspector_notes) {
        successMessage += `\n• Notes: ${updateData.data.inspector_notes.substring(0, 50)}${updateData.data.inspector_notes.length > 50 ? '...' : ''}`;
      }
      if (resultImageId) {
        successMessage += `\n• Result File: Uploaded successfully (ID: ${resultImageId})`;
      }

      alert(successMessage);
      router.push('/inspection-details');

    } else {
      const errorResponse = await res.json();
      console.error('📜 Save API Error Response:', errorResponse);
      throw new Error(`Failed to save: ${res.status}`);
    }
  };

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
    if (recordId) {
      fetchRecord();
    }
  }, [role, recordId]);

  useEffect(() => {
    const initializeHPLCData = async () => {
      if (testParameters.testingMethod === 'HPLC' && !hplcData.report_code) {
        const [autoReportNumber, autoRequestNumber, autoSampleId, autoSampleCode] = await Promise.all([
          generateReportNumber(),
          generateRequestNumber(),
          generateSampleId(),
          generateSampleCode()
        ]);

        setHplcData(prev => ({
          ...prev,
          report_code: autoReportNumber,
          testing_no: autoRequestNumber,
          sample_code: autoSampleId,
          sample_preparation: autoSampleCode
        }));
      }
    };

    initializeHPLCData();
  }, [testParameters.testingMethod]);

  // if (role === 'loading' || loading) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-screen">
  //       <div className="animate-pulse mb-4">
  //         <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
  //       </div>
  //       <p className="text-gray-500">Loading inspection record...</p>
  //       {recordId && <p className="text-sm text-gray-400">Record ID: {recordId}</p>}
  //       <p className="text-xs text-gray-400 mt-2">Check Console for detailed logs</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833-.27 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium mb-2">Error loading record</p>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => router.push('/inspection-details')} variant="outline">
          Back to Inspection Details
        </Button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Record not found</p>
      </div>
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
              onClick={() => router.push('/inspection-details')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">Quality Inspection</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Results
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="p-6 max-w-6xl mx-auto">
          {/* Batch Information */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2">
              <span className="text-green-600"><Label><LucidePackage className="h-4 w-4" /></Label></span>Batch Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Batch ID</Label>
                <Input value={record.batch_id} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium">Farm Name</Label>
                <Input value={record.farm_name} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium">Date Received</Label>
                <Input
                  value={record.Date ? new Date(record.Date).toLocaleDateString('en-CA') : ''}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Harvest Date</Label>
                <Input
                  value={record.harvest_date ? new Date(record.harvest_date).toLocaleDateString('en-CA') : 'N/A'}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Quality</Label>
                <Input value={record.Quality_grade} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium">Yield</Label>
                <Input value={`${record.yield} ${record.yield_unit}`} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  {record.Submission_status === "Pending" && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                  {record.Submission_status === "Completed" && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                  {record.Submission_status === "Draft" && (
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      Draft
                    </span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Select Status</Label>
                <Select
                  value={testResults.status}
                  onValueChange={(value) =>
                    setTestResults({ ...testResults, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Test Parameters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><span className="text-green-600"><Label><FlaskConical className="h-4 w-4" /></Label></span>
              Test Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium">Testing Method</Label>
                  <Select
                    value={testParameters.testingMethod}
                    onValueChange={handleTestingMethodChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIR Spectroscopy">NIR Spectroscopy</SelectItem>
                      <SelectItem value="HPLC">HPLC</SelectItem>
                      <SelectItem value="UV-Vis">UV-Vis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Test Parameters - only show for non-HPLC methods */}
                {testParameters.testingMethod !== 'HPLC' && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Select Test Parameters</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="curcuminoid"
                          checked={testParameters.curcuminoidTest}
                          onCheckedChange={(checked) =>
                            setTestParameters({ ...testParameters, curcuminoidTest: !!checked })
                          }
                        />
                        <Label htmlFor="curcuminoid" className="text-sm">
                          Curcuminoid Test
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="moisture"
                          checked={testParameters.moistureContent}
                          onCheckedChange={(checked) =>
                            setTestParameters({ ...testParameters, moistureContent: !!checked })
                          }
                        />
                        <Label htmlFor="moisture" className="text-sm">
                          Moisture Content
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conditional Test Results */}
          {testParameters.testingMethod === 'HPLC' ? (
            /* HPLC Test Results */
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-green-600"><Label><LucideMicroscope className="h-4 w-4" /></Label></span>
                  Test Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Report No.
                        <span className="text-xs text-green-600 ml-1">(Auto-generated)</span>
                      </Label>
                      <Input
                        name="hplc_report_code"
                        value={hplcData.report_code}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                        placeholder="RP 2025-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Request No.
                        <span className="text-xs text-green-600 ml-1">(Auto-generated)</span>
                      </Label>
                      <Input
                        name="hplc_testing_no"
                        value={hplcData.testing_no}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                        placeholder="MPIC006-ACK25-245"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Sample ID
                        <span className="text-xs text-green-600 ml-1">(Auto-generated)</span>
                      </Label>
                      <Input
                        name="hplc_sample_code"
                        value={hplcData.sample_code}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                        placeholder="MPIC-TS25-597"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Sample Name</Label>
                      <Input
                        name="hplc_sample_name"
                        value={hplcData.sample_name}
                        onChange={handleHPLCChange}
                        placeholder="Turmeric"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Scientific Name</Label>
                      <Input
                        name="hplc_scientific_name"
                        value={hplcData.scientific_name}
                        onChange={handleHPLCChange}
                        placeholder="Curcuma longa"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Sample Code
                        <span className="text-xs text-green-600 ml-1">(Auto-generated)</span>
                      </Label>
                      <Input
                        name="hplc_sample_preparation"
                        value={hplcData.sample_preparation}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                        placeholder="T68-AJL-01"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Sample Type</Label>
                      <Input
                        name="hplc_sample_condition"
                        value={hplcData.sample_condition}
                        onChange={handleHPLCChange}
                        placeholder="Powder/Dry"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Quantity</Label>
                      <Input
                        name="hplc_quantity"
                        value={hplcData.quantity}
                        onChange={handleHPLCChange}
                        placeholder="1 Bag"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Weight/Volume</Label>
                      <Input
                        name="hplc_sample_amount"
                        value={hplcData.sample_amount}
                        onChange={handleHPLCChange}
                        placeholder="10 g"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Temperature Upon Receipt</Label>
                      <Input
                        name="hplc_temperature"
                        value={hplcData.temperature}
                        onChange={handleHPLCChange}
                        placeholder="Room Temperature, Normal Condition"
                      />
                    </div>
                  </div>

                  {/* Curcuminoid Quantity Section */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-green-600"><Label><FlaskConical className="h-4 w-4" /></Label></span>
                      <h3 className="text-lg font-semibold text-gray-800">Curcuminoid Quantity (mg/g)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Bisdemethoxycurcumin (BDMC)</Label>
                        <Input
                          name="hplc_bdmc_result"
                          type="text"
                          value={hplcData.bdmc_result}
                          onChange={handleHPLCChange}
                          placeholder="12.3 ± 1.8"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Demethoxycurcumin (DMC)</Label>
                        <Input
                          name="hplc_dmc_result"
                          type="text"
                          value={hplcData.dmc_result}
                          onChange={handleHPLCChange}
                          placeholder="10.4 ± 3.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Curcumin (CUR)</Label>
                        <Input
                          name="hplc_cur_result"
                          type="text"
                          value={hplcData.cur_result}
                          onChange={handleHPLCChange}
                          placeholder="27.2 ± 8.4"
                        />
                      </div>
                    </div>

                    {/* Total Curcuminoids Display */}
                    <TotalCurcuminoidsDisplay />

                    {/* ✅ Quality Assessment - วางใต้ Total Curcuminoids */}
                    <div className="border rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-green-600"><Label><SquarePen className="h-4 w-4" /></Label></span>
                        <h4 className="text-lg font-semibold ">Quality Assessment</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Overall Assessment</Label>
                          <Select
                            value={hplcData.quality_assessment}
                            onValueChange={(value) => setHplcData({ ...hplcData, quality_assessment: value })}
                          >
                            <SelectTrigger className="bg-white ">
                              <SelectValue placeholder="Select assessment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pass">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600"></span>
                                  <span>Pass</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Fail">
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600"></span>
                                  <span>Fail</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Analyst Name</Label>
                          <Input
                            name="hplc_analyst_name"
                            value={hplcData.analyst_name}
                            onChange={handleHPLCChange}
                            placeholder="Enter analyst name"
                            className="bg-white "
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Reviewer Name</Label>
                          <Input
                            name="hplc_reviewer_name"
                            value={hplcData.reviewer_name}
                            onChange={handleHPLCChange}
                            placeholder="Enter reviewer name"
                            className="bg-white "
                          />
                        </div>
                      </div>

                      {/* Note เหมือน Total Curcuminoids */}
                      <p className="text-xs text-gray-600 mt-2">
                        Assessment based on laboratory standards and curcuminoid content analysis
                      </p>
                    </div>
                  </div>


                  {/* Bottom Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Moisture Quantity</Label>
                      <Input
                        name="hplc_moisture_quantity"
                        value={hplcData.moisture_quantity}
                        onChange={handleHPLCChange}
                        placeholder="Enter moisture content..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Test Date</Label>
                      <Input
                        name="hplc_test_date"
                        type="date"
                        value={hplcData.test_date}
                        onChange={handleHPLCChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Standard Test Results for NIR/UV-Vis */
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><span className="text-green-600"><Label><LucideMicroscope className="h-4 w-4" /></Label></span>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {testParameters.curcuminoidTest && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Curcuminoid Quality</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={testResults.curcuminoidQuality}
                            onChange={(e) =>
                              setTestResults({ ...testResults, curcuminoidQuality: e.target.value })
                            }
                            placeholder="Enter percentage"
                          />
                        </div>
                        <div className="mt-6">
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    )}

                    {testParameters.moistureContent && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Moisture Quality</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={testResults.moistureQuality}
                            onChange={(e) =>
                              setTestResults({ ...testResults, moistureQuality: e.target.value })
                            }
                            placeholder="Enter percentage"
                          />
                        </div>
                        <div className="mt-6">
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Test Date</Label>
                      <Input
                        type="date"
                        value={testResults.testDate}
                        onChange={(e) =>
                          setTestResults({ ...testResults, testDate: e.target.value })
                        }
                      />
                    </div>

{/* ✅ Quality Assessment - วางใต้ Total Curcuminoids */}
                    <div className="border rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-green-600"><Label><SquarePen className="h-4 w-4" /></Label></span>
                        <h4 className="text-lg font-semibold ">Quality Assessment</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Overall Assessment</Label>
                          <Select
                            value={hplcData.quality_assessment}
                            onValueChange={(value) => setHplcData({ ...hplcData, quality_assessment: value })}
                          >
                            <SelectTrigger className="bg-white ">
                              <SelectValue placeholder="Select assessment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pass">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600"></span>
                                  <span>Pass</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Fail">
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600"></span>
                                  <span>Fail</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Analyst Name</Label>
                          <Input
                            name="hplc_analyst_name"
                            value={hplcData.analyst_name}
                            onChange={handleHPLCChange}
                            placeholder="Enter analyst name"
                            className="bg-white "
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">Reviewer Name</Label>
                          <Input
                            name="hplc_reviewer_name"
                            value={hplcData.reviewer_name}
                            onChange={handleHPLCChange}
                            placeholder="Enter reviewer name"
                            className="bg-white "
                          />
                        </div>
                      </div>

                      {/* Note เหมือน Total Curcuminoids */}
                      <p className="text-xs text-gray-600 mt-2">
                        Assessment based on laboratory standards and curcuminoid content analysis
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2"><span className="text-green-600"><Label><Upload className="h-4 w-4" /></Label></span>Upload Results File</Label>
                      <div
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 transition cursor-pointer bg-gray-50 relative p-4"
                        onClick={() => !processingFile && fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        {processingFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm">Processing file...</p>
                          </div>
                        ) : filePreview ? (
                          renderFilePreview()
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <Upload className="h-12 w-12 text-gray-400" />
                            <p className="text-sm font-medium">Drag & drop a file here</p>
                            <p className="text-xs text-gray-400">or click to browse</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <ImageIcon size={12} />
                                <span>Images</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Table size={12} />
                                <span>CSV</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText size={12} />
                                <span>Excel</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, GIF, CSV, XLS, XLSX up to 10MB
                            </p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFile(file);
                            }
                          }}
                          className="hidden"
                          disabled={processingFile}
                        />
                      </div>
                      {testResults.uploadedFile && (
                        <p className="text-sm text-green-600 mt-2">
                          File selected: {testResults.uploadedFile.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium"><span className="text-green-600"><Label><LucideNotebook className="h-4 w-4" /></Label></span>Inspector Notes</Label>
                      <Textarea
                        placeholder="Add your comments here..."
                        value={testResults.inspectorNotes}
                        onChange={(e) =>
                          setTestResults({ ...testResults, inspectorNotes: e.target.value })
                        }
                        rows={4}
                        className="min-h-[100px] max-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inspector Notes Section - only for HPLC */}
          {testParameters.testingMethod === 'HPLC' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-green-600"><Label><Notebook className="h-4 w-4" /></Label></span>
                  Inspector Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add your comments here..."
                  value={testResults.inspectorNotes}
                  onChange={(e) =>
                    setTestResults({ ...testResults, inspectorNotes: e.target.value })
                  }
                  rows={4}

                />
              </CardContent>
            </Card>
          )}

          {/* Updated Upload Results File Section for HPLC - fixed height */}
          {testParameters.testingMethod === 'HPLC' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-green-600"><Label><Upload className="h-4 w-4" /></Label></span>
                  Upload Results File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 transition cursor-pointer bg-gray-50 relative p-4"
                  onClick={() => !processingFile && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {processingFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm">Processing file...</p>
                    </div>
                  ) : filePreview ? (
                    renderFilePreview()
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                      <p className="text-sm font-medium">Drag & drop a file here</p>
                      <p className="text-xs text-gray-400">or click to browse</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <ImageIcon size={12} />
                          <span>Images</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Table size={12} />
                          <span>CSV</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText size={12} />
                          <span>Excel</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF, CSV, XLS, XLSX up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFile(file);
                      }
                    }}
                    className="hidden"
                    disabled={processingFile}
                  />
                </div>
                {testResults.uploadedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    File selected: {testResults.uploadedFile.name}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* KaminCAL Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>KaminCAL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Sample Name</Label>
                    <Input
                      name="sample_name"
                      value={kaminCALData.sample_name}
                      onChange={handleKaminCALChange}
                      placeholder="Name"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Solvent Volume</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="solvent_volume"
                        type="number"
                        step="0.01"
                        value={kaminCALData.solvent_volume}
                        onChange={handleKaminCALChange}
                        placeholder="Enter volume"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 min-w-[30px]">mL</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Concentration</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="concentration"
                        type="number"
                        step="0.01"
                        value={kaminCALData.concentration}
                        onChange={handleKaminCALChange}
                        placeholder="Enter concentration"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 min-w-[50px]">mg/mL</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">First Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="first_time"
                        type="number"
                        step="0.01"
                        value={kaminCALData.first_time}
                        onChange={handleKaminCALChange}
                        placeholder="Enter time"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 min-w-[50px]">mg/mL</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Second Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="second_time"
                        type="number"
                        step="0.01"
                        value={kaminCALData.second_time}
                        onChange={handleKaminCALChange}
                        placeholder="Enter time"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 min-w-[50px]">mg/mL</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Third Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="third_time"
                        type="number"
                        step="0.01"
                        value={kaminCALData.third_time}
                        onChange={handleKaminCALChange}
                        placeholder="Enter time"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 min-w-[50px]">mg/mL</span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Plant Weight</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="plant_weight"
                        type="number"
                        step="0.01"
                        value={kaminCALData.plant_weight}
                        onChange={handleKaminCALChange}
                        placeholder="Enter weight"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 min-w-[30px]">mg</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Average OD</Label>
                    <Input
                      name="average_od"
                      type="number"
                      step="0.01"
                      value={kaminCALData.average_od}
                      onChange={handleKaminCALChange}
                      placeholder="Enter OD value"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Number of Replications</Label>
                    <Input
                      name="number_of_replications"
                      type="number"
                      value={kaminCALData.number_of_replications}
                      onChange={handleKaminCALChange}
                      placeholder="Enter number"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Analytical Instrument</Label>
                    <Select
                      value={kaminCALData.analytical_instrument}
                      onValueChange={(value) =>
                        setKaminCALData({ ...kaminCALData, analytical_instrument: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HPLC">HPLC</SelectItem>
                        <SelectItem value="UV-Vis">UV-Vis</SelectItem>
                        <SelectItem value="NIR">NIR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Curcuminoid Content (Percentage by weight)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        name="curcuminoid_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={kaminCALData.curcuminoid_percentage}
                        onChange={handleKaminCALChange}
                        placeholder="Enter percentage"
                        className="flex-1"
                      />
                      <Select
                        value={kaminCALData.curcuminoid_content}
                        onValueChange={(value) =>
                          setKaminCALData({ ...kaminCALData, curcuminoid_content: value })
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}