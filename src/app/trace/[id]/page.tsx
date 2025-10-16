'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Factory, Leaf, Package, FileText, QrCode, Download, Share2 } from "lucide-react";
import PublicNavigation from "@/components/public-navigation";
import Footer from "@/components/Footer";
import QRCode from 'qrcode';

interface ProductData {
    id: number;
    documentId: string;
    final_product_type: string;
    output_quantity: string;
    output_unit?: string; // เพิ่ม output_unit
    processing_status: string;
    processing_date: string;
    operator_processor: string;
    product_grade: string;
    standard_criteria?: string; // เพิ่ม standard_criteria สำหรับ certifications
    batch_lot_number?: string; // เพิ่ม batch_lot_number ระดับ root
    certification_status?: string; // เพิ่ม certification_status
    factory_submission?: {
        batch_id: string;
        batch_lot_number?: string; // เพิ่ม batch_lot_number
        farm_name: string;
        factory_name?: string; // เพิ่ม factory_name
        Factory_Name?: string; // เพิ่ม Factory_Name ตามโครงสร้างของ Strapi
        factory?: {
            name?: string;
            Factory_Name?: string; // เพิ่ม Factory_Name ใน factory object
        };
        test_type: string;
        quality_grade: string;
        date: string;
        harvest_records?: {
            farm?: {
                farm_name: string;
                farm_address: string;
                crop_type: string;
                cultivation_method: string;
                farm_size: number;
                farm_size_unit: string;
            };
            batch_id: string;
            yield: number;
            date: string;
        };
    };
    batch_info?: {
        plant_variety: string;
        farm_name: string;
        farmer_name: string;
        location: string;
        farm_address: string;
        farm_size: string;
        cultivation_method: string;
        certifications: string;
        harvest_date: string;
    };
    quality_data?: {
        moisture: string;
        curcumin_content: string;
        certifications: string[];
        lead_ppm?: string;
        cadmium_ppm?: string;
        arsenic_ppm?: string;
        mercury_ppm?: string;
        total_plate_count?: string;
        yeast_mold?: string;
    };
}

const TraceProductPage = () => {
    const params = useParams();
    const router = useRouter();
    const [productData, setProductData] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [showQRCode, setShowQRCode] = useState(false);

    // Generate QR Code for this product's trace URL
    const generateQRCode = async () => {
        try {
            const traceUrl = `${window.location.origin}/trace/${params.id}`;
            const qrDataUrl = await QRCode.toDataURL(traceUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#16a34a', // Green color
                    light: '#ffffff'
                }
            });
            setQrCodeUrl(qrDataUrl);
            setShowQRCode(true);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    // Download QR Code as image
    const downloadQRCode = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.download = `turmeric-trace-${params.id}.png`;
            link.href = qrCodeUrl;
            link.click();
        }
    };

    // Share QR Code
    const shareTrace = async () => {
        const traceUrl = `${window.location.origin}/trace/${params.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `TurmeRic Product Trace - ${productData?.final_product_type}`,
                    text: 'Scan this QR code or visit this link to trace the product journey',
                    url: traceUrl
                });
            } catch (error) {
                console.log('Error sharing:', error);
                // Fallback to copying to clipboard
                navigator.clipboard.writeText(traceUrl);
                alert('Trace URL copied to clipboard!');
            }
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(traceUrl);
            alert('Trace URL copied to clipboard!');
        }
    };

    // Get product image based on type
    const getProductImage = (productType: string) => {
        const imageMap: { [key: string]: string } = {
            'Powder': '/image3.png',
            'Capsule': '/image5.png',
            'Oil': '/image4.png',
            'Extract': '/image4.png',
            'Tea Bag': '/image11.png',
        };
        return imageMap[productType] || '/image5.png';
    };

    // Get product display name for public view
    const getProductDisplayName = (productType: string) => {
        const displayMap: { [key: string]: string } = {
            'Powder': 'Turmeric Powder',
            'Capsule': 'Turmeric Capsules',
            'Oil': 'Turmeric Oil',
            'Extract': 'Turmeric Oil', // Factory term "Extract" displays as "Turmeric Oil" for public
            'Tea Bag': 'Turmeric Tea Bag',
        };
        return displayMap[productType] || `Turmeric ${productType}`;
    };

    const fetchProductData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch factory processing data with output_records_json
            const response = await fetch(`https://api-freeroll-production.up.railway.app/api/factory-processings?populate[factory_submission][populate][batch][populate]=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const result = await response.json();

            if (result.data && Array.isArray(result.data)) {
                // Search for product in output_records_json by Batch Lot Number
                let foundItem: any = null;
                let foundRecord: any = null;

                // First try to find by documentId (backward compatibility)
                foundItem = result.data.find((item: any) =>
                    item.documentId === params.id || item.id === parseInt(params.id as string)
                );

                // If not found, search in output_records_json by batch lot number
                if (!foundItem) {
                    for (const item of result.data) {
                        if (item.output_records_json) {
                            try {
                                const outputRecords = JSON.parse(item.output_records_json);
                                const record = outputRecords.find((r: any) => 
                                    r.batchLotNumber === params.id
                                );
                                
                                if (record) {
                                    foundItem = item;
                                    foundRecord = record;
                                    console.log('✅ Found product by Batch Lot Number:', params.id);
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                }

                if (!foundItem) {
                    throw new Error('Product not found');
                }

                // Process the found product
                const item = foundItem;

                // Get factory name from factory_submission first, then try to fetch factory details
                let factoryName = ''; // Default to known factory name

                // Try getting factory name from factory_submission first
                if (item.factory_submission?.Factory_Name) {
                    factoryName = item.factory_submission.Factory_Name;
                    console.log('✅ Factory name from factory_submission.Factory_Name:', factoryName);
                } else if (item.factory?.Factory_Name) {
                    factoryName = item.factory.Factory_Name;
                    console.log('✅ Factory name from item.factory.Factory_Name:', factoryName);
                } else {
                    // Try to fetch factory details from Factory collection
                    try {
                        const factoryResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/factories`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });

                        if (factoryResponse.ok) {
                            const factoryData = await factoryResponse.json();

                            // Get the first factory or find the matching one
                            if (factoryData.data && factoryData.data.length > 0) {
                                const factory = factoryData.data[0]; // Get first factory
                                if (factory.Factory_Name) {
                                    factoryName = factory.Factory_Name;
                                    console.log('✅ Factory name from factory API:', factoryName);
                                }
                            }
                        }
                    } catch (factoryError) {
                        console.log('❌ Failed to fetch factory list:', factoryError);
                        console.log('✅ Using default Factory_Name:', factoryName);
                    }
                }

                // Get farmer name from user_documentId
                let farmerName = 'Unknown Farmer';
                const userDocumentId = item.factory_submission?.batch?.user_documentId;

                if (userDocumentId) {
                    try {

                        const userResponse = await fetch(`https://api-freeroll-production.up.railway.app/api/users?filters[documentId][$eq]=${userDocumentId}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });

                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            // console.log('✅ User API response:', userData);

                            if (userData && Array.isArray(userData) && userData.length > 0) {
                                const user = userData[0];
                                farmerName = user.username || user.name || 'Unknown Farmer';
                            } else if (userData && userData.username) {
                                // Direct user object
                                farmerName = userData.username || userData.name || 'Unknown Farmer';
                            } else {
                                farmerName = item.factory_submission?.batch?.Farm?.farmer_name || 'Unknown Farmer';
                            }
                        } else {
                            console.log('❌ Failed to fetch user data, status:', userResponse.status);
                            // Fallback to Farm.farmer_name
                            farmerName = item.factory_submission?.batch?.Farm?.farmer_name || 'Unknown Farmer';
                        }
                    } catch (userError) {
                        // Fallback to Farm.farmer_name
                        farmerName = item.factory_submission?.batch?.Farm?.farmer_name || 'Unknown Farmer';
                    }
                } else {
                    // Fallback to Farm.farmer_name if no user_documentId
                    farmerName = item.factory_submission?.batch?.Farm?.farmer_name || 'Unknown Farmer';
                }

                const processedData: ProductData = {
                    id: item.id,
                    documentId: foundRecord?.batchLotNumber || item.documentId,
                    final_product_type: foundRecord?.productType || item.final_product_type,
                    output_quantity: foundRecord?.quantity || item.output_quantity,
                    output_unit: foundRecord?.unit || item.output_unit || 'kg',
                    processing_status: item.Processing_Status || item.processing_status,
                    processing_date: item.processing_date_custom || item.processing_date || item.Date_Received,
                    operator_processor: foundRecord?.processor || item.operator_processor,
                    product_grade: foundRecord?.productGrade || item.product_grade,
                    standard_criteria: item.standard_criteria || '',
                    batch_lot_number: foundRecord?.batchLotNumber || item.batch_lot_number || '',
                    certification_status: item.certification_status || '',
                    factory_submission: {
                        ...item.factory_submission,
                        Factory_Name: factoryName
                    },
                    batch_info: {
                        plant_variety: item.factory_submission?.batch?.Plant_Variety ||
                            item.factory_submission?.Plant_Variety ||
                            'Curcuma longa',
                        farm_name: item.factory_submission?.batch?.Farm?.Farm_Name ||
                            item.factory_submission?.farm_name ||
                            'Unknown Farm',
                        farmer_name: farmerName,
                        location: item.factory_submission?.batch?.Farm?.Farm_Address ||
                            item.factory_submission?.batch?.Farm?.Farm_Name ||
                            item.factory_submission?.farm_name ||
                            'Unknown Location',
                        farm_address: item.factory_submission?.batch?.Farm?.Farm_Address ||
                            'Address not available',
                        farm_size: item.factory_submission?.batch?.Farm?.Farm_Size ?
                            `${item.factory_submission.batch.Farm.Farm_Size} ${item.factory_submission.batch.Farm.Farm_Size_Unit || 'Rai'}` :
                            'Size not available',
                        cultivation_method: item.factory_submission?.batch?.Farm?.Cultivation_Method ||
                            item.factory_submission?.batch?.Cultivation_Method ||
                            'Traditional',
                        certifications: item.factory_submission?.batch?.Farm?.certifications ||
                            item.standard_criteria ||
                            'GAP',
                        harvest_date: item.factory_submission?.date || item.processing_date || ''
                    },
                    quality_data: {
                        moisture: item.moisture || '< 10%',
                        curcumin_content: item.curcuminoid_content || '> 3%',
                        certifications: item.standard_criteria ? [item.standard_criteria] : ['GMP', 'HACCP', 'Organic', 'FDA'],
                        lead_ppm: item.lead_ppm || 'N/A',
                        cadmium_ppm: item.cadmium_ppm || 'N/A',
                        arsenic_ppm: item.arsenic_ppm || 'N/A',
                        mercury_ppm: item.mercury_ppm || 'N/A',
                        total_plate_count: item.total_plate_count || 'N/A',
                        yeast_mold: item.yeast_mold || 'N/A'
                    }
                };

                console.log('✅ Final processed data:', processedData);
                console.log('📊 Batch info created:', processedData.batch_info);

                setProductData(processedData);
            } else {
                throw new Error('Product data not available');
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchProductData();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <PublicNavigation />
                <div className="container mx-auto px-6 py-12">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="h-64 bg-gray-200 rounded"></div>
                            <div className="space-y-4">
                                <div className="h-6 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !productData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <PublicNavigation />
                <div className="container mx-auto px-6 py-12">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                        <p className="text-gray-600 mb-8">{error || 'The product you are looking for does not exist or is not available.'}</p>
                        <Button onClick={() => router.push('/products-category')} className="bg-green-600 hover:bg-green-700">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNavigation />

            {/* Breadcrumb */}
            <div className="bg-green-700 text-white py-2">
                <div className="container mx-auto px-6">
                    <nav className="flex items-center text-sm">
                        <span
                            className="text-green-200 cursor-pointer hover:text-white transition-colors"
                            onClick={() => router.push('/home')}
                        >
                            Home Page
                        </span>
                        <span className="mx-2">{'>'}</span>
                        <span
                            className="text-green-200 cursor-pointer hover:text-white transition-colors"
                            onClick={() => router.push('/products-category')}
                        >Product</span>
                        <span className="mx-2">{'>'}</span>
                        <span>Trace Back</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Back Button and QR Code Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/products-category')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Products
                    </Button>
                    
                    <div className="flex gap-2">
                        <Button
                            onClick={generateQRCode}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Generate QR Code
                        </Button>
                        <Button
                            onClick={shareTrace}
                            variant="outline"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Trace
                        </Button>
                    </div>
                </div>

                {/* QR Code Modal */}
                {showQRCode && (
                    <div className="fixed inset-0 bg-transparent backdrop-blur-none flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-300">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Product Trace QR Code</h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    Scan this QR code to trace the journey of this specific product
                                </p>
                                
                                {qrCodeUrl && (
                                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="Product Trace QR Code"
                                            className="mx-auto w-48 h-48 border-2 border-gray-200 rounded-lg bg-white"
                                        />
                                    </div>
                                )}
                                
                                <div className="space-y-2 mb-6 text-left bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-700">Product:</span>
                                        <span className="text-xs text-gray-600">{getProductDisplayName(productData.final_product_type)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-700">Lot ID:</span>
                                        <span className="text-xs text-gray-600">{productData.batch_lot_number}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-700">Quantity:</span>
                                        <span className="text-xs text-gray-600">{productData.output_quantity} {productData.output_unit}</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button
                                        onClick={downloadQRCode}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download QR
                                    </Button>
                                    <Button
                                        onClick={() => setShowQRCode(false)}
                                        variant="outline"
                                        className="flex-1 text-sm"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Product Image and Basic Info */}
                    <div>
                        <Card>
                            <CardContent className="p-6">
                                <div className="aspect-square bg-gray-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden border-0">
                                    <img
                                        src={getProductImage(productData.final_product_type)}
                                        alt={productData.final_product_type}
                                        className="w-full h-full object-cover border-0 outline-0"
                                        style={{ border: 'none', outline: 'none' }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {getProductDisplayName(productData.final_product_type)}
                                    </h1>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{getProductDisplayName(productData.final_product_type)}</Badge>
                                        <Badge variant="secondary">{productData.product_grade || 'Standard Grade'}</Badge>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600">
                                        {/* แถวที่ 1: Lot ID และ Quantity */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                <span>Lot ID: {productData.batch_lot_number || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                <span>Quantity: {productData.output_quantity || 'N/A'} {productData.output_unit || ''}</span>
                                            </div>
                                        </div>

                                        {/* แถวที่ 2: Processed และ Processor */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>Processed: {productData.processing_date ? new Date(productData.processing_date).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Factory className="h-4 w-4" />
                                                <span>Processor: {productData.operator_processor || 'TurmeRic Factory'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certifications */}
                                    <div className="pt-4">
                                        <h3 className="font-medium text-gray-900 mb-2">Certifications</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {productData.standard_criteria ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                    {productData.standard_criteria}
                                                </Badge>
                                            ) : (
                                                <>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">GMP</Badge>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">HACCP</Badge>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">Organic</Badge>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">FDA</Badge>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Traceability Information */}
                    <div className="space-y-6">
                        {/* Farm Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Leaf className="h-5 w-5 text-green-600" />
                                    Farm Origin
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-900">Farmer Name:</span>
                                        <p className="text-gray-600">
                                            {productData.batch_info?.farmer_name || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Farm Name:</span>
                                        <p className="text-gray-600">
                                            {productData.batch_info?.farm_name || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Location:</span>
                                        <p className="text-gray-600 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {productData.batch_info?.farm_address || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Plant Variety:</span>
                                        <p className="text-gray-600">
                                            {productData.batch_info?.plant_variety || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Certifications:</span>
                                        <div className="mt-1">
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                               GAP {/* {productData.batch_info?.certifications || 'GAP'} */}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Cultivation Method:</span>
                                        <p className="text-gray-600">
                                            {productData.batch_info?.cultivation_method || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Farm Size:</span>
                                        <p className="text-gray-600">
                                            {productData.batch_info?.farm_size || ''}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quality Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Quality Assurance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Basic Quality Data */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {/* <div>
                                        <span className="font-medium text-gray-900">Test Type:</span>
                                        <p className="text-gray-600">
                                            {productData.factory_submission?.test_type || 'Curcuminoid'}
                                        </p>
                                    </div> */}
                                    <div>
                                        <span className="font-medium text-gray-900">Quality Grade:</span>
                                        <p className="text-gray-600">
                                            {productData.factory_submission?.quality_grade  || productData.product_grade || 'Grade A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Moisture Content:</span>
                                        <p className="text-gray-600">{productData.quality_data?.moisture || '< 10%'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900">Curcumin Content:</span>
                                        <p className="text-gray-600">{productData.quality_data?.curcumin_content || '> 3%'}</p>
                                    </div>
                                </div>

                                {/* Heavy Metals Analysis */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Heavy Metals Analysis (mg/kg)</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-900">Lead (Pb):</span>
                                            <p className="text-gray-600">{productData.quality_data?.lead_ppm || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Cadmium (Cd):</span>
                                            <p className="text-gray-600">{productData.quality_data?.cadmium_ppm || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Arsenic (As):</span>
                                            <p className="text-gray-600">{productData.quality_data?.arsenic_ppm || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Mercury (Hg):</span>
                                            <p className="text-gray-600">{productData.quality_data?.mercury_ppm || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Microbiological Analysis */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Microbiological Analysis (CFU/g)</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-900">Total Plate Count:</span>
                                            <p className="text-gray-600">{productData.quality_data?.total_plate_count || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Yeast & Mold:</span>
                                            <p className="text-gray-600">{productData.quality_data?.yeast_mold || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Processing Journey */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Factory className="h-5 w-5 text-orange-600" />
                                    Processing Journey
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Factory Information */}
                                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                                        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Factory Name</div>
                                            <div className="text-xs text-gray-600">
                                                {productData.factory_submission?.Factory_Name ||
                                                    productData.factory_submission?.factory?.Factory_Name ||
                                                    productData.factory_submission?.factory?.name ||
                                                    productData.factory_submission?.factory_name ||
                                                    ''}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Processing Date */}
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Processing Date</div>
                                            <div className="text-xs text-gray-600">
                                                {productData.processing_date ?
                                                    new Date(productData.processing_date).toLocaleDateString() :
                                                    'Not specified'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Production Method */}
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Production Method</div>
                                            <div className="text-xs text-gray-600">
                                                {productData.standard_criteria ?
                                                    `${productData.standard_criteria}-certified extraction` :
                                                    'Standard extraction method'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quality Checks */}
                                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Quality Checks</div>
                                            <div className="text-xs text-gray-600">
                                                {productData.certification_status || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default TraceProductPage;