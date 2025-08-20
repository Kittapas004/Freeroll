'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import ChemicalChart from "@/components/ChemicalChart";
import RecentActivity from "@/components/RecentActivity";
import QuickActions from "@/components/QuickActions";
import NotificationPanel from "@/components/NotificationPanel";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import WeatherCard from "@/components/WeatherCard";
import React from "react";
import { Activity, CalendarClock, ChartColumnBig, ClipboardList, History, Inspect, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Sprout, Leaf, Factory, Wrench, FlaskConical, Notebook, Check, ChartSpline, Star, SquarePen, Trash, Circle, ChevronDown, ChevronUp, Pencil, EllipsisVertical } from "lucide-react";
import QualityDashboard from "./QualityDashboard";

export default function DashboardPage() {
  const [batchDocumentID, setBatchDocumentID] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = React.useState({
    name: "",
    email: "",
    avatar: "",
    role: "",
  });
  type Batches = {
    batches_id: string;
    planting_date: string;
    plant_variety: string;
    cultivation_method: string;
    status: string;
    location: string;
    farm_id: string;
    image: string;
    Farm_Status: string;
    recent_fertilizer_record: {
      id: string;
      documentId: string;
      date: string;
      fertilizer_type: string;
      amount: number;
      size: number;
      note: string;
      method: string;
      unit: string;
    }[];
    recent_harvest_record: {
      id: string;
      documentId: string;
      date: string;
      yleld: number;
      quality_grade: string;
      method: string;
      note: string;
      result_type: string;
      curcumin_quality: string;
      yleld_unit: string;
      // status: string;
      lab_status: string;
    }[];
    lab_submission_record: {
      id: string;
      documentId: string;
      date: string;
      lab_name: string;
      quality_grade: string;
      status: string;
      harvest_record: string;
      report: File | null;
    }[];
    factory_records: {
      id: string;
      documentId: string;
      date: string;
      factory_name: string;
      status: string;
    }[];
  };
  const [dashboardData, setDashboardData] = useState<Batches | null>(null);
  const fetchDashboardData = async (documentId: string) => {
    try {
      const res = await fetch(`https://api-freeroll-production.up.railway.app/api/batches/${documentId}?populate[Farm][populate]=*&populate[Batch_image][populate]=*&populate[lab_submission_records][populate]=*&populate[harvest_records][populate]=*&populate[fertilizer_records][populate]=*&populate[factory_submissions][populate]=*`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch data");

      const data = await res.json();
      console.log("Fetched data:", data);
      const batch = data.data;

      setDashboardData({
        batches_id: batch.Batch_id,
        planting_date: batch.Date_of_Planting,
        plant_variety: batch.Plant_Variety,
        cultivation_method: batch.Cultivation_Method,
        status: batch.Batch_Status,
        farm_id: batch.Farm.documentId,
        location: batch.Farm.Farm_Name ?? "N/A",
        Farm_Status: batch.Farm.Farm_Status,
        image: batch.Batch_image?.url ? `https://api-freeroll-production.up.railway.app${batch.Batch_image.url}`
          : "",
        recent_fertilizer_record: batch.fertilizer_records.map((record: any) => ({
          id: record.id,
          documentId: record.documentId,
          date: record.Date,
          fertilizer_type: record.Fertilizer_type,
          amount: record.Quantity_applied,
          size: record.Size,
          note: record.Note || "",
          method: record.Method,
          unit: record.Quantity_applied_unit,
        })),
        recent_harvest_record: batch.harvest_records.map((record: any) => ({
          id: record.id,
          documentId: record.documentId,
          date: record.Date,
          yleld: record.yleld,
          quality_grade: record.quality_grade,
          method: record.Method,
          note: record.Note || "",
          result_type: record.Result_type,
          curcumin_quality: record.Curcumin_quality,
          yleld_unit: record.Yleld_unit,
          // status: record.Harvest_status,
          lab_status: record.Submission_status,
        })),
        lab_submission_record: batch.lab_submission_records.map((record: any) => ({
          id: record.id,
          documentId: record.documentId,
          date: record.Date,
          lab_name: record.Lab_name,
          quality_grade: record.Quality_grade,
          status: record.Submission_status,
          harvest_record: record.harvest_record.documentId,
          report: record.Report?.[0]?.url
            ? `https://api-freeroll-production.up.railway.app${record.Report[0].url}`
            : "",
        })),
        factory_records: batch.factory_submissions.map((record: any) => ({
          id: record.id,
          documentId: record.documentId,
          date: record.Date,
          factory_name: record.Factory,
          status: record.Submission_status,
        })),
      });
      return data
    }
    catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };
  const [batch, setBatch] = useState<any[]>([]);
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      localStorage.setItem('sidebarOpen', String(!prev));
      return !prev;
    });
  };

  const getDisplayStatus = (dashboardData: Batches | null): string => {
    if (!dashboardData) return "No Data";

    // ตรวจสอบ Farm_Status ก่อน (ให้ความสำคัญกับสถานะล่าสุด)
    if (dashboardData.Farm_Status === "Harvested") {
      return "Harvested";
    }

    if (dashboardData.Farm_Status === "Fertilized") {
      return "Fertilized";
    }

    // ถ้าไม่มี Farm_Status หรือ Farm_Status เป็น default ให้ดูจาก Batch_Status
    switch (dashboardData.status) {
      case "Completed Successfully":
      case "Completed Past Data":
        return "Completed";
      case "Pending Actions":
      default:
        return "Planted";
    }
  };

  const getNextHarvestInfo = (dashboardData: Batches | null): { status: string; detail: string } => {
    if (!dashboardData) return { status: "No Data", detail: "Please select a batch" };

    const currentStatus = getDisplayStatus(dashboardData);

    // ถ้าเก็บเกี่ยวแล้ว
    if (currentStatus === "Harvested" || currentStatus === "Completed") {
      return {
        status: "Harvested",
        detail: "Harvest completed"
      };
    }

    // ถ้ายังไม่ได้ปลูกหรือไม่มีวันที่ปลูก
    if (!dashboardData.planting_date) {
      return {
        status: "N/A",
        detail: "Please select a batch"
      };
    }

    // คำนวณวันที่เก็บเกี่ยว (270 วันหลังจากปลูก)
    const harvestDate = new Date(dashboardData.planting_date).getTime() + 270 * 24 * 60 * 60 * 1000;
    const daysLeft = Math.ceil((harvestDate - Date.now()) / (1000 * 60 * 60 * 24));
    const expectedDate = new Date(harvestDate).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (daysLeft > 0) {
      return {
        status: `${daysLeft} days`,
        detail: `Expected: ${expectedDate}`
      };
    } else {
      return {
        status: "Ready to harvest",
        detail: `Expected: ${expectedDate}`
      };
    }
  };

  const getUpcomingTask = (dashboardData: Batches | null): { task: string; next: string } => {
    if (!dashboardData) return { task: "No Tasks", next: "Please select a batch" };

    // ตรวจสอบสถานะปัจจุบันและกำหนดงานถัดไป
    const currentStatus = getDisplayStatus(dashboardData);

    switch (currentStatus) {
      case "Planted":
        return {
          task: "Fertilization",
          next: "Apply fertilizer to crop"
        };
      case "Fertilized":
        return {
          task: "Monitor Growth",
          next: "Wait for harvest time"
        };
      case "Harvested":
        return {
          task: "Lab Submission",
          next: "Submit samples for testing"
        };
      case "Completed":
        return {
          task: "All Complete",
          next: "Process finished successfully"
        };
      default:
        return {
          task: "Next Step",
          next: "Check farm status"
        };
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("https://api-freeroll-production.up.railway.app/api/users/me?populate=*", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      setUser({
        name: userData.username || "",
        email: userData.email || "",
        avatar: userData.avatar?.url
          ? `https://api-freeroll-production.up.railway.app${userData.avatar.url}`
          : "",
        role: userData.user_role || "",
      });
      // console.log("User data fetched successfully:", userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchBatch = async () => {
    try {
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/batches?populate=*&filters[user_documentId][$eq]=${localStorage.getItem("userId")}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch batch data");
      }

      const batchData = await response.json();

      // ⭐ เพิ่มการเรียงลำดับตาม Batch_id
      const sortedBatches = batchData.data.sort((a: any, b: any) => {
        const getNumber = (batchId: string) => {
          const match = batchId.match(/T-Batch-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getNumber(a.Batch_id) - getNumber(b.Batch_id);
      });

      const batchDetails = sortedBatches.map((batch: any) => ({
        id: batch.Batch_id,
        documentId: batch.documentId,
      }));

      console.log("Batch data fetched successfully:", batchDetails);
      setBatch(batchDetails);
    } catch (error) {
      console.error("Error fetching batch data:", error);
    }
  };

  const generateTimeline = () => {
    if (!dashboardData) return [];

    const plantedcompleted = dashboardData.planting_date.length > 0 ? [
      {
        date: new Date(dashboardData.planting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: "Planted Completed",
        color: "green"
      }
    ] : [];

    const fertilizercompleted = dashboardData.recent_fertilizer_record
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 1)
      .map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        // status: `Fertilizer Applied: ${record.fertilizer_type}`,
        status: "Fertilizer Completed",
        color: "green"
      }));

    const harvestingcompleted = dashboardData.recent_harvest_record
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 1)
      .map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        // status: `Harvesting Completed: ${record.quality_grade}`,
        status: "Harvesting Completed",
        color: "green"
      }));

    const submittedtolab = dashboardData.lab_submission_record.map(record => ({
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: record.status === "Pending" ? "Sample Sent to Lab" : "Lab Submission Completed",
      color: record.status === "Pending" ? "blue" : "green"
    }));

    const submittedtofactory = dashboardData.factory_records.map(record => ({
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: record.status === "Pending" ? "Submitted to Factory" : "Factory Submission Completed",
      color: record.status === "Pending" ? "blue" : "green"
    }));

    const allEvents = [
      ...plantedcompleted,
      ...fertilizercompleted,
      ...harvestingcompleted,
      ...submittedtolab,
      ...submittedtofactory,
    ];

    return allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timeline = generateTimeline();

  const generateActivities = () => {
    if (!dashboardData) return [];

    const plantedActivities = dashboardData.planting_date ? [{
      icon: <Sprout className="w-4 h-4 text-green-600" />, // ✅ ใช้ Lucide icon
      title: "Planted",
      date: dashboardData.planting_date,
      content: [
        `Batch : ${dashboardData.batches_id}`,
        `Date : ${new Date(dashboardData.planting_date).toLocaleDateString('en-US')}`,
        `Location : ${dashboardData.location}`,
        `Plant Variety : ${dashboardData.plant_variety}`,
      ]
    }] : [];

    const fertilizerActivities = dashboardData.recent_fertilizer_record.map(record => ({
      icon: <Leaf className="w-4 h-4 text-green-600" />, // ✅ Leaf สำหรับ Fertilizer
      title: "Fertilizer Applied",
      date: record.date,
      content: [
        `Batch : ${dashboardData.batches_id}`,
        `Date : ${new Date(record.date).toLocaleDateString('en-US')}`,
        `Fertilizer Type : ${record.fertilizer_type}`,
        `Fertilizer Quantity : ${record.amount} ${record.unit}`,
      ]
    }));

    const harvestingActivities = dashboardData.recent_harvest_record.map(record => ({
      icon: <Wrench className="w-4 h-4 text-yellow-600" />, // ✅ Wrench สำหรับ Harvest
      title: "Harvesting",
      date: record.date,
      content: [
        `Batch : ${dashboardData.batches_id}`,
        `Date : ${new Date(record.date).toLocaleDateString('en-US')}`,
        `Quality Grade : ${record.quality_grade}`,
        `Yield : ${record.yleld} ${record.yleld_unit}`,
      ]
    }));

    const labActivities = dashboardData.lab_submission_record.map(record => ({
      icon: <FlaskConical className="w-4 h-4 text-blue-600" />, // ✅ Flask สำหรับ Lab
      title: "Lab Submission",
      date: record.date,
      content: [
        `Batch : ${dashboardData.batches_id}`,
        `Date : ${new Date(record.date).toLocaleDateString('en-US')}`,
        `Lab Name : ${record.lab_name}`,
        `Quality Grade : ${record.quality_grade}`,
      ]
    }));

    const factoryActivities = dashboardData.factory_records.map(record => ({
      icon: <Factory className="w-4 h-4 text-purple-600" />, // ✅ Notebook สำหรับ Factory
      title: "Factory Submission",
      date: record.date,
      content: [
        `Batch : ${dashboardData.batches_id}`,
        `Date : ${new Date(record.date).toLocaleDateString('en-US')}`,
        `Factory Name : ${record.factory_name}`,
        `Status : ${record.status}`,
      ]
    }));

    const allActivities = [
      ...plantedActivities,
      ...fertilizerActivities,
      ...harvestingActivities,
      ...labActivities,
      ...factoryActivities
    ];

    // ✅ Sort by real date value
    return allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };


  const activities = generateActivities();


  React.useEffect(() => {
    fetchUserData();
    fetchBatch();
  }, []);

  React.useEffect(() => {
    if (batch && batch.length > 0) {
      setBatchDocumentID(batch[0].documentId);
      setBatchId(batch[0].id);
    }
  }, [batch]);

  React.useEffect(() => {
    if (batchDocumentID) {
      fetchDashboardData(batchDocumentID);
    }
  }, [batchDocumentID]);

  const dashboardByRole: Record<string, any[]> = {
    //Farmer Dashboard
    Farmer: [
      <main key="farmer-dashboard" className="flex flex-row h-full">
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="text-2xl font-semibold text-gray-800">
              <SidebarTrigger onClick={toggleSidebar} />
              Welcome {user.name}!
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search batches..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div> */}
              <span className="">
                <Select
                  value={batchDocumentID ?? ""}
                  onValueChange={(value) => {
                    const selected = batch.find(b => b.documentId === value);
                    if (selected) {
                      setBatchDocumentID(selected.documentId);
                      setBatchId(selected.id);
                    }
                  }}
                >
                  <SelectTrigger className="...">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batch.map((b) => (
                      <SelectItem key={b.id} value={b.documentId}>
                        {b.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-4">
            <div className="bg-white border rounded-2xl shadow-sm p-4">
              <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
                Next Harvest
                <span className="text-lg"><CalendarClock className="text-green-600" /></span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-1">
                {getNextHarvestInfo(dashboardData).status}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {getNextHarvestInfo(dashboardData).detail}
              </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm p-4">
              <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
                Harvest Quality
                <span className="text-lg"><ChartColumnBig className="text-green-600" /></span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-1">
                {dashboardData?.recent_harvest_record?.length ?? 0 > 0 ? (
                  dashboardData?.recent_harvest_record.reduce((acc, record) => {
                    const existingGrade = acc.find((item) => item.grade === record.quality_grade);
                    const yieldInKg = record.yleld_unit === "kg" ? record.yleld : record.yleld / 1000;

                    if (existingGrade) {
                      existingGrade.totalYield += yieldInKg;
                    } else {
                      acc.push({ grade: record.quality_grade, totalYield: yieldInKg });
                    }

                    return acc;
                  }, [] as { grade: string; totalYield: number }[])
                    .sort((a, b) => b.totalYield - a.totalYield).map((item, index) => (
                      <div
                        key={index}
                        className={
                          item.totalYield === Math.max(...dashboardData?.recent_harvest_record.reduce((acc, record) => {
                            const yieldInKg = record.yleld_unit === "kg" ? record.yleld : record.yleld / 1000;
                            const existingGrade = acc.find((entry) => entry.grade === record.quality_grade);

                            if (existingGrade) {
                              existingGrade.totalYield += yieldInKg;
                            } else {
                              acc.push({ grade: record.quality_grade, totalYield: yieldInKg });
                            }

                            return acc;
                          }, [] as { grade: string; totalYield: number }[]).map((entry) => entry.totalYield))
                            ? "text-xl font-bold text-gray-800 mt-1"
                            : "text-xs text-gray-400 mt-0.5"
                        }
                      >
                        {((item.totalYield / dashboardData?.recent_harvest_record.reduce((sum, record) => sum + (record.yleld_unit === "kg" ? record.yleld : record.yleld / 1000), 0)) * 100).toFixed(0)}% {item.grade}
                      </div>
                    ))
                ) : (
                  "No Data"
                )}
              </div>
            </div>
            <div className="bg-white border rounded-2xl shadow-sm p-4">
              <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
                Status
                <span className="text-lg"><Sprout className="text-green-600" /></span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-1">
                {getDisplayStatus(dashboardData)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {dashboardData?.Farm_Status === "Harvested" ? "Ready for processing" :
                  dashboardData?.Farm_Status === "Fertilized" ? "Growing phase" :
                    dashboardData && getDisplayStatus(dashboardData) !== "Completed" && dashboardData.planting_date
                      ? `${Math.max(0, Math.ceil(
                        (new Date(dashboardData.planting_date).getTime() + 9 * 30 * 24 * 60 * 60 * 1000 - Date.now())
                        / (1000 * 60 * 60 * 24 * 30)
                      ))} more months to go!`
                      : "Check status"}
              </div>
            </div>
            <div className="bg-white border rounded-2xl shadow-sm p-4">
              <div className="text-sm text-gray-500 flex items-center justify-between gap-2">
                Upcoming Tasks
                <span className="text-lg"><ClipboardList className="text-green-600" /></span>
              </div>
              <div className="text-xl font-bold text-gray-800 mt-1">
                {getUpcomingTask(dashboardData).task}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {getUpcomingTask(dashboardData).next}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className="lg:col-span-2">
              <ChemicalChart key={batchDocumentID} batchDoucumentId={batchDocumentID ?? undefined} />
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm max-h-96 overflow-hidden"> {/* เพิ่ม max-height และ overflow */}
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Turmeric History – {dashboardData?.batches_id}
              </div>

              <div className="max-h-80 overflow-y-auto"> {/* เพิ่ม scrollable container */}
                <ul className="relative ml-4 pl-4 text-sm">
                  <div
                    className="absolute left-5.25 w-0.5 bg-gray-300"
                    style={{ top: '0.75rem', bottom: '3.25rem' }}
                  ></div>
                  {timeline.map((item, i) => {
                    const ringColorClass = {
                      green: "ring-green-500",
                      blue: "ring-blue-500",
                      gray: "ring-gray-500",
                    }[item.color] || "ring-gray-500";

                    return (
                      <li key={i} className="relative pl-6 pb-4"> {/* ลด padding-bottom */}
                        <span
                          title={
                            item.color === "green"
                              ? "Completed"
                              : item.color === "blue"
                                ? "Pending"
                                : "No Status"
                          }
                          className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-white bg-white ring-2 ${ringColorClass}`}
                        />
                        <div className="font-medium text-gray-800 text-xs">{item.status}</div> {/* ลดขนาดฟอนต์ */}
                        <div className="text-xs text-gray-500">{item.date}</div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className={`bg-white rounded-2xl shadow-sm p-4 lg:col-span-2`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <History className="text-green-600" size={16} />
                  <div className="text-sm font-bold text-green-700">Recent Activity</div>
                </div>
              </div>

              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.slice(0, 3).map((act, i) => (
                    <div
                      key={i}
                      className="border p-4 rounded-xl hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center gap-2 font-medium text-sm text-gray-700 mb-2">
                        <span className="text-lg text-green-600">{act.icon}</span>
                        <span>{act.title}</span>
                      </div>
                      <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                        {act.content.map((line, j) => (
                          <li key={j}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    No recent activities to display.
                  </div>
                )}
              </div>
            </div>
            <QuickActions batchDoucumentId={batchDocumentID ?? undefined} />
          </div>

        </div>
        <div className="hidden lg:block w-1/4 p-4 border-l">
          <Card>
            <div className="p-4 flex flex-col items-center gap-4">
              <div className="flex flex-col items-center">
                <p className="text-2xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <h2 className="text-2xl font-bold">Weather Average</h2>
              </div>
              <WeatherCard />
            </div>
          </Card>

          {/* ส่ง batchId ไปยัง NotificationPanel */}
          <NotificationPanel selectedBatchId={batchId ?? undefined} />
        </div>
      </main>
    ],

    "Quality Inspection": [
      <QualityDashboard />
    ],

    //Admin Dashboard
    Admin: [
      <h1>Hello Admin</h1>
    ],
  }


  const dashboard = dashboardByRole[user.role]?.map((component, index) =>
    React.cloneElement(component, { key: `dashboard-${user.role}-${index}` })
  ) || [];

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        {dashboard}
      </SidebarInset>
    </SidebarProvider>
  );
}
