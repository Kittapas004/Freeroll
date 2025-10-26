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
import { Search, Plus, Edit, Trash2, UserPlus, Filter, Upload, Building2, Building, ChevronLeft, ChevronRight } from 'lucide-react'
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
  lab?: { id: string | number; documentId?: string; Lab_Name: string } | null
  factory?: { id: string | number; documentId?: string; Factory_Name: string } | null
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
  lab?: string | number | null  // Support both string (documentId) and number (id)
  factory?: string | number | null  // Support both string (documentId) and number (id)
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
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
    avatar: null,
    lab: null,
    factory: null
  })

  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  
  // Labs and Factories data - store both numeric id and documentId
  const [labs, setLabs] = useState<{ id: number; documentId: string; Lab_Name: string }[]>([])
  const [factories, setFactories] = useState<{ id: number; documentId: string; Factory_Name: string }[]>([])

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
    fetchLabsAndFactories()
  }, [])

  const fetchLabsAndFactories = async () => {
    try {
      const jwt = localStorage.getItem('jwt')
      
      // Fetch Labs
      const labsUrl = 'https://api-freeroll-production.up.railway.app/api/labs?pagination[pageSize]=100'
      const labsRes = await fetch(labsUrl, {
        headers: { Authorization: `Bearer ${jwt}` }
      })
      
      if (!labsRes.ok) {
        console.error('❌ Labs API error:', labsRes.status, labsRes.statusText)
      }
      
      const labsData = await labsRes.json()
      
      if (labsData?.data && Array.isArray(labsData.data)) {
        const mappedLabs = labsData.data.map((item: any) => {
          const labName = item.attributes?.Lab_Name || item.Lab_Name || 'Unknown Lab'
          const numericId = item.id
          const docId = item.documentId
          return {
            id: numericId,
            documentId: docId,
            Lab_Name: labName
          }
        })
        setLabs(mappedLabs)
      } else {
        setLabs([])
      }

      // Fetch Factories
      const factoriesUrl = 'https://api-freeroll-production.up.railway.app/api/factories?pagination[pageSize]=100'
      const factoriesRes = await fetch(factoriesUrl, {
        headers: { Authorization: `Bearer ${jwt}` }
      })
      
      if (!factoriesRes.ok) {
        console.error('❌ Factories API error:', factoriesRes.status, factoriesRes.statusText)
      }
      
      const factoriesData = await factoriesRes.json()
      
      if (factoriesData?.data && Array.isArray(factoriesData.data)) {
        const mappedFactories = factoriesData.data.map((item: any) => {
          const factoryName = item.attributes?.Factory_Name || item.Factory_Name || 'Unknown Factory'
          const numericId = item.id
          const docId = item.documentId
          return {
            id: numericId,
            documentId: docId,
            Factory_Name: factoryName
          }
        })
        setFactories(mappedFactories)
      } else {
        setFactories([])
      }
    } catch (error) {
      console.error('❌ Error fetching labs/factories:', error)
      setLabs([])
      setFactories([])
    }
  }

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
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [searchTerm, roleFilter, statusFilter, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // populate avatar, lab, and factory fields
      const response = await fetch('https://api-freeroll-production.up.railway.app/api/users?populate[avatar]=*&populate[lab]=*&populate[factory]=*', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to update Lab's users_permissions_users relation
  const updateLabUsers = async (labDocumentId: string, userId: number, action: 'add' | 'remove', jwt: string) => {
    try {
      // First, get current lab data with populated users
      const labRes = await fetch(`https://api-freeroll-production.up.railway.app/api/labs/${labDocumentId}?populate=users_permissions_users`, {
        headers: { Authorization: `Bearer ${jwt}` }
      })
      
      if (!labRes.ok) {
        console.error('Failed to fetch lab data')
        return
      }

      const labData = await labRes.json()
      const currentUsers = labData.data?.users_permissions_users || []

      // Calculate new users array
      let newUserIds: number[]
      if (action === 'add') {
        const existingUserIds = currentUsers.map((u: any) => u.id)
        newUserIds = existingUserIds.includes(userId) 
          ? existingUserIds 
          : [...existingUserIds, userId]
      } else {
        newUserIds = currentUsers.filter((u: any) => u.id !== userId).map((u: any) => u.id)
      }

      // Update lab with new users array
      const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/labs/${labDocumentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            users_permissions_users: newUserIds
          }
        })
      })

      if (!updateRes.ok) {
        const errorData = await updateRes.json()
        console.error('Failed to update lab users:', errorData)
      }
    } catch (error) {
      console.error('Error updating lab users:', error)
    }
  }

  // Helper function to update Factory's users_permissions_users relation
  const updateFactoryUsers = async (factoryDocumentId: string, userId: number, action: 'add' | 'remove', jwt: string) => {
    try {
      // First, get current factory data with populated users
      const factoryRes = await fetch(`https://api-freeroll-production.up.railway.app/api/factories/${factoryDocumentId}?populate=users_permissions_users`, {
        headers: { Authorization: `Bearer ${jwt}` }
      })
      
      if (!factoryRes.ok) {
        console.error('Failed to fetch factory data')
        return
      }

      const factoryData = await factoryRes.json()
      const currentUsers = factoryData.data?.users_permissions_users || []

      // Calculate new users array
      let newUserIds: number[]
      if (action === 'add') {
        const existingUserIds = currentUsers.map((u: any) => u.id)
        newUserIds = existingUserIds.includes(userId) 
          ? existingUserIds 
          : [...existingUserIds, userId]
      } else {
        newUserIds = currentUsers.filter((u: any) => u.id !== userId).map((u: any) => u.id)
      }

      // Update factory with new users array
      const updateRes = await fetch(`https://api-freeroll-production.up.railway.app/api/factories/${factoryDocumentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            users_permissions_users: newUserIds
          }
        })
      })

      if (!updateRes.ok) {
        const errorData = await updateRes.json()
        console.error('Failed to update factory users:', errorData)
      }
    } catch (error) {
      console.error('Error updating factory users:', error)
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
        user_role: formData.user_role,
        phone: formData.phone || '',
        blocked: formData.blocked,
      }

      // Include avatar ID if uploaded
      if (avatarId) {
        userData.avatar = avatarId
      }

      // Include lab ID if role is Quality Inspection
      if (formData.user_role === 'Quality Inspection' && formData.lab) {
        const selectedLab = labs.find(l => String(l.documentId) === String(formData.lab))
        if (selectedLab) {
          userData.lab = selectedLab.id
        }
      }

      // Include factory ID if role is Factory
      if (formData.user_role === 'Factory' && formData.factory) {
        const selectedFactory = factories.find(f => String(f.documentId) === String(formData.factory))
        if (selectedFactory) {
          userData.factory = selectedFactory.id
        }
      }

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

      const newUser = await response.json()

      // Step 2: Update Lab/Factory relations from Lab/Factory side
      const jwt = localStorage.getItem('jwt')
      
      if (formData.user_role === 'Quality Inspection' && formData.lab) {
        const selectedLab = labs.find(l => String(l.documentId) === String(formData.lab))
        if (selectedLab) {
          await updateLabUsers(selectedLab.documentId, newUser.id, 'add', jwt!)
        }
      }

      if (formData.user_role === 'Factory' && formData.factory) {
        const selectedFactory = factories.find(f => String(f.documentId) === String(formData.factory))
        if (selectedFactory) {
          await updateFactoryUsers(selectedFactory.documentId, newUser.id, 'add', jwt!)
        }
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
      const jwt = localStorage.getItem('jwt')
      
      // Step 1: Update basic user info (without lab/factory relations)
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        user_role: formData.user_role,
        phone: formData.phone || '',
        blocked: formData.blocked,
      }

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
            Authorization: `Bearer ${jwt}`,
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

      console.log('📝 Updating user basic info:', updateData)

      // Update user basic info
      const userResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error?.message || 'Failed to update user')
      }

      // Step 2: Handle Lab/Factory relations from Lab/Factory side
      const oldLabId = selectedUser.lab && typeof selectedUser.lab === 'object' 
        ? (selectedUser.lab as any).documentId || (selectedUser.lab as any).id 
        : null
      const oldFactoryId = selectedUser.factory && typeof selectedUser.factory === 'object'
        ? (selectedUser.factory as any).documentId || (selectedUser.factory as any).id
        : null
      const newLabId = formData.lab
      const newFactoryId = formData.factory

      // Handle Lab relation change
      if (formData.user_role === 'Quality Inspection') {
        if (oldLabId && oldLabId !== newLabId) {
          await updateLabUsers(String(oldLabId), selectedUser.id, 'remove', jwt!)
        }
        if (newLabId) {
          await updateLabUsers(String(newLabId), selectedUser.id, 'add', jwt!)
        }
        if (oldFactoryId) {
          await updateFactoryUsers(String(oldFactoryId), selectedUser.id, 'remove', jwt!)
        }
      } else if (formData.user_role === 'Factory') {
        if (oldFactoryId && oldFactoryId !== newFactoryId) {
          await updateFactoryUsers(String(oldFactoryId), selectedUser.id, 'remove', jwt!)
        }
        if (newFactoryId) {
          await updateFactoryUsers(String(newFactoryId), selectedUser.id, 'add', jwt!)
        }
        if (oldLabId) {
          await updateLabUsers(String(oldLabId), selectedUser.id, 'remove', jwt!)
        }
      } else {
        if (oldLabId) {
          await updateLabUsers(String(oldLabId), selectedUser.id, 'remove', jwt!)
        }
        if (oldFactoryId) {
          await updateFactoryUsers(String(oldFactoryId), selectedUser.id, 'remove', jwt!)
        }
      }

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
    
    // Get lab documentId
    let labDocId: string | number | null = null
    if (user.lab && typeof user.lab === 'object') {
      labDocId = (user.lab as any).documentId || null
      if (!labDocId && (user.lab as any).id) {
        const matchedLab = labs.find(l => l.id === (user.lab as any).id)
        labDocId = matchedLab?.documentId || null
      }
    }
    
    // Get factory documentId
    let factoryDocId: string | number | null = null
    if (user.factory && typeof user.factory === 'object') {
      factoryDocId = (user.factory as any).documentId || null
      if (!factoryDocId && (user.factory as any).id) {
        const matchedFactory = factories.find(f => f.id === (user.factory as any).id)
        factoryDocId = matchedFactory?.documentId || null
      }
    }
    
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      user_role: user.user_role || '',
      phone: user.phone || '',
      blocked: user.blocked,
      avatar: null,
      lab: labDocId,
      factory: factoryDocId,
    })
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
      lab: null,
      factory: null,
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
    if (!avatar) return ''
    
    if (typeof avatar === 'object') {
      const possibleUrls = [
        avatar.url,
        avatar.data?.attributes?.url,
        avatar.attributes?.url,
        avatar.formats?.thumbnail?.url,
        avatar.formats?.small?.url,
      ]

      for (const url of possibleUrls) {
        if (url) {
          if (url.startsWith('http')) return url
          return `https://api-freeroll-production.up.railway.app${url}`
        }
      }
      return ''
    }
    
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
                <BreadcrumbPage>User Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
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
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                        onValueChange={(value) => {
                          setFormData({ ...formData, user_role: value })
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="Farmer">Farmer</SelectItem>
                          <SelectItem value="Factory">Factory</SelectItem>
                          <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lab selection - show only for Quality Inspection */}
                    {formData.user_role === 'Quality Inspection' && (
                      <div className="grid gap-2">
                        <Label htmlFor="lab">Lab <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.lab?.toString() || ''}
                          onValueChange={(value) => {
                            setFormData({ ...formData, lab: value || null })
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Lab" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] max-h-[300px]" position="popper">
                            {labs.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No labs available. Please create labs first.
                              </div>
                            ) : (
                              labs.map((lab) => (
                                <SelectItem key={lab.id} value={lab.documentId.toString()}>
                                  {lab.Lab_Name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {labs.length} lab(s) available
                        </p>
                      </div>
                    )}

                    {/* Factory selection - show only for Factory */}
                    {formData.user_role === 'Factory' && (
                      <div className="grid gap-2">
                        <Label htmlFor="factory">Factory <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.factory?.toString() || ''}
                          onValueChange={(value) => {
                            setFormData({ ...formData, factory: value || null })
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Factory" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] max-h-[300px]" position="popper">
                            {factories.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No factories available. Please create factories first.
                              </div>
                            ) : (
                              factories.map((factory) => (
                                <SelectItem key={factory.id} value={factory.documentId.toString()}>
                                  {factory.Factory_Name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {factories.length} factory(s) available: {factories.map(f => f.Factory_Name).join(', ')}
                        </p>
                      </div>
                    )}

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
                <>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Lab/Factory</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers
                        .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                        .map((user) => (
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
                          <TableCell>
                            {user.user_role === 'Quality Inspection' && user.lab && typeof user.lab === 'object' && user.lab.Lab_Name ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                               {user.lab.Lab_Name}
                              </Badge>
                            ) : user.user_role === 'Factory' && user.factory && typeof user.factory === 'object' && user.factory.Factory_Name ? (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                 {user.factory.Factory_Name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
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
                
                {/* Pagination Controls */}
                {filteredUsers.length > ITEMS_PER_PAGE && (
                  <div className="mt-4 px-6 pb-4 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
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
                        {Array.from({ length: Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)))}
                        disabled={currentPage === Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
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
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                onValueChange={(value) => {
                  setFormData({ ...formData, user_role: value })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999] max-h-[300px]" position="popper">
                  <SelectItem value="Farmer">Farmer</SelectItem>
                  <SelectItem value="Factory">Factory</SelectItem>
                  <SelectItem value="Quality Inspection">Quality Inspection</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lab selection - show only for Quality Inspection */}
            {formData.user_role === 'Quality Inspection' && (
              <div className="grid gap-2">
                <Label htmlFor="edit-lab">Lab <span className="text-red-500">*</span></Label>
                <div className="w-full">
                  <Select
                    value={formData.lab?.toString() || ''}
                    onValueChange={(value) => {
                      setFormData({ ...formData, lab: value || null })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lab" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] max-h-[300px]" position="popper">
                      {labs.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No labs available. Please create labs first.
                        </div>
                      ) : (
                        labs.map((lab) => (
                          <SelectItem key={lab.id} value={lab.documentId.toString()}>
                            {lab.Lab_Name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {labs.length} lab(s) available 
                </p>
              </div>
            )}

            {/* Factory selection - show only for Factory */}
            {formData.user_role === 'Factory' && (
              <div className="grid gap-2">
                <Label htmlFor="edit-factory">Factory <span className="text-red-500">*</span></Label>
                <div className="w-full">
                  <Select
                    value={formData.factory?.toString() || ''}
                    onValueChange={(value) => {
                      setFormData({ ...formData, factory: value || null })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Factory" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] max-h-[300px]" position="popper">
                      {factories.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No factories available. Please create factories first.
                        </div>
                      ) : (
                        factories.map((factory) => (
                          <SelectItem key={factory.id} value={factory.documentId.toString()}>
                            {factory.Factory_Name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {factories.length} factory(s) available: {factories.map(f => f.Factory_Name).join(', ')}
                </p>
              </div>
            )}

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
