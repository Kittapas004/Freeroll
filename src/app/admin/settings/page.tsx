'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Save, Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'TurmeRic',
    dateFormat: 'dd/mm/yyyy',
    defaultCurrency: 'THB (Thai Baht)',
    
    // Units of Measurement
    weightUnit: 'Kilogram',
    areaUnit: 'Acres',
    
    // Quality Standards
    qualityPassThreshold: 'Pass',
    qualityFailThreshold: 'Fail',
    
    // System Configuration
    maxFileSize: '10MB',
    allowedFileTypes: 'PNG, JPG, GIF, PDF',
  })

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    setCurrentUserRole(userRole || '')
    
    if (userRole !== 'Admin') {
      router.push('/unauthorized')
      return
    }
  }, [router])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setLoading(false)
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
                  <BreadcrumbPage>System Settings</BreadcrumbPage>
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
                <h1 className="text-3xl font-bold">General Setting</h1>
                <p className="text-gray-500 mt-1">Manage configurations and platform settings</p>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>

            <div className="grid gap-6">
              {/* Units of Measurement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Units of Measurement
                  </CardTitle>
                  <CardDescription>Configure measurement units used across the platform</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Units Name</Label>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Kilogram</span>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">Kg</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">Weight</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Symbol</Label>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Acres</span>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">ac</span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">Area</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-fit">
                    + Add Unit
                  </Button>
                </CardContent>
              </Card>

              {/* Platform Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>General platform configuration</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date-format">Date Format</Label>
                      <Input
                        id="date-format"
                        value={settings.dateFormat}
                        onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Input
                        id="currency"
                        value={settings.defaultCurrency}
                        onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Farmer Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Farmer</CardTitle>
                  <CardDescription>Configure farmer-specific settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Crop Type</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Turmeric ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Cultivation Method</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Organic ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Plant Variety</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Curcuma longa ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Soil Quality</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Good ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Water Source</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">River/Stream ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fertilizer Record */}
              <Card>
                <CardHeader>
                  <CardTitle>Fertilizer Record</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Fertilizer Type</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Organic ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">How to Apply</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Broadcast ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Harvest Record */}
              <Card>
                <CardHeader>
                  <CardTitle>Harvest Record</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Harvest Method</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Machine ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Quality Grade</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">A ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Result Type</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">HPLC ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Inspector */}
              <Card>
                <CardHeader>
                  <CardTitle>Quality inspector</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Testing Method</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">HPLC ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Quality Assessment</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Pass ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Factory */}
              <Card>
                <CardHeader>
                  <CardTitle>Factory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Test Type</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Curcuminoid ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Raw Material Type</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Fresh Rhizome ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">E. coli (CFU/g)</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Detected ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Salmonella</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Detected ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Processing Method</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Drying ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Final Product Type</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Capsules ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Standard Criteria</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">GMP ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Certification Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Passed ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Product Grade</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Premium ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Target Market / Usage</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Export ×</span>
                      <Button variant="outline" size="sm">Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
