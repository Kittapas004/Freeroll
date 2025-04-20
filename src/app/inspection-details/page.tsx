'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface LabSubmissionRecord {
  id: number;
  Date: string;
  Lab_name: string;
  Quality_grade: string;
  Submission_status: string;
  batch?: {
    id: number;
    Batch_ID: string;
    Farm?: {
      Name: string;
    };
    Harvest_Date: string;
    Total_Yield: number;
  };
}

export default function InspectionDetailsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [records, setRecords] = useState<LabSubmissionRecord[]>([]);
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
    const fetchLabSubmissions = async () => {
      try {
        const res = await fetch('http://localhost:1337/api/lab-submission-records?populate=batch.Farm', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });
        const data = await res.json();
        const cleanedRecords = data.data
          .filter((item: any) => item?.attributes?.batch?.data)
          .map((item: any) => ({
            id: item.id,
            ...item.attributes,
            batch: {
              ...item.attributes.batch.data.attributes,
              id: item.attributes.batch.data.id,
              Farm: item.attributes.batch.data.attributes.Farm,
            },
          }));
        setRecords(cleanedRecords);
      } catch (err) {
        console.error('Error fetching lab submission records:', err);
      }
    };
    if (role !== 'loading' && ALLOWED_ROLES.includes(role)) {
      fetchLabSubmissions();
    }
  }, [role]);

  const filteredRecords = records.filter((record) => {
    const batchMatch = record.batch?.Batch_ID.toLowerCase().includes(filters.batchId.toLowerCase());
    const farmMatch = record.batch?.Farm?.Name.toLowerCase().includes(filters.farmName.toLowerCase());
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
                <div className="font-semibold text-lg">Batch: {record.batch?.Batch_ID || '-'}</div>
                <div className="text-sm text-gray-600">Farm: {record.batch?.Farm?.Name || '-'}</div>
                <div className="text-sm">Date: {new Date(record.Date).toLocaleDateString()}</div>
                <div className="text-sm">Quality: {record.Quality_grade}</div>
                <div className="text-sm">Status: {record.Submission_status}</div>
                <div className="text-sm">Yield: {record.batch?.Total_Yield} kg</div>
              </Card>
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
