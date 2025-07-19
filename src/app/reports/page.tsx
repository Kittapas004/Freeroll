'use client'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, CheckCircle, ArrowRight, ArrowLeft, Send } from "lucide-react";

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
  
  // Selected items for sending to farmer
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Export history state
  const [exportHistory, setExportHistory] = useState<any[]>([]);
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
  const fetchCompletedRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Fetching Completed Records ===');

      // Get all lab submission records with Completed status
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
        throw new Error(`Failed to fetch records: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API Data:', data);

      console.log('API Response Structure:', JSON.stringify(data.data[0], null, 2));

      if (!data.data || data.data.length === 0) {
        console.log('No completed records found');
        setCompletedData([]);
        return;
      }

      // Process the records 
      const processedRecords: CompletedRecord[] = data.data.map((item: any) => {
        const attrs = item.attributes || item;

        // Extract batch and farm info with multiple fallback methods
        let batchId = 'N/A';
        let farmName = 'Unknown Farm';

        if (attrs?.batch?.data?.attributes) {
          const batchData = attrs.batch.data.attributes;
          batchId = batchData?.Batch_id || 'N/A';

          if (batchData?.Farm?.data?.attributes) {
            farmName = batchData.Farm.data.attributes.Farm_Name || 'Unknown Farm';
          }
        } else if (attrs?.batch?.data) {
          // Alternative structure
          batchId = attrs.batch.data?.Batch_id || 'N/A';
          farmName = attrs.batch.data?.Farm?.Farm_Name || 'Unknown Farm';
        } else if (item?.batch) {
          // Direct access
          batchId = item.batch?.Batch_id || 'N/A';
          farmName = item.batch?.Farm?.Farm_Name || 'Unknown Farm';
        }

        // Extract harvest record info 
        let yield_amount = 0;
        let yield_unit = 'kg';
        if (attrs?.harvest_record?.data) {
          const harvestData = attrs.harvest_record.data.attributes;
          yield_amount = harvestData?.yleld || harvestData?.yield || 0;
          yield_unit = harvestData?.Yleld_unit || harvestData?.yield_unit || 'kg';
        } else {
          // fallback
          yield_amount = item.harvest_record?.yleld || 0;
          yield_unit = item.harvest_record?.Yleld_unit || 'kg';
        }

        // Determine test type based on available data
        let testType = 'Unknown';
        if (attrs?.curcumin_quality && attrs?.moisture_quality) {
          testType = 'Curcumin/Moisture';
        } else if (attrs?.curcumin_quality) {
          testType = 'Curcumin';
        } else if (attrs?.moisture_quality) {
          testType = 'Moisture Content';
        }

        const record: CompletedRecord = {
          id: item.id.toString(),
          batchId,
          farmName,
          testType: 'Curcumin/Moisture', // your logic here
          qualityGrade: attrs?.Quality_grade || 'Not Graded',
          yield: yield_amount,
          yieldUnit: yield_unit,
          dateOfResult: attrs?.test_date || attrs?.Date || attrs?.createdAt || '',
          status: attrs?.Submission_status || 'Completed',
          curcuminLevel: attrs?.curcumin_quality || undefined,
          moistureLevel: attrs?.moisture_quality || undefined,
          testDate: attrs?.test_date || '',
          inspectorNotes: attrs?.inspector_notes || ''
        };

        

        return record;
      });

      console.log('Final processed records:', processedRecords);
      setCompletedData(processedRecords);

    } catch (err) {
      console.error('Error fetching completed records:', err);
      setError(`Error loading completed records: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch export history (records that have been sent to farmers)
  const fetchExportHistory = async () => {
    try {
      // This would be a separate API call for records that have been exported/sent
      // For now, we'll leave it empty until the export functionality is implemented
      setExportHistory([]);
    } catch (err) {
      console.error('Error fetching export history:', err);
    }
  };

  useEffect(() => {
    fetchCompletedRecords();
    fetchExportHistory();
  }, []);

  // Filter completed data based on search criteria
  const filteredData = completedData.filter(item => {
    const batchMatch = item.batchId.toLowerCase().includes(batchIdFilter.toLowerCase());
    const farmMatch = selectedFarm === "All Farms" || item.farmName === selectedFarm;
    const testMatch = selectedTest === "All Tests" || item.testType.includes(selectedTest);
    const dateMatch = !dateFilter || item.dateOfResult.includes(dateFilter);
    
    return batchMatch && farmMatch && testMatch && dateMatch;
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
  }, [batchIdFilter, selectedFarm, selectedTest, dateFilter]);

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

  // Handle sending to farmer
  const handleSendToFarmer = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to send to farmer.');
      return;
    }

    const selectedBatches = completedData
      .filter(item => selectedItems.includes(item.id))
      .map(item => item.batchId)
      .join(', ');

    const confirmed = confirm(`Send the following batch results to farmers?\n\nBatches: ${selectedBatches}\n\nThis action will notify farmers about their test results.`);
    
    if (confirmed) {
      try {
        // Here you would implement the actual API call to notify farmers
        alert(`Successfully sent ${selectedItems.length} batch result(s) to farmers!\n\nBatches: ${selectedBatches}`);
        setSelectedItems([]);
        setSelectAll(false);
        
        // Refresh export history
        fetchExportHistory();
      } catch (err) {
        console.error('Error sending to farmer:', err);
        alert('Failed to send results to farmers. Please try again.');
      }
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    // Search logic is handled by filteredData
  };

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
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
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
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} completed results
                </p>
              </div>
              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <button 
                    onClick={handleSendToFarmer}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send to Farmer ({selectedItems.length})
                  </button>
                )}
                <button className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center hover:bg-green-600">
                  <FileDownload />
                  <span className="ml-1">Export Data</span>
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
                  currentData.map((result) => (
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.qualityGrade === 'A' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Grade {result.qualityGrade}
                        </span>
                      </td>
                      <td className="py-3">{result.yield} {result.yieldUnit}</td>
                      <td className="py-3">
                        <div className="text-xs">
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
                        <div className="flex items-center text-green-500">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>{result.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))
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
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${
                          i + 1 === currentPage 
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search batches..."
                  className="px-3 py-1 pl-8 border border-gray-300 rounded-md text-sm"
                />
                <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
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
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No export history available
                    </td>
                  </tr>
                ) : (
                  exportHistory.map((history, index) => (
                    <tr key={index} className="text-sm border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{history.batchId}</td>
                      <td className="py-3">{history.farmName}</td>
                      <td className="py-3">{history.testType}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Grade {history.qualityGrade}
                        </span>
                      </td>
                      <td className="py-3">{history.yield}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {history.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-gray-500 hover:text-gray-700">
                          <div className="h-4 w-4">
                            <FileText />
                          </div>
                        </button>
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