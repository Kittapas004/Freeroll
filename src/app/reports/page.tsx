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

interface CompletedRecord {
  id: string;
  documentId?: string | number; // ⭐ เพิ่มฟิลด์นี้สำหรับ API calls
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
  exported?: boolean; // ⭐ เพิ่มฟิลด์นี้
  exportStatus?: string; // ⭐ เพิ่มฟิลด์นี้
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
  exportHistoryId?: string | number;
  exportId?: string | number;
  exportedBy?: string;
  documentId?: string | number;
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
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [exportHistorySearch, setExportHistorySearch] = useState("");

  // Filter export history in real time
  const filteredExportHistory: ExportHistoryItem[] = exportHistory.filter((item: ExportHistoryItem) => {
    const q = exportHistorySearch.toLowerCase();
    return (
      item.batchId?.toLowerCase().includes(q) ||
      item.farmName?.toLowerCase().includes(q) ||
      item.testType?.toLowerCase().includes(q) ||
      item.qualityGrade?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      item.exportedBy?.toLowerCase().includes(q)
    );
  });

  const [exportedItemIds, setExportedItemIds] = useState<string[]>([]);

  // Fetch lab info for the current user
  useEffect(() => {
    const fetchLabInfo = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        const response = await fetch(`https://api-freeroll-production.up.railway.app/api/labs?documentId=${userId}`, {
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

  // แก้ไขการประมวลผลข้อมูลใน fetchCompletedRecords
  const fetchCompletedRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Fetching Quality Inspection Completed Records (Updated for HPLC) ===');

      // Step 1: ดึงข้อมูลทั้งหมดที่ Completed
      console.log('Step 1: Fetching all completed lab submission records...');

      const response = await fetch(
        `https://api-freeroll-production.up.railway.app/api/lab-submission-records?populate[batch][populate][Farm][populate]=*&populate[harvest_record][populate]=*&filters[Submission_status][$eq]=Completed`,
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
          testing_method: attrs?.testing_method,
          // Standard test results
          curcumin_quality: attrs?.curcumin_quality,
          moisture_quality: attrs?.moisture_quality,
          // HPLC test results
          hplc_total_curcuminoids: attrs?.hplc_total_curcuminoids,
          hplc_moisture_quantity: attrs?.hplc_moisture_quantity,
          test_date: attrs?.test_date,
          quality_grade: attrs?.Quality_grade,
          batch_info: attrs?.batch?.data?.attributes?.Batch_id,
          farm_info: attrs?.batch?.data?.attributes?.Farm?.data?.attributes?.Farm_Name
        });
      });

      // Step 3: Process และกรองข้อมูล (รองรับ HPLC)
      console.log('=== Processing records (with HPLC support) ===');

      const processedRecords: CompletedRecord[] = [];

      for (let i = 0; i < data.data.length; i++) {
        const item = data.data[i];
        const attrs = item.attributes || item;

        console.log(`\n--- Processing Record ${i + 1} ---`);
        console.log('Item:', item);
        console.log('Attributes:', attrs);

        // ตรวจสอบ testing method
        const testingMethod = attrs?.testing_method || 'NIR Spectroscopy';
        console.log('Testing method:', testingMethod);

        // ตรวจสอบเงื่อนไขการกรองแยกตาม testing method
        let hasTestResults = false;
        let curcuminValue = null;
        let moistureValue = null;
        let testType = 'Unknown';

        if (testingMethod === 'HPLC') {
          // สำหรับ HPLC
          const hplcCurcuminoids = attrs?.hplc_total_curcuminoids;
          const hplcMoisture = attrs?.hplc_moisture_quantity;

          const hasHPLCCurcuminoids = hplcCurcuminoids !== null &&
            hplcCurcuminoids !== undefined &&
            hplcCurcuminoids !== '';

          const hasHPLCMoisture = hplcMoisture !== null &&
            hplcMoisture !== undefined &&
            hplcMoisture !== '';

          hasTestResults = hasHPLCCurcuminoids || hasHPLCMoisture;

          if (hasTestResults) {
            // แปลงค่า HPLC เพื่อแสดงผล
            if (hasHPLCCurcuminoids) {
              curcuminValue = parseFloat(hplcCurcuminoids) / 10; // mg/g to % for comparison
            }
            if (hasHPLCMoisture) {
              moistureValue = parseFloat(hplcMoisture);
            }

            // กำหนด test type สำหรับ HPLC
            if (hasHPLCCurcuminoids && hasHPLCMoisture) {
              testType = 'HPLC - Curcuminoids/Moisture';
            } else if (hasHPLCCurcuminoids) {
              testType = 'HPLC - Curcuminoids';
            } else if (hasHPLCMoisture) {
              testType = 'HPLC - Moisture Content';
            }
          }

          console.log('HPLC test results:', {
            hplcCurcuminoids,
            hplcMoisture,
            hasHPLCCurcuminoids,
            hasHPLCMoisture,
            curcuminValue,
            moistureValue,
            testType
          });

        } else {
          // สำหรับ NIR/UV-Vis (เดิม)
          const standardCurcumin = attrs?.curcumin_quality;
          const standardMoisture = attrs?.moisture_quality;

          const hasCurcumin = standardCurcumin !== null &&
            standardCurcumin !== undefined &&
            standardCurcumin > 0;

          const hasMoisture = standardMoisture !== null &&
            standardMoisture !== undefined &&
            standardMoisture > 0;

          hasTestResults = hasCurcumin || hasMoisture;

          if (hasTestResults) {
            curcuminValue = standardCurcumin;
            moistureValue = standardMoisture;

            // กำหนด test type สำหรับ standard methods
            if (hasCurcumin && hasMoisture) {
              testType = 'Curcuminoids/Moisture';
            } else if (hasCurcumin) {
              testType = 'Curcuminoids';
            } else if (hasMoisture) {
              testType = 'Moisture';
            }
          }

          console.log('Standard test results:', {
            standardCurcumin,
            standardMoisture,
            hasCurcumin,
            hasMoisture,
            curcuminValue,
            moistureValue,
            testType
          });
        }

        const hasTestDate = attrs?.test_date && attrs.test_date !== '';
        const isCompleted = attrs?.Submission_status === 'Completed';

        console.log('Filter conditions:', {
          hasTestResults,
          hasTestDate,
          isCompleted,
          testingMethod
        });

        // เงื่อนไขการผ่าน: ต้องเป็น Completed และมี test results
        const passesFilter = isCompleted && hasTestResults;

        console.log('Passes filter:', passesFilter);

        if (!passesFilter) {
          console.log('❌ Record filtered out');
          continue;
        }

        console.log('✅ Record passes filter, processing...');

        // Extract batch and farm info (เหมือนเดิม)
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

        // Extract harvest record info (เหมือนเดิม)
        let yield_amount = 0;
        let yield_unit = 'kg';

        console.log('Extracting harvest info...');
        console.log('Harvest data structure:', attrs?.harvest_record);

        if (attrs?.harvest_record?.data?.attributes) {
          const harvestData = attrs.harvest_record.data.attributes;
          yield_amount = harvestData?.yleld || harvestData?.yield || 0;
          yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
          console.log('Method 1 - Found yield from data.attributes:', yield_amount, yield_unit);
        } else if (attrs?.harvest_record?.data) {
          const harvestData = attrs.harvest_record.data;
          yield_amount = harvestData?.yleld || harvestData?.yield || 0;
          yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
          console.log('Method 2 - Found yield from data:', yield_amount, yield_unit);
        } else if (attrs?.harvest_record) {
          const harvestData = attrs.harvest_record;
          yield_amount = harvestData?.yleld || harvestData?.yield || 0;
          yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
          console.log('Method 3 - Found yield from direct:', yield_amount, yield_unit);
        } else {
          console.log('No harvest record found');
        }

        const record: CompletedRecord = {
          id: item.id.toString(),
          documentId: item.documentId || item.id,
          batchId,
          farmName,
          testType,
          qualityGrade: attrs?.Quality_grade || 'Not Graded',
          yield: yield_amount,
          yieldUnit: yield_unit,
          dateOfResult: attrs?.test_date || attrs?.Date || attrs?.createdAt || '',
          status: 'Completed',
          curcuminLevel: curcuminValue || undefined,
          moistureLevel: moistureValue || undefined,
          testDate: attrs?.test_date || '',
          inspectorNotes: attrs?.inspector_notes || '',
          exported: attrs?.exported || false,
          exportStatus: attrs?.export_status || 'Pending Export'
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
        console.log('2. No completed records have test results (standard or HPLC)');
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

  // เรียกใช้ debug function ใน useEffect
  useEffect(() => {
    const initializeData = async () => {
      await fetchCompletedRecords();

      // รอสักครู่แล้วโหลด export history
      setTimeout(() => {
        fetchExportHistory();
      }, 1000);
    };

    initializeData();
  }, []);

  // Auto-refresh processedRecords and exportHistory every 30 seconds (flicker-free)
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const refreshData = async () => {
      setLoading(true);
      try {
        await fetchCompletedRecords();
        await fetchExportHistory();
      } catch (err) {
        // Error handled in fetch functions
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    intervalId = setInterval(refreshData, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const clearExportHistory = async () => {
    const confirmed = confirm('Clear all export history?\n\nThis will remove all records from the database.');

    if (!confirmed) return;

    try {
      for (const item of exportHistory) {
        await fetch(`https://api-freeroll-production.up.railway.app/api/export-histories/${item.documentId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });
      }
      setExportHistory([]);
      console.log("✅ Export history cleared from API");
    } catch (err) {
      console.error("❌ Error clearing export history:", err);
    }
  };

  let labID = '';
  let UserName = '';

  const fetchUserData = async (): Promise<void> => {
    try {
      const res = await fetch('https://api-freeroll-production.up.railway.app/api/users/me?populate=*', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }

      const user = await res.json();
      labID = user.lab?.id;
      UserName = user.username || 'Unknown User';

      console.log("Lab Id:", labID);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExportHistory = async (): Promise<void> => {
    try {
      console.log('=== Loading Export History from API ===');
      const res = await fetch('https://api-freeroll-production.up.railway.app/api/export-histories?populate=*', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch export history: ${res.status}`);
      }

      const data = await res.json();
      console.log("Export history API data:", data);

      // Transform API response to match ExportHistoryItem[]
      const history: ExportHistoryItem[] = data.data.map((item: any) => {
        return {
          id: item.id,
          documentId: item.documentId,
          batchId: item.batch_name || "N/A",
          lab: item.lab?.Lab_Name || "Unknown Lab",
          farmName: item.farm_name || "Unknown Farm",
          testType: item.test_type || "N/A",
          qualityGrade: item.quality_grade || "Not Graded",
          yield: item.yield || 0,
          yieldUnit: item.yield_unit || "kg",
          status: item.export_status || "Unknown",
          exportDate: item.export_date || new Date().toISOString(),
          exportedBy: item.exported_by || "Unknown User",
        };
      });

      setExportHistory(history);
    } catch (err) {
      console.error("❌ Error fetching export history:", err);
      setExportHistory([]); // fallback: empty state
    }
  };


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

  useEffect(() => {
    // เมื่อ completedData เปลี่ยนแปลง ให้ refresh export history
    if (completedData.length > 0) {
      fetchExportHistory();
    }
  }, [completedData]);

  // Filter completed data based on search criteria
  const filteredData = completedData.filter((item: CompletedRecord) => {
    const batchMatch = item.batchId.toLowerCase().includes(batchIdFilter.toLowerCase());
    const farmMatch = selectedFarm === "All Farms" || item.farmName === selectedFarm;
    const testMatch = selectedTest === "All Tests" || item.testType.includes(selectedTest);
    const dateMatch = !dateFilter || item.dateOfResult.includes(dateFilter);

    // ⭐ ไม่แสดงรายการที่ export แล้ว (ทั้งจาก exported field และ exportedItemIds)
    const notExported = !item.exported && !exportedItemIds.includes(item.id);

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

  const handleExportData = async (): Promise<void> => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to export.');
      return;
    }

    const selectedBatchesData = completedData.filter((item: CompletedRecord) => selectedItems.includes(item.id));

    if (selectedBatchesData.length === 0) {
      alert('Error: No matching records found for selected items. Please refresh and try again.');
      return;
    }

    const idMapping = selectedBatchesData.map(item => ({
      frontendId: item.id,
      apiId: item.documentId || item.id,
      batchId: item.batchId,
      farmName: item.farmName,
      testType: item.testType,
      qualityGrade: item.qualityGrade,
      yield: item.yield,
      yieldUnit: item.yieldUnit,
    }));

    const batchNames = selectedBatchesData.map((item: CompletedRecord) => item.batchId).join(', ');

    const confirmed = confirm(
      `Export the following batches?\n\n${batchNames}\n\n` +
      `⚠️ Note: After export, these results will become available to farmers.`
    );

    if (confirmed) {
      try {
        console.log('🚀 Starting export process...');

        // Step 1: Update exported status
        for (const mapping of idMapping) {
          const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/lab-submission-records/${mapping.apiId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('jwt')}`,
            },
            body: JSON.stringify({
              data: {
                exported: true,
                export_status: 'Exported',
                export_date: new Date().toISOString()
              }
            }),
          });
          await fetchUserData();
          const createExportHistoryRes = await fetch('https://api-freeroll-production.up.railway.app/api/export-histories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
          body: JSON.stringify({
            data: {
              batch_ids: mapping.apiId,
              export_date: new Date().toISOString(),
              export_status: 'Export Success',
              lab: Number(labID),
              exported_by: UserName,
              exported: true,
              batch_name: String(mapping.batchId),
              farm_name: String(mapping.farmName),
              test_type: String(mapping.testType),
              quality_grade: String(mapping.qualityGrade),
              yield: Number(mapping.yield),
              yield_unit: String(mapping.yieldUnit),
            }
          }),
        });

          if (!updateRes.ok && !createExportHistoryRes.ok) {
            throw new Error(`Failed to update export status for record ${mapping.apiId}`);
          }
        }

        alert(
          `🎉 Successfully exported ${selectedItems.length} batch(es)!\n\n` +
          `Batches: ${batchNames}\n\n` +
          `✅ These results are now available to farmers.`
        );

        // Reset selection
        setSelectedItems([]);
        setSelectAll(false);

        // อัพเดต completedData
        setCompletedData(prev =>
          prev.map(item =>
            selectedItems.includes(item.id)
              ? { ...item, exported: true, exportStatus: 'Exported' }
              : item
          )
        );

        console.log('✅ Export completed and saved to localStorage');

      } catch (err: unknown) {
        console.error('❌ Export error:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert(`❌ Export failed: ${errorMessage}`);
        setSelectedItems([]);
        setSelectAll(false);
      }
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    // Search logic is handled by filteredData
  };

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
                  {/* <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" /> */}
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
                    <option>Curcuminoids</option>
                    <option>Moisture</option>
                    <option>Curcuminoids/Moisture</option>
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
                              <div>Curcuminoids: {result.curcuminLevel}%</div>
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
                <button
                  onClick={clearExportHistory}
                  className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                >
                  Clear History
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={exportHistorySearch}
                    onChange={e => setExportHistorySearch(e.target.value)}
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
                  <th className="pb-2">Export Date</th>
                  <th className="pb-2">Exported By</th>
                </tr>
              </thead>
              <tbody>
                {filteredExportHistory.length === 0 ? (
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
        filteredExportHistory.slice(0, 10).map((history, index) => (
          <tr key={history.id || index} className="text-sm border-b hover:bg-gray-50">
            <td className="py-3 font-medium">{history.batchId}</td>
            <td className="py-3">{history.farmName}</td>
            <td className="py-3">{history.testType}</td>
            <td className="py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${history.qualityGrade === 'A' || history.qualityGrade === 'Grade A'
                ? 'bg-green-100 text-green-800'
                : history.qualityGrade === 'B' || history.qualityGrade === 'Grade B'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
                }`}>
                {history.qualityGrade}
              </span>
            </td>
            <td className="py-3">{history.yield} {history.yieldUnit}</td>
            <td className="py-3">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {history.status}
              </span>
            </td>
            <td className="py-3">
              <span className="text-gray-500 text-xs">
                {formatDate(history.exportDate)}
              </span>
            </td>
            <td className="py-3">
                {history.exportedBy}
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