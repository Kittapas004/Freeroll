'use client'

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { GiFarmer } from 'react-icons/gi'
import { TbTestPipe } from 'react-icons/tb'
import { BiSolidFactory } from 'react-icons/bi'
import { PiFarm } from 'react-icons/pi';
import { GiFertilizerBag } from 'react-icons/gi';
import { PiPlant } from 'react-icons/pi';
import { X } from 'lucide-react'

// Reusable component for settings sections
type SettingFieldType = {
  label: string
  items: string[]
  setItems: React.Dispatch<React.SetStateAction<string[]>>
  // API endpoint (e.g. 'crop-types')
  apiEndpoint?: string
  // field name inside the Strapi content type attributes (e.g. 'type', 'method', 'variety')
  apiField?: string
}

interface SettingSectionProps {
  title: string
  icon: ReactNode
  fields: SettingFieldType[]
}

interface SettingFieldProps {
  label: string
  items: string[]
  setItems: React.Dispatch<React.SetStateAction<string[]>>
  apiEndpoint?: string
  apiField?: string
}

function SettingSection({ title, icon, fields }: SettingSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => (
            <SettingField key={index} {...field} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Reusable component for individual setting fields
function SettingField({ label, items, setItems, apiEndpoint, apiField }: SettingFieldProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const value = inputValue.trim()
    if (!value) return

    ;(async () => {
      // If no apiEndpoint/apiField provided, just update local state
      if (!apiEndpoint || !apiField) {
        setItems([...items, value])
        setInputValue('')
        return
      }

      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('token') ?? localStorage.getItem('jwt') ?? ''
          : ''

        const res = await fetch(`https://api-freeroll-production.up.railway.app/api/${apiEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ data: { [apiField]: value } }),
        })

        if (!res.ok) {
          console.error('Failed to create item', await res.text())
          return
        }

        const json = await res.json()
        // Strapi returns created object under data.attributes
        const created = json?.data?.attributes?.[apiField] ?? value
        setItems([...items, created])
        setInputValue('')
        window.alert('Added successfully')
      } catch (err) {
        console.error('Error adding item to API', err)
      }
    })()
  }

  const handleRemove = (index: number) => {
    const valueToRemove = items[index]
    ;(async () => {
      // If no apiEndpoint/apiField provided, just update local state
      if (!apiEndpoint || !apiField) {
        setItems(items.filter((_, i) => i !== index))
        return
      }
      // make conditon to ensure user want to delete
      const confirmDelete = window.confirm(`Are you sure you want to remove "${valueToRemove}"?`)
      if (!confirmDelete) return
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('token') ?? localStorage.getItem('jwt') ?? ''
          : ''
        // Find the item by value to get ID
        const filterQS = `filters[${apiField}][$eq]=${encodeURIComponent(valueToRemove)}`
        const findRes = await fetch(`https://api-freeroll-production.up.railway.app/api/${apiEndpoint}?${filterQS}&pagination[pageSize]=1`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        })
        if (!findRes.ok) {
          console.error('Failed to find item to delete', await findRes.text())
          return
        }

        const findJson = await findRes.json()
        const found = findJson?.data && findJson.data.length > 0 ? findJson.data[0] : null

        if (!found) {
          // Not found on server; still remove locally
          setItems(items.filter((_, i) => i !== index))
          return
        }
        const id = found.documentId
        const delRes = await fetch(`https://api-freeroll-production.up.railway.app/api/${apiEndpoint}/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })
        if (!delRes.ok) {
          console.error('Failed to delete item', await delRes.text())
          return
        }

        setItems(items.filter((_, i) => i !== index))
        window.alert('Removed successfully')
      } catch (err) {
        console.error('Error removing item from API', err)
      }
    })()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e as React.KeyboardEvent<HTMLInputElement>).key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-medium text-sm mb-3">{label}</h3>

      {/* Scrollable container for items */}
      <div className="max-h-32 overflow-y-auto mb-3 border rounded-md p-2 bg-gray-50">
        {items.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-2">No items added yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-xs"
              >
                {item}
                <button
                  onClick={() => handleRemove(index)}
                  className="text-gray-600 hover:text-gray-900 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add new item"
          value={inputValue}
          onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
          onKeyPress={handleKeyPress}
          className="text-sm"
        />
        <Button
          onClick={handleAdd}
          className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
        >
          Add
        </Button>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const router = useRouter();

  // Farmer Settings State
  const [cropTypes, setCropTypes] = useState<string[]>([])
  const [plantVarieties, setPlantVarieties] = useState<string[]>([])
  const [fertilizerTypes, setFertilizerTypes] = useState<string[]>([])
  const [harvestMethods, setHarvestMethods] = useState<string[]>([])
  const [resultTypes, setResultTypes] = useState<string[]>([])

  // Quality Inspector Settings State
  const [testingMethods, setTestingMethods] = useState<string[]>([])
  const [sampletypes, setSampleTypes] = useState<string[]>([])

  // Factory Settings State
  const [processingMethods, setProcessingMethods] = useState<string[]>([])
  const [finalProductTypes, setFinalProductTypes] = useState<string[]>([])
  const [standardCriteria, setStandardCriteria] = useState<string[]>([])
  const [targetMarkets, setTargetMarkets] = useState<string[]>([])

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    setCurrentUserRole(userRole || '')

    if (userRole !== 'Admin') {
      // Uncomment in production
      router.push('/unauthorized')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        // Get JWT token - prioritize 'jwt' from localStorage
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('jwt') || localStorage.getItem('token') || ''
          : ''

        if (!token) {
          console.error('❌ No authentication token found!')
          alert('กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
          return
        }

        const cropTypesRes = await fetch('https://api-freeroll-production.up.railway.app/api/crop-types', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!cropTypesRes.ok) {
          console.error('Failed to fetch crop types:', cropTypesRes.status)
          if (cropTypesRes.status === 401) {
            alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่')
            return
          }
        }

        const cropTypesData = await cropTypesRes.json()
        setCropTypes(cropTypesData?.data?.map((item: any) => item.attributes?.type || item.type) || [])

        // Fetch Plant Varieties
        const plantVarietiesRes = await fetch('https://api-freeroll-production.up.railway.app/api/plant-varieties', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const plantVarietiesData = await plantVarietiesRes.json()
        setPlantVarieties(plantVarietiesData?.data?.map((item: any) => item.attributes?.variety || item.variety) || [])

        // Fetch Fertilizer Types
        const fertilizerTypesRes = await fetch('https://api-freeroll-production.up.railway.app/api/fertilizer-types', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const fertilizerTypesData = await fertilizerTypesRes.json()
        setFertilizerTypes(fertilizerTypesData?.data?.map((item: any) => item.attributes?.type || item.type) || [])

        // Fetch Harvest Methods
        const harvestMethodsRes = await fetch('https://api-freeroll-production.up.railway.app/api/harvest-methods', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const harvestMethodsData = await harvestMethodsRes.json()
        setHarvestMethods(harvestMethodsData?.data?.map((item: any) => item.attributes?.method || item.method) || [])

        // Fetch Result Types
        const resultTypesRes = await fetch('https://api-freeroll-production.up.railway.app/api/result-types', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const resultTypesData = await resultTypesRes.json()
        setResultTypes(resultTypesData?.data?.map((item: any) => item.attributes?.type || item.type) || [])

        // Fetch Test Method
        const testMethodRes = await fetch('https://api-freeroll-production.up.railway.app/api/lab-testing-methods', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const testMethodData = await testMethodRes.json()
        setTestingMethods(testMethodData?.data?.map((item: any) => item.attributes?.method || item.method) || [])

        // Fetch Sample Type
        const sampleTypeRes = await fetch('https://api-freeroll-production.up.railway.app/api/hplc-sample-conditions', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const sampleTypeData = await sampleTypeRes.json()
        setSampleTypes(sampleTypeData?.data?.map((item: any) => item.attributes?.condition || item.condition) || [])
        
        // Fetch Standard Criteria
        const standardCriteriaRes = await fetch('https://api-freeroll-production.up.railway.app/api/standard-criterias', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const standardCriteriaData = await standardCriteriaRes.json()
        setStandardCriteria(standardCriteriaData?.data?.map((item: any) => item.attributes?.criteria || item.criteria) || [])

        // Fetch Processing Methods
        const processingMethodsRes = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processing-methods', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const processingMethodsData = await processingMethodsRes.json()
        setProcessingMethods(processingMethodsData?.data?.map((item: any) => item.attributes?.method || item.method) || [])

        // Fetch Final Product Types
        const finalProductTypesRes = await fetch('https://api-freeroll-production.up.railway.app/api/final-product-types', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const finalProductTypesData = await finalProductTypesRes.json()
        setFinalProductTypes(finalProductTypesData?.data?.map((item: any) => item.attributes?.type || item.type) || [])

        // Fetch Target Markets
        const targetMarketsRes = await fetch('https://api-freeroll-production.up.railway.app/api/target-markets', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const targetMarketsData = await targetMarketsRes.json()
        setTargetMarkets(targetMarketsData?.data?.map((item: any) => item.attributes?.target || item.target) || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
                <BreadcrumbPage>System Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="min-h-screen w-full">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">System Settings</h1>
              <p className="text-gray-500 mt-1">Configure your system settings</p>
            </div>

            <Tabs defaultValue="farmer" className="w-full">
              <TabsList
                className="mb-4 bg-transparent border-b border-gray-200 space-x-4 w-full flex justify-start rounded-none h-auto p-0"
              >
                <TabsTrigger
                  value="farmer"
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-green-600 pb-3"
                >
                  <GiFarmer className="mr-2 h-5 w-5" />
                  Farmer
                </TabsTrigger>
                <TabsTrigger
                  value="quality-inspector"
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-green-600 pb-3"
                >
                  <TbTestPipe className="mr-2 h-5 w-5" />
                  Quality Inspector
                </TabsTrigger>
                <TabsTrigger
                  value="factory-processing"
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-green-600 pb-3"
                >
                  <BiSolidFactory className="mr-2 h-5 w-5" />
                  Factory & Processing
                </TabsTrigger>
              </TabsList>

              {/* Farmer Tab */}
              <TabsContent value="farmer" className="mt-6">
                <SettingSection
                  title="Farm"
                  icon={<PiFarm className="h-5 w-5" />}
                  fields={[
                    { label: 'Crop Type', items: cropTypes, setItems: setCropTypes, apiEndpoint: 'crop-types', apiField: 'type' },
                    // { label: 'Plant Variety', items: plantVarieties, setItems: setPlantVarieties, apiEndpoint: 'plant-varieties', apiField: 'variety' },
                  ]}
                />

                <SettingSection
                  title="Fertilizer Record"
                  icon={<GiFertilizerBag className="h-5 w-5" />}
                  fields={[
                    { label: 'Fertilizer Type', items: fertilizerTypes, setItems: setFertilizerTypes, apiEndpoint: 'fertilizer-types', apiField: 'type' },
                  ]}
                />

                <SettingSection
                  title="Harvest Record"
                  icon={<PiPlant className="h-5 w-5" />}
                  fields={[
                    { label: 'Harvest Method', items: harvestMethods, setItems: setHarvestMethods, apiEndpoint: 'harvest-methods', apiField: 'method' },
                    { label: 'Result Type', items: resultTypes, setItems: setResultTypes, apiEndpoint: 'result-types', apiField: 'type' },
                  ]}
                />
              </TabsContent>

              {/* Quality Inspector Tab */}
              <TabsContent value="quality-inspector" className="mt-6">
                <SettingSection
                  title="Quality Inspector"
                  icon={<TbTestPipe className="h-5 w-5" />}
                  fields={[
                    // { label: 'Testing Method', items: testingMethods, setItems: setTestingMethods, apiEndpoint: 'lab-testing-methods', apiField: 'method' },
                    { label: 'HPLC Sample Type', items: sampletypes, setItems: setSampleTypes, apiEndpoint: 'hplc-sample-conditions', apiField: 'condition' },
                  ]}
                />
              </TabsContent>

              {/* Factory & Processing Tab */}
              <TabsContent value="factory-processing" className="mt-6">
                <SettingSection
                  title="Factory"
                  icon={<BiSolidFactory className="h-5 w-5" />}
                  fields={[
                    { label: 'Standard Criteria', items: standardCriteria, setItems: setStandardCriteria, apiEndpoint: 'standard-criterias', apiField: 'criteria' },
                    { label: 'Processing Method', items: processingMethods, setItems: setProcessingMethods, apiEndpoint: 'factory-processing-methods', apiField: 'method' },
                    { label: 'Final Product Type', items: finalProductTypes, setItems: setFinalProductTypes, apiEndpoint: 'final-product-types', apiField: 'type' },
                    { label: 'Target Market / Usage', items: targetMarkets, setItems: setTargetMarkets, apiEndpoint: 'target-markets', apiField: 'target' },
                  ]}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}