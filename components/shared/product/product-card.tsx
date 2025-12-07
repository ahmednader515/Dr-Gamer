"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IProductInput } from "@/types";
import Rating from "./rating";
import { formatNumber, generateId, getVariationPricing, isVariationSaleActive, round2 } from "@/lib/utils";
import ProductPrice from "./product-price";
import ImageHover from "./image-hover";
import { Eye, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useCartStore from "@/hooks/use-cart-store";
import { useLoading } from "@/hooks/use-loading";
import { LoadingSpinner } from "@/components/shared/loading-overlay";
import { useFavorites } from "@/hooks/use-favorites";
import { useRouter } from "next/navigation";
import VariationSelectionDialog from "./variation-selection-dialog";

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
  const { toggleFavorite, isFavorited: checkIsFavorited } = useFavorites();
  const [isFavorited, setIsFavorited] = React.useState(() => checkIsFavorited(product.id));
  const router = useRouter();

  // Update favorite state when localStorage changes
  React.useEffect(() => {
    setIsFavorited(checkIsFavorited(product.id));
    
    const handleUpdate = () => {
      setIsFavorited(checkIsFavorited(product.id));
    };
    
    window.addEventListener('favorites-updated', handleUpdate);
    return () => window.removeEventListener('favorites-updated', handleUpdate);
  }, [product.id, checkIsFavorited]);
  

  const ProductImage = () => {
    // Check if product has variations with discounts
    const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0;
    let maxDiscountPercentage = 0;

    if (hasVariations) {
      const variationsWithDiscount = product.variations.filter((v: any) =>
        isVariationSaleActive(v)
      );

      if (variationsWithDiscount.length > 0) {
        // Calculate max discount percentage
        maxDiscountPercentage = Math.max(
          ...variationsWithDiscount.map((v: any) => {
            const { currentPrice, originalPrice } = getVariationPricing(v);
            if (!originalPrice || originalPrice <= currentPrice) return 0;
            return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
          })
        );
      }
    }

    return (
      <div className="relative group">
        <Link href={`/product/${product.slug}`}>
          <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden" style={{ backgroundColor: '#351564' }}>
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
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#351564' }}>
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            
            {/* Quick action buttons overlay */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/product/${product.slug}`);
                }}
                className="p-1.5 sm:p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110" 
                style={{ backgroundColor: 'rgba(53, 21, 100, 0.9)' }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(53, 21, 100, 1)'} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(53, 21, 100, 0.9)'}
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className={`p-1.5 sm:p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110 ${isFavorited ? 'text-red-500' : 'text-purple-400'}`}
                style={{ backgroundColor: 'rgba(53, 21, 100, 0.9)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(53, 21, 100, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(53, 21, 100, 0.9)'}
              >
                <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            {/* Discount badge - Top left corner */}
            {maxDiscountPercentage > 0 && (
              <Badge variant="destructive" className="absolute top-2 sm:top-3 right-2 sm:right-3 text-xs font-bold z-10">
                -{maxDiscountPercentage}% OFF
              </Badge>
            )}
            
            {/* Stock status badge - Below discount badge if both exist */}
            {product.countInStock <= 10 && product.countInStock > 0 && (
              <Badge variant="destructive" className={`absolute ${maxDiscountPercentage > 0 ? 'top-10 sm:top-12' : 'top-2 sm:top-3'} right-2 sm:right-3 text-xs`}>
                Only {product.countInStock} left
              </Badge>
            )}
            {product.countInStock === 0 && (
               <Badge variant="secondary" className={`absolute ${maxDiscountPercentage > 0 ? 'top-10 sm:top-12' : 'top-2 sm:top-3'} right-2 sm:right-3 text-xs`} style={{ backgroundColor: '#351564' }}>
                Out of Stock
              </Badge>
            )}
          </div>
        </Link>
      </div>
    );
  };

  const ProductDetails = () => {
    // Check if product has variations with discounts
    const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0;
    const pricingDetails = hasVariations
      ? product.variations.map((variation: any) => ({
          variation,
          pricing: getVariationPricing(variation),
        }))
      : [];
    const currentPrices = pricingDetails.length
      ? pricingDetails.map((entry) => entry.pricing.currentPrice || 0)
      : [];
    const minCurrentPrice = currentPrices.length ? Math.min(...currentPrices) : Number(product.price);
    const maxCurrentPrice = currentPrices.length ? Math.max(...currentPrices) : Number(product.listPrice);

    let lowestDiscountedPrice = minCurrentPrice;
    let highestOriginalPrice = maxCurrentPrice;
    let maxDiscountPercentage = 0;
    let hasAnyDiscount = false;

    if (hasVariations) {
      const variationsWithDiscount = pricingDetails.filter(
        (entry) => entry.pricing.saleActive
      );

      if (variationsWithDiscount.length > 0) {
        hasAnyDiscount = true;
        // Get lowest discounted price
        lowestDiscountedPrice = Math.min(
          ...variationsWithDiscount.map((entry) => entry.pricing.currentPrice)
        );
        // Get highest original price
        highestOriginalPrice = Math.max(
          ...variationsWithDiscount.map((entry) => entry.pricing.originalPrice)
        );
        // Calculate max discount percentage
        maxDiscountPercentage = Math.max(
          ...variationsWithDiscount.map((entry) => {
            const { currentPrice, originalPrice } = entry.pricing;
            if (!originalPrice || originalPrice <= currentPrice) return 0;
            return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
          })
        );
      } else if (pricingDetails.length > 0) {
        lowestDiscountedPrice = Math.min(...currentPrices);
        highestOriginalPrice = Math.max(...currentPrices);
      }
    }

    return (
      <div className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-4" style={{ backgroundColor: 'rgba(45, 26, 95, 0.5)' }} dir="ltr">
        {/* Product Name */}
        <Link
          href={`/product/${product.slug}`}
          className="block group"
        >
          <h3 
             className="font-semibold text-gray-100 text-left leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors duration-200 text-sm sm:text-base"
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
            <span className="text-xs text-gray-500">Rating:</span>
            <div className="bg-yellow-100 text-yellow-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
              {product.avgRating && !isNaN(product.avgRating) ? product.avgRating.toFixed(1) : '0.0'}
            </div>
          </div>
          <span className="text-xs text-gray-500 text-left">
            ({product.numReviews && !isNaN(product.numReviews) ? formatNumber(product.numReviews) : '0'} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="text-left">
          {hasAnyDiscount ? (
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {lowestDiscountedPrice.toFixed(2)} EGP
                </span>
                <Badge variant="destructive" className="text-xs">
                  -{maxDiscountPercentage}%
                </Badge>
              </div>
              <span className="text-sm text-gray-400 line-through">
                {highestOriginalPrice.toFixed(2)} EGP
              </span>
            </div>
          ) : (
            <ProductPrice
              price={minCurrentPrice}
              originalPrice={maxCurrentPrice}
              className="items-start"
              isRange={true}
            />
          )}
        </div>
      </div>
    );
  };

  const AddButton = () => {
    const { addItem } = useCartStore();
    const { toast } = useToast();
    const { isLoading: isAddingToCart, withLoading } = useLoading();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogActionType, setDialogActionType] = useState<'add' | 'buy'>('add');
    
    // Check if product has variations
    const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0;

    const addToCartWithVariation = async (selectedVariation: string) => {
      // Calculate the price based on selected variation
      const selectedPrice = selectedVariation && hasVariations
        ? (() => {
            const variation = product.variations.find((v: any) => v.name === selectedVariation);
            if (!variation) return Number(product.price);
            const pricing = getVariationPricing(variation);
            return pricing.currentPrice || Number(product.price);
          })()
        : Number(product.price);

      await withLoading(
        async () => {
          await addItem({
            product: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            categoryId: (product as any).categoryId ?? null,
            image: product.images[0],
            price: selectedPrice,
            countInStock: product.countInStock,
            color: product.colors?.[0] || '',
            size: product.sizes?.[0] || '',
            quantity: 1,
            // product type & game account fields
            productType: (product as any).productType || 'game_code',
            platformType: (product as any).platformType,
            productCategory: (product as any).productCategory,
            selectedVariation: selectedVariation || undefined,
            isAddToOwnAccount: false,
            accountUsername: undefined,
            accountPassword: undefined,
            accountBackupCode: undefined,
            disableTwoStepVerified: false,
            clientId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }, 1);

          toast({
            title: 'Added to Cart',
            description: `${product.name} has been added to your cart`,
            variant: 'default',
          });
        }
      );
    };

    const buyNowWithVariation = async (selectedVariation: string) => {
      // Calculate the price based on selected variation
        const selectedPrice = selectedVariation && hasVariations
          ? (() => {
              const variation = product.variations.find((v: any) => v.name === selectedVariation);
              if (!variation) return Number(product.price);
              const pricing = getVariationPricing(variation);
              return pricing.currentPrice || Number(product.price);
            })()
          : Number(product.price);

      await withLoading(
        async () => {
          await addItem({
            product: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            categoryId: (product as any).categoryId ?? null,
            image: product.images[0],
            price: selectedPrice,
            countInStock: product.countInStock,
            color: product.colors?.[0] || '',
            size: product.sizes?.[0] || '',
            quantity: 1,
            // product type & game account fields
            productType: (product as any).productType || 'game_code',
            platformType: (product as any).platformType,
            productCategory: (product as any).productCategory,
            selectedVariation: selectedVariation || undefined,
            isAddToOwnAccount: false,
            accountUsername: undefined,
            accountPassword: undefined,
            accountBackupCode: undefined,
            disableTwoStepVerified: false,
            clientId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }, 1);

          toast({
            title: 'Added to Cart',
            description: `Redirecting to checkout...`,
            variant: 'default',
          });

          // Navigate to checkout (will redirect to sign-in if not logged in)
          router.push('/checkout');
        }
      );
    };

    const handleAddToCart = () => {
      if (hasVariations) {
        setDialogActionType('add');
        setIsDialogOpen(true);
      } else {
        addToCartWithVariation('');
      }
    };

    const handleBuyNow = () => {
      if (hasVariations) {
        setDialogActionType('buy');
        setIsDialogOpen(true);
      } else {
        buyNowWithVariation('');
      }
    };

    const handleDialogConfirm = (selectedVariation: string) => {
      if (dialogActionType === 'add') {
        addToCartWithVariation(selectedVariation);
      } else {
        buyNowWithVariation(selectedVariation);
      }
    };

    return (
      <div className="p-3 sm:p-4 pt-0 space-y-2">
        {/* Mobile: Favorites button above Add to Cart */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="md:hidden w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
          {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
        </button>

        {/* Buy Now Button */}
        <button 
          onClick={handleBuyNow}
          disabled={isAddingToCart || product.countInStock === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {isAddingToCart ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Buy Now
            </>
          )}
        </button>

        {/* Add to Cart Button */}
        <button 
          onClick={handleAddToCart}
          disabled={isAddingToCart || product.countInStock === 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {isAddingToCart ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              Add to Cart
            </>
          )}
        </button>
        
        {/* Variation Selection Dialog */}
        <VariationSelectionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          product={product}
          onConfirm={handleDialogConfirm}
          actionType={dialogActionType}
        />
      </div>
    );
  };

  if (hideBorder) {
    return (
      <div className="flex flex-col h-full rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden group border-2 hover:border-purple-500 hover:scale-[1.03] m-1" style={{ backgroundColor: '#2d1a5f', borderColor: '#4618ac' }} dir="ltr">
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
    <Card className="flex flex-col h-full rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden group border-2 hover:border-purple-500 hover:scale-[1.03] m-1" style={{ backgroundColor: '#2d1a5f', borderColor: '#4618ac' }} dir="ltr">
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
