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
      console.log('Lab documentId:', data.data[0].documentId);

      fetchLabSubmissionsByLabId(data.data[0].documentId);

    } catch (err) {
      console.error('Error fetching lab submission records:', err);
    }
  };

  const fetchLabSubmissionsByLabId = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:1337/api/lab-submission-records?populate[batch][populate]=Farm&populate[harvest_record][populate]=*&filters[lab][documentId][$eq]=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });
      const data = await res.json();
      const mappedData = data.data.map((item: any) => ({
        id: item.id,
        batch_id: item.batch.Batch_id,
        farm_name: item.batch.Farm.Farm_Name,
        Date: item.Date,
        Quality_grade: item.Quality_grade,
        Submission_status: item.Submission_status,
        yield: item.harvest_record.yleld,
        yield_unit: item.harvest_record.Yleld_unit,
      }));
      setRecordDate(mappedData);
    } catch (err) {
      console.error('Error fetching lab submission records:', err);
    }
  }

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
                value={filters.status || "all"} // เพิ่ม fallback value
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
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="py-2">{record.batch_id}</td>
                    <td className="py-2">{record.farm_name}</td>
                    <td className="py-2">{new Date(record.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="py-2">{record.Quality_grade}</td>
                    <td className="py-2">{record.yield} {record.yield_unit}</td>
                    <td className="py-2">
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
                    <td className="py-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                        onClick={() => router.push(`/inspection-details/${record.id}`)} // 👈 ไปหน้าแก้ไข
                      >
                        <Pencil size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
