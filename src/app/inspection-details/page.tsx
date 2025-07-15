'use client';

import { useEffect, useState } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Sprout, Leaf, Plus, Wrench, FlaskConical, Notebook, Check, ChartSpline, Star, SquarePen, Trash, Circle, ChevronDown, ChevronUp, Pencil, EllipsisVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function InspectionDetailsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [recordDate, setRecordDate] = useState<any[]>([]);
  const [role, setRole] = useState<string | 'loading'>('loading');
  const [filters, setFilters] = useState({
    batchId: '',
    farmName: '',
    date: '',
    status: ''
  });

  const router = useRouter();

  const toggleSidebar = () => {
    localStorage.setItem('sidebarOpen', String(!isSidebarOpen));
    setIsSidebarOpen(!isSidebarOpen);
  };

  const ALLOWED_ROLES = ['Quality Inspection'];

  const fetchLabSubmissions = async () => {
    try {
      const res = await fetch(`http://localhost:1337/api/labs?documentId=${localStorage.getItem("userId")}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });
      const data = await res.json();
      console.log('Lab response:', data);

      if (data.data && data.data.length > 0) {
        console.log('Lab documentId found:', data.data[0].documentId);
        fetchLabSubmissionsByLabId(data.data[0].documentId);
      } else {
        console.error('No lab found for user:', localStorage.getItem("userId"));
      }
    } catch (err) {
      console.error('Error fetching lab submission records:', err);
    }
  };

  // แก้ไขฟังก์ชัน fetchLabSubmissionsByLabId ให้รองรับทั้ง 2 แบบ พร้อม debug เพิ่มเติม
  const fetchLabSubmissionsByLabId = async (id: string) => {
    try {
      console.log('=== DEBUG: Fetching Lab Submissions ===');
      console.log('Lab ID:', id);
      console.log('API URL:', `http://localhost:1337/api/lab-submission-records?populate[batch][populate]=Farm&populate[harvest_record][populate]=*&filters[lab][documentId][$eq]=${id}`);
      
      // ดึงข้อมูล lab submission records พร้อม populate batch และ farm
      const res = await fetch(
        `http://localhost:1337/api/lab-submission-records?populate[batch][populate]=Farm&populate[harvest_record][populate]=*&filters[lab][documentId][$eq]=${id}`, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );
      const data = await res.json();
      console.log('=== API Response ===');
      console.log('Status:', res.status);
      console.log('Data:', data);
      console.log('Number of records:', data.data?.length || 0);

      if (!data.data || data.data.length === 0) {
        console.warn('No lab submission records found for lab ID:', id);
        setRecordDate([]);
        return;
      }

      // ประมวลผลข้อมูล lab submission records - รองรับทั้ง 2 แบบ
      const mappedData = data.data.map((item: any, index: number) => {
        console.log(`=== Processing Item ${index + 1} ===`);
        console.log('Raw item:', item);
        
        const attrs = item.attributes;
        
        // วิธีที่ 1: ลองดึงข้อมูล batch จาก relation ก่อน (ใหม่)
        let batchId = 'N/A';
        let farmName = 'Unknown Farm';
        
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
        
        // วิธีที่ 2: ถ้าไม่ได้ใช้วิธีเดิม (fallback)
        if (batchId === 'N/A') {
          batchId = attrs?.batch?.data?.attributes?.Batch_id || 
                    item.batch?.Batch_id || 
                    'N/A';
          console.log('Batch ID from fallback:', batchId);
        }
        
        if (farmName === 'Unknown Farm') {
          farmName = attrs?.batch?.data?.attributes?.Farm?.data?.attributes?.Farm_Name || 
                     item.batch?.Farm?.Farm_Name || 
                     'Unknown Farm';
          console.log('Farm name from fallback:', farmName);
        }

        // ดึงข้อมูล harvest record
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
        
        const mappedItem = {
          id: item.id,
          batch_id: batchId,
          farm_name: farmName,
          Date: attrs?.Date || item.Date,
          Quality_grade: attrs?.Quality_grade || item.Quality_grade || 'Not Graded',
          Submission_status: attrs?.Submission_status || item.Submission_status || 'Draft',
          yield: yield_amount,
          yield_unit: yield_unit,
          curcumin_quality: attrs?.curcumin_quality,
          moisture_quality: attrs?.moisture_quality,
          test_date: attrs?.test_date,
          inspector_notes: attrs?.inspector_notes
        };
        
        console.log('Mapped item:', mappedItem);
        return mappedItem;
      });

      console.log('=== Final Results ===');
      console.log('Total mapped records:', mappedData.length);
      console.log('Final mapped data:', mappedData);
      setRecordDate(mappedData);
      
    } catch (err) {
      console.error('Error fetching lab submission records:', err);
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
    }
  }, [role]);

  useEffect(() => {
    if (role !== 'loading' && ALLOWED_ROLES.includes(role)) {
      fetchLabSubmissions();
    }
  }, [role]);

  const filteredRecords = recordDate.filter((record) => {
    const batchMatch = record.batch_id.toLowerCase().includes(filters.batchId.toLowerCase());
    const farmMatch = record.farm_name.toLowerCase().includes(filters.farmName.toLowerCase());
    const dateMatch = filters.date === '' || new Date(record.Date).toISOString().split('T')[0] === filters.date;
    const statusMatch = filters.status === '' || record.Submission_status === filters.status;
    return batchMatch && farmMatch && dateMatch && statusMatch;
  });

  if (role === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
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
            <h1 className="text-2xl font-semibold">Inspection Details</h1>
          </div>
        </header>

        <main className="p-6">
          {/* 🔍 Search Filter Section */}
          <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium block mb-1">Batch ID</Label>
              <Input
                placeholder="Enter batch ID"
                value={filters.batchId}
                onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium block mb-1">Date Received</Label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium block mb-1">Farm Name</Label>
              <Input
                placeholder="Enter farm name"
                value={filters.farmName}
                onChange={(e) => setFilters({ ...filters, farmName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium block mb-1">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value === "all" ? "" : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ✅ Show Filtered Results */}
          <div className="bg-white rounded-xl shadow p-4">
            <table className="w-full table-auto text-sm">
              <thead className="border-b">
                <tr className="text-left text-gray-600">
                  <th className="py-2">Batch</th>
                  <th className="py-2">Farm Name</th>
                  <th className="py-2">Date Received</th>
                  <th className="py-2">Quality</th>
                  <th className="py-2">Yield</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    console.log('Rendering record:', record);

                    return (
                      <tr key={record.id} className="border-t hover:bg-gray-50">
                        <td className="py-3">{record.batch_id}</td>
                        <td className="py-3">{record.farm_name}</td>
                        <td className="py-3">
                          {record.Date ? new Date(record.Date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : 'N/A'}
                        </td>
                        <td className="py-3">{record.Quality_grade}</td>
                        <td className="py-3">{record.yield} {record.yield_unit}</td>
                        <td className="py-3">
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
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {/* <span className="text-xs text-gray-500">ID: {record.id}</span> */}
                            <button
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Edit"
                              onClick={() => {
                                console.log('Navigating to edit page with ID:', record.id);
                                router.push(`/inspection-details/${record.id}`);
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}