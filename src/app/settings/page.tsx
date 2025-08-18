'use client';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, User } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

interface UserData {
    username: string;
    email: string;
    avatar?: { url: string };
    phone?: string;
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
    const [currentPassword, setCurrentPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            localStorage.setItem('sidebarOpen', String(!prev));
            return !prev;
        });
    };

    const handleUpdateUser = async (userData: UserData) => {
        try {
            let imageId = null;

            // Check if a new image is selected for upload
            if (imageInputRef.current?.files?.[0]) {
                const formData = new FormData();
                formData.append("files", imageInputRef.current.files[0]);

                console.log("📦 Uploading file:", imageInputRef.current.files[0]);

                const uploadRes = await fetch("https://popular-trust-9012d3ebd9.strapiapp.com/api/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: formData,
                });



                if (!uploadRes.ok) {
                    throw new Error("Failed to upload image");
                }

                const uploadData = await uploadRes.json();
                imageId = uploadData[0]?.id; // Get the uploaded image ID
            }

            // Prepare the updated user data
            const updatedUserData: any = {
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
            };

            // Include the uploaded image ID if available
            if (imageId) {
                updatedUserData.avatar = { id: imageId };
            }

            // Fetch the numeric user ID
            const jwt = localStorage.getItem("jwt");
            const userRes = await fetch("https://popular-trust-9012d3ebd9.strapiapp.com/api/users/me", {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });

            if (!userRes.ok) {
                throw new Error("Failed to fetch user ID");
            }

            const userDataResponse = await userRes.json();
            const userId = userDataResponse.id; // Numeric user ID

            // Update the user
            const res = await fetch(`https://popular-trust-9012d3ebd9.strapiapp.com/api/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify(updatedUserData),
            });

            console.log("🔁 Update Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json(); // Parse the error response
                console.error("📜 Update Error body:", errorData);
                throw new Error("Failed to update user");
            }

            const data = await res.json();
            console.log("✅ Updated user:", data);
            alert("User updated successfully!");
        } catch (err) {
            console.error("❌ Error updating user:", err);
            alert("Failed to update user. Please try again.");
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const jwt = localStorage.getItem("jwt");
                console.log("JWT token:", jwt);

                const res = await fetch('https://popular-trust-9012d3ebd9.strapiapp.com/api/users/me?populate=*', {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("📜 Error body:", errorText);
                    throw new Error(`Failed to fetch user (status: ${res.status})`);
                }

                const data = await res.json();
                console.log("✅ Fetched user:", data);

                // Debug avatar data structure
                console.log("🖼️ Avatar data:", data.avatar);
                if (data.avatar) {
                    console.log("🔗 Avatar URL structure:", {
                        direct: data.avatar.url,
                        nested: data.avatar.data?.attributes?.url,
                        formats: data.avatar.data?.attributes?.formats
                    });
                }

                setUser(data);
            } catch (err) {
                console.error("❌ Error fetching user:", err);
            }
        };

        fetchUser();
    }, []);

    const getAvatarUrl = (avatar: any) => {
        if (!avatar) return null;

        // ลองหลายรูปแบบของ Strapi structure
        const possibleUrls = [
            avatar.url,                                    // Direct URL
            avatar.data?.attributes?.url,                  // Strapi v4 structure
            avatar.data?.attributes?.formats?.thumbnail?.url, // Thumbnail format
            avatar.data?.attributes?.formats?.small?.url,     // Small format
        ];

        const validUrl = possibleUrls.find(url => url);

        if (validUrl) {
            // ตรวจสอบว่าเป็น full URL หรือไม่
            if (validUrl.startsWith('http')) {
                return validUrl;
            } else {
                return `https://popular-trust-9012d3ebd9.strapiapp.com${validUrl}`;
            }
        }

        return null;
    };


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
                            <div
                                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 transition cursor-pointer bg-gray-50 relative mx-auto"
                                onClick={() => imageInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="absolute inset-0 object-cover w-full h-full rounded-full"
                                        onError={(e) => {
                                            console.error("❌ Error loading preview image");
                                            setImagePreview(null);
                                        }}
                                    />
                                ) : getAvatarUrl(user.avatar) ? (
                                    <img
                                        src={getAvatarUrl(user.avatar)}
                                        alt="Avatar"
                                        className="absolute inset-0 object-cover w-full h-full rounded-full"
                                        onError={(e) => {
                                            console.error("❌ Error loading avatar image:", getAvatarUrl(user.avatar));
                                            // อาจจะ set state เพื่อไม่ให้แสดงรูปนี้อีก
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 z-10">
                                        <p className="text-sm">Drag & drop an image here</p>
                                        <p className="text-xs text-gray-400">or click to browse</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={imageInputRef}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleFile(file);
                                        }
                                    }}
                                    className="hidden"
                                />
                            </div>
                            <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>
                                    <label className="text-sm font-medium block mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={user.username}
                                        onChange={(e) => setUser({ ...user, username: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        className="w-full border rounded px-3 py-2 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        onChange={(e) => {
                                            setPhone(e.target.value);
                                            setUser({ ...user, phone: e.target.value });
                                        }}
                                        value={phone}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>

                                <div className="col-span-full flex justify-end gap-2 mt-4">
                                    <button className="px-4 py-2 border rounded text-white bg-red-600 hover:bg-red-700">
                                        Cancel
                                    </button>
                                    <button className="px-4 py-2 border rounded text-white bg-green-600 hover:bg-green-700"
                                        onClick={() => handleUpdateUser(user!)}
                                    >
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
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
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
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
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
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    <button
                                        className="px-4 py-2 border rounded text-white bg-green-600 hover:bg-green-700"
                                        onClick={async () => {
                                            if (newPassword !== confirmPassword) {
                                                alert("New password and confirmation do not match.");
                                                return;
                                            }
                                            try {
                                                const jwt = localStorage.getItem("jwt");
                                                const res = await fetch("https://popular-trust-9012d3ebd9.strapiapp.com/api/auth/change-password", {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        Authorization: `Bearer ${jwt}`,
                                                    },
                                                    body: JSON.stringify({
                                                        currentPassword,
                                                        password: newPassword,
                                                        passwordConfirmation: confirmPassword,
                                                    }),
                                                });

                                                if (!res.ok) {
                                                    const errorData = await res.json();
                                                    console.error("Error changing password:", errorData);
                                                    alert("Failed to change password. Please try again.");
                                                    return;
                                                }

                                                alert("Password changed successfully!");
                                                setCurrentPassword("");
                                                setNewPassword("");
                                                setConfirmPassword("");
                                            } catch (err) {
                                                console.error("Error:", err);
                                                alert("An error occurred. Please try again.");
                                            }
                                        }}
                                    >
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
