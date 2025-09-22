'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import PublicNavigation from "@/components/public-navigation"
import Footer from "@/components/Footer"
import Link from "next/link"
import { ArrowRight, CheckCircle, Leaf, Factory, FlaskConical, Star, Sprout, Package, LeafIcon, HandHeart, RefreshCcw, LinkIcon, Globe, Clock, RotateCcw, ChevronLeft, ChevronRight, SoupIcon, HeartPulseIcon, Heart, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentProductIndex, setCurrentProductIndex] = useState(0) // เพิ่มสำหรับ product carousel
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0) // เพิ่มสำหรับ category carousel

  // Factory data states
  const [factoryData, setFactoryData] = useState({
    totalTurmericUsed: 0,
    topProductType: "N/A",
    processingWaste: 0,
    totalHarvestYield: 0, // เพิ่มสำหรับ YIELD จาก Harvest_Record
    loading: true,
    error: null as string | null
  })

  // Farm data states
  const [farmData, setFarmData] = useState({
    totalFarms: 0,
    loading: true,
    error: null as string | null
  })

  const heroImages = [
    "/batch1.png",
    "/TurmeRic-logo.png",
    "/MFU.png"
  ]

  // Product categories data
  const productCategories = [
    {
      id: 1,
      title: "Food & Beverage",
      image: "/image24.png",
    },
    {
      id: 2,
      title: "Health Supplements",
      image: "/image25.png",
    },
    {
      id: 3,
      title: "Beauty & Personal Care",
      image: "/image26.png",
    }
  ]


  // Category carousel functions
  const nextCategory = () => {
    setCurrentCategoryIndex((prev) => (prev + 1) % productCategories.length)
  }

  const prevCategory = () => {
    setCurrentCategoryIndex((prev) => (prev - 1 + productCategories.length) % productCategories.length)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Add smooth scrolling
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  // Fetch factory data from Strapi
  const fetchFactoryData = async () => {
    try {
      setFactoryData(prev => ({ ...prev, loading: true, error: null }))

      // เรียก API โดยไม่ต้องใช้ JWT (Public Access)
      const processingRes = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*', {
        headers: {
          'Content-Type': 'application/json'
        },
      })

      // ดึงข้อมูล Harvest_Record สำหรับ YIELD
      const harvestRes = await fetch('https://api-freeroll-production.up.railway.app/api/harvest-records?populate=*', {
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (!processingRes.ok || !harvestRes.ok) {
        // ถ้า Public API ไม่ทำงาน ลองใช้ JWT
        const jwtToken = localStorage.getItem('jwt')

        if (jwtToken) {
          const authProcessingRes = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate=*', {
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
              'Content-Type': 'application/json'
            },
          })

          const authHarvestRes = await fetch('https://api-freeroll-production.up.railway.app/api/harvest-records?populate=*', {
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
              'Content-Type': 'application/json'
            },
          })

          if (authProcessingRes.ok && authHarvestRes.ok) {
            const authProcessingData = await authProcessingRes.json()
            const authHarvestData = await authHarvestRes.json()
            await processFactoryData(authProcessingData, authHarvestData)
            return
          }
        }

        throw new Error(`API Error: ${processingRes.status} ${processingRes.statusText}`)
      }

      const processingData = await processingRes.json()
      const harvestData = await harvestRes.json()
      await processFactoryData(processingData, harvestData)

    } catch (error) {
      console.error('Error fetching factory data:', error)
      setFactoryData({
        totalTurmericUsed: 0,
        topProductType: "Error",
        processingWaste: 0,
        totalHarvestYield: 0,
        loading: false,
        error: 'Unable to fetch data'
      })
    }
  }

  // Fetch farm data from Strapi
  const fetchFarmData = async () => {
    try {
      setFarmData(prev => ({ ...prev, loading: true, error: null }))

      // เรียก API โดยไม่ต้องใช้ JWT (Public Access)
      const farmRes = await fetch('https://api-freeroll-production.up.railway.app/api/farms?populate=*', {
        headers: {
          'Content-Type': 'application/json'
        },
      })

      const farmDataRes = await farmRes.json()
      const farms = farmDataRes.data || []

      setFarmData({
        totalFarms: farms.length,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error fetching farm data:', error)
      setFarmData({
        totalFarms: 0,
        loading: false,
        error: 'Unable to fetch data'
      })
    }
  }

  // แยกฟังก์ชันประมวลผลข้อมูลออกมา
  const processFactoryData = async (processingData: any, harvestData: any) => {
    const processings = processingData.data || []
    const harvests = harvestData.data || []

    console.log('🌾 Raw harvest data:', harvests)
    console.log('🌾 Number of harvest records:', harvests.length)

    if (processings.length > 0) {
      // Filter completed and exported processings for calculations
      const completedProcessings = processings.filter((p: any) =>
        p.Processing_Status === 'Completed' || p.Processing_Status === 'Export Success'
      )

      // Calculate total turmeric used (sum of incoming_weight from completed processings)
      const totalTurmericUsed = completedProcessings.reduce((sum: number, p: any) => {
        const incomingWeight = parseFloat(p.incoming_weight) || 0
        return sum + incomingWeight
      }, 0)

      // Calculate total waste (sum of waste_quantity from completed processings)
      const totalWaste = completedProcessings.reduce((sum: number, p: any) => {
        return sum + (parseFloat(p.waste_quantity) || 0)
      }, 0)

      // Calculate total harvest yield (sum of yleld from all harvest records)
      const totalHarvestYield = harvests.reduce((sum: number, h: any) => {
        const yield_amount = parseFloat(h.yleld) || 0
        console.log(`🌾 Processing harvest record ${h.id}: yleld=${h.yleld}, parsed=${yield_amount}`)
        return sum + yield_amount
      }, 0)

      console.log('🌾 Total harvest yield calculated:', totalHarvestYield)

      // Find top product type by grouping final_product_type and summing incoming_weight
      const productTypeTotals = completedProcessings.reduce((acc: any, p: any) => {
        const productType = p.final_product_type || 'Unknown Product'
        const incomingWeight = parseFloat(p.incoming_weight) || 0

        if (!acc[productType]) {
          acc[productType] = 0
        }
        acc[productType] += incomingWeight

        return acc
      }, {})

      // Find the product type with highest total incoming weight
      let topProductTypeName = 'Capsule' // Default from Dashboard
      let topProductWeight = 0
      Object.entries(productTypeTotals).forEach(([type, total]: [string, any]) => {
        if (total > topProductWeight) {
          topProductWeight = total
          topProductTypeName = type
        }
      })

      console.log('📊 Calculated statistics:', {
        totalTurmericUsed: Math.round(totalTurmericUsed * 100) / 100,
        topProductType: topProductTypeName,
        processingWaste: Math.round(totalWaste * 100) / 100,
        totalHarvestYield: Math.round(totalHarvestYield * 100) / 100
      })

      setFactoryData({
        totalTurmericUsed: Math.round(totalTurmericUsed * 100) / 100,
        topProductType: topProductTypeName,
        processingWaste: Math.round(totalWaste * 100) / 100,
        totalHarvestYield: Math.round(totalHarvestYield * 100) / 100,
        loading: false,
        error: null
      })
    } else {
      console.log('📝 No processing data found')
      // แสดง N/A เมื่อไม่มีข้อมูล
      setFactoryData({
        totalTurmericUsed: 0,
        topProductType: "N/A",
        processingWaste: 0,
        totalHarvestYield: 0,
        loading: false,
        error: null
      })
    }
  }

  useEffect(() => {
    fetchFactoryData()
    fetchFarmData()
  }, [])

  // เพิ่ม useEffect เพื่อ log เมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (!factoryData.loading && !factoryData.error) {
      console.log('✅ Factory data loaded successfully')
    }
  }, [factoryData])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <PublicNavigation />

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden" style={{
        background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("/image1.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '600px'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-70">
          <div className="text-center">
            <div className="space-y-8 mb-12">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  From Thai Soil to Golden
                  <br />
                  Wellness
                </h1>
                <p className="text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
                  Trace every step of our sustainable turmeric journey – from the first
                  rhizome planted to the capsule in your hand.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products-category">
                  <Button size="lg"  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Trace a Product
                  </Button>
                </Link>
                <Link href="/home#trace">
                  <Button size="lg" variant="outline" className="bg-invisible text-white hover:bg-green-500 hover:text-white px-8 py-3">
                    Learn the Process
                  </Button>
                </Link>
              </div>
            </div>


            {/* Trace Flow Indicators - Horizontal Layout */}
            <div className="flex justify-center items-center space-x-4 text-yellow-400 text-sm">
              <div className="flex items-center space-x-2">
                <LeafIcon className="h-4 w-4 text-yellow-400" />
                <span className="text-white">Plant</span>
              </div>
              <ArrowRight className="h-4 w-4 text-white" />
              <div className="flex items-center space-x-2">
                <Sprout className="h-4 w-4 text-yellow-400" />
                <span className="text-white">Grow</span>
              </div>
              <ArrowRight className="h-4 w-4 text-white" />
              <div className="flex items-center space-x-2">
                <HandHeart className="h-4 w-4 text-yellow-400" />
                <span className="text-white">Harvest</span>
              </div>
              <ArrowRight className="h-4 w-4 text-white" />
              <div className="flex items-center space-x-2">
                <RefreshCcw className="h-4 w-4 text-yellow-400" />
                <span className="text-white">Process</span>
              </div>
              <ArrowRight className="h-4 w-4 text-white" />
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-yellow-400" />
                <span className="text-white">Product</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Golden Roots for Modern Wellness</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our premium turmeric products, each with complete traceability
            </p>
          </div>

          {/* Product Category Label */}
          <div className="text-left mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Product Category</h3>
          </div>

          {/* Category Carousel */}
          <div className="relative mb-16 pt-4">
            {/* Navigation Buttons */}
            <button
              onClick={prevCategory}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
              aria-label="Previous category"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <button
              onClick={nextCategory}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
              aria-label="Next category"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            {/* Category Cards Container */}
            <div className="overflow-hidden mx-12 py-2">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentCategoryIndex * (100 / 3)}%)` }}
              >
                {productCategories.map((category, index) => (
                  <div key={category.id} className="w-1/3 flex-shrink-0 px-4 py-2">
                    <div
                      className="text-center cursor-pointer group"
                      onClick={() => {
                        // Navigate to products-category page with specific category
                        const categoryMap: { [key: string]: string } = {
                          "Food & Beverage": "Food & Beverage",
                          "Health Supplements": "Health Supplements",
                          "Beauty & Personal Care": "Beauty & Personal Care"
                        };
                        const targetCategory = categoryMap[category.title] || "All Product";
                        window.location.href = `/products-category?category=${encodeURIComponent(targetCategory)}`;
                      }}
                    >
                      <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-4 overflow-hidden relative transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-2">
                        <img
                          src={category.image}
                          alt={category.title}
                          className="w-full h-full object-cover transition-transform duration-500"
                          loading="eager"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.currentTarget;
                            const container = target.parentElement!;
                            container.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
                                <div class="text-center p-8">
                                  <div class="text-6xl mb-4">
                                  </div>
                                  <p class="text-green-800 font-medium text-sm"></p>
                                </div>
                              </div>
                            `;
                          }}
                        />
                        {/* Hover overlay with improved visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                            <span className="text-green-800 font-semibold flex items-center gap-2 text-sm">
                              View Products
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-green-900 flex items-center justify-center gap-2 group-hover:text-green-700 transition-colors duration-300">
                        {category.title === "Food & Beverage" && <SoupIcon className="w-5 h-5" />}
                        {category.title === "Health Supplements" && <Heart className="w-5 h-5" />}
                        {category.title === "Beauty & Personal Care" && <Sparkles className="w-5 h-5" />}
                        {category.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Real-time Factory Statistics</h3>
              <p className="text-sm text-gray-600 mt-1">
                {factoryData.loading ? 'Loading data from factory system...' :
                  factoryData.error ? 'Unable to connect to factory system' :
                    'Live data from factory processing records'}
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : `${factoryData.totalTurmericUsed} kg`}
              </div>
              <div className="text-gray-600">Total Turmeric Used</div>
              {factoryData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {factoryData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : factoryData.topProductType}
              </div>
              <div className="text-gray-600">Top Product Output</div>
              {factoryData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {factoryData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : `${factoryData.processingWaste} kg`}
              </div>
              <div className="text-gray-600">Processing Waste</div>
              {factoryData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {factoryData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trace Back Section */}
      <section id="trace" className="py-20 bg-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Trace Back: From Product to Plant</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow the reverse journey of our turmeric lifecycle
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1: Refined & Packaged */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Refined & Packaged</h3>
                  <p className="text-gray-600 mb-4">
                    Our state-of-the-art facilities transform harvested turmeric into pure
                    supplements, ensuring 95%+ curcumin retention through gentle
                    processing every batch.
                  </p>
                  <Link href="/process-detail/refined-packaged">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <img src="/image6.png" alt="Factory" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 2: Extraction & Drying */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Extraction & Drying</h3>
                  <p className="text-gray-600 mb-4">
                    Gentle solar drying preserves nutrients and active compounds. No
                    chemicals used, with full traceability via blockchain technology
                    recording every batch.
                  </p>
                  <Link href="/process-detail/extraction-drying">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <img src="/image7.png" alt="Processing" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 3: Hand-Picked at Peak */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Hand-Picked at Peak</h3>
                  <p className="text-gray-600 mb-4">
                    After 8 months of careful growth, our farmers hand-harvest each
                    rhizome at peak maturity. Every batch is tested for Grade A quality
                    before processing.
                  </p>
                  <Link href="/process-detail/hand-picked-at-peak">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <img src="/image8.png" alt="Harvest" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 4: Nurtured Sustainably */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nurtured Sustainably</h3>
                  <p className="text-gray-600 mb-4">
                    Organic cultivation methods with monitored soil pH (6.5-7.0).
                    Complete fertilizer and water records maintained for every batch
                    throughout the growing season.
                  </p>
                  <Link href="/process-detail/nurtured-sustainably">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <img src="/image9.png" alt="Farming" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 5: Roots in Rich Soil */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Roots in Rich Soil</h3>
                  <p className="text-gray-600 mb-4">
                    Everything begins with select Curcuma longa varieties planted in
                    the fertile soils of Chiang Rai. Your journey of pure wellness starts
                    here.
                  </p>
                  <Link href="/process-detail/roots-in-rich-soil">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <img src="/image10.png" alt="Soil" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Section */}
      <section id="farm" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Transforming Thai Agriculture</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real impact on turmeric farming and supply chains
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Image and Stats */}
            <div className="space-y-6">
              <div className="relative">
                <img
                  src="/batch1.png"
                  alt="Turmeric Farm"
                  className="w-full h-80 object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {farmData.loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                        Loading...
                      </span>
                    ) : farmData.error ? '10+' : `${farmData.totalFarms}+`} Farms Connected
                  </h3>
                  <p className="text-gray-600">Linking farmers across Chiang Rai since 2025, creating a sustainable network.</p>
                </div>
              </div>
            </div>

            {/* Right Side - Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Organic Farming */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Leaf className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Organic Farming</h3>
                <p className="text-sm text-gray-600">100% chemical-free cultivation</p>
              </div>

              {/* Traceability */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <LinkIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Traceability</h3>
                <p className="text-sm text-gray-600">Every batch tracked from soil to shelf</p>
              </div>

              {/* Global Reach */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Globe className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Global Reach</h3>
                <p className="text-sm text-gray-600">Serving markets worldwide from Thailand</p>
              </div>

              {/* Timely Insights */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Timely Insights</h3>
                <p className="text-sm text-gray-600">Real-time updates for farmers</p>
              </div>
            </div>
          </div>

          {/* Impact Numbers */}
          <div className="mt-16 grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {farmData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : farmData.error ? '10+' : `${farmData.totalFarms}+`}
              </div>
              <div className="text-gray-600">Connected Farms</div>
              {farmData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {farmData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-gray-600">Organic Certified</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : `${factoryData.totalHarvestYield}kg`}
              </div>
              <div className="text-gray-600">Annual Harvest</div>
              {factoryData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {factoryData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">2025</div>
              <div className="text-gray-600">Since Established</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}