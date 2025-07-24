'use client'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, CheckCircle, ArrowRight, ArrowLeft, Send, Check, X } from "lucide-react";

function FileDownload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

interface CompletedRecord {
  id: string;
  batchId: string;
  farmName: string;
  testType: string;
  qualityGrade: string;
  yield: number;
  yieldUnit: string;
  dateOfResult: string;
  status: string;
  curcuminLevel?: number;
  moistureLevel?: number;
  testDate?: string;
  inspectorNotes?: string;
}

interface ExportHistoryItem {
  id: string;
  batchId: string;
  farmName: string;
  testType: string;
  qualityGrade: string;
  yield: number;
  yieldUnit: string;
  status: string;
  exportDate: string;
  curcuminLevel?: number;
  moistureLevel?: number;
  exportHistoryId?: string | number;
  exportId?: string | number;
}

interface APIExportHistoryItem {
  id: string | number;
  attributes: {
    batch_ids: string[] | string;
    export_date?: string;
    export_status?: string;
    createdAt?: string;
  };
}

interface LabSubmissionRecordAPI {
  data: {
    id: string | number;
    attributes: {
      batch?: {
        data?: {
          attributes?: {
            Batch_id?: string;
            Farm?: {
              data?: {
                attributes?: {
                  Farm_Name?: string;
                };
              };
            };
          };
        };
      };
      harvest_record?: {
        data?: {
          attributes?: {
            yleld?: number;
            yield?: number;
            Yleld_unit?: string;
            yield_unit?: string;
          };
        };
      };
      Quality_grade?: string;
      curcumin_quality?: number;
      moisture_quality?: number;
      [key: string]: any;
    };
  };
}

export default function ReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState("All Farms");
  const [selectedTest, setSelectedTest] = useState("All Tests");
  const [batchIdFilter, setBatchIdFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Data states
  const [completedData, setCompletedData] = useState<CompletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states for Data Export section
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(2); // จำกัด 2 รายการต่อหน้า

  // Selected items for export
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Export history state
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  const [exportedItemIds, setExportedItemIds] = useState<string[]>([]);

  // Fetch lab info for the current user
  useEffect(() => {
    const fetchLabInfo = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        const response = await fetch(`http://localhost:1337/api/labs?documentId=${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch lab info: ${response.status}`);
        }
        const data = await response.json();
        // You can use the lab info here if needed
        // console.log('Lab info:', data);
      } catch (err) {
        console.error('Error fetching lab info:', err);
      }
    };
    fetchLabInfo();
  }, []);

  // Fetch completed lab submission records
  // แทนที่ฟังก์ชัน fetchCompletedRecords เดิมด้วยโค้ดนี้
  const fetchCompletedRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Fetching Quality Inspection Completed Records ===');

      // Step 1: ลองดึงข้อมูลทั้งหมดก่อน แล้วกรองในฝั่ง client
      console.log('Step 1: Fetching all lab submission records...');

      const response = await fetch(
        `http://localhost:1337/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&filters[Submission_status][$eq]=Completed`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch records: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw API Data:', data);
      console.log('Total records from API:', data.data?.length || 0);

      if (!data.data || data.data.length === 0) {
        console.log('No completed records found');
        setCompletedData([]);
        return;
      }

      // Step 2: Debug แต่ละ record
      console.log('=== Debugging each record ===');
      data.data.forEach((item: any, index: number) => {
        const attrs = item.attributes || item;
        console.log(`Record ${index + 1} (ID: ${item.id}):`, {
          id: item.id,
          submission_status: attrs?.Submission_status,
          curcumin_quality: attrs?.curcumin_quality,
          moisture_quality: attrs?.moisture_quality,
          test_date: attrs?.test_date,
          quality_grade: attrs?.Quality_grade,
          batch_info: attrs?.batch?.data?.attributes?.Batch_id,
          farm_info: attrs?.batch?.data?.attributes?.Farm?.data?.attributes?.Farm_Name
        });
      });

      // Step 3: Process และกรองข้อมูล
      console.log('=== Processing records ===');

      const processedRecords: CompletedRecord[] = [];

      for (let i = 0; i < data.data.length; i++) {
        const item = data.data[i];
        const attrs = item.attributes || item;

        console.log(`\n--- Processing Record ${i + 1} ---`);
        console.log('Item:', item);
        console.log('Attributes:', attrs);

        // ตรวจสอบเงื่อนไขการกรอง
        const hasCurcumin = attrs?.curcumin_quality !== null &&
          attrs?.curcumin_quality !== undefined &&
          attrs?.curcumin_quality > 0;

        const hasMoisture = attrs?.moisture_quality !== null &&
          attrs?.moisture_quality !== undefined &&
          attrs?.moisture_quality > 0;

        const hasTestDate = attrs?.test_date && attrs.test_date !== '';

        const isCompleted = attrs?.Submission_status === 'Completed';

        console.log('Filter conditions:', {
          hasCurcumin,
          hasMoisture,
          hasTestDate,
          isCompleted,
          curcumin_value: attrs?.curcumin_quality,
          moisture_value: attrs?.moisture_quality,
          test_date_value: attrs?.test_date
        });

        // เงื่อนไขการผ่าน: ต้องเป็น Completed และมี test results อย่างน้อย 1 อย่าง
        const passesFilter = isCompleted && (hasCurcumin || hasMoisture);

        console.log('Passes filter:', passesFilter);

        if (!passesFilter) {
          console.log('❌ Record filtered out');
          continue;
        }

        console.log('✅ Record passes filter, processing...');

        // Extract batch and farm info
        let batchId = 'N/A';
        let farmName = 'Unknown Farm';

        console.log('Extracting batch/farm info...');
        console.log('Batch data structure:', attrs?.batch);

        if (attrs?.batch?.data?.attributes) {
          const batchData = attrs.batch.data.attributes;
          batchId = batchData?.Batch_id || 'N/A';
          console.log('Found batch ID:', batchId);

          if (batchData?.Farm?.data?.attributes) {
            farmName = batchData.Farm.data.attributes.Farm_Name || 'Unknown Farm';
            console.log('Found farm name:', farmName);
          }
        } else {
          // Try alternative structures
          console.log('Trying alternative batch structure...');
          if (attrs?.batch?.Batch_id) {
            batchId = attrs.batch.Batch_id;
            farmName = attrs.batch.Farm?.Farm_Name || 'Unknown Farm';
            console.log('Alternative - Batch ID:', batchId, 'Farm:', farmName);
          }
        }

        // Extract harvest record info 
        let yield_amount = 0;
        let yield_unit = 'kg';

        console.log('Extracting harvest info...');
        console.log('Harvest data structure:', attrs?.harvest_record);

        if (attrs?.harvest_record?.data?.attributes) {
          // Structure: harvest_record.data.attributes
          const harvestData = attrs.harvest_record.data.attributes;
          yield_amount = harvestData?.yleld || harvestData?.yield || 0;
          yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
          console.log('Method 1 - Found yield from data.attributes:', yield_amount, yield_unit);
        } else if (attrs?.harvest_record?.data) {
          // Structure: harvest_record.data (direct)
          const harvestData = attrs.harvest_record.data;
          yield_amount = harvestData?.yleld || harvestData?.yield || 0;
          yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
          console.log('Method 2 - Found yield from data:', yield_amount, yield_unit);
        } else if (attrs?.harvest_record) {
          // Structure: harvest_record (direct attributes)
          const harvestData = attrs.harvest_record;
          yield_amount = harvestData?.yleld || harvestData?.yield || 0;
          yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
          console.log('Method 3 - Found yield from direct:', yield_amount, yield_unit);
        } else {
          console.log('No harvest record found');
        }

        // Extract test results
        const curcuminQuality = attrs?.curcumin_quality;
        const moistureQuality = attrs?.moisture_quality;

        // Determine test type
        let testType = 'Unknown';
        if (hasCurcumin && hasMoisture) {
          testType = 'Curcumin/Moisture';
        } else if (hasCurcumin) {
          testType = 'Curcumin';
        } else if (hasMoisture) {
          testType = 'Moisture Content';
        }

        const record: CompletedRecord = {
          id: item.id.toString(),
          batchId,
          farmName,
          testType,
          qualityGrade: attrs?.Quality_grade || 'Not Graded',
          yield: yield_amount,
          yieldUnit: yield_unit,
          dateOfResult: attrs?.test_date || attrs?.Date || attrs?.createdAt || '',
          status: 'Completed',
          curcuminLevel: curcuminQuality || undefined,
          moistureLevel: moistureQuality || undefined,
          testDate: attrs?.test_date || '',
          inspectorNotes: attrs?.inspector_notes || ''
        };

        console.log('Final processed record:', record);
        processedRecords.push(record);
      }

      console.log('=== Final Results ===');
      console.log('Total processed records:', processedRecords.length);
      console.log('Records:', processedRecords);

      if (processedRecords.length === 0) {
        console.warn('⚠️ No records passed the filter criteria');
        console.log('This could mean:');
        console.log('1. No lab submission records have Submission_status = "Completed"');
        console.log('2. No completed records have curcumin_quality or moisture_quality values');
        console.log('3. The data structure is different than expected');
      }

      setCompletedData(processedRecords);

    } catch (err) {
      console.error('❌ Error fetching quality inspection completed records:', err);
      setError(`Error loading quality inspection completed records: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มฟังก์ชัน debug เพื่อตรวจสอบข้อมูลใน database
  const debugDatabaseRecords = async () => {
    try {
      console.log('🔍 DEBUG: Checking database records...');

      // ตรวจสอบข้อมูลใน lab-submission-records
      const labRes = await fetch(
        'http://localhost:1337/api/lab-submission-records?populate=*',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (labRes.ok) {
        const labData = await labRes.json();
        console.log('All lab submission records:', labData.data?.length || 0);

        labData.data?.forEach((record: any, index: number) => {
          console.log(`Lab Record ${index + 1}:`, {
            id: record.id,
            status: record.attributes?.Submission_status,
            curcumin: record.attributes?.curcumin_quality,
            moisture: record.attributes?.moisture_quality,
            test_date: record.attributes?.test_date,
            batch: record.attributes?.batch?.data?.attributes?.Batch_id
          });
        });
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // เรียกใช้ debug function ใน useEffect
  useEffect(() => {
    const initializeData = async () => {
      // เรียก debug ก่อน
      await debugDatabaseRecords();

      // แล้วค่อยดึงข้อมูลจริง
      await fetchCompletedRecords();

      // รอแล้ว fetch export history
      setTimeout(() => {
        fetchExportHistory();
      }, 1500);
    };

    initializeData();
  }, []);

  // อัพเดท fetchExportHistory ให้ใช้ API จริงที่สร้างขึ้นแล้ว
  const fetchExportHistory = async (): Promise<void> => {
    try {
      console.log('=== Fetching Export History from API ===');

      const historyRes = await fetch(
        `http://localhost:1337/api/export-histories?sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      console.log('Export history API status:', historyRes.status);

      if (!historyRes.ok) {
        console.warn(`API error ${historyRes.status}, falling back to localStorage`);
        loadLocalExportHistory();
        return;
      }

      const historyData = await historyRes.json();
      console.log('Raw export history data from API:', historyData);

      if (!historyData.data || historyData.data.length === 0) {
        console.log('No export history found in API, checking localStorage');
        loadLocalExportHistory();
        return;
      }

      // ประมวลผลข้อมูลจาก API
      const processedHistory: ExportHistoryItem[] = [];

      for (const historyItem of historyData.data as APIExportHistoryItem[]) {
        const attrs = historyItem?.attributes || {};

        // ดึง batch_ids จาก API response
        let batchIds: string[] = [];
        if (Array.isArray(attrs.batch_ids)) {
          batchIds = attrs.batch_ids;
        } else if (typeof attrs.batch_ids === 'string') {
          try {
            // ลองแปลงจาก JSON string
            const parsed = JSON.parse(attrs.batch_ids);
            batchIds = Array.isArray(parsed) ? parsed : [attrs.batch_ids];
          } catch {
            batchIds = [attrs.batch_ids];
          }
        }

        console.log('Processing export history item:', {
          id: historyItem.id,
          batchIds: batchIds,
          exportDate: attrs.export_date || attrs.createdAt
        });

        // สำหรับแต่ละ batch_id ใน export history
        for (const batchId of batchIds) {
          try {
            console.log(`Fetching lab record for batch ID: ${batchId}`);

            // ดึงข้อมูล Lab Submission Record แต่ละรายการ
            const recordRes = await fetch(
              `http://localhost:1337/api/lab-submission-records/${batchId}?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
              }
            );

            if (!recordRes.ok) {
              console.warn(`Failed to fetch record ${batchId}:`, recordRes.status);
              continue;
            }

            const recordData: LabSubmissionRecordAPI = await recordRes.json();
            const recordAttrs = recordData.data?.attributes || {};

            console.log(`Record data for batch ${batchId}:`, recordAttrs);

            // ประมวลผลข้อมูล batch
            let batchIdDisplay = 'N/A';
            let farmName = 'Unknown Farm';
            let yield_amount = 0;
            let yield_unit = 'kg';

            // Extract batch และ farm info
            if (recordAttrs?.batch?.data?.attributes) {
              const batch = recordAttrs.batch.data.attributes;
              batchIdDisplay = batch?.Batch_id || 'N/A';

              if (batch?.Farm?.data?.attributes) {
                farmName = batch.Farm.data.attributes.Farm_Name || 'Unknown Farm';
              }
            }

            // Extract harvest record info
            if (recordAttrs?.harvest_record?.data?.attributes) {
              const harvest = recordAttrs.harvest_record.data.attributes;
              yield_amount = harvest?.yleld || harvest?.yield || 0;
              yield_unit = harvest?.Yleld_unit || harvest?.yield_unit || 'kg';
            }

            // กำหนด test type
            const curcuminQuality = recordAttrs?.curcumin_quality;
            const moistureQuality = recordAttrs?.moisture_quality;
            const hasCurcumin = curcuminQuality !== null && curcuminQuality !== undefined && curcuminQuality > 0;
            const hasMoisture = moistureQuality !== null && moistureQuality !== undefined && moistureQuality > 0;

            let testType = 'No Test Results';
            if (hasCurcumin && hasMoisture) {
              testType = 'Curcumin/Moisture';
            } else if (hasCurcumin) {
              testType = 'Curcumin';
            } else if (hasMoisture) {
              testType = 'Moisture Content';
            }

            // เพิ่มเข้า processed history
            processedHistory.push({
              id: `${historyItem.id}-${batchId}`,
              batchId: batchIdDisplay,
              farmName: farmName,
              testType: testType,
              qualityGrade: recordAttrs?.Quality_grade || 'Not Graded',
              yield: yield_amount,
              yieldUnit: yield_unit,
              status: attrs.export_status || 'Export Success',
              exportDate: attrs.export_date || attrs.createdAt || new Date().toISOString(),
              curcuminLevel: curcuminQuality,
              moistureLevel: moistureQuality,
              exportHistoryId: historyItem.id
            });

          } catch (fetchError) {
            console.error(`Error fetching record ${batchId}:`, fetchError);

            // ถ้าดึงข้อมูลไม่ได้ ใส่ข้อมูล placeholder
            processedHistory.push({
              id: `${historyItem.id}-${batchId}-fallback`,
              batchId: `Batch-${batchId}`,
              farmName: 'Unknown Farm',
              testType: 'Unknown',
              qualityGrade: 'Unknown',
              yield: 0,
              yieldUnit: 'kg',
              status: attrs.export_status || 'Export Success',
              exportDate: attrs.export_date || attrs.createdAt || new Date().toISOString(),
              exportHistoryId: historyItem.id
            });
          }
        }
      }

      console.log('Final processed export history:', processedHistory);

      if (processedHistory.length > 0) {
        setExportHistory(processedHistory);
        // บันทึกลง localStorage เป็น backup
        localStorage.setItem('exportHistoryBackup', JSON.stringify(processedHistory));
        console.log('✅ Export history loaded successfully from API');
      } else {
        console.warn('No valid export history items processed, falling back to localStorage');
        loadLocalExportHistory();
      }

    } catch (err) {
      console.error('Error fetching export history from API:', err);
      // ถ้า API error ให้ใช้ localStorage
      loadLocalExportHistory();
    }
  };
  // อัพเดท useEffect
  useEffect(() => {
    const initializeData = async () => {
      await fetchCompletedRecords();
      // รอสักครู่เพื่อให้ completedData โหลดเสร็จ
      setTimeout(() => {
        fetchExportHistory();
      }, 1500);
    };

    initializeData();
  }, []);

  // Filter completed data based on search criteria
  const filteredData = completedData.filter((item: CompletedRecord) => {
    const batchMatch = item.batchId.toLowerCase().includes(batchIdFilter.toLowerCase());
    const farmMatch = selectedFarm === "All Farms" || item.farmName === selectedFarm;
    const testMatch = selectedTest === "All Tests" || item.testType.includes(selectedTest);
    const dateMatch = !dateFilter || item.dateOfResult.includes(dateFilter);

    // ไม่แสดงรายการที่ export แล้ว
    const notExported = !exportedItemIds.includes(item.id);

    return batchMatch && farmMatch && testMatch && dateMatch && notExported;
  });
  // Get unique farm names for dropdown
  const uniqueFarms = [...new Set(completedData.map(item => item.farmName))].filter(name => name !== 'Unknown Farm');

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems([]);
    setSelectAll(false);
  }, [batchIdFilter, selectedFarm, selectedTest, dateFilter]);

  // เพิ่ม useEffect เพื่อดู exportHistory state
  useEffect(() => {
    console.log('Export history state updated:', exportHistory);
  }, [exportHistory]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle item selection
  const handleItemSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentData.map(item => item.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle export data
  const handleExportData = async (): Promise<void> => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to export.');
      return;
    }

    // ตรวจสอบว่ามีรายการที่ export แล้วหรือไม่
    const alreadyExportedItems = selectedItems.filter(id => exportedItemIds.includes(id));
    if (alreadyExportedItems.length > 0) {
      const alreadyExportedNames = completedData
        .filter((item: CompletedRecord) => alreadyExportedItems.includes(item.id))
        .map((item: CompletedRecord) => item.batchId)
        .join(', ');

      alert(`The following items have already been exported:\n${alreadyExportedNames}\n\nPlease select different items.`);
      return;
    }

    const selectedBatchesData = completedData.filter((item: CompletedRecord) => selectedItems.includes(item.id));
    const batchNames = selectedBatchesData.map((item: CompletedRecord) => item.batchId).join(', ');

    const confirmed = confirm(`Export the following batches?\n\n${batchNames}\n\nNote: These items will be removed from the "Ready to Send" list after export.`);

    if (confirmed) {
      try {
        console.log('🚀 Starting export process...');

        // ตรวจสอบซ้ำอีกครั้งก่อน export
        const doubleCheckExported = selectedItems.filter(id => exportedItemIds.includes(id));
        if (doubleCheckExported.length > 0) {
          alert('Some items were already exported by another process. Please refresh and try again.');
          return;
        }

        // อัพเดต exported items ทันที
        const newExportedItems = [...exportedItemIds, ...selectedItems];
        setExportedItemIds(newExportedItems);
        localStorage.setItem('exportedItems', JSON.stringify(newExportedItems));

        console.log('Updated exported items:', newExportedItems);

        // บันทึก Export History ใน API
        const exportResponse = await fetch('http://localhost:1337/api/export-histories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
          body: JSON.stringify({
            data: {
              batch_ids: selectedItems,
              export_date: new Date().toISOString(),
              export_status: 'completed'
            }
          }),
        });

        console.log('Export API response status:', exportResponse.status);

        if (!exportResponse.ok) {
          // Rollback exported items ถ้า API error
          setExportedItemIds(exportedItemIds);
          localStorage.setItem('exportedItems', JSON.stringify(exportedItemIds));

          const errorData = await exportResponse.text();
          console.error('Export API error:', errorData);
          throw new Error(`Export failed: ${exportResponse.status} - ${errorData}`);
        }

        const exportResult = await exportResponse.json();
        console.log('✅ Export API success:', exportResult);

        // สร้าง Notifications สำหรับ Farmers ของแต่ละ batch
        console.log('🔔 Creating farmer notifications...');

        for (const batchData of selectedBatchesData) {
          try {
            // ดึงข้อมูล batch เพื่อหา user_documentId ของ farmer
            const batchRes = await fetch(
              `http://localhost:1337/api/batches?filters[Batch_id][$eq]=${batchData.batchId}&populate=*`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
              }
            );

            if (!batchRes.ok) {
              console.warn(`Could not fetch batch ${batchData.batchId} for notification`);
              continue;
            }

            const batchInfo = await batchRes.json();
            const batch = batchInfo.data?.[0];

            if (!batch) {
              console.warn(`Batch ${batchData.batchId} not found for notification`);
              continue;
            }

            const farmerUserId = batch.attributes?.user_documentId || batch.user_documentId;

            if (!farmerUserId) {
              console.warn(`No farmer user ID found for batch ${batchData.batchId}`);
              continue;
            }

            console.log(`Creating notification for farmer ${farmerUserId}, batch ${batchData.batchId}`);

            // สร้าง notification
            const notificationRes = await fetch('http://localhost:1337/api/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('jwt')}`,
              },
              body: JSON.stringify({
                data: {
                  Text: `Lab test results are ready for batch ${batchData.batchId}. Curcumin: ${batchData.curcuminLevel || 'N/A'}%, Moisture: ${batchData.moistureLevel || 'N/A'}%, Grade: ${batchData.qualityGrade}`,
                  Date: new Date().toISOString(),
                  Notification_status: 'Lab Results Ready',
                  batch: batch.documentId || batch.id,
                  user_documentId: farmerUserId,
                }
              })
            });

            if (notificationRes.ok) {
              console.log(`✅ Notification created for farmer ${farmerUserId}, batch ${batchData.batchId}`);
            } else {
              console.warn(`❌ Failed to create notification for batch ${batchData.batchId}:`, notificationRes.status);
            }

          } catch (notificationError) {
            console.error(`Error creating notification for batch ${batchData.batchId}:`, notificationError);
          }
        }

        // บันทึกลง localStorage backup
        const backupHistoryItem: ExportHistoryItem[] = selectedBatchesData.map((item: CompletedRecord) => ({
          id: `api-${exportResult.data?.id || Date.now()}-${item.id}`,
          batchId: item.batchId,
          farmName: item.farmName,
          testType: item.testType,
          qualityGrade: item.qualityGrade,
          yield: item.yield,
          yieldUnit: item.yieldUnit,
          status: 'Export Success',
          exportDate: new Date().toISOString(),
          curcuminLevel: item.curcuminLevel,
          moistureLevel: item.moistureLevel,
          exportHistoryId: exportResult.data?.id
        }));

        // อัพเดต localStorage backup (ไม่ให้ซ้ำ)
        const currentBackup: ExportHistoryItem[] = JSON.parse(localStorage.getItem('exportHistoryBackup') || '[]');

        // กรองข้อมูลซ้ำออก
        const filteredBackup = currentBackup.filter((existingItem: ExportHistoryItem) =>
          !backupHistoryItem.some((newItem: ExportHistoryItem) =>
            existingItem.batchId === newItem.batchId &&
            new Date(existingItem.exportDate).toDateString() === new Date(newItem.exportDate).toDateString()
          )
        );

        const updatedBackup = [...backupHistoryItem, ...filteredBackup].slice(0, 50);
        localStorage.setItem('exportHistoryBackup', JSON.stringify(updatedBackup));

        // อัพเดท export history state (ไม่ให้ซ้ำ)
        setExportHistory((prev: ExportHistoryItem[]) => {
          const filteredPrev = prev.filter((existingItem: ExportHistoryItem) =>
            !backupHistoryItem.some((newItem: ExportHistoryItem) =>
              existingItem.batchId === newItem.batchId &&
              new Date(existingItem.exportDate).toDateString() === new Date(newItem.exportDate).toDateString()
            )
          );
          return [...backupHistoryItem, ...filteredPrev];
        });

        alert(`Successfully exported ${selectedItems.length} batch(es)!\n\nBatches: ${batchNames}\n\nThese items have been moved to Export History.`);

        // Reset selection
        setSelectedItems([]);
        setSelectAll(false);

        // รอแล้ว refresh export history
        setTimeout(async () => {
          console.log('🔄 Delayed refresh export history...');
          await fetchExportHistory();
        }, 2000);

      } catch (err: unknown) {
        console.error('Export error:', err);

        // Rollback exported items ถ้า error
        setExportedItemIds(exportedItemIds);
        localStorage.setItem('exportedItems', JSON.stringify(exportedItemIds));

        const errorMessage = err instanceof Error ? err.message : String(err);
        alert(`Export failed: ${errorMessage}\n\nPlease try again.`);

        // Reset selection
        setSelectedItems([]);
        setSelectAll(false);
      }
    }
  };

  const resetExportedItems = (): void => {
    const confirmed = confirm('Reset all exported items?\n\nThis will make all previously exported items available for export again.\n\nThis action should only be used for testing.');

    if (confirmed) {
      setExportedItemIds([]);
      localStorage.removeItem('exportedItems');
      console.log('✅ Exported items reset');
      alert('Exported items have been reset. Previously exported items will now appear in the "Ready to Send" list again.');
    }
  };

  const clearExportHistory = (): void => {
    const confirmed = confirm('Clear all export history?\n\nThis will remove all export history records.\n\nThis action should only be used for testing.');

    if (confirmed) {
      setExportHistory([]);
      localStorage.removeItem('exportHistory');
      localStorage.removeItem('exportHistoryBackup');
      console.log('✅ Export history cleared');
      alert('Export history has been cleared.');
    }
  };

  const hiddenItemsCount = completedData.length - filteredData.length;

  // เพิ่มฟังก์ชันเพื่อ manual refresh export history
  const manualRefreshExportHistory = async (): Promise<void> => {
    console.log('🔄 Manual refresh export history...');
    setExportHistory([]); // ล้างก่อน

    try {
      await fetchExportHistory();
      console.log('✅ Manual refresh completed');
    } catch (error: unknown) {
      console.error('❌ Manual refresh failed:', error);
      // ถ้าไม่ได้ ลองใช้ backup
      loadLocalExportHistory();
    }
  };

  // เพิ่มฟังก์ชัน debug เพื่อตรวจสอบ API
  const debugCurrentExportHistory = async (): Promise<void> => {
    console.log('🔍 Debug: Checking current export history in API...');

    try {
      const response = await fetch(
        'http://localhost:1337/api/export-histories?sort=createdAt:desc',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      console.log('API Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Data:', data);
        console.log('Number of items:', data.data?.length || 0);

        data.data?.forEach((item: any, index: number) => {
          console.log(`Item ${index + 1}:`, {
            id: item.id,
            batch_ids: item.attributes?.batch_ids,
            created: item.attributes?.createdAt
          });
        });
      } else {
        console.error('API Error:', await response.text());
      }
    } catch (error: unknown) {
      console.error('Debug error:', error);
    }
  };


  const loadLocalExportHistory = (): void => {
    try {
      console.log('🔄 Loading export history from localStorage...');

      // ลองโหลดจาก backup ก่อน
      const backupHistory = localStorage.getItem('exportHistoryBackup');
      if (backupHistory) {
        const parsed: ExportHistoryItem[] = JSON.parse(backupHistory);
        console.log('✅ Loaded export history from backup:', parsed);
        setExportHistory(parsed);
        return;
      }

      // ถ้าไม่มี backup ใช้ local history เก่า
      const localHistory = localStorage.getItem('exportHistory');
      if (localHistory) {
        const parsed: ExportHistoryItem[] = JSON.parse(localHistory);
        console.log('✅ Loaded export history from local storage:', parsed);
        setExportHistory(parsed);
      } else {
        console.log('ℹ️ No export history found in localStorage');
        setExportHistory([]);
      }
    } catch (error) {
      console.error('❌ Error loading local export history:', error);
      setExportHistory([]);
    }
  };

  const saveToLocalExportHistory = (newExportItems: CompletedRecord[]): void => {
    try {
      const currentHistory: ExportHistoryItem[] = JSON.parse(
        localStorage.getItem('exportHistory') || '[]'
      );

      const newHistoryItems: ExportHistoryItem[] = newExportItems.map((item: CompletedRecord) => ({
        id: `local-${Date.now()}-${item.id}`,
        batchId: item.batchId,
        farmName: item.farmName,
        testType: item.testType,
        qualityGrade: item.qualityGrade,
        yield: item.yield,
        yieldUnit: item.yieldUnit,
        exportDate: new Date().toISOString(),
        status: 'Export Success (Local)',
        exportId: Date.now() + Math.random(),
        curcuminLevel: item.curcuminLevel,
        moistureLevel: item.moistureLevel
      }));

      const updatedHistory = [...newHistoryItems, ...currentHistory];
      const limitedHistory = updatedHistory.slice(0, 50);

      localStorage.setItem('exportHistory', JSON.stringify(limitedHistory));
      setExportHistory(limitedHistory);

      console.log('✅ Saved export history to localStorage:', limitedHistory);
    } catch (error) {
      console.error('❌ Error saving local export history:', error);
    }
  };

  const debugExportHistoryAPI = async (): Promise<void> => {
    console.log('🐛 Debug: Checking Export History API...');

    try {
      // ทดสอบ GET
      const getRes = await fetch('http://localhost:1337/api/export-histories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }
      });

      console.log('GET /export-histories status:', getRes.status);

      if (getRes.ok) {
        const getData = await getRes.json();
        console.log('GET data:', getData);
      } else {
        console.error('GET error:', await getRes.text());
      }
    } catch (err) {
      console.error('Debug API test failed:', err);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    // Search logic is handled by filteredData
  };


  const createTestExportHistory = () => {
    console.log('🧪 Creating test export history...');

    const testHistory = [
      {
        id: 'test-1',
        batchId: 'T-Batch-001',
        farmName: 'MFU Farm',
        testType: 'Curcumin/Moisture',
        qualityGrade: 'B',
        yield: 1000,
        yieldUnit: 'kg',
        status: 'Export Success',
        exportDate: new Date().toISOString(),
        curcuminLevel: 10,
        moistureLevel: 20
      },
      {
        id: 'test-2',
        batchId: 'T-Batch-002',
        farmName: 'Test Farm',
        testType: 'Curcumin',
        qualityGrade: 'A',
        yield: 500,
        yieldUnit: 'kg',
        status: 'Export Success',
        exportDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // เมื่อวาน
        curcuminLevel: 50
      }
    ];

    setExportHistory(testHistory);
    localStorage.setItem('exportHistory', JSON.stringify(testHistory));
    console.log('✅ Test export history created');
  };


  // โหลดจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const saved = localStorage.getItem('exportedItems');
    if (saved) {
      setExportedItemIds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    console.log('🔄 Export history state updated:', exportHistory.length, 'items');
    exportHistory.forEach((item, index) => {
      console.log(`Export item ${index + 1}:`, {
        id: item.id,
        batchId: item.batchId,
        farmName: item.farmName,
        exportDate: item.exportDate
      });
    });
  }, [exportHistory]);

  const handleReset = () => {
    setBatchIdFilter("");
    setSelectedFarm("All Farms");
    setSelectedTest("All Tests");
    setDateFilter("");
    setCurrentPage(1);
    setSelectedItems([]);
    setSelectAll(false);
  };

  // Format date display
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      // ตรวจสอบว่าเป็น valid date
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };
  const determineTestStatus = (curcuminLevel: number | null | undefined, moistureLevel: number | null | undefined): string => {
    const curcuminThreshold = 3.0; // minimum 3% curcumin
    const moistureThreshold = 15.0; // maximum 15% moisture

    const curcuminPass = curcuminLevel === null || curcuminLevel === undefined || curcuminLevel >= curcuminThreshold;
    const moisturePass = moistureLevel === null || moistureLevel === undefined || moistureLevel <= moistureThreshold;

    return (curcuminPass && moisturePass) ? 'Passed' : 'Failed';
  };

  if (loading) {
    return (
      <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
              <h1 className="text-2xl font-semibold text-gray-800">
                Reports & Data Export
              </h1>
            </div>
          </header>
          <main className="flex-1 p-6 bg-gray-50 overflow-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading completed test results...</p>
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
          <header className="flex justify-between h-16 items-center gap-2 px-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
              <h1 className="text-2xl font-semibold text-gray-800">
                Reports & Data Export
              </h1>
            </div>
          </header>
          <main className="flex-1 p-6 bg-gray-50 overflow-auto">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={fetchCompletedRecords}
                      className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
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
            <SidebarTrigger onClick={() => setIsSidebarOpen(prev => !prev)} />
            <h1 className="text-2xl font-semibold text-gray-800">
              Reports & Data Export
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            Completed Results: {totalItems} items
          </div>
        </header>
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          {/* Search Form */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <input
                  type="text"
                  placeholder="Enter batch ID"
                  value={batchIdFilter}
                  onChange={(e) => setBatchIdFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Result</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                <div className="relative">
                  <select
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedFarm}
                    onChange={(e) => setSelectedFarm(e.target.value)}
                  >
                    <option>All Farms</option>
                    {uniqueFarms.map((farmName) => (
                      <option key={farmName} value={farmName}>
                        {farmName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                <div className="relative">
                  <select
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                  >
                    <option>All Tests</option>
                    <option>Curcumin</option>
                    <option>Moisture Content</option>
                    <option>Curcumin/Moisture</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center hover:bg-green-600"
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </button>
            </div>
          </div>

          {/* Data Export Section */}
          <div className="bg-white rounded-md shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium">Completed Test Results - Ready to Send</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {Math.min(currentData.length, itemsPerPage)} of {filteredData.length} available results
                  {hiddenItemsCount > 0 && (
                    <span className="text-blue-600 ml-2">
                      ({hiddenItemsCount} items already exported and hidden)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <span className="text-sm text-gray-600 flex items-center mr-2">
                    {selectedItems.length} item(s) selected
                  </span>
                )}
                <button
                  onClick={handleExportData}
                  disabled={selectedItems.length === 0}
                  className={`px-4 py-2 rounded-md flex items-center ${selectedItems.length > 0
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <FileDownload />
                  <span className="ml-1">Export Data ({selectedItems.length})</span>
                </button>
              </div>
            </div>


            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-700 border-b">
                  <th className="pb-2 w-8">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="pb-2">Batch ID</th>
                  <th className="pb-2">Farm Name</th>
                  <th className="pb-2">Test Type</th>
                  <th className="pb-2">Quality Grade</th>
                  <th className="pb-2">Yield</th>
                  <th className="pb-2">Test Results</th>
                  <th className="pb-2">Date of Result</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No completed results found matching your criteria
                    </td>
                  </tr>
                ) : (
                  currentData.map((result) => {
                    const testStatus = determineTestStatus(result.curcuminLevel, result.moistureLevel);

                    return (
                      <tr key={result.id} className="text-sm border-b hover:bg-gray-50">
                        <td className="py-3">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedItems.includes(result.id)}
                            onChange={() => handleItemSelect(result.id)}
                          />
                        </td>
                        <td className="py-3 font-medium">{result.batchId}</td>
                        <td className="py-3">{result.farmName}</td>
                        <td className="py-3">{result.testType}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.qualityGrade === 'A'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            Grade {result.qualityGrade}
                          </span>
                        </td>
                        <td className="py-3">{result.yield} {result.yieldUnit}</td>
                        <td className="py-3">
                          <div className={`text-xs ${testStatus === 'Failed' ? 'text-red-600' : 'text-gray-900'}`}>
                            {result.curcuminLevel && (
                              <div>Curcumin: {result.curcuminLevel}%</div>
                            )}
                            {result.moistureLevel && (
                              <div>Moisture: {result.moistureLevel}%</div>
                            )}
                            {!result.curcuminLevel && !result.moistureLevel && (
                              <div className="text-gray-400">No data</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3">{formatDate(result.dateOfResult)}</td>
                        <td className="py-3">
                          {testStatus === "Passed" ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <Check size={14} className="mr-1" /> Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              <X size={14} className="mr-1" /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="p-1 rounded-full hover:bg-gray-100 disabled:text-gray-300"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${i + 1 === currentPage
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-full hover:bg-gray-100 disabled:text-gray-300"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Export History */}
          <div className="bg-white rounded-md shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Export History</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search batches..."
                    className="px-3 py-1 pl-8 border border-gray-300 rounded-md text-sm"
                  />
                  <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-700 border-b">
                  <th className="pb-2">Batch ID</th>
                  <th className="pb-2">Farm Name</th>
                  <th className="pb-2">Test Type</th>
                  <th className="pb-2">Quality Grade</th>
                  <th className="pb-2">Yield</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {exportHistory.length === 0 ? (
                  // แทนที่จะแสดง "No export history available" 
                  // ให้แสดงข้อมูล mock หรือคำแนะนำ
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="text-gray-500">
                        <p className="mb-2">No export history yet</p>
                        <p className="text-sm text-gray-400">
                          Export some completed test results to see them here
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exportHistory.slice(0, 10).map((history, index) => (
                    <tr key={history.exportId || history.id || index} className="text-sm border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{history.batchId}</td>
                      <td className="py-3">{history.farmName}</td>
                      <td className="py-3">{history.testType}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${history.qualityGrade === 'A'
                          ? 'bg-green-100 text-green-800'
                          : history.qualityGrade === 'B'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          Grade {history.qualityGrade}
                        </span>
                      </td>
                      <td className="py-3">{history.yield} {history.yieldUnit}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {history.status || 'Export Success'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-gray-500 text-xs">
                          {history.exportDate ? formatDate(history.exportDate) : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}