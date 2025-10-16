'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import PublicNavigation from "@/components/public-navigation"
import Footer from "@/components/Footer"
import Link from "next/link"
import { ArrowRight, CheckCircle, Leaf, Factory, FlaskConical, Star, Sprout, Package, LeafIcon, HandHeart, RefreshCcw, LinkIcon, Globe, Clock, RotateCcw, ChevronLeft, ChevronRight, SoupIcon, HeartPulseIcon, Heart, Sparkles, ArrowDown } from "lucide-react"
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

    console.log('� Processing factory data...')
    console.log('📊 Total processing records:', processings.length)
    console.log('�🌾 Raw harvest data:', harvests)
    console.log('🌾 Number of harvest records:', harvests.length)

    if (processings.length > 0) {
      // Filter completed and exported processings for calculations
      const completedProcessings = processings.filter((p: any) =>
        p.Processing_Status === 'Completed' || p.Processing_Status === 'Export Success'
      )
      
      console.log('✅ Completed processings:', completedProcessings.length)

      // Calculate total turmeric used (sum of processed_weight from completed processings)
      const totalTurmericUsed = completedProcessings.reduce((sum: number, p: any) => {
        // Use processed_weight to show actual amount USED (not incoming/original)
        const processedWeight = parseFloat(p.processed_weight) || 0
        console.log(`  - Processing ${p.id}: processed_weight = ${processedWeight} kg`)
        return sum + processedWeight
      }, 0)
      
      console.log('📦 Total Turmeric Used:', totalTurmericUsed, 'kg')

      // Calculate total waste from output_records_json
      let totalWaste = 0
      completedProcessings.forEach((p: any) => {
        if (p.output_records_json) {
          try {
            const outputRecords = JSON.parse(p.output_records_json)
            outputRecords.forEach((record: any) => {
              const wasteQty = parseFloat(record.wasteQuantity) || 0
              console.log(`  - Waste from ${record.batchLotNumber}: ${wasteQty} kg`)
              totalWaste += wasteQty
            })
          } catch (e) {
            console.error('❌ Error parsing output_records_json for waste:', e)
          }
        }
      })
      
      console.log('🗑️ Total Waste:', totalWaste, 'kg')

      // Calculate total harvest yield (sum of yleld from all harvest records)
      const totalHarvestYield = harvests.reduce((sum: number, h: any) => {
        const yield_amount = parseFloat(h.yleld) || 0
        console.log(`🌾 Processing harvest record ${h.id}: yleld=${h.yleld}, parsed=${yield_amount}`)
        return sum + yield_amount
      }, 0)

      console.log('🌾 Total harvest yield calculated:', totalHarvestYield)

      // Find top product type by grouping productType from output_records_json and summing quantity
      const productTypeTotals: { [key: string]: number } = {}
      
      completedProcessings.forEach((p: any) => {
        if (p.output_records_json) {
          try {
            const outputRecords = JSON.parse(p.output_records_json)
            outputRecords.forEach((record: any) => {
              const productType = record.productType || 'Unknown Product'
              const quantity = parseFloat(record.quantity) || 0
              
              console.log(`  - Product: ${productType}, Quantity: ${quantity} ${record.unit}`)
              
              if (!productTypeTotals[productType]) {
                productTypeTotals[productType] = 0
              }
              productTypeTotals[productType] += quantity
            })
          } catch (e) {
            console.error('❌ Error parsing output_records_json for product type:', e)
          }
        }
      })
      
      console.log('📈 Product Type Totals:', productTypeTotals)

      // Find the product type with highest total incoming weight
      let topProductTypeName = 'N/A'
      let topProductWeight = 0
      Object.entries(productTypeTotals).forEach(([type, total]: [string, any]) => {
        if (total > topProductWeight) {
          topProductWeight = total
          topProductTypeName = type
        }
      })
      
      console.log('🏆 Top Product:', topProductTypeName, '(', topProductWeight, 'kg )')

      console.log('📊 Final Calculated statistics:', {
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
        minHeight: '100vh'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 lg:py-40">
          <div className="text-center">
            <div className="space-y-6 md:space-y-8 mb-8 md:mb-12">
              <div className="space-y-3 md:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight px-2">
                  From Thai Soil to Golden
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>Wellness
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto px-4">
                  Trace every step of our sustainable turmeric journey – from the first
                  rhizome planted to the capsule in your hand.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
                <Link href="/products-category">
                  <Button size="lg" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 md:px-8 py-3 flex items-center justify-center">
                    <Package className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                    Trace a Product
                  </Button>
                </Link>
                <Link href="/home#trace">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-green-500 hover:text-white hover:border-green-500 px-6 md:px-8 py-3">
                    Learn the Process
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trace Flow Indicators - Responsive Layout */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4 text-yellow-400 text-xs sm:text-sm px-4">
              {/* Mobile: Stack vertically with arrows */}
              <div className="flex flex-col sm:hidden space-y-2 w-full max-w-xs">
                <div className="flex items-center justify-center space-x-2">
                  <LeafIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">Plant</span>
                </div>
                <ArrowDown className="h-4 w-4 text-white mx-auto" />
                <div className="flex items-center justify-center space-x-2">
                  <Sprout className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">Grow</span>
                </div>
                <ArrowDown className="h-4 w-4 text-white mx-auto" />
                <div className="flex items-center justify-center space-x-2">
                  <HandHeart className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">Harvest</span>
                </div>
                <ArrowDown className="h-4 w-4 text-white mx-auto" />
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCcw className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">Process</span>
                </div>
                <ArrowDown className="h-4 w-4 text-white mx-auto" />
                <div className="flex items-center justify-center space-x-2">
                  <Package className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">Product</span>
                </div>
              </div>

              {/* Desktop: Horizontal layout */}
              <div className="hidden sm:flex items-center space-x-3 md:space-x-4">
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
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 md:space-y-4 mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 px-4">Golden Roots for Modern Wellness</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Discover our premium turmeric products, each with complete traceability
            </p>
          </div>

          {/* Product Category Label */}
          <div className="text-left mb-6 md:mb-8 px-4 md:px-0">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">Product Category</h3>
          </div>

          {/* Category Carousel - Mobile Responsive */}
          <div className="relative mb-12 md:mb-16 pt-4">
            {/* Navigation Buttons - Hidden on mobile */}
            <button
              onClick={prevCategory}
              className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
              aria-label="Previous category"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <button
              onClick={nextCategory}
              className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
              aria-label="Next category"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            {/* Category Cards Container */}
            <div className="overflow-hidden mx-4 md:mx-12 py-2">
              <div
                className="flex transition-transform duration-500 ease-in-out md:hidden"
                style={{ transform: `translateX(-${currentCategoryIndex * 100}%)` }}
              >
                {/* Mobile: One card at a time */}
                {productCategories.map((category, index) => (
                  <div key={category.id} className="w-full flex-shrink-0 px-2 py-2 md:hidden">
                    <div
                      className="text-center cursor-pointer group"
                      onClick={() => {
                        const categoryMap: { [key: string]: string } = {
                          "Food & Beverage": "Food & Beverage",
                          "Health Supplements": "Health Supplements",
                          "Beauty & Personal Care": "Beauty & Personal Care"
                        };
                        const targetCategory = categoryMap[category.title] || "All Product";
                        window.location.href = `/products-category?category=${encodeURIComponent(targetCategory)}`;
                      }}
                    >
                      <div className="aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden relative transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-2 max-w-sm mx-auto">
                        <img
                          src={category.image}
                          alt={category.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500"
                          loading="eager"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const container = target.parentElement!;
                            container.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                <div class="text-center p-8">
                                  <div class="text-6xl mb-4 text-gray-400">📦</div>
                                  <p class="text-gray-500 font-medium text-sm">Image not available</p>
                                </div>
                              </div>
                            `;
                          }}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                            <span className="text-green-800 font-semibold flex items-center gap-2 text-sm">
                              View Products
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-green-900 flex items-center justify-center gap-2 group-hover:text-green-700 transition-colors duration-300">
                        {category.title === "Food & Beverage" && <SoupIcon className="w-4 md:w-5 h-4 md:h-5" />}
                        {category.title === "Health Supplements" && <Heart className="w-4 md:w-5 h-4 md:h-5" />}
                        {category.title === "Beauty & Personal Care" && <Sparkles className="w-4 md:w-5 h-4 md:h-5" />}
                        {category.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Show all three cards */}
              <div className="hidden md:flex transition-transform duration-500 ease-in-out"
                   style={{ transform: `translateX(-${currentCategoryIndex * (100 / 3)}%)` }}>
                {productCategories.map((category, index) => (
                  <div key={category.id} className="w-1/3 flex-shrink-0 px-4 py-2">
                    <div
                      className="text-center cursor-pointer group"
                      onClick={() => {
                        const categoryMap: { [key: string]: string } = {
                          "Food & Beverage": "Food & Beverage",
                          "Health Supplements": "Health Supplements",
                          "Beauty & Personal Care": "Beauty & Personal Care"
                        };
                        const targetCategory = categoryMap[category.title] || "All Product";
                        window.location.href = `/products-category?category=${encodeURIComponent(targetCategory)}`;
                      }}
                    >
                      <div className="aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden relative transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-2">
                        <img
                          src={category.image}
                          alt={category.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500"
                          loading="eager"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const container = target.parentElement!;
                            container.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                <div class="text-center p-8">
                                  <div class="text-6xl mb-4 text-gray-400">📦</div>
                                  <p class="text-gray-500 font-medium text-sm">Image not available</p>
                                </div>
                              </div>
                            `;
                          }}
                        />
                        {/* Hover overlay */}
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

            {/* Mobile Pagination Dots */}
            <div className="flex justify-center space-x-2 mt-4 md:hidden">
              {productCategories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCategoryIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentCategoryIndex ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to category ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-8 md:py-12 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">Real-time Factory Statistics</h3>
              <p className="text-sm text-gray-600 mt-1">
                {factoryData.loading ? 'Loading data from factory system...' :
                  factoryData.error ? 'Unable to connect to factory system' :
                    'Live data from factory processing records'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="space-y-2 p-4 md:p-0">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : `${factoryData.totalTurmericUsed} kg`}
              </div>
              <div className="text-gray-600 text-sm md:text-base">Total Turmeric Used</div>
              {factoryData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {factoryData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2 p-4 md:p-0">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : factoryData.topProductType}
              </div>
              <div className="text-gray-600 text-sm md:text-base">Top Product Output</div>
              {factoryData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {factoryData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2 p-4 md:p-0">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : `${factoryData.processingWaste} kg`}
              </div>
              <div className="text-gray-600 text-sm md:text-base">Processing Waste</div>
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
      <section id="trace" className="py-12 md:py-20 bg-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 md:space-y-4 mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 px-4">Trace Back: From Product to Plant</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Follow the reverse journey of our turmeric lifecycle
            </p>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Step 1: Refined & Packaged */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex items-center space-x-4 md:flex-col md:space-x-0 md:space-y-2">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      1
                    </div>
                  </div>
                  <img src="/image6.png" alt="Factory" className="h-20 w-32 md:h-32 md:w-48 object-cover rounded-lg md:hidden" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Refined & Packaged</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Our state-of-the-art facilities transform harvested turmeric into pure
                    supplements, ensuring 95%+ curcumin retention through gentle
                    processing every batch.
                  </p>
                  <Link href="/process-detail/refined-packaged">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-sm md:text-base">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img src="/image6.png" alt="Factory" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 2: Extraction & Drying */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex items-center space-x-4 md:flex-col md:space-x-0 md:space-y-2">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      2
                    </div>
                  </div>
                  <img src="/image7.png" alt="Processing" className="h-20 w-32 md:h-32 md:w-48 object-cover rounded-lg md:hidden" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Extraction & Drying</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Gentle solar drying preserves nutrients and active compounds. No
                    chemicals used, with full traceability via blockchain technology
                    recording every batch.
                  </p>
                  <Link href="/process-detail/extraction-drying">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-sm md:text-base">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img src="/image7.png" alt="Processing" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 3: Hand-Picked at Peak */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex items-center space-x-4 md:flex-col md:space-x-0 md:space-y-2">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      3
                    </div>
                  </div>
                  <img src="/image8.png" alt="Harvest" className="h-20 w-32 md:h-32 md:w-48 object-cover rounded-lg md:hidden" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Hand-Picked at Peak</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    After 8 months of careful growth, our farmers hand-harvest each
                    rhizome at peak maturity. Every batch is tested for Grade A quality
                    before processing.
                  </p>
                  <Link href="/process-detail/hand-picked-at-peak">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-sm md:text-base">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img src="/image8.png" alt="Harvest" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 4: Nurtured Sustainably */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex items-center space-x-4 md:flex-col md:space-x-0 md:space-y-2">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      4
                    </div>
                  </div>
                  <img src="/image9.png" alt="Farming" className="h-20 w-32 md:h-32 md:w-48 object-cover rounded-lg md:hidden" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Nurtured Sustainably</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Organic cultivation methods with monitored soil pH (6.5-7.0).
                    Complete fertilizer and water records maintained for every batch
                    throughout the growing season.
                  </p>
                  <Link href="/process-detail/nurtured-sustainably">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-sm md:text-base">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img src="/image9.png" alt="Farming" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>

            {/* Step 5: Roots in Rich Soil */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex items-center space-x-4 md:flex-col md:space-x-0 md:space-y-2">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                      5
                    </div>
                  </div>
                  <img src="/image10.png" alt="Planting" className="h-20 w-32 md:h-32 md:w-48 object-cover rounded-lg md:hidden" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Roots in Rich Soil</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Everything begins with select Curcuma longa varieties planted in
                    the fertile soils of Chiang Rai. Your journey of pure wellness starts
                    here.
                  </p>
                  <Link href="/process-detail/roots-in-rich-soil">
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-sm md:text-base">
                      View Process Detail
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img src="/image10.png" alt="Soil" className="h-32 w-48 object-cover rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Section */}
      <section id="farm" className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 md:space-y-4 mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Transforming Thai Agriculture</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Real impact on turmeric farming and supply chains
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Side - Image and Stats */}
            <div className="space-y-6">
              <div className="relative">
                <img
                  src="/batch1.png"
                  alt="Turmeric Farm"
                  className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 md:p-4 max-w-[calc(100%-2rem)] md:max-w-none">
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900">
                    {farmData.loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-3 md:h-4 w-3 md:w-4 border-b-2 border-gray-900 mr-2"></div>
                        Loading...
                      </span>
                    ) : farmData.error ? '10+' : `${farmData.totalFarms}+`} Farms Connected
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">Linking farmers across Chiang Rai since 2025, creating a sustainable network.</p>
                </div>
              </div>
            </div>

            {/* Right Side - Features Grid */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {/* Organic Farming */}
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Leaf className="w-6 md:w-8 h-6 md:h-8 text-green-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Organic Farming</h3>
                <p className="text-xs md:text-sm text-gray-600">100% chemical-free cultivation</p>
              </div>

              {/* Traceability */}
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <LinkIcon className="w-6 md:w-8 h-6 md:h-8 text-green-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Traceability</h3>
                <p className="text-xs md:text-sm text-gray-600">Every batch tracked from soil to shelf</p>
              </div>

              {/* Global Reach */}
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Globe className="w-6 md:w-8 h-6 md:h-8 text-green-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Global Reach</h3>
                <p className="text-xs md:text-sm text-gray-600">Serving markets worldwide from Thailand</p>
              </div>

              {/* Timely Insights */}
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-6 md:w-8 h-6 md:h-8 text-green-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Timely Insights</h3>
                <p className="text-xs md:text-sm text-gray-600">Real-time updates for farmers</p>
              </div>
            </div>
          </div>

          {/* Impact Numbers */}
          <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                {farmData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 md:h-6 w-5 md:w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : farmData.error ? '10+' : `${farmData.totalFarms}+`}
              </div>
              <div className="text-sm md:text-base text-gray-600">Connected Farms</div>
              {farmData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {farmData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm md:text-base text-gray-600">Organic Certified</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                {factoryData.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 md:h-6 w-5 md:w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : factoryData.error ? 'N/A' : `${factoryData.totalHarvestYield}kg`}
              </div>
              <div className="text-sm md:text-base text-gray-600">Annual Harvest</div>
              {factoryData.loading && (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
              {factoryData.error && (
                <div className="text-xs text-red-500">Connection error</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-green-600">2025</div>
              <div className="text-sm md:text-base text-gray-600">Since Established</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}