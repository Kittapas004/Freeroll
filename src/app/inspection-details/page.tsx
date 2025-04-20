'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="p-4">
                <div className="font-semibold text-lg">Batch: {record.batch_id || '-'}</div>
                <div className="text-sm text-gray-600">Farm: {record.farm_name || '-'}</div>
                <div className="text-sm">Date: {new Date(record.Date).toLocaleDateString()}</div>
                <div className="text-sm">Quality: {record.Quality_grade}</div>
                <div className="text-sm">Status: {record.Submission_status}</div>
                <div className="text-sm">Yield: {record.yield} {record.yield_unit}</div>
              </Card>
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
