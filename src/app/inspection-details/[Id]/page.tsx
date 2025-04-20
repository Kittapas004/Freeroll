'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function EditInspectionDetail() {
  const { id } = useParams();
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      const res = await fetch(`http://localhost:1337/api/lab-submission-records/${id}?populate[batch][populate]=Farm&populate[harvest_record][populate]=*`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });
      const data = await res.json();
      const item = data.data;
  
      setRecord({
        batch_id: item.attributes.batch.data.attributes.Batch_id,
        farm_name: item.attributes.batch.data.attributes.Farm.Farm_Name,
        date_received: item.attributes.Date,
        harvest_date: item.attributes.harvest_record?.data?.attributes?.Date || '',
        quality: item.attributes.Quality_grade,
        yield: item.attributes.harvest_record?.data?.attributes?.yleld,
        yield_unit: item.attributes.harvest_record?.data?.attributes?.Yleld_unit,
        curcuminoid: item.attributes.curcumin_quality,
        moisture: item.attributes.moisture_quality,
        test_date: item.attributes.test_date,
        status: item.attributes.Submission_status,
      });
    };
  
    fetchRecord();
  }, [id]);
  
  if (!record) return <div className="p-6">Loading...</div>;

  return (
    <SidebarProvider open={true}>
      <AppSidebar />
      <SidebarInset>
        <main className="p-6 space-y-6">
          <h1 className="text-2xl font-semibold">Quality Inspection</h1>

          {/* 🔎 Batch Info */}
          <section className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Batch Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div><strong>Batch ID:</strong> {record.batch_id}</div>
              <div><strong>Farm Name:</strong> {record.farm_name}</div>
              <div><strong>Date Received:</strong> {record.date_received}</div>
              <div><strong>Harvest Date:</strong> {record.harvest_date}</div>
              <div><strong>Quality:</strong> {record.quality}</div>
              <div><strong>Yield:</strong> {record.yield} {record.yield_unit}</div>
            </div>
          </section>

          {/* 🧪 Test Result Input */}
          <section className="bg-white rounded-xl p-6 shadow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Curcuminoid Quality</label>
              <input defaultValue={record.curcumin} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Moisture Quality</label>
              <input defaultValue={record.moisture} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Test Date</label>
              <input type="date" defaultValue={record.test_date} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select defaultValue={record.status} className="w-full border rounded p-2">
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </section>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Save Draft</button>
            <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Submit Report</button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
