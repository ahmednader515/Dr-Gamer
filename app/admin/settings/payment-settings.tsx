'use client'

import React from 'react'
import { Plus, Trash2, CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaymentMethod } from '@/types'
import { cn } from '@/lib/utils'

interface PaymentSettingsProps {
  paymentMethods: PaymentMethod[]
  defaultPaymentMethod: string
  onPaymentMethodsChange: (methods: PaymentMethod[]) => void
  onDefaultPaymentMethodChange: (methodName: string) => void
}

export default function PaymentSettings({
  paymentMethods,
  defaultPaymentMethod,
  onPaymentMethodsChange,
  onDefaultPaymentMethodChange,
}: PaymentSettingsProps) {
  const methodTypeOptions = [
    { value: 'wallet', label: 'Wallet / Mobile Money' },
    { value: 'instapay', label: 'Instant Pay (username + link)' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'link', label: 'Payment Link Only' },
    { value: 'other', label: 'Other / Custom' },
  ] as const

  const handleAddPaymentMethod = () => {
    const baseName = 'New Payment Method'
    let counter = paymentMethods.length + 1
    let candidate = `${baseName} ${counter}`

    const existingNames = new Set(paymentMethods.map((method) => method.name))
    while (existingNames.has(candidate)) {
      counter += 1
      candidate = `${baseName} ${counter}`
    }

    onPaymentMethodsChange([
      ...paymentMethods,
      {
        name: candidate,
        commission: 0,
        type: 'wallet',
        label: `${candidate} Reference`,
        number: '',
        icon: '',
        userName: '',
        link: '',
        linkLabel: '',
        accountHolder: '',
        iban: '',
        swift: '',
        notes: '',
      },
    ])
  }

  const handleRemovePaymentMethod = (index: number) => {
    if (paymentMethods.length <= 1) return

    const updatedMethods = paymentMethods.filter((_, i) => i !== index)
    const removedMethod = paymentMethods[index]

    onPaymentMethodsChange(updatedMethods)

    if (removedMethod.name === defaultPaymentMethod) {
      onDefaultPaymentMethodChange(updatedMethods[0]?.name ?? '')
    }
  }

  const handlePaymentMethodChange = (
    index: number,
    field: keyof PaymentMethod,
    value: string,
  ) => {
    const updatedMethods = [...paymentMethods]
    const previousName = updatedMethods[index].name

    if (field === 'commission') {
      const numericValue = value === '' ? 0 : Number(value)
      updatedMethods[index] = {
        ...updatedMethods[index],
        commission: Number.isFinite(numericValue) ? numericValue : 0,
      }
    } else {
      updatedMethods[index] = {
        ...updatedMethods[index],
        [field]: value,
      }

      if (
        field === 'name' &&
        previousName === defaultPaymentMethod &&
        value.trim()
      ) {
        onDefaultPaymentMethodChange(value)
      }
    }

    onPaymentMethodsChange(updatedMethods)
  }

  const resolvedDefaultMethod =
    paymentMethods.find((method) => method.name === defaultPaymentMethod)
      ?.name ?? paymentMethods[0]?.name ?? ''

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CreditCard className="h-5 w-5" />
          Checkout Payment Methods
        </CardTitle>
        <CardDescription>
          Control which payment options are shown during checkout, configure
          provider fees, and choose the default option customers see first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              The selected default payment method appears pre-selected at
              checkout. Keep at least one method enabled.
            </p>
          </div>
          <Button type="button" size="sm" onClick={handleAddPaymentMethod}>
            <Plus className="h-4 w-4" />
            <span className="ml-2">Add Payment Method</span>
          </Button>
        </div>

        <RadioGroup
          value={resolvedDefaultMethod}
          onValueChange={onDefaultPaymentMethodChange}
          className="space-y-4"
        >
          {paymentMethods.map((method, index) => {
            const radioValue = method.name || `method-${index}`
            const isOnlyMethod = paymentMethods.length === 1
            const methodType = (method.type as PaymentMethod['type']) ?? 'wallet'

            const renderInput = (
              field: keyof PaymentMethod,
              label: string,
              placeholder: string,
            ) => (
              <div className="space-y-2">
                <Label htmlFor={`payment-${field}-${index}`}>{label}</Label>
                <Input
                  id={`payment-${field}-${index}`}
                  value={(method[field] as string | undefined) ?? ''}
                  onChange={(event) =>
                    handlePaymentMethodChange(
                      index,
                      field,
                      event.target.value,
                    )
                  }
                  placeholder={placeholder}
                />
              </div>
            )

            const renderNotes = (placeholder: string) => (
              <div>
                <Label htmlFor={`payment-notes-${index}`}>Customer Notes</Label>
                <Textarea
                  id={`payment-notes-${index}`}
                  value={method.notes ?? ''}
                  onChange={(event) =>
                    handlePaymentMethodChange(index, 'notes', event.target.value)
                  }
                  placeholder={placeholder}
                  rows={3}
                />
              </div>
            )

            const renderTypeSpecificFields = () => {
              switch (methodType) {
                case 'wallet':
                  return (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput(
                          'label',
                          'Display Label',
                          'e.g. Vodafone Cash Number',
                        )}
                        {renderInput(
                          'number',
                          'Wallet Number / Handle',
                          'e.g. 0127 791 0038',
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput('icon', 'Icon (emoji or text)', 'e.g. 📱')}
                        {renderInput(
                          'userName',
                          'Username (optional)',
                          'e.g. @wallet-handle',
                        )}
                      </div>
                      {renderNotes(
                        'Optional instructions shown to customers (e.g. upload screenshot after transfer).',
                      )}
                    </div>
                  )
                case 'instapay':
                  return (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput(
                          'label',
                          'Display Label',
                          'e.g. InstaPay Username',
                        )}
                        {renderInput(
                          'number',
                          'InstaPay Handle',
                          'e.g. mina.shk',
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput(
                          'userName',
                          'Username (displayed)',
                          'e.g. mina.shk@instapay',
                        )}
                        {renderInput('icon', 'Icon (emoji or text)', 'e.g. 💳')}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput('link', 'Payment Link', 'https://')}
                        {renderInput(
                          'linkLabel',
                          'Link Button Label',
                          'e.g. Send via InstaPay',
                        )}
                      </div>
                      {renderNotes('Optional instructions shown to customers.')}
                    </div>
                  )
                case 'bank':
                  return (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput(
                          'label',
                          'Display Label',
                          'e.g. Bank Account Number',
                        )}
                        {renderInput(
                          'number',
                          'Account Number',
                          'e.g. 5110333000001242',
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput(
                          'accountHolder',
                          'Account Holder',
                          'e.g. Mina Samir Hakim',
                        )}
                        {renderInput('icon', 'Icon (emoji or text)', 'e.g. 🏦')}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput('iban', 'IBAN', 'e.g. EG0600 0205 1105...')}
                        {renderInput(
                          'swift',
                          'Swift Code',
                          'e.g. BMISEGCXXXX',
                        )}
                      </div>
                      {renderNotes('Optional instructions for bank transfers.')}
                    </div>
                  )
                case 'link':
                  return (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput(
                          'label',
                          'Display Label',
                          'e.g. Pay Online',
                        )}
                        {renderInput('icon', 'Icon (emoji or text)', 'e.g. 🔗')}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput('link', 'Payment Link', 'https://')}
                        {renderInput(
                          'linkLabel',
                          'Link Button Label',
                          'e.g. Pay Now',
                        )}
                      </div>
                      {renderNotes('Optional instructions for link payments.')}
                    </div>
                  )
                case 'other':
                default:
                  return (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput('label', 'Display Label', 'e.g. Payment')}
                        {renderInput(
                          'number',
                          'Reference / Number',
                          'e.g. Custom reference',
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput('icon', 'Icon (emoji or text)', 'e.g. 💰')}
                        {renderInput(
                          'link',
                          'Payment Link (optional)',
                          'https://',
                        )}
                      </div>
                      {renderNotes('Optional instructions shown to customers.')}
                    </div>
                  )
              }
            }

            return (
              <div
                key={`payment-method-${index}`}
                className="rounded-lg border border-border bg-background/60 p-4 shadow-sm transition hover:border-primary/60"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 gap-3">
                    <RadioGroupItem
                      id={`payment-method-${index}`}
                      value={radioValue}
                      className="mt-2"
                      aria-label={`Set ${method.name || 'payment method'} as default`}
                      disabled={!method.name}
                    />

                    <div className="flex-1 space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput('name', 'Method Name', 'e.g. Vodafone Cash')}
                        <div className="space-y-2">
                          <Label htmlFor={`payment-commission-${index}`}>
                            Commission (%)
                          </Label>
                          <Input
                            id={`payment-commission-${index}`}
                            type="number"
                            min="0"
                            step="0.1"
                            value={method.commission}
                            onChange={(event) =>
                              handlePaymentMethodChange(
                                index,
                                'commission',
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`payment-type-${index}`}>
                          Payment Method Type
                        </Label>
                        <Select
                          value={methodType}
                          onValueChange={(value) =>
                            handlePaymentMethodChange(index, 'type', value)
                          }
                        >
                          <SelectTrigger id={`payment-type-${index}`}>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent>
                            {methodTypeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {renderTypeSpecificFields()}
                    </div>
                  </div>

                  <div className={cn('flex items-center justify-end')}>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(index)}
                      disabled={isOnlyMethod}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-2">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

