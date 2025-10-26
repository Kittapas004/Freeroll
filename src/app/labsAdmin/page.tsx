"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Lab {
  id: number
  Lab_Name: string
  Status_Lab: string
  Contact_person?: string
  Phone?: string
  Email?: string
  createdAt: string
  updatedAt: string
}

interface LabFormData {
  Lab_Name: string
  Status_Lab: string
  Contact_person: string
  Phone: string
  Email: string
}

const initialFormData: LabFormData = {
  Lab_Name: "",
  Status_Lab: "Active",
  Contact_person: "",
  Phone: "",
  Email: "",
}

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null)
  const [formData, setFormData] = useState<LabFormData>(initialFormData)
  const { toast } = useToast()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchLabs()
  }, [])

  const fetchLabs = async () => {
    try {
      const response = await fetch('https://api-freeroll-production.up.railway.app/api/labs?populate=*', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error('Failed to fetch labs')
      }
      
      const data = await response.json()
      console.log('✅ Labs data:', data)
      console.log('✅ Labs count:', data.data?.length || 0)
      
      if (data.data && Array.isArray(data.data)) {
        const mappedLabs = data.data.map((item: any) => {
          // Check if attributes exist (Strapi v4 format) or use item directly
          if (item.attributes) {
            console.log('✅ Lab with attributes:', item)
            return {
              id: item.id,
              ...item.attributes
            }
          } else {
            // Data is already flattened - use documentId (Strapi v5)
            console.log('✅ Lab flattened:', item)
            return {
              ...item,
              id: item.documentId || item.id  // Use documentId for API calls
            }
          }
        })
        console.log('✅ Mapped Labs:', mappedLabs)
        setLabs(mappedLabs)
      } else {
        console.warn('⚠️ No labs data found or invalid format')
        setLabs([])
      }
    } catch (error) {
      console.error('❌ Error fetching labs:', error)
      toast({
        title: "Error",
        description: "Failed to load labs. Please check console for details.",
        variant: "destructive",
      })
    }
  }

  const handleAddLab = async () => {
    if (!formData.Lab_Name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lab name",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('https://api-freeroll-production.up.railway.app/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          data: {
            Lab_Name: formData.Lab_Name,
            Status_Lab: formData.Status_Lab,
            Contact_person: formData.Contact_person || undefined,
            Phone: formData.Phone || undefined,
            Email: formData.Email || undefined,
            exported: false
          }
        })
      })

      if (!response.ok) throw new Error('Failed to add lab')

      toast({
        title: "Success",
        description: "Lab added successfully",
      })
      
      setFormData(initialFormData)
      setIsAddDialogOpen(false)
      fetchLabs()
    } catch (error) {
      console.error('Error adding lab:', error)
      toast({
        title: "Error",
        description: "Failed to add lab",
        variant: "destructive",
      })
    }
  }

  const handleUpdateLab = async () => {
    if (!selectedLab || !formData.Lab_Name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lab name",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('🔄 Updating lab:', selectedLab.id)
      console.log('📝 Form data:', formData)
      
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/labs/${selectedLab.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          data: {
            Lab_Name: formData.Lab_Name,
            Status_Lab: formData.Status_Lab,
            Contact_person: formData.Contact_person || null,
            Phone: formData.Phone || null,
            Email: formData.Email || null,
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error Response:', errorData)
        throw new Error(errorData.error?.message || 'Failed to update lab')
      }

      const result = await response.json()
      console.log('✅ Update result:', result)

      toast({
        title: "Success",
        description: "Lab updated successfully",
      })
      
      setFormData(initialFormData)
      setIsEditDialogOpen(false)
      setSelectedLab(null)
      fetchLabs()
    } catch (error: any) {
      console.error('❌ Error updating lab:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update lab",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLab = async (id: number) => {
    try {
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/labs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete lab')

      toast({
        title: "Success",
        description: "Lab deleted successfully",
      })
      
      setIsDeleteDialogOpen(false)
      setSelectedLab(null)
      fetchLabs()
    } catch (error) {
      console.error('Error deleting lab:', error)
      toast({
        title: "Error",
        description: "Failed to delete lab",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (lab: Lab) => {
    setSelectedLab(lab)
    setFormData({
      Lab_Name: lab.Lab_Name,
      Status_Lab: lab.Status_Lab,
      Contact_person: lab.Contact_person || "",
      Phone: lab.Phone || "",
      Email: lab.Email || "",
    })
    setIsEditDialogOpen(true)
  }

  const filteredLabs = labs.filter(lab =>
    lab.Lab_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredLabs.length / ITEMS_PER_PAGE)
  const paginatedLabs = filteredLabs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

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
                <BreadcrumbPage>Lab Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Lab Management</h1>
              <p className="text-muted-foreground">Testing Lab Management</p>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lab
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Lab</DialogTitle>
                  <DialogDescription>
                    Add Testing Lab to the System
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-lab-name">Lab Name *</Label>
                      <Input
                        id="add-lab-name"
                        placeholder="Enter lab name"
                        value={formData.Lab_Name}
                        onChange={(e) => setFormData({ ...formData, Lab_Name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="add-status">Status *</Label>
                      <Select
                        value={formData.Status_Lab}
                        onValueChange={(value) => setFormData({ ...formData, Status_Lab: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="add-contact">Contact Person</Label>
                      <Input
                        id="add-contact"
                        placeholder="Enter contact person"
                        value={formData.Contact_person}
                        onChange={(e) => setFormData({ ...formData, Contact_person: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="add-phone">Phone</Label>
                      <Input
                        id="add-phone"
                        placeholder="Enter phone number"
                        value={formData.Phone}
                        onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="add-email">Email</Label>
                      <Input
                        id="add-email"
                        type="email"
                        placeholder="Enter email"
                        value={formData.Email}
                        onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false)
                    setFormData(initialFormData)
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLab} className="bg-green-600 hover:bg-green-700">
                    Add Lab
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">ID</TableHead>
                  <TableHead>Lab Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No labs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLabs.map((lab, index) => (
                    <TableRow key={lab.id}>
                      <TableCell className="font-medium pl-6">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                      <TableCell>{lab.Lab_Name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          lab.Status_Lab === 'Active' ? 'bg-green-100 text-green-800' :
                          lab.Status_Lab === 'Inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lab.Status_Lab}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lab.Contact_person && <div className="font-medium">{lab.Contact_person}</div>}
                          {lab.Phone && <div className="text-gray-600">{lab.Phone}</div>}
                          {lab.Email && <div className="text-gray-600 text-xs">{lab.Email}</div>}
                          {!lab.Contact_person && !lab.Phone && !lab.Email && <span className="text-gray-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lab.createdAt ? new Date(lab.createdAt).toLocaleDateString('th-TH') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-2 pr-6">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(lab)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setSelectedLab(lab)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {filteredLabs.length > ITEMS_PER_PAGE && (
              <div className="mt-4 px-6 pb-4 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredLabs.length)} of {filteredLabs.length} labs
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Lab</DialogTitle>
                <DialogDescription>
                  แก้ไขข้อมูลห้องแล็บทดสอบ
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-lab-name">Lab Name *</Label>
                    <Input
                      id="edit-lab-name"
                      placeholder="Enter lab name"
                      value={formData.Lab_Name}
                      onChange={(e) => setFormData({ ...formData, Lab_Name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select
                      value={formData.Status_Lab}
                      onValueChange={(value) => setFormData({ ...formData, Status_Lab: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-contact">Contact Person</Label>
                    <Input
                      id="edit-contact"
                      placeholder="Enter contact person"
                      value={formData.Contact_person}
                      onChange={(e) => setFormData({ ...formData, Contact_person: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      placeholder="Enter phone number"
                      value={formData.Phone}
                      onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.Email}
                      onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  setFormData(initialFormData)
                  setSelectedLab(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateLab} className="bg-blue-600 hover:bg-blue-700">
                  Update Lab
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
                  Are you sure you want to delete this lab?
                  {selectedLab && (
                    <span className="font-semibold"> {selectedLab.Lab_Name}</span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedLab(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedLab && handleDeleteLab(selectedLab.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
