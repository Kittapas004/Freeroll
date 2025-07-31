import React from 'react';
import { Clock, FileText, FlaskConical, Pencil, CheckCircle, XCircle } from "lucide-react";

interface LabStatusBadgeProps {
  status: string;
  exported?: boolean;
  exportStatus?: string;
  showText?: boolean;
}

export const LabStatusBadge: React.FC<LabStatusBadgeProps> = ({ 
  status, 
  exported = false, 
  exportStatus = 'Unknown',
  showText = true 
}) => {
  
  const getStatusInfo = () => {
    if (status === 'Completed' && exported) {
      return {
        icon: <CheckCircle size={14} />,
        text: 'Available to Farmer',
        className: 'bg-green-100 text-green-800',
        description: 'Report has been exported and is accessible to farmer'
      };
    } else if (status === 'Completed' && !exported) {
      return {
        icon: <Clock size={14} />,
        text: exportStatus === 'Pending Export' ? 'Ready to Export' : exportStatus,
        className: 'bg-orange-100 text-orange-800',
        description: 'Test completed, awaiting export to make available to farmer'
      };
    } else if (status === 'Pending') {
      return {
        icon: <FlaskConical size={14} />,
        text: 'Testing in Progress',
        className: 'bg-yellow-100 text-yellow-800',
        description: 'Sample submitted to lab, testing in progress'
      };
    } else if (status === 'Draft') {
      return {
        icon: <Pencil size={14} />,
        text: 'Draft Report',
        className: 'bg-gray-100 text-gray-800',
        description: 'Report in draft status, not yet completed'
      };
    } else if (status === 'Failed') {
      return {
        icon: <XCircle size={14} />,
        text: 'Export Failed',
        className: 'bg-red-100 text-red-800',
        description: 'Export process failed, needs attention'
      };
    } else {
      return {
        icon: <FileText size={14} />,
        text: 'Unknown Status',
        className: 'bg-gray-100 text-gray-800',
        description: 'Status unknown'
      };
    }
  };

  const statusInfo = getStatusInfo();

  if (!showText) {
    return (
      <div 
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${statusInfo.className}`}
        title={statusInfo.description}
      >
        {statusInfo.icon}
      </div>
    );
  }

  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${statusInfo.className}`}
      title={statusInfo.description}
    >
      {statusInfo.icon}
      {showText && <span>{statusInfo.text}</span>}
    </span>
  );
};