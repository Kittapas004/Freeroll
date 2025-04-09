'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, User } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

interface UserData {
    username: string;
    email: string;
    avatar?: { url: string };
    phone?: string;
    user_role?: string;
    farms?: { name: string }[];
}

export default function SettingsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState<UserData | null>(null);

    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (user?.phone) setPhone(user.phone);
    }, [user]);

    <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border rounded px-3 py-2"
    />
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem('sidebarOpen', String(!prev));
            return !prev;
        });
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const jwt = localStorage.getItem("jwt");
                console.log("JWT token:", jwt);

                const res = await fetch('http://localhost:1337/api/users/me?populate[avatar]=*&populate[farms]=*', {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                });

                console.log("🔁 Status:", res.status);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("📜 Error body:", errorText);
                    throw new Error(`Failed to fetch user (status: ${res.status})`);
                }

                const data = await res.json();
                console.log("✅ Fetched user:", data);
                setUser(data);
            } catch (err) {
                console.error("❌ Error fetching user:", err);
            }
        };

        fetchUser();
    }, []);

    if (!user) {
        return <div className="p-6 text-gray-500">Loading user info...</div>;
    }

    return (
        <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger onClick={toggleSidebar} />
                        <h1 className="text-xl font-semibold">Account Settings</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="bg-white shadow rounded mb-6">
                            <TabsTrigger value="personal" className="flex items-center gap-1 px-4 py-2">
                                <User className="w-4 h-4" /> Personal Information
                            </TabsTrigger>
                            <TabsTrigger value="password" className="flex items-center gap-1 px-4 py-2">
                                <Lock className="w-4 h-4" /> Change Password
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal">
                            <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-full text-center mb-4">
                                    <img
                                        src={
                                            user.avatar?.url
                                                ? `http://localhost:1337${user.avatar.url}`
                                                : '/kitapas.jpg'
                                        }
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full mx-auto mb-2 object-cover"
                                    />
                                    <p className="text-blue-600 text-sm cursor-pointer hover:underline">Change Picture</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={user.username}
                                        className="w-full border rounded px-3 py-2"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        className="w-full border rounded px-3 py-2"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={user.phone || ''}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Farm Name</label>
                                    <input
                                        type="text"
                                        value={user.farms?.[0]?.name || ''}
                                        className="w-full border rounded px-3 py-2"
                                        disabled
                                    />
                                </div>

                                <div className="col-span-full flex justify-end gap-2 mt-4">
                                    <button className="px-4 py-2 border rounded text-white bg-red-600 hover:bg-red-700">
                                        Cancel
                                    </button>
                                    <button className="px-4 py-2 border rounded text-white bg-green-600 hover:bg-green-700">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="password">
                            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="text-sm font-medium block mb-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="w-full border rounded px-3 py-2 pr-10"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="text-sm font-medium block mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            className="w-full border rounded px-3 py-2 pr-10"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="text-sm font-medium block mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="w-full border rounded px-3 py-2 pr-10"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button className="px-4 py-2 border rounded text-white bg-red-600 hover:bg-red-700">
                                        Cancel
                                    </button>
                                    <button className="px-4 py-2 border rounded text-white bg-green-600 hover:bg-green-700">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
