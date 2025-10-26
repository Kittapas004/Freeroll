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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface Factory {
  id: number
  Factory_Name: string
  Factory_address?: string
  Contact_person?: string
  Phone?: string
  Email?: string
  Factory_type: string
  Capacity_per_day?: number
  Specialization: string
  Status: string
  createdAt: string
  updatedAt: string
}

interface FactoryFormData {
  Factory_Name: string
  Factory_address: string
  Contact_person: string
  Phone: string
  Email: string
  Factory_type: string
  Capacity_per_day: string
  Specialization: string
  Status: string
}

const initialFormData: FactoryFormData = {
  Factory_Name: "",
  Factory_address: "",
  Contact_person: "",
  Phone: "",
  Email: "",
  Factory_type: "",
  Capacity_per_day: "",
  Specialization: "",
  Status: "Active",
}

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null)
  const [formData, setFormData] = useState<FactoryFormData>(initialFormData)
  const { toast } = useToast()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchFactories()
  }, [])

  const fetchFactories = async () => {
    try {
      const response = await fetch('https://api-freeroll-production.up.railway.app/api/factories?populate=*', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error('Failed to fetch factories')
      }
      
      const data = await response.json()
      console.log('✅ Factories data:', data)
      console.log('✅ Factories count:', data.data?.length || 0)
      
      if (data.data && Array.isArray(data.data)) {
        const mappedFactories = data.data.map((item: any) => {
          // Check if attributes exist (Strapi v4 format) or use item directly
          if (item.attributes) {
            console.log('✅ Factory with attributes:', item)
            return {
              id: item.id,
              ...item.attributes
            }
          } else {
            // Data is already flattened - use documentId if available
            console.log('✅ Factory flattened:', item)
            return {
              ...item,
              id: item.documentId || item.id  // Use documentId if available, fallback to id
            }
          }
        })
        console.log('✅ Mapped Factories:', mappedFactories)
        setFactories(mappedFactories)
      } else {
        console.warn('⚠️ No factories data found or invalid format')
        setFactories([])
      }
    } catch (error) {
      console.error('❌ Error fetching factories:', error)
      toast({
        title: "Error",
        description: "Failed to load factories. Please check console for details.",
        variant: "destructive",
      })
    }
  }

  const handleAddFactory = async () => {
    if (!formData.Factory_Name.trim() || !formData.Factory_type || !formData.Specialization) {
      toast({
        title: "Error",
        description: "Please fill in required fields (Name, Type, Specialization)",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('https://api-freeroll-production.up.railway.app/api/factories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          data: {
            Factory_Name: formData.Factory_Name,
            Factory_address: formData.Factory_address || undefined,
            Contact_person: formData.Contact_person || undefined,
            Phone: formData.Phone || undefined,
            Email: formData.Email || undefined,
            Factory_type: formData.Factory_type,
            Capacity_per_day: formData.Capacity_per_day ? parseFloat(formData.Capacity_per_day) : undefined,
            Specialization: formData.Specialization,
            Status: formData.Status,
            exported: false
          }
        })
      })

      if (!response.ok) throw new Error('Failed to add factory')

      toast({
        title: "Success",
        description: "Factory added successfully",
      })
      
      setFormData(initialFormData)
      setIsAddDialogOpen(false)
      fetchFactories()
    } catch (error) {
      console.error('Error adding factory:', error)
      toast({
        title: "Error",
        description: "Failed to add factory",
        variant: "destructive",
      })
    }
  }

  const handleUpdateFactory = async () => {
    if (!selectedFactory || !formData.Factory_Name.trim() || !formData.Factory_type || !formData.Specialization) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('🔄 Updating factory:', selectedFactory.id)
      console.log('📝 Form data:', formData)
      
      // First, verify the factory exists
      const checkResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/factories/${selectedFactory.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })
      
      if (!checkResponse.ok) {
        console.error('❌ Factory not found, ID:', selectedFactory.id)
        throw new Error(`Factory ID ${selectedFactory.id} not found. Please refresh the page.`)
      }
      
      const payload = {
        data: {
          Factory_Name: formData.Factory_Name,
          Factory_address: formData.Factory_address || null,
          Contact_person: formData.Contact_person || null,
          Phone: formData.Phone || null,
          Email: formData.Email || null,
          Factory_type: formData.Factory_type,
          Capacity_per_day: formData.Capacity_per_day ? parseFloat(formData.Capacity_per_day) : null,
          Specialization: formData.Specialization,
          Status: formData.Status,
        }
      }
      
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2))
      
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factories/${selectedFactory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error Response:', errorData)
        throw new Error(errorData.error?.message || 'Failed to update factory')
      }

      const result = await response.json()
      console.log('✅ Update result:', result)

      toast({
        title: "Success",
        description: "Factory updated successfully",
      })
      
      setFormData(initialFormData)
      setIsEditDialogOpen(false)
      setSelectedFactory(null)
      fetchFactories()
    } catch (error: any) {
      console.error('❌ Error updating factory:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update factory",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFactory = async (id: number) => {
    try {
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete factory')

      toast({
        title: "Success",
        description: "Factory deleted successfully",
      })
      
      setIsDeleteDialogOpen(false)
      setSelectedFactory(null)
      fetchFactories()
    } catch (error) {
      console.error('Error deleting factory:', error)
      toast({
        title: "Error",
        description: "Failed to delete factory",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (factory: Factory) => {
    setSelectedFactory(factory)
    setFormData({
      Factory_Name: factory.Factory_Name,
      Factory_address: factory.Factory_address || "",
      Contact_person: factory.Contact_person || "",
      Phone: factory.Phone || "",
      Email: factory.Email || "",
      Factory_type: factory.Factory_type,
      Capacity_per_day: factory.Capacity_per_day?.toString() || "",
      Specialization: factory.Specialization,
      Status: factory.Status,
    })
    setIsEditDialogOpen(true)
  }

  const filteredFactories = factories.filter(factory =>
    factory.Factory_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredFactories.length / ITEMS_PER_PAGE)
  const paginatedFactories = filteredFactories.slice(
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
                <BreadcrumbPage>Factory Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Factory Management</h1>
              <p className="text-muted-foreground">Processing Plant Management</p>
            </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Factory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Factory</DialogTitle>
              <DialogDescription>
                Add New Processing Plant
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-factory-name">Factory Name *</Label>
                  <Input
                    id="add-factory-name"
                    placeholder="Enter factory name"
                    value={formData.Factory_Name}
                    onChange={(e) => setFormData({ ...formData, Factory_Name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-factory-type">Factory Type *</Label>
                  <Select
                    value={formData.Factory_type}
                    onValueChange={(value) => setFormData({ ...formData, Factory_type: value })}
                  >
                    <SelectTrigger id="add-factory-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Packaging">Packaging</SelectItem>
                      <SelectItem value="Extraction">Extraction</SelectItem> */}
                      <SelectItem value="Full_Service">Full Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-specialization">Specialization *</Label>
                  <Select
                    value={formData.Specialization}
                    onValueChange={(value) => setFormData({ ...formData, Specialization: value })}
                  >
                    <SelectTrigger id="add-specialization">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="Capsules">Capsules</SelectItem>
                      <SelectItem value="Essential_Oil">Essential Oil</SelectItem>
                      <SelectItem value="Powder">Powder</SelectItem>
                      <SelectItem value="Extract">Extract</SelectItem> */}
                      <SelectItem value="All">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-status">Status</Label>
                  <Select
                    value={formData.Status}
                    onValueChange={(value) => setFormData({ ...formData, Status: value })}
                  >
                    <SelectTrigger id="add-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* <div className="col-span-2 space-y-2">
                  <Label htmlFor="add-factory-address">Factory Address</Label>
                  <Textarea
                    id="add-factory-address"
                    placeholder="Enter factory address"
                    value={formData.Factory_address}
                    onChange={(e) => setFormData({ ...formData, Factory_address: e.target.value })}
                  />
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="add-contact-person">Contact Person</Label>
                  <Input
                    id="add-contact-person"
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

                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  />
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="add-capacity">Capacity per Day</Label>
                  <Input
                    id="add-capacity"
                    type="number"
                    placeholder="Enter capacity"
                    value={formData.Capacity_per_day}
                    onChange={(e) => setFormData({ ...formData, Capacity_per_day: e.target.value })}
                  />
                </div> */}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false)
                setFormData(initialFormData)
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddFactory} className="bg-green-600 hover:bg-green-700">
                Add Factory
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search factories..."
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
                  <TableHead>Factory Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFactories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No factories found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFactories.map((factory, index) => (
                    <TableRow key={factory.id}>
                      <TableCell className="font-medium pl-6">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                      <TableCell>{factory.Factory_Name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                          {factory.Factory_type?.replace('_', ' ') || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                          {factory.Specialization?.replace('_', ' ') || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          factory.Status === 'Active' ? 'bg-green-100 text-green-800' :
                          factory.Status === 'Inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {factory.Status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {factory.Phone && <div className="text-sm">{factory.Phone}</div>}
                      {factory.Email && <div className="text-xs text-muted-foreground">{factory.Email}</div>}
                    </TableCell>
                    <TableCell className="text-right space-x-2 pr-6">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(factory)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setSelectedFactory(factory)
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
          {filteredFactories.length > ITEMS_PER_PAGE && (
            <div className="mt-4 px-6 pb-4 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredFactories.length)} of {filteredFactories.length} factories
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
                <DialogTitle>Edit Factory</DialogTitle>
                <DialogDescription>
                  แก้ไขข้อมูลโรงงานแปรรูป
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-factory-name">Factory Name *</Label>
                <Input
                  id="edit-factory-name"
                  placeholder="Enter factory name"
                  value={formData.Factory_Name}
                  onChange={(e) => setFormData({ ...formData, Factory_Name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-factory-type">Factory Type *</Label>
                <Select
                  value={formData.Factory_type}
                  onValueChange={(value) => setFormData({ ...formData, Factory_type: value })}
                >
                  <SelectTrigger id="edit-factory-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                    <SelectItem value="Extraction">Extraction</SelectItem>
                    <SelectItem value="Full_Service">Full Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specialization *</Label>
                <Select
                  value={formData.Specialization}
                  onValueChange={(value) => setFormData({ ...formData, Specialization: value })}
                >
                  <SelectTrigger id="edit-specialization">
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Capsules">Capsules</SelectItem>
                    <SelectItem value="Essential_Oil">Essential Oil</SelectItem>
                    <SelectItem value="Powder">Powder</SelectItem>
                    <SelectItem value="Extract">Extract</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.Status}
                  onValueChange={(value) => setFormData({ ...formData, Status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-factory-address">Factory Address</Label>
                <Textarea
                  id="edit-factory-address"
                  placeholder="Enter factory address"
                  value={formData.Factory_address}
                  onChange={(e) => setFormData({ ...formData, Factory_address: e.target.value })}
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="edit-contact-person">Contact Person</Label>
                <Input
                  id="edit-contact-person"
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

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity per Day</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  placeholder="Enter capacity"
                  value={formData.Capacity_per_day}
                  onChange={(e) => setFormData({ ...formData, Capacity_per_day: e.target.value })}
                />
              </div> */}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              setFormData(initialFormData)
              setSelectedFactory(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFactory} className="bg-blue-600 hover:bg-blue-700">
              Update Factory
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
                  Are you sure you want to delete this factory?
                  {selectedFactory && (
                    <span className="font-semibold"> {selectedFactory.Factory_Name}</span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedFactory(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedFactory && handleDeleteFactory(selectedFactory.id)}
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