'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Users,
    Activity,
    Package,
    Bell,
    UserPlus,
    Settings,
    BellRing,
    CheckCircle2,
    AlertTriangle,
    UserCircle,
    Factory,
    Search,
    Zap,
    History,
    User,
    TrendingDown,
} from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AdminDashboardProps {
    userName?: string;
}

interface DashboardStats {
    totalUsers: number;
    activeInspections: number;
    processingBatches: number;
    totalNotifications: number;
    usersGrowth: string;
    inspectionsGrowth: string;
    batchesGrowth: string;
}

interface UserRoles {
    farmers: { total: number; active: number };
    inspectors: { total: number; active: number };
    factories: { total: number; active: number };
}

interface RecentActivity {
    id: string;
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
    time: string;
}

export default function AdminDashboard({ userName = 'Admin' }: AdminDashboardProps) {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState('7');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeInspections: 0,
        processingBatches: 0,
        totalNotifications: 0,
        usersGrowth: '+0%',
        inspectionsGrowth: '+0%',
        batchesGrowth: '+0%',
    });

    const [userRoles, setUserRoles] = useState<UserRoles>({
        farmers: { total: 0, active: 0 },
        inspectors: { total: 0, active: 0 },
        factories: { total: 0, active: 0 },
    });

    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

    // Fetch real data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('jwt');

                // Fetch all users
                const usersRes = await fetch('https://api-freeroll-production.up.railway.app/api/users?populate[avatar]=*&populate[lab]=*&populate[factory]=*', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const usersData = await usersRes.json();

                // Count users by role
                let farmerCount = 0;
                let inspectorCount = 0;
                let factoryCount = 0;

                usersData.forEach((user: any) => {
                    if (user.user_role === 'Farmer') farmerCount++;
                    else if (user.user_role === 'Quality Inspection') inspectorCount++;
                    else if (user.user_role === 'Factory') factoryCount++;
                });

                // Fetch processing data
                const processingRes = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const processingData = await processingRes.json();

                const activeBatches = processingData.data?.filter(
                    (item: any) => item.Processing_Status === 'Processing' || item.Processing_Status === 'Received'
                ).length || 0;

                // Count only Processing status for factory inspections
                const factoryProcessing = processingData.data?.filter(
                    (item: any) => item.Processing_Status === 'Processing'
                ).length || 0;

                // Fetch admin notifications
                const notifRes = await fetch('https://api-freeroll-production.up.railway.app/api/admin-notifications?populate=Target_Users&sort=createdAt:desc', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const notifData = await notifRes.json();

                // Update stats
                setStats({
                    totalUsers: usersData.length,
                    activeInspections: factoryProcessing,
                    processingBatches: activeBatches,
                    totalNotifications: notifData.data?.length || 0,
                    usersGrowth: '+2%',
                    inspectionsGrowth: factoryProcessing > 0 ? `+${Math.round((factoryProcessing / 20) * 100)}%` : '0%',
                    batchesGrowth: activeBatches > 0 ? `+${Math.round((activeBatches / 15) * 100)}%` : '0%',
                });

                setUserRoles({
                    farmers: { total: farmerCount, active: farmerCount },
                    inspectors: { total: inspectorCount, active: inspectorCount },
                    factories: { total: factoryCount, active: factoryCount },
                });

                // Create recent activities from real data (Admin-related activities)
                const activities: RecentActivity[] = [];

                // 1. Recently created/updated users
                if (usersData.length > 0) {
                    const sortedUsers = [...usersData].sort((a: any, b: any) =>
                        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
                    );
                    const recentUser = sortedUsers[0];
                    const isNew = new Date(recentUser.createdAt).getTime() === new Date(recentUser.updatedAt).getTime();

                    activities.push({
                        id: `user-${recentUser.id}`,
                        type: 'info',
                        title: isNew ? 'New user created' : 'User profile updated',
                        description: `${recentUser.username} (${recentUser.user_role}) · ${formatTimeAgo(recentUser.updatedAt || recentUser.createdAt)}`,
                        time: formatTimeAgo(recentUser.updatedAt || recentUser.createdAt),
                    });
                }

                // 2. Recently created/updated labs
                try {
                    const labsRes = await fetch('https://api-freeroll-production.up.railway.app/api/labs?sort=updatedAt:desc&pagination[limit]=1', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const labsData = await labsRes.json();

                    if (labsData.data && labsData.data.length > 0) {
                        const recentLab = labsData.data[0];
                        const isNew = new Date(recentLab.createdAt).getTime() === new Date(recentLab.updatedAt).getTime();

                        activities.push({
                            id: `lab-${recentLab.id}`,
                            type: 'success',
                            title: isNew ? 'New lab registered' : 'Lab information updated',
                            description: `${recentLab.Name || 'Lab'} · ${formatTimeAgo(recentLab.updatedAt)}`,
                            time: formatTimeAgo(recentLab.updatedAt),
                        });
                    }
                } catch (err) {
                    console.log('Could not fetch labs data');
                }

                // 3. Recently created/updated factories
                try {
                    const factoriesRes = await fetch('https://api-freeroll-production.up.railway.app/api/factories?sort=updatedAt:desc&pagination[limit]=1', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const factoriesData = await factoriesRes.json();

                    if (factoriesData.data && factoriesData.data.length > 0) {
                        const recentFactory = factoriesData.data[0];
                        const isNew = new Date(recentFactory.createdAt).getTime() === new Date(recentFactory.updatedAt).getTime();

                        activities.push({
                            id: `factory-${recentFactory.id}`,
                            type: 'success',
                            title: isNew ? 'New factory registered' : 'Factory information updated',
                            description: `${recentFactory.Name || 'Factory'} · ${formatTimeAgo(recentFactory.updatedAt)}`,
                            time: formatTimeAgo(recentFactory.updatedAt),
                        });
                    }
                } catch (err) {
                    console.log('Could not fetch factories data');
                }

                // 4. Recently created admin notifications
                if (notifData.data && notifData.data.length > 0) {
                    const recentNotif = notifData.data[0];

                    activities.push({
                        id: `notif-${recentNotif.id}`,
                        type: 'info',
                        title: 'Notification sent',
                        description: `${recentNotif.Title || 'Notification'} · ${formatTimeAgo(recentNotif.createdAt)}`,
                        time: formatTimeAgo(recentNotif.createdAt),
                    });
                }

                // Sort all activities by time and take top 5
                activities.sort((a, b) => {
                    const timeA = new Date(a.time).getTime();
                    const timeB = new Date(b.time).getTime();
                    return timeB - timeA;
                });

                setRecentActivities(activities.slice(0, 5));

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatTimeAgo = (dateString: string): string => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return new Date(dateString).toLocaleDateString();
    };

    // User Activity Trends Data (7 days) - Show empty data if no users
    const hasUserData = stats.totalUsers > 0;
    const activityData = {
        labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        datasets: [
            {
                label: 'User Activity',
                data: hasUserData ? [5, 7, 9, 6, 8, 7, 7] : [0, 0, 0, 0, 0, 0, 0],
                borderColor: hasUserData ? '#10b981' : '#d1d5db',
                backgroundColor: hasUserData ? 'rgba(16, 185, 129, 0.1)' : 'rgba(209, 213, 219, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: hasUserData ? '#10b981' : '#d1d5db',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const activityOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#000',
                bodyColor: '#666',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11,
                    },
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f3f4f6',
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11,
                    },
                    stepSize: 2,
                },
            },
        },
    };

    // Total User Distribution (Donut Chart)
    const userDistributionData = {
        labels: ['Farmer', 'Inspector', 'Factories'],
        datasets: [
            {
                data: [userRoles.farmers.total, userRoles.inspectors.total, userRoles.factories.total],
                backgroundColor: ['#10b981', '#3b82f6', '#f97316'],
                borderWidth: 0,
                cutout: '70%',
            },
        ],
    };

    const userDistributionOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#000',
                bodyColor: '#666',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
            },
        },
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            {/* Welcome Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome {userName}!</h1>
                        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your system today</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading dashboard data...</div>
                </div>
            ) : (
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Users */}
                        <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Total Users</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</h3>
                                    <p className="text-xs text-gray-500 mt-2">All users in the system</p>
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                        {/* <span>{stats.usersGrowth} this month</span> */}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </Card>

                        {/* Factory Processing */}
                        <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Factory Processing</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeInspections}</h3>
                                    <p className="text-xs text-gray-500 mt-2">Currently being processed</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Activity className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </Card>

                        {/* Processing Batches */}
                        <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Processing Batches</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.processingBatches}</h3>
                                    <p className="text-xs text-gray-500 mt-2">Currently being processed farmer for batches</p>
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                        {/* <span>{stats.batchesGrowth} this week</span> */}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Package className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </Card>

                        {/* Total Notifications */}
                        <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Total Notifications Sent</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalNotifications}</h3>
                                    <p className="text-xs text-gray-500 mt-2">Total messages to users via all channels</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <Bell className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User Activity Trends */}
                        <Card className="lg:col-span-2 p-6 bg-white border-0 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="text-green-600" size={16} />
                                    <h3 className="text-sm font-bold text-green-700">User Activity Trends</h3>
                                </div>
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger className="w-32 h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Last 7 days</SelectItem>
                                        <SelectItem value="14">Last 14 days</SelectItem>
                                        <SelectItem value="30">Last 30 days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {!hasUserData ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center">
                                    <Activity className="w-12 h-12 text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium">No user activity data</p>
                                    <p className="text-gray-400 text-sm mt-1">User activity will appear here once users are active in the system</p>
                                </div>
                            ) : (
                                <div className="h-64">
                                    <Line data={activityData} options={activityOptions} />
                                </div>
                            )}
                        </Card>

                        {/* Total User Distribution */}
                        <Card className="p-6 bg-white border-0 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Users className="text-green-600" size={16} />
                                <h3 className="text-sm font-bold text-green-700">Total User</h3>
                            </div>
                            <div className="h-64 flex items-center justify-center">
                                <Doughnut data={userDistributionData} options={userDistributionOptions} />
                            </div>
                        </Card>
                    </div>

                    {/* User Roles Overview - Full Width */}
                    <Card className="p-6 bg-white border-0 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="text-green-600" size={16} />
                            <h3 className="text-sm font-bold text-green-700">User Roles Overview</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            {/* Farmers */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <UserCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h4 className="font-semibold text-gray-700 mb-1">Farmers</h4>
                                <p className="text-2xl font-bold text-gray-900">{userRoles.farmers.total}</p>
                                <p className="text-xs text-gray-500 mt-1">Active: {userRoles.farmers.active}</p>
                            </div>

                            {/* Inspectors */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-10 h-10 text-blue-600" />
                                </div>
                                <h4 className="font-semibold text-gray-700 mb-1">Inspectors</h4>
                                <p className="text-2xl font-bold text-gray-900">{userRoles.inspectors.total}</p>
                                <p className="text-xs text-gray-500 mt-1">Active: {userRoles.inspectors.active}</p>
                            </div>

                            {/* Factories */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                    <Factory className="w-10 h-10 text-purple-600" />
                                </div>
                                <h4 className="font-semibold text-gray-700 mb-1">Factories</h4>
                                <p className="text-2xl font-bold text-gray-900">{userRoles.factories.total}</p>
                                <p className="text-xs text-gray-500 mt-1">Active: {userRoles.factories.active}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Activity & Quick Actions Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Activity - Takes 2 columns */}
                        <Card className="lg:col-span-2 p-6 bg-white border-0 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <History className="text-green-600" size={16} />
                                <h3 className="text-sm font-bold text-green-700">Recent Activity</h3>
                            </div>

                            <div className="space-y-3">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="border p-4 rounded-xl hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div
                                                    className={`p-2 rounded-full ${activity.type === 'success'
                                                        ? 'bg-green-100'
                                                        : activity.type === 'warning'
                                                            ? 'bg-orange-100'
                                                            : 'bg-blue-100'
                                                        }`}
                                                >
                                                    {activity.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                                    {activity.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                                                    {activity.type === 'info' && <UserCircle className="w-4 h-4 text-blue-600" />}
                                                </div>
                                                <h4 className="font-medium text-sm text-gray-700">{activity.title}</h4>
                                            </div>
                                            <p className="text-xs text-gray-600 ml-11">{activity.description}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-12">
                                        <History className="w-12 h-12 text-gray-300 mb-3" />
                                        <p className="text-gray-500 font-medium">No recent activities</p>
                                        <p className="text-gray-400 text-sm mt-1">Activities will appear here as users interact with the system</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Quick Action */}
                        <Card className="p-6 bg-white border-0 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="text-green-600" size={16} />
                                <h3 className="text-sm font-bold text-green-700">Quick Action</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    className="flex flex-col items-center gap-2 border rounded-xl py-4 hover:bg-gray-50 transition-colors"
                                    onClick={() => router.push('/users')}
                                >
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <UserPlus className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium">User Management</span>
                                </button>

                                <button
                                    className="flex flex-col items-center gap-2 border rounded-xl py-4 hover:bg-gray-50 transition-colors"
                                    onClick={() => router.push('/admin/settings')}
                                >
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <Settings className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium">System Settings</span>
                                </button>

                                <button
                                    className="flex flex-col items-center gap-2 border rounded-xl py-4 hover:bg-gray-50 transition-colors"
                                    onClick={() => router.push('/labsAdmin')}
                                >
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Search className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium">Lab Management</span>
                                </button>

                                <button
                                    className="flex flex-col items-center gap-2 border rounded-xl py-4 hover:bg-gray-50 transition-colors"
                                    onClick={() => router.push('/factoriesAdmin')}
                                >
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Factory className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium">Factory Management</span>
                                </button>

                                <button
                                    className="flex flex-col items-center gap-2 border rounded-xl py-4 hover:bg-gray-50 transition-colors col-span-2"
                                    onClick={() => router.push('/admin-notifications')}
                                >
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <BellRing className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium">Notifications</span>
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
