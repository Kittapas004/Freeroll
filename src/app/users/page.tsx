'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, UserPlus, Filter, Upload } from 'lucide-react'
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface User {
  id: number
  documentId: string
  username: string
  email: string
  user_role?: string
  phone?: string
  blocked: boolean
  avatar?: string | any // Can be string URL or Strapi media object
  createdAt: string
  updatedAt: string
}

interface NewUser {
  username: string
  email: string
  password: string
  user_role: string
  phone?: string
  blocked: boolean
  avatar?: File | null
}

// Role mapping for Strapi
// ⚠️ ต้องตรวจสอบ Role ID จริงใน Strapi Admin Panel
// ไปที่: Settings → Users & Permissions → Roles
const ROLE_MAP: { [key: string]: number } = {
  'Farmer': 1,          // Authenticated role
  'Factory': 1,         // ใช้ role เดียวกัน
  'Quality Inspection': 1,  // ใช้ role เดียวกัน
  'Admin': 1,           // ใช้ role เดียวกัน (จะใช้ user_role แยก)
}

export default function UserManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    user_role: '',
    phone: '',
    blocked: false,
    avatar: null
  })

  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    setCurrentUserRole(userRole || '')
    
    if (userRole !== 'Admin') {
      router.push('/unauthorized')
      return
    }
  }, [router])

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
      )
    }

    // Role filter
    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.user_role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(user => 
        statusFilter === 'Active' ? !user.blocked : user.blocked
      )
    }

    setFilteredUsers(filtered)
  }, [searchTerm, roleFilter, statusFilter, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // ต้อง populate avatar field
      const response = await fetch('https://api-freeroll-production.up.railway.app/api/users?populate=avatar', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      console.log('Users data:', data)
      // Log first user's avatar to debug
      if (data.length > 0) {
        console.log('First user:', data[0])
        console.log('First user avatar:', data[0].avatar)
      }
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    // Validate required fields
    if (!formData.username || !formData.email || !formData.password || !formData.user_role) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน (Username, Email, Password, และ Role)')
      return
    }

    try {
      // Get role ID from role name
      const roleId = ROLE_MAP[formData.user_role]
      
      if (!roleId) {
        throw new Error('Invalid role selected')
      }

      // Upload avatar first if exists
      let avatarId: number | undefined = undefined
      if (formData.avatar) {
        const formDataUpload = new FormData()
        formDataUpload.append('files', formData.avatar)

        const uploadResponse = await fetch('https://api-freeroll-production.up.railway.app/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
          body: formDataUpload,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          avatarId = uploadData[0]?.id // Use ID, not URL
        }
      }

      // Prepare data for Strapi - use role ID
      const userData: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: roleId,  // Strapi expects role ID (number)
        phone: formData.phone || '',
        blocked: formData.blocked,
      }

      // Include avatar ID if uploaded
      if (avatarId) {
        userData.avatar = avatarId
      }

      console.log('Sending user data:', userData)

      const response = await fetch('https://api-freeroll-production.up.railway.app/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Server error:', error)
        throw new Error(error.error.message || 'Failed to create user')
      }

      setIsAddDialogOpen(false)
      resetForm()
      fetchUsers()
      alert('เพิ่มผู้ใช้สำเร็จ!')
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(error.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || '',
        blocked: formData.blocked,
      }

      // ไม่ส่ง role เพราะใช้ user_role enumeration แทน
      // role field จะใช้ default "Authenticated" role (ID: 1)

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password
      }

      // Upload avatar first if new avatar is provided
      if (formData.avatar) {
        const formDataUpload = new FormData()
        formDataUpload.append('files', formData.avatar)

        const uploadResponse = await fetch('https://api-freeroll-production.up.railway.app/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
          body: formDataUpload,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          const avatarId = uploadData[0]?.id
          if (avatarId) {
            updateData.avatar = avatarId
          }
        }
      }

      console.log('Update data (simplified):', updateData)

      // Update user WITHOUT role field
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify(updateData),
      })

      const responseData = await response.json()
      console.log('Response:', responseData)

      if (!response.ok) {
        console.error('Update error details:', responseData)
        throw new Error(responseData.error?.message || responseData.message || 'Failed to update user')
      }

      console.log('✅ User updated successfully')

      setIsEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      fetchUsers()
      alert('อัพเดทผู้ใช้สำเร็จ!')
    } catch (error: any) {
      console.error('Error updating user:', error)
      alert(error.message || 'เกิดข้อผิดพลาดในการอัพเดทผู้ใช้')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      user_role: user.user_role || '',
      phone: user.phone || '',
      blocked: user.blocked,
      avatar: null,
    })
    // Use getAvatarUrl to handle both string and object formats
    setAvatarPreview(getAvatarUrl(user.avatar))
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      user_role: '',
      phone: '',
      blocked: false,
      avatar: null,
    })
    setAvatarPreview('')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, avatar: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getAvatarUrl = (avatar?: string | any) => {
    console.log('🖼️ Processing avatar:', avatar)
    
    if (!avatar) return ''
    
    // If avatar is a Strapi media object with nested structure
    if (typeof avatar === 'object') {
      // Try multiple possible paths in Strapi structure
      const possibleUrls = [
        avatar.url,                           // Direct: { url: '...' }
        avatar.data?.attributes?.url,         // Strapi v4: { data: { attributes: { url: '...' } } }
        avatar.attributes?.url,               // Alternative: { attributes: { url: '...' } }
        avatar.formats?.thumbnail?.url,       // Thumbnail
        avatar.formats?.small?.url,           // Small
      ]

      for (const url of possibleUrls) {
        if (url) {
          console.log('✅ Found avatar URL:', url)
          if (url.startsWith('http')) return url
          return `https://api-freeroll-production.up.railway.app${url}`
        }
      }
      
      console.log('❌ No valid URL found in avatar object')
      return ''
    }
    
    // If avatar is a string
    const avatarStr = typeof avatar === 'string' ? avatar : String(avatar)
    if (!avatarStr || avatarStr === '[object Object]') return ''
    if (avatarStr.startsWith('http')) return avatarStr
    return `https://api-freeroll-production.up.railway.app${avatarStr}`
  }

  const getInitials = (name: string) => {
    if (!name) return '??'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-500'
      case 'Factory':
        return 'bg-orange-500'
      case 'Farmer':
        return 'bg-green-500'
      case 'Quality Inspection':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (currentUserRole !== 'Admin') {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
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
                  <BreadcrumbPage>User Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-screen w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-gray-500 mt-1">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
                </p>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                if (open) {
                  resetForm()
                }
                setIsAddDialogOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account for the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Avatar Upload */}
                    <div className="grid gap-2">
                      <Label>Avatar</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl text-gray-400">👤</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 2MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="username">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.user_role}
                        onValueChange={(value) => setFormData({ ...formData, user_role: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Farmer">Farmer</SelectItem>
                          <SelectItem value="Factory">Factory</SelectItem>
                          <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="blocked"
                        checked={formData.blocked}
                        onChange={(e) => setFormData({ ...formData, blocked: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="blocked" className="cursor-pointer">
                        Block user account
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser} className="bg-green-500 hover:bg-green-600">
                      Save User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  <SelectItem value="Farmer">Farmer</SelectItem>
                  <SelectItem value="Factory">Factory</SelectItem>
                  <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user.avatar ? (
                                  <img 
                                    src={getAvatarUrl(user.avatar)} 
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-semibold text-sm">
                                    {getInitials(user.username)}
                                  </span>
                                )}
                              </div>
                              <span>{user.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={`${getRoleBadgeColor(user.user_role)} text-white`}>
                              {user.user_role || 'No Role'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={user.blocked ? "destructive" : "default"}>
                              {user.blocked ? 'Blocked' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.updatedAt).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="grid gap-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-400">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    id="edit-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-username">Full Name</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.user_role}
                onValueChange={(value) => setFormData({ ...formData, user_role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Farmer">Farmer</SelectItem>
                  <SelectItem value="Factory">Factory</SelectItem>
                  <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-blocked"
                checked={formData.blocked}
                onChange={(e) => setFormData({ ...formData, blocked: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-blocked" className="cursor-pointer">
                Block user account
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              setSelectedUser(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              Save Changes
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
              This action cannot be undone. This will permanently delete the user account
              <span className="font-semibold"> {selectedUser?.username}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
