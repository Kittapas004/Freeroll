'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Package, Search, SoupIcon, Sparkle, QrCode } from "lucide-react";
import PublicNavigation from "@/components/public-navigation";
import Footer from "@/components/Footer";
import QRCode from 'qrcode';

interface FactoryProcessing {
    id: number;
    documentId: string;
    batchLotNumber: string; // เพิ่ม batch lot number
    processor: string; // เปลี่ยนจาก operator_processor
    final_product_type: string;
    output_quantity: number; // เปลี่ยนเป็น number
    output_unit: string;
    processing_status: string;
    processing_date: string;
    product_grade: string;
    target_market: string; // เพิ่ม target market
    standard_criteria?: string;
    wasteQuantity: number; // เพิ่ม waste quantity
    factory_submission?: {
        batch_id: string;
        farm_name: string;
        test_type: string;
        quality_grade: string;
        harvest_records?: {
            farm?: {
                farm_name: string;
                farm_address: string;
                crop_type: string;
                cultivation_method: string;
            };
        };
    };
    batch_info?: {
        plant_variety: string;
        farm_name: string;
        location: string;
    };
}

interface ProductCategory {
    type: string;
    displayName: string;
    description: string;
    image: string;
    products: FactoryProcessing[];
}

const ProductsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Product');
    const [factoryProcessingData, setFactoryProcessingData] = useState<FactoryProcessing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQRPopover, setShowQRPopover] = useState<string | null>(null);
    const [qrCodeData, setQrCodeData] = useState<{url: string, productName: string} | null>(null);

    // Generate QR Code for popover display
    const showProductQRCode = async (productId: string, productName: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            const traceUrl = `${window.location.origin}/trace/${productId}`;
            const qrDataUrl = await QRCode.toDataURL(traceUrl, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#16a34a',
                    light: '#ffffff'
                }
            });
            
            setQrCodeData({ url: qrDataUrl, productName });
            setShowQRPopover(productId);
        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Error generating QR code. Please try again.');
        }
    };

    // Set initial category from URL params
    useEffect(() => {
        const categoryFromUrl = searchParams.get('category');
        if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
            setSelectedCategory(categoryFromUrl);
        }
    }, [searchParams]);

    // Function to handle category change and update URL
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        // Update URL without page reload
        const url = new URL(window.location.href);
        if (category === 'All Product') {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', category);
        }
        window.history.pushState({}, '', url.toString());
    };

    // Product category definitions with appropriate images
    const productCategories: { [key: string]: ProductCategory } = {
        'All Product': {
            type: 'All Product',
            displayName: 'All Product',
            description: 'Entire Range',
            image: '',
            products: []
        },
        'Food & Beverage': {
            type: 'Food & Beverage',
            displayName: 'Food & Beverage',
            description: 'Spice blends, Instant drinks',
            image: '',
            products: []
        },
        'Health Supplements': {
            type: 'Health Supplements',
            displayName: 'Health Supplements',
            description: 'Capsules',
            image: '',
            products: []
        },
        'Beauty & Personal Care': {
            type: 'Beauty & Personal Care',
            displayName: 'Beauty & Personal Care',
            description: 'Face and body',
            image: '',
            products: []
        }
    };

    // Mapping from final_product_type to category and image
    const getProductDetails = (finalProductType: string) => {
        const productMap: { [key: string]: { category: string; image: string; displayName: string } } = {
            'Powder': {
                category: 'Food & Beverage',
                image: '/image3.png',
                displayName: 'Turmeric Powder'
            },
            'Capsule': {
                category: 'Health Supplements',
                image: '/image5.png',
                displayName: 'Turmeric Capsules'
            },
            'Oil': {
                category: 'Beauty & Personal Care',
                image: '/image4.png',
                displayName: 'Turmeric Oil'
            },
            'Extract': {
                category: 'Beauty & Personal Care',
                image: '/image4.png',
                displayName: 'Turmeric Oil'
            },
            'Tea Bag': {
                category: 'Food & Beverage',
                image: '/image11.png',
                displayName: 'Turmeric Tea Bag'
            }
        };

        return productMap[finalProductType] || {
            category: 'Food & Beverage',
            image: '/image3.png',
            displayName: finalProductType
        };
    };

    const fetchFactoryProcessingData = async () => {
        try {
            setLoading(true);

            // Fetch factory processing data with output_records_json
            let response = await fetch('https://api-freeroll-production.up.railway.app/api/factory-processings?populate[factory_submission][populate][batch][populate]=*', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🏭 Factory Processing API Response:', result);

            if (result?.data && Array.isArray(result.data)) {
                // Filter ONLY Completed items
                const completedItems = result.data.filter((item: any) => {
                    const status = item.Processing_Status;
                    return status === 'Completed' || status === 'Export Success';
                });

                console.log('✅ Filtered completed items:', completedItems.length);

                // Parse output_records_json and create individual product records
                const allProducts: FactoryProcessing[] = [];

                completedItems.forEach((item: any) => {
                    // Parse output_records_json to get multiple output records
                    if (item.output_records_json) {
                        try {
                            const outputRecords = JSON.parse(item.output_records_json);
                            
                            // Each output record becomes a separate product
                            outputRecords.forEach((record: any) => {
                                allProducts.push({
                                    id: item.id,
                                    documentId: record.batchLotNumber || `${item.documentId}-${record.id}`, // Use batchLotNumber as unique ID
                                    batchLotNumber: record.batchLotNumber || 'N/A',
                                    processor: record.processor || 'Unknown',
                                    final_product_type: record.productType || 'Unknown',
                                    output_quantity: parseFloat(record.quantity) || 0,
                                    output_unit: record.unit || 'kg',
                                    processing_status: item.Processing_Status || 'Completed',
                                    processing_date: item.processing_date_custom || item.Date_Received || item.createdAt,
                                    product_grade: record.productGrade || '',
                                    target_market: record.targetMarket || '',
                                    standard_criteria: item.standard_criteria || '',
                                    wasteQuantity: parseFloat(record.wasteQuantity) || 0,
                                    factory_submission: item.factory_submission || null,
                                    batch_info: {
                                        plant_variety: item.factory_submission?.batch?.Plant_Variety ||
                                            item.factory_submission?.Plant_Variety ||
                                            'Unknown Variety',
                                        farm_name: item.factory_submission?.Farm_Name ||
                                            item.factory_submission?.farm_name || '',
                                        location: item.factory_submission?.batch?.Farm?.Farm_Address || ''
                                    }
                                });
                            });
                        } catch (e) {
                            console.error('❌ Error parsing output_records_json:', e);
                        }
                    }
                });

                console.log('📦 Total products from output records:', allProducts.length);
                console.log('📊 Sample products:', allProducts.slice(0, 3));

                setFactoryProcessingData(allProducts);
            } else {
                console.error('Invalid data structure:', result);
                setFactoryProcessingData([]);
            }
        } catch (error) {
            console.error('Error fetching factory processing data:', error);
            setFactoryProcessingData([]);
        } finally {
            setLoading(false);
        }
    };

    // Group products by category
    const groupProductsByCategory = () => {
        const categories = { ...productCategories };

        factoryProcessingData.forEach(product => {
            const productDetails = getProductDetails(product.final_product_type);
            const categoryName = productDetails.category;

            if (categories[categoryName]) {
                categories[categoryName].products.push(product);
            }

            // Add to All Product category
            categories['All Product'].products.push(product);
        });

        return categories;
    };

    // Filter products based on search term and selected category
    const getFilteredProducts = () => {
        const categories = groupProductsByCategory();

        if (selectedCategory === 'All Product') {
            return factoryProcessingData.filter(product => {
                const productDetails = getProductDetails(product.final_product_type);
                const searchableText = `${productDetails.displayName} ${product.final_product_type} ${product.product_grade || ''} ${product.batch_info?.plant_variety || ''}`.toLowerCase();
                return searchableText.includes(searchTerm.toLowerCase());
            });
        }

        // Handle subcategory filtering
        if (selectedCategory === 'Spice blends') {
            return factoryProcessingData.filter(product => {
                const productDetails = getProductDetails(product.final_product_type);
                const searchableText = `${productDetails.displayName} ${product.final_product_type} ${product.product_grade || ''} ${product.batch_info?.plant_variety || ''}`.toLowerCase();
                return product.final_product_type === 'Powder' && searchableText.includes(searchTerm.toLowerCase());
            });
        }

        if (selectedCategory === 'Instant drinks') {
            return factoryProcessingData.filter(product => {
                const productDetails = getProductDetails(product.final_product_type);
                const searchableText = `${productDetails.displayName} ${product.final_product_type} ${product.product_grade || ''} ${product.batch_info?.plant_variety || ''}`.toLowerCase();
                return product.final_product_type === 'Tea Bag' && searchableText.includes(searchTerm.toLowerCase());
            });
        }

        if (selectedCategory === 'Capsules') {
            return factoryProcessingData.filter(product => {
                const productDetails = getProductDetails(product.final_product_type);
                const searchableText = `${productDetails.displayName} ${product.final_product_type} ${product.product_grade || ''} ${product.batch_info?.plant_variety || ''}`.toLowerCase();
                return product.final_product_type === 'Capsule' && searchableText.includes(searchTerm.toLowerCase());
            });
        }

        if (selectedCategory === 'Face and body') {
            return factoryProcessingData.filter(product => {
                const productDetails = getProductDetails(product.final_product_type);
                const searchableText = `${productDetails.displayName} ${product.final_product_type} ${product.product_grade || ''} ${product.batch_info?.plant_variety || ''}`.toLowerCase();
                return (product.final_product_type === 'Oil' || product.final_product_type === 'Extract') && searchableText.includes(searchTerm.toLowerCase());
            });
        }

        return categories[selectedCategory]?.products.filter(product => {
            const productDetails = getProductDetails(product.final_product_type);
            const searchableText = `${productDetails.displayName} ${product.final_product_type} ${product.product_grade || ''} ${product.batch_info?.plant_variety || ''}`.toLowerCase();
            return searchableText.includes(searchTerm.toLowerCase());
        }) || [];
    };

    // Get category subtitle based on selection
    const getCategorySubtitle = () => {
        const categories = groupProductsByCategory();
        const categoryData = categories[selectedCategory];

        if (selectedCategory === 'All Product') {
            return 'Entire Range';
        }

        if (selectedCategory === 'Spice blends') {
            return 'Spice blends';
        }

        if (selectedCategory === 'Instant drinks') {
            return 'Instant drinks';
        }

        if (selectedCategory === 'Capsules') {
            return 'Capsules';
        }

        if (selectedCategory === 'Face and body') {
            return 'Face and body';
        }

        if (selectedCategory === 'Food & Beverage') {
            // Check which subcategory products exist
            const hasSpiceBlends = categoryData.products.some(p => p.final_product_type === 'Powder');
            const hasInstantDrinks = categoryData.products.some(p => p.final_product_type === 'Tea Bag');

            if (hasSpiceBlends && hasInstantDrinks) return 'Spice blends, Instant drinks';
            if (hasSpiceBlends) return 'Spice blends';
            if (hasInstantDrinks) return 'Instant drinks';
            return 'Food & Beverage Products';
        }

        return categoryData?.description || '';
    };

    useEffect(() => {
        fetchFactoryProcessingData();
    }, []);

    // Close QR popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showQRPopover) {
                setShowQRPopover(null);
                setQrCodeData(null);
            }
        };

        if (showQRPopover) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showQRPopover]);

    const filteredProducts = getFilteredProducts();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <PublicNavigation />
                <div className="container mx-auto px-6 py-12">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-48 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Public Navigation */}
            <PublicNavigation />

            {/* Breadcrumb */}
            <div className="bg-green-700 text-white py-2 md:py-3">
                <div className="container mx-auto px-4 md:px-6">
                    <nav className="flex items-center text-xs md:text-sm">
                        <span
                            className="text-green-200 cursor-pointer hover:text-white transition-colors"
                            onClick={() => router.push('/home')}
                        >
                            Home Page
                        </span>
                        <span className="mx-1 md:mx-2">{'>'}</span>
                        <span>Product</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                {/* Mobile Category Navigation */}
                <div className="lg:hidden mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold">Products</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search Product"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-48"
                            />
                        </div>
                    </div>
                    
                    {/* Horizontal scrollable categories for mobile */}
                    <div className="overflow-x-auto">
                        <div className="flex space-x-2 pb-2 min-w-max">
                            <button
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                                    selectedCategory === 'All Product' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => handleCategoryChange('All Product')}
                            >
                                All Product
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                                    selectedCategory === 'Food & Beverage' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => handleCategoryChange('Food & Beverage')}
                            >
                                Food & Beverage
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                                    selectedCategory === 'Health Supplements' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => handleCategoryChange('Health Supplements')}
                            >
                                Health Supplements
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                                    selectedCategory === 'Beauty & Personal Care' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => handleCategoryChange('Beauty & Personal Care')}
                            >
                                Beauty & Care
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Desktop Sidebar - Hidden on mobile */}
                    <div className="hidden lg:block w-64 bg-white rounded-lg shadow-sm p-6 h-fit">
                        <h2
                            className={`text-lg font-semibold mb-6 cursor-pointer transition-colors flex items-center ${selectedCategory === 'All Product' ? 'text-green-600' : 'text-gray-900 hover:text-green-600'
                                }`}
                            onClick={() => handleCategoryChange('All Product')}
                        >
                            <Package className="w-4 h-4 mr-2" /> All Product
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <h3
                                    className={`text-sm font-medium mb-2 cursor-pointer flex items-center ${selectedCategory === 'Food & Beverage' ||
                                            selectedCategory === 'Spice blends' ||
                                            selectedCategory === 'Instant drinks'
                                            ? 'text-green-600' : 'text-gray-700'
                                        }`}
                                    onClick={() => handleCategoryChange('Food & Beverage')}
                                >
                                    <SoupIcon className="w-4 h-4 mr-2" /> Food & Beverage
                                </h3>
                                <div className="ml-4 space-y-1 text-sm text-gray-600">
                                    <div
                                        className={`cursor-pointer ${selectedCategory === 'Spice blends'
                                                ? 'text-green-600 font-medium'
                                                : 'hover:text-green-600'
                                            }`}
                                        onClick={() => handleCategoryChange('Spice blends')}
                                    >
                                        Spice blends
                                    </div>
                                    <div
                                        className={`cursor-pointer ${selectedCategory === 'Instant drinks'
                                                ? 'text-green-600 font-medium'
                                                : 'hover:text-green-600'
                                            }`}
                                        onClick={() => handleCategoryChange('Instant drinks')}
                                    >
                                        Instant drinks
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3
                                    className={`text-sm font-medium mb-2 cursor-pointer flex items-center ${selectedCategory === 'Health Supplements' || selectedCategory === 'Capsules' ? 'text-green-600' : 'text-gray-700'
                                        }`}
                                    onClick={() => handleCategoryChange('Health Supplements')}
                                >
                                    <Heart className="w-4 h-4 mr-2" /> Health Supplements
                                </h3>
                                <div className="ml-4 space-y-1 text-sm text-gray-600">
                                    <div
                                        className={`cursor-pointer hover:text-green-600 ${selectedCategory === 'Capsules' ? 'text-green-600 font-medium' : ''}`}
                                        onClick={() => handleCategoryChange('Capsules')}
                                    >
                                        Capsules
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3
                                    className={`text-sm font-medium mb-2 cursor-pointer flex items-center ${selectedCategory === 'Beauty & Personal Care' || selectedCategory === 'Face and body' ? 'text-green-600' : 'text-gray-700'
                                        }`}
                                    onClick={() => handleCategoryChange('Beauty & Personal Care')}
                                >
                                    <Sparkle className="w-4 h-4 mr-2" /> Beauty & Personal Care
                                </h3>
                                <div className="ml-4 space-y-1 text-sm text-gray-600">
                                    <div
                                        className={`cursor-pointer hover:text-green-600 ${selectedCategory === 'Face and body' ? 'text-green-600 font-medium' : ''}`}
                                        onClick={() => handleCategoryChange('Face and body')}
                                    >
                                        Face and body
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Desktop Category Header - Hidden on mobile */}
                        <div className="hidden lg:block mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">
                                        {selectedCategory === 'All Product' ? <Package className="w-8 h-8 mr-2" /> :
                                            selectedCategory === 'Food & Beverage' ||
                                                selectedCategory === 'Spice blends' ||
                                                selectedCategory === 'Instant drinks' ? <SoupIcon className="w-8 h-8 mr-2" /> :
                                                selectedCategory === 'Health Supplements' ||
                                                selectedCategory === 'Capsules' ? <Heart className="w-8 h-8 mr-2" /> :
                                                selectedCategory === 'Beauty & Personal Care' ||
                                                selectedCategory === 'Face and body' ? <Sparkle className="w-8 h-8 mr-2" /> : <Package className="w-8 h-8 mr-2" />}
                                    </div>
                                    <div className="text-2xl">
                                        <h1 className="text-xl font-semibold">
                                            {selectedCategory === 'Spice blends' ? 'Food & Beverage' :
                                                selectedCategory === 'Instant drinks' ? 'Food & Beverage' :
                                                selectedCategory === 'Capsules' ? 'Health Supplements' :
                                                selectedCategory === 'Face and body' ? 'Beauty & Personal Care' :
                                                    selectedCategory}
                                        </h1>
                                        <p className="text-gray-600 text-sm">{getCategorySubtitle()}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search Product"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-64"
                                    />
                                </div>
                            </div>

                            {/* Category Bar */}
                            <div className="bg-green-700 text-white px-4 py-2 rounded">
                                {getCategorySubtitle()}
                            </div>
                        </div>

                        {/* Mobile Category Title */}
                        <div className="lg:hidden mb-4">
                            <div className="bg-green-700 text-white px-4 py-2 rounded">
                                {getCategorySubtitle()}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {filteredProducts.map((product) => {
                                const productDetails = getProductDetails(product.final_product_type);

                                return (
                                    <Card
                                        key={product.documentId}
                                        className="hover:shadow-lg transition-shadow"
                                    >
                                        <CardContent className="p-3 md:p-4">
                                            <div 
                                                className="aspect-square bg-gray-100 rounded-lg mb-3 md:mb-4 flex items-center justify-center overflow-hidden cursor-pointer"
                                                onClick={() => router.push(`/trace/${product.documentId}`)}
                                            >
                                                <img
                                                    src={productDetails.image}
                                                    alt={productDetails.displayName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/image5.png'; // Fallback image
                                                    }}
                                                />
                                            </div>

                                            <div onClick={() => router.push(`/trace/${product.documentId}`)} className="cursor-pointer">
                                                <h3 className="font-medium text-sm md:text-base mb-2 line-clamp-2">{productDetails.displayName}</h3>

                                                <div className="space-y-1 text-xs md:text-sm text-gray-600">
                                                    <div className="truncate">Quality Grade: {product.factory_submission?.quality_grade || product.product_grade || 'N/A'}</div>
                                                    <div className="truncate">Quantity: {product.output_quantity || 'N/A'} {product.output_unit || ''}</div>
                                                    <div className="truncate">Plant Variety: {product.batch_info?.plant_variety || 'Unknown Variety'}</div>
                                                </div>

                                                <div className="mt-2 md:mt-3">
                                                    <Badge variant="outline" className="text-xs">
                                                        {product.final_product_type}
                                                    </Badge>
                                                </div>

                                                {/* Certifications */}
                                                <div className="mt-2">
                                                    <div className="text-xs text-gray-500 mb-1">Certifications:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {/* แสดง standard_criteria จริงจาก API */}
                                                        {product.standard_criteria && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {product.standard_criteria}
                                                            </Badge>
                                                        )}

                                                        {/* แสดง cultivation_method ถ้ามี */}
                                                        {product.factory_submission?.harvest_records?.farm?.cultivation_method && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {product.factory_submission.harvest_records.farm.cultivation_method}
                                                            </Badge>
                                                        )}

                                                        {/* แสดง placeholder ถ้าไม่มีข้อมูล certification */}
                                                        {!product.standard_criteria && !product.factory_submission?.harvest_records?.farm?.cultivation_method && (
                                                            <Badge variant="secondary" className="text-xs text-gray-400">
                                                                No certification data
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-3 md:mt-4">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs md:text-sm"
                                                    onClick={() => router.push(`/trace/${product.documentId}`)}
                                                >
                                                    Trace Back
                                                </Button>
                                                <div className="relative">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="px-3"
                                                        onClick={(e) => showProductQRCode(product.documentId, productDetails.displayName, e)}
                                                        title="Show QR Code for this product"
                                                    >
                                                        <QrCode className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    {/* QR Popover */}
                                                    {showQRPopover === product.documentId && qrCodeData && (
                                                        <div className="absolute right-0 top-full mt-2 z-50">
                                                            <div className="bg-white rounded-lg shadow-lg border p-4 w-56">
                                                                {/* Arrow pointing up */}
                                                                <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t transform rotate-45"></div>
                                                                
                                                                <div className="text-center">
                                                                    <p className="text-sm font-medium text-gray-900 mb-3">
                                                                        {qrCodeData.productName}
                                                                    </p>
                                                                    <div className="flex justify-center mb-3">
                                                                        <img 
                                                                            src={qrCodeData.url} 
                                                                            alt="QR Code"
                                                                            className="w-32 h-32 border rounded"
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 mb-3">
                                                                        Scan to trace product
                                                                    </p>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-2 rounded transition-colors"
                                                                            onClick={() => {
                                                                                const link = document.createElement('a');
                                                                                link.download = `${qrCodeData.productName}-qr.png`;
                                                                                link.href = qrCodeData.url;
                                                                                link.click();
                                                                            }}
                                                                        >
                                                                            Download
                                                                        </button>
                                                                        <button
                                                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 px-2 rounded transition-colors"
                                                                            onClick={() => {
                                                                                setShowQRPopover(null);
                                                                                setQrCodeData(null);
                                                                            }}
                                                                        >
                                                                            Close
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-8 md:py-12">
                                <div className="text-gray-500 text-base md:text-lg mb-2">No products found</div>
                                <div className="text-gray-400 text-sm md:text-base px-4">
                                    {searchTerm
                                        ? `No products match "${searchTerm}" in ${selectedCategory}`
                                        : `No products available in ${selectedCategory}`
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

// Loading component for Suspense fallback
const ProductsLoading = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
                <div className="text-gray-500 text-lg">Loading products...</div>
            </div>
        </div>
        <Footer />
    </div>
);

// Main component with Suspense wrapper
const ProductsPage = () => {
    return (
        <Suspense fallback={<ProductsLoading />}>
            <ProductsContent />
        </Suspense>
    );
};

export default ProductsPage;