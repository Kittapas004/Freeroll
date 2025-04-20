'use client';

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Check, X, ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

export default function InspectionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [dateFilter, setDateFilter] = useState("Last 7 days");
  const [currentPage, setCurrentPage] = useState(1);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  // Mock data for inspections
  const inspections = [
    {
      id: "T-Batch-002",
      date: "Jan 15, 2025",
      status: "Passed",
      inspector: "Sarah Johnson",
      parameters: { curcumin: "4.2%", moisture: "12.5%" }
    },
    {
      id: "T-Batch-042",
      date: "Jan 14, 2025",
      status: "Failed",
      inspector: "Sarah Johnson",
      parameters: { curcumin: "1.2%", moisture: "10.1%" }
    },
    {
      id: "T-Batch-023",
      date: "Jan 25, 2025",
      status: "Failed",
      inspector: "Sarah Johnson",
      parameters: { curcumin: "1.3%", moisture: "8.1%" }
    },
    {
      id: "T-Batch-001",
      date: "Jan 15, 2025",
      status: "Passed",
      inspector: "Sarah Johnson",
      parameters: { curcumin: "4.2%", moisture: "12.5%" }
    },
  ];

  const totalResults = 97;
  const resultsPerPage = 10;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All status" || inspection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSearch = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setIsStatusDropdownOpen(false);
    setCurrentPage(1);
  };

  const handleDateFilter = (filter: React.SetStateAction<string>) => {
    setDateFilter(filter);
    setIsDateDropdownOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 p-5 overflow-auto">
        <div className="text-2xl font-semibold text-gray-800 mb-6">
          Quality Inspection History
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-grow max-w-lg">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search inspections..."
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Status Filter */}
            <div className="relative">
              <button
                className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white w-full sm:w-40"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              >
                <span className="text-sm">{statusFilter}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full sm:w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {["All status", "Passed", "Failed", "Pending"].map((status) => (
                      <button
                        key={status}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        onClick={() => handleStatusFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div className="relative">
              <button
                className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white w-full sm:w-40"
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              >
                <span className="text-sm">{dateFilter}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              {isDateDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full sm:w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {["Last 7 days", "Last 30 days", "Last 90 days", "This year"].map((filter) => (
                      <button
                        key={filter}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        onClick={() => handleDateFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Inspections */}
        <Card className="overflow-hidden mb-4">
          <div className="p-4 pb-2">
            <h2 className="text-lg font-medium text-gray-800">Recent Inspections</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parameters
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.map((inspection) => (
                  <tr key={inspection.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inspection.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inspection.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {inspection.status === "Passed" ? (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <Check size={14} className="mr-1" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <X size={14} className="mr-1" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inspection.inspector}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {inspection.status === "Passed" ? (
                        <span className="text-gray-900">
                          Curcumin: {inspection.parameters.curcumin}, Moisture: {inspection.parameters.moisture}
                        </span>
                      ) : (
                        <span className="text-red-500">
                          Curcumin: {inspection.parameters.curcumin}, Moisture: {inspection.parameters.moisture}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-500">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing 1 to {Math.min(resultsPerPage, filteredInspections.length)} of {totalResults} results
            </div>
            <div className="flex space-x-1">
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentPage === page
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}