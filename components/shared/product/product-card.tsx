"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IProductInput } from "@/types";
import Rating from "./rating";
import { formatNumber, generateId, round2 } from "@/lib/utils";
import ProductPrice from "./product-price";
import ImageHover from "./image-hover";
import { Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useCartStore from "@/hooks/use-cart-store";
import { useLoading } from "@/hooks/use-loading";
import { LoadingSpinner } from "@/components/shared/loading-overlay";

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
}: {
  product: IProductInput & { id: string };
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
}) => {
  // Helper function to get product type label
  const getProductTypeLabel = (productType: string = 'game_code') => {
    const typeMap: { [key: string]: string } = {
      'game_code': 'كود اللعبة',
      'game_account': 'حساب اللعبة',
      'subscription': 'اشتراك',
    };
    return typeMap[productType] || 'كود اللعبة';
  };

  const getProductTypeColor = (productType: string = 'game_code') => {
    const colorMap: { [key: string]: string } = {
      'game_code': 'bg-blue-600',
      'game_account': 'bg-purple-600',
      'subscription': 'bg-purple-600',
    };
    return colorMap[productType] || 'bg-blue-600';
  };

  const ProductImage = () => (
    <div className="relative group">
      <Link href={`/product/${product.slug}`}>
        <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-gray-800">
          {/* Product Type Banner */}
          <div className={`absolute top-2 right-2 ${getProductTypeColor(product.productType || 'game_code')} text-white text-center py-0.5 px-2 z-10 text-[10px] sm:text-xs font-semibold rounded`}>
            {getProductTypeLabel(product.productType || 'game_code')}
          </div>
          
          {product.images && product.images.length > 0 && product.images[0] ? (
            product.images.length > 1 ? (
              <ImageHover
                src={product.images[0]}
                hoverSrc={product.images[1]}
                alt={product.name}
              />
            ) : (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-500 text-sm">لا توجد صورة</span>
            </div>
          )}
          
          {/* Quick action buttons overlay */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button className="p-1.5 sm:p-2 bg-gray-800/90 hover:bg-gray-800 rounded-full shadow-md transition-all duration-200 hover:scale-110">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
            </button>
          </div>
          
          {/* Stock status badge */}
          {product.countInStock <= 10 && product.countInStock > 0 && (
            <Badge variant="destructive" className="absolute top-2 sm:top-3 right-2 sm:right-3 text-xs">
              آخر {product.countInStock} قطع
            </Badge>
          )}
          {product.countInStock === 0 && (
             <Badge variant="secondary" className="absolute top-2 sm:top-3 right-2 sm:right-3 text-xs bg-gray-800">
              نفذت الكمية
            </Badge>
          )}
        </div>
      </Link>
    </div>
  );

  const ProductDetails = () => (
    <div className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-800/50" dir="rtl">
      {/* Product Name */}
      <Link
        href={`/product/${product.slug}`}
        className="block group"
      >
        <h3 
           className="font-semibold text-gray-100 text-right leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors duration-200 text-sm sm:text-base"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {product.name}
        </h3>
      </Link>

      {/* Rating and Reviews - Clean Number Design */}
      <div className="flex flex-col items-start gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs text-gray-500">التقييم:</span>
          <div className="bg-yellow-100 text-yellow-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
            {product.avgRating && !isNaN(product.avgRating) ? product.avgRating.toFixed(1) : '0.0'}
          </div>
        </div>
        <span className="text-xs text-gray-500 text-left">
          ({product.numReviews && !isNaN(product.numReviews) ? formatNumber(product.numReviews) : '0'} تقييم)
        </span>
      </div>

      {/* Price */}
      <div className="text-left">
        <ProductPrice
          price={product.price}
          originalPrice={product.listPrice}
          className="items-start"
        />
      </div>
    </div>
  );

  const AddButton = () => {
    const { addItem } = useCartStore();
    const { toast } = useToast();
    const { isLoading: isAddingToCart, withLoading } = useLoading();

    const handleAddToCart = async () => {
      await withLoading(
        async () => {
          await addItem({
            product: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            image: product.images[0],
            price: Number(product.price),
            countInStock: product.countInStock,
            color: product.colors[0] || '',
            size: product.sizes[0] || '',
            quantity: 1,
            // product type & game account fields
            productType: (product as any).productType || 'game_code',
            isAddToOwnAccount: false,
            accountUsername: undefined,
            accountPassword: undefined,
            clientId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }, 1);

          toast({
            title: 'تمت الإضافة إلى السلة',
            description: `تم إضافة ${product.name} إلى سلة التسوق الخاصة بك`,
            variant: 'default',
          });
        }
      );
    };

    return (
      <div className="p-3 sm:p-4 pt-0">
         <button 
           onClick={handleAddToCart}
           disabled={isAddingToCart}
           className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
         >
          {isAddingToCart ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              إضافة للسلة
            </>
          )}
        </button>
      </div>
    );
  };

  if (hideBorder) {
    return (
      <div className="flex flex-col h-full bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden group border-2 border-gray-700 hover:border-purple-500 hover:scale-[1.03] m-1" dir="rtl">
        <ProductImage />
        {!hideDetails && (
          <>
            <ProductDetails />
            {!hideAddToCart && <AddButton />}
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden group border-2 border-gray-700 hover:border-purple-500 hover:scale-[1.03] m-1" dir="rtl">
      <ProductImage />
      {!hideDetails && (
        <>
          <ProductDetails />
          {!hideAddToCart && <AddButton />}
        </>
      )}
    </Card>
  );
};

export default ProductCard;
