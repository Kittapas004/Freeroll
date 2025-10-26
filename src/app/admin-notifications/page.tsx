'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminNotification {
  id: string;
  documentId: string;
  Title: string;
  Message: string;
  Target_Role: 'All' | 'Farmer' | 'Factory' | 'Quality Inspection' | 'Specific Users';
  Target_Users?: any[]; // Array of user objects
  Priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  Category: 'Announcement' | 'System Update' | 'Maintenance' | 'Alert' | 'General';
  Status: 'Active' | 'Expired' | 'Draft';
  Expire_Date?: string;
  Created_By?: string;
  Icon?: string;
  Link_Url?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationForm {
  Title: string;
  Message: string;
  Target_Role: 'All' | 'Farmer' | 'Factory' | 'Quality Inspection' | 'Specific Users';
  Target_Users: number[]; // Array of user IDs
  Priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  Category: 'Announcement' | 'System Update' | 'Maintenance' | 'Alert' | 'General';
  Status: 'Active' | 'Expired' | 'Draft';
  Expire_Date?: string;
  Link_Url?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  user_role?: string;
}

export default function AdminNotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const [formData, setFormData] = useState<NotificationForm>({
    Title: '',
    Message: '',
    Target_Role: 'All',
    Target_Users: [],
    Priority: 'Normal',
    Category: 'General',
    Status: 'Active',
    Expire_Date: '',
    Link_Url: '',
  });

  // Check user role
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setCurrentUserRole(userRole || '');
    
    if (userRole !== 'Admin') {
      router.push('/unauthorized');
    }
  }, [router]);

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch('https://api-freeroll-production.up.railway.app/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-freeroll-production.up.railway.app';
      const response = await fetch(
        `${apiUrl}/api/admin-notifications?populate=Target_Users&sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const result = await response.json();
      console.log('Fetched notifications:', result);
      
      const notificationData = result.data.map((item: any) => ({
        id: item.id,
        documentId: item.documentId,
        ...item,
      }));

      setNotifications(notificationData);
      setFilteredNotifications(notificationData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show alert, just set empty array
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserRole === 'Admin') {
      fetchNotifications();
      fetchUsers();
    }
  }, [currentUserRole]);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.Message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'All') {
      filtered = filtered.filter((n) => n.Target_Role === filterRole || n.Target_Role === 'All');
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter((n) => n.Status === filterStatus);
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchTerm, filterRole, filterStatus, notifications]);

  // Create notification
  const handleCreateNotification = async () => {
    try {
      const username = localStorage.getItem('username') || 'Admin';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-freeroll-production.up.railway.app';
      
      // Prepare data, remove empty optional fields
      const dataToSend: any = {
        ...formData,
        Created_By: username,
      };
      
      // Remove Expire_Date if empty
      if (!dataToSend.Expire_Date || dataToSend.Expire_Date.trim() === '') {
        delete dataToSend.Expire_Date;
      }
      
      // Remove Link_Url if empty
      if (!dataToSend.Link_Url || dataToSend.Link_Url.trim() === '') {
        delete dataToSend.Link_Url;
      }
      
      // Handle Target_Users - only include if Target_Role is 'Specific Users'
      if (dataToSend.Target_Role === 'Specific Users') {
        if (!dataToSend.Target_Users || dataToSend.Target_Users.length === 0) {
          alert('Please select at least one user when sending to specific users');
          return;
        }
        // Keep Target_Users as array of IDs
      } else {
        // Remove Target_Users for role-based notifications
        delete dataToSend.Target_Users;
      }
      
      const response = await fetch(
        `${apiUrl}/api/admin-notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
          body: JSON.stringify({
            data: dataToSend,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create Error:', errorText);
        throw new Error('Failed to create notification');
      }

      alert('Notification created successfully!');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Failed to create notification. Please check console for details.');
    }
  };

  // Update notification
  const handleUpdateNotification = async () => {
    if (!selectedNotification) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-freeroll-production.up.railway.app';
      
      // Prepare data, remove empty optional fields
      const dataToSend: any = { ...formData };
      
      // Remove Expire_Date if empty
      if (!dataToSend.Expire_Date || dataToSend.Expire_Date.trim() === '') {
        delete dataToSend.Expire_Date;
      }
      
      // Remove Link_Url if empty
      if (!dataToSend.Link_Url || dataToSend.Link_Url.trim() === '') {
        delete dataToSend.Link_Url;
      }
      
      // Handle Target_Users - only include if Target_Role is 'Specific Users'
      if (dataToSend.Target_Role === 'Specific Users') {
        if (!dataToSend.Target_Users || dataToSend.Target_Users.length === 0) {
          alert('Please select at least one user when sending to specific users');
          return;
        }
        // Keep Target_Users as array of IDs
      } else {
        // Remove Target_Users for role-based notifications
        delete dataToSend.Target_Users;
      }
      
      const response = await fetch(
        `${apiUrl}/api/admin-notifications/${selectedNotification.documentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
          body: JSON.stringify({
            data: dataToSend,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update notification');

      alert('Notification updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedNotification(null);
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      alert('Failed to update notification. Please check console for details.');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (documentId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-freeroll-production.up.railway.app';
      const response = await fetch(
        `${apiUrl}/api/admin-notifications/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete notification');

      alert('Notification deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please check console for details.');
    }
  };

  const resetForm = () => {
    setFormData({
      Title: '',
      Message: '',
      Target_Role: 'All',
      Target_Users: [],
      Priority: 'Normal',
      Category: 'General',
      Status: 'Active',
      Expire_Date: '',
      Link_Url: '',
    });
  };

  const openEditDialog = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    
    // Extract user IDs from Target_Users
    const targetUserIds = notification.Target_Users 
      ? notification.Target_Users.map((u: any) => u.id || u)
      : [];
    
    setFormData({
      Title: notification.Title,
      Message: notification.Message,
      Target_Role: notification.Target_Role,
      Target_Users: targetUserIds,
      Priority: notification.Priority,
      Category: notification.Category,
      Status: notification.Status,
      Expire_Date: notification.Expire_Date || '',
      Link_Url: notification.Link_Url || '',
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    setIsViewDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Normal':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Low':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Expired':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (currentUserRole !== 'Admin') {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Notifications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Notifications</h1>
              <p className="text-muted-foreground">Manage and send notifications to users</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Notification</DialogTitle>
                  <DialogDescription>
                    Send a notification to specific user roles
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.Title}
                      onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.Message}
                      onChange={(e) => setFormData({ ...formData, Message: e.target.value })}
                      placeholder="Enter notification message"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="target-role">Target Role *</Label>
                      <Select
                        value={formData.Target_Role}
                        onValueChange={(value: any) => {
                          setFormData({ ...formData, Target_Role: value, Target_Users: [] });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Users</SelectItem>
                          <SelectItem value="Farmer">Farmer</SelectItem>
                          <SelectItem value="Factory">Factory</SelectItem>
                          <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                          <SelectItem value="Specific Users">Specific Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.Priority}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, Priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Specific Users Selection - Show only when Target_Role is 'Specific Users' */}
                  {formData.Target_Role === 'Specific Users' && (
                    <div className="grid gap-2">
                      <Label htmlFor="target-users">Select Users *</Label>
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                        {users.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No users available</p>
                        ) : (
                          <div className="space-y-2">
                            {users.map((user) => (
                              <label
                                key={user.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.Target_Users.includes(user.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        Target_Users: [...formData.Target_Users, user.id],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        Target_Users: formData.Target_Users.filter((id) => id !== user.id),
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{user.username}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({user.email})</span>
                                  {user.user_role && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                      {user.user_role}
                                    </span>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.Target_Users.length} user(s) selected
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.Category}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, Category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Announcement">Announcement</SelectItem>
                          <SelectItem value="System Update">System Update</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Alert">Alert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.Status}
                        onValueChange={(value: any) => setFormData({ ...formData, Status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expire-date">Expire Date (Optional)</Label>
                    <Input
                      id="expire-date"
                      type="datetime-local"
                      value={formData.Expire_Date}
                      onChange={(e) => setFormData({ ...formData, Expire_Date: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Leave empty for no expiration</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="link-url">Link URL (Optional)</Label>
                    <Input
                      id="link-url"
                      value={formData.Link_Url}
                      onChange={(e) => setFormData({ ...formData, Link_Url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNotification} className="bg-green-600 hover:bg-green-700">
                    Create Notification
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Notifications</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {notifications.filter((n) => n.Status === 'Active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Draft</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {notifications.filter((n) => n.Status === 'Draft').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expired</p>
                  <p className="text-2xl font-bold text-red-600">
                    {notifications.filter((n) => n.Status === 'Expired').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  <SelectItem value="Farmer">Farmer</SelectItem>
                  <SelectItem value="Factory">Factory</SelectItem>
                  <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Notifications List */}
          <Card className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 && !loading ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <p className="text-gray-700 font-medium mb-1">Unable to connect to server</p>
                <p className="text-gray-500 text-sm mb-4">Please make sure Strapi backend is running on port 1337</p>
                <Button 
                  onClick={() => {
                    setLoading(true);
                    fetchNotifications();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Retry Connection
                </Button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filteredNotifications
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((notification) => {
                    const isExpired = notification.Expire_Date && new Date(notification.Expire_Date) <= new Date();
                    const daysUntilExpiry = notification.Expire_Date 
                      ? Math.ceil((new Date(notification.Expire_Date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                    <div
                      key={notification.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{notification.Title}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
                              notification.Priority
                            )}`}
                          >
                            {notification.Priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                              notification.Status
                            )}`}
                          >
                            {notification.Status}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium border border-purple-300">
                            {notification.Category}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {notification.Message && notification.Message.trim() && !notification.Message.match(/^#{3,}$/)
                            ? notification.Message
                            : '(No message content)'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          {/* Target Recipients */}
                          <div className="flex items-start gap-2 text-xs">
                            <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-gray-500 font-medium">Sent to: </span>
                              {notification.Target_Role === 'Specific Users' ? (
                                <div className="mt-1">
                                  <span className="text-blue-600 font-medium">Specific Users ({notification.Target_Users?.length || 0})</span>
                                  {notification.Target_Users && notification.Target_Users.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {notification.Target_Users.slice(0, 3).map((user: any) => (
                                        <span key={user.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs">
                                          {user.username}
                                        </span>
                                      ))}
                                      {notification.Target_Users.length > 3 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                          +{notification.Target_Users.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-700 font-medium">{notification.Target_Role}</span>
                              )}
                            </div>
                          </div>

                          {/* Expiry Date */}
                          <div className="flex items-start gap-2 text-xs">
                            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-gray-500 font-medium">Expires: </span>
                              {notification.Expire_Date ? (
                                <div className="mt-1">
                                  <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-700'}>
                                    {new Date(notification.Expire_Date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {!isExpired && daysUntilExpiry !== null && (
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                      daysUntilExpiry <= 1 ? 'bg-red-100 text-red-700' :
                                      daysUntilExpiry <= 3 ? 'bg-orange-100 text-orange-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {daysUntilExpiry === 0 ? 'Today' : 
                                       daysUntilExpiry === 1 ? 'Tomorrow' :
                                       `${daysUntilExpiry} days left`}
                                    </span>
                                  )}
                                  {isExpired && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                      Expired
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">No expiration</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(notification)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(notification)}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNotification(notification);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {filteredNotifications.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredNotifications.length)} of {filteredNotifications.length} notifications
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)))}
                      disabled={currentPage === Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
            )}
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Notification</DialogTitle>
              <DialogDescription>Update notification details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-message">Message *</Label>
                <Textarea
                  id="edit-message"
                  value={formData.Message}
                  onChange={(e) => setFormData({ ...formData, Message: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Target Role</Label>
                  <Select
                    value={formData.Target_Role}
                    onValueChange={(value: any) => {
                      setFormData({ ...formData, Target_Role: value, Target_Users: [] });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Users</SelectItem>
                      <SelectItem value="Farmer">Farmer</SelectItem>
                      <SelectItem value="Factory">Factory</SelectItem>
                      <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                      <SelectItem value="Specific Users">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.Priority}
                    onValueChange={(value: any) => setFormData({ ...formData, Priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specific Users Selection for Edit - Show only when Target_Role is 'Specific Users' */}
              {formData.Target_Role === 'Specific Users' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-target-users">Select Users *</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No users available</p>
                    ) : (
                      <div className="space-y-2">
                        {users.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.Target_Users.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    Target_Users: [...formData.Target_Users, user.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    Target_Users: formData.Target_Users.filter((id) => id !== user.id),
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium">{user.username}</span>
                              <span className="text-xs text-muted-foreground ml-2">({user.email})</span>
                              {user.user_role && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                  {user.user_role}
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.Target_Users.length} user(s) selected
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.Category}
                    onValueChange={(value: any) => setFormData({ ...formData, Category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Announcement">Announcement</SelectItem>
                      <SelectItem value="System Update">System Update</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.Status}
                    onValueChange={(value: any) => setFormData({ ...formData, Status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Expire Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.Expire_Date}
                  onChange={(e) => setFormData({ ...formData, Expire_Date: e.target.value })}
                />
                <p className="text-xs text-gray-500">Leave empty for no expiration</p>
              </div>

              <div className="grid gap-2">
                <Label>Link URL (Optional)</Label>
                <Input
                  value={formData.Link_Url}
                  onChange={(e) => setFormData({ ...formData, Link_Url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedNotification(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateNotification} className="bg-green-600 hover:bg-green-700">
                Update Notification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Notification Details</DialogTitle>
            </DialogHeader>
            {selectedNotification && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-500">Title</Label>
                  <p className="font-semibold text-lg break-words">{selectedNotification.Title}</p>
                </div>

                <div>
                  <Label className="text-gray-500">Message</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-48 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {selectedNotification.Message && selectedNotification.Message.trim() && !selectedNotification.Message.match(/^#{3,}$/) 
                        ? selectedNotification.Message 
                        : '(No message content)'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Target Role</Label>
                    <p className="font-medium">{selectedNotification.Target_Role}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Priority</Label>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${getPriorityColor(
                        selectedNotification.Priority
                      )}`}
                    >
                      {selectedNotification.Priority}
                    </span>
                  </div>
                </div>

                {/* Show selected users if Target_Role is 'Specific Users' */}
                {selectedNotification.Target_Role === 'Specific Users' && selectedNotification.Target_Users && (
                  <div>
                    <Label className="text-gray-500">Target Users</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-48 overflow-y-auto">
                      {selectedNotification.Target_Users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No users selected</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedNotification.Target_Users.map((user: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-medium">{user.username || 'Unknown User'}</p>
                                <p className="text-xs text-muted-foreground">{user.email || 'No email'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Category</Label>
                    <p className="font-medium">{selectedNotification.Category}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                        selectedNotification.Status
                      )}`}
                    >
                      {selectedNotification.Status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Created At</Label>
                    <p className="font-medium">
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedNotification.Expire_Date && (
                    <div>
                      <Label className="text-gray-500">Expire Date</Label>
                      <p className="font-medium">
                        {new Date(selectedNotification.Expire_Date).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedNotification.Link_Url && (
                  <div>
                    <Label className="text-gray-500">Link URL</Label>
                    <a
                      href={selectedNotification.Link_Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block mt-1 break-all text-sm"
                    >
                      {selectedNotification.Link_Url}
                    </a>
                  </div>
                )}

                {selectedNotification.Created_By && (
                  <div>
                    <Label className="text-gray-500">Created By</Label>
                    <p className="font-medium">{selectedNotification.Created_By}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setSelectedNotification(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this notification?
                {selectedNotification && (
                  <span className="font-semibold"> {selectedNotification.Title}</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedNotification(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedNotification && handleDeleteNotification(selectedNotification.documentId)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
