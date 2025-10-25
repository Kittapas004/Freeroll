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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
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
  createdAt: string
  updatedAt: string
}

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null)
  const [newLabName, setNewLabName] = useState("")
  const { toast } = useToast()

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
    if (!newLabName.trim()) {
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
            Lab_Name: newLabName,
            exported: false
          }
        })
      })

      if (!response.ok) throw new Error('Failed to add lab')

      toast({
        title: "Success",
        description: "Lab added successfully",
      })
      
      setNewLabName("")
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
    if (!selectedLab || !newLabName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lab name",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('🔄 Updating lab:', selectedLab.id)
      console.log('📝 Lab name:', newLabName)
      
      const response = await fetch(`https://api-freeroll-production.up.railway.app/api/labs/${selectedLab.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          data: {
            Lab_Name: newLabName
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
      
      setNewLabName("")
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
    if (!confirm("Are you sure you want to delete this lab?")) return

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
    setNewLabName(lab.Lab_Name)
    setIsEditDialogOpen(true)
  }

  const filteredLabs = labs.filter(lab =>
    lab.Lab_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lab</DialogTitle>
                  <DialogDescription>
                    เพิ่มห้องแล็บทดสอบใหม่ในระบบ
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="lab-name">Lab Name</Label>
                    <Input
                      id="lab-name"
                      placeholder="Enter lab name"
                      value={newLabName}
                      onChange={(e) => setNewLabName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false)
                    setNewLabName("")
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
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No labs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLabs.map((lab, index) => (
                    <TableRow key={lab.id}>
                      <TableCell className="font-medium pl-6">{index + 1}</TableCell>
                      <TableCell>{lab.Lab_Name || 'N/A'}</TableCell>
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
                          onClick={() => handleDeleteLab(lab.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Lab</DialogTitle>
                <DialogDescription>
                  แก้ไขข้อมูลห้องแล็บทดสอบ
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-lab-name">Lab Name</Label>
                  <Input
                    id="edit-lab-name"
                    placeholder="Enter lab name"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  setNewLabName("")
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
