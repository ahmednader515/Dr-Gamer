'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface VariationSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onConfirm: (selectedVariation: string) => void
  actionType: 'add' | 'buy'
}

export default function VariationSelectionDialog({
  isOpen,
  onClose,
  product,
  onConfirm,
  actionType,
}: VariationSelectionDialogProps) {
  const [selectedVariation, setSelectedVariation] = useState<string>('')
  
  const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0
  
  const handleConfirm = () => {
    if (!selectedVariation && hasVariations) {
      return
    }
    onConfirm(selectedVariation)
    onClose()
  }
  
  // Calculate selected price
  const selectedPrice = selectedVariation && hasVariations
    ? product.variations.find((v: any) => v.name === selectedVariation)?.price
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-left">
            {actionType === 'add' ? 'Select Options' : 'Select Options to Buy'}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-left">
            {product.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Price Display */}
          {hasVariations ? (
            <div>
              {selectedVariation && selectedPrice ? (
                <div>
                  <p className='text-sm text-gray-400 mb-1'>Selected option price:</p>
                  <div className='text-2xl font-bold text-purple-400'>
                    {Number(selectedPrice).toFixed(2)} EGP
                  </div>
                </div>
              ) : (
                <div>
                  <div className='text-xl font-bold text-white'>
                    {Number(product.price).toFixed(2)} - {Number(product.listPrice).toFixed(2)} EGP
                  </div>
                  <p className='text-sm text-gray-400 mt-1'>Price varies by option</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className='text-2xl font-bold text-purple-400'>
                {Number(product.price).toFixed(2)} EGP
              </div>
            </div>
          )}

          {/* Variation Selection */}
          {hasVariations && (
            <div className='border border-gray-700 rounded-lg p-4 bg-gray-800/50'>
              <h3 className='text-base font-semibold mb-3 text-left'>Select Your Option: *</h3>
              <div className='space-y-2'>
                {product.variations.map((variation: any) => (
                  <button
                    key={variation.name}
                    className={`w-full px-4 py-3 border rounded-lg text-sm transition-all text-left ${
                      selectedVariation === variation.name 
                        ? 'border-purple-500 bg-purple-500/20 text-white ring-2 ring-purple-500' 
                        : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedVariation(variation.name)}
                  >
                    <div className='flex justify-between items-center'>
                      <span className='font-medium'>{variation.name}</span>
                      <span className={`font-bold ${selectedVariation === variation.name ? 'text-purple-300' : 'text-purple-400'}`}>
                        {Number(variation.price).toFixed(2)} EGP
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              variant='outline'
              onClick={onClose}
              className='flex-1 border-gray-600 hover:bg-gray-800'
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={hasVariations && !selectedVariation}
              className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {actionType === 'add' ? 'Add to Cart' : 'Buy Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

