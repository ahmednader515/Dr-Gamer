'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { UploadButton } from '@/lib/uploadthing'
import { X } from 'lucide-react'

interface HowToUseSettingsProps {
  howToUseVideo: string | null
  onHowToUseVideoChange: (video: string | null) => void
}

export default function HowToUseSettings({ 
  howToUseVideo, 
  onHowToUseVideoChange 
}: HowToUseSettingsProps) {
  const handleVideoUpload = (url: string) => {
    onHowToUseVideoChange(url)
    toast({
      title: 'Video Uploaded',
      description: 'How to Use video has been uploaded successfully',
      variant: 'default'
    })
  }

  const handleRemoveVideo = () => {
    onHowToUseVideoChange(null)
    toast({
      title: 'Video Removed',
      description: 'How to Use video has been removed',
      variant: 'default'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>How to Use Video</CardTitle>
        <p className='text-sm text-muted-foreground'>
          Upload a video that will be shown when users click the "How to Use" button. This video will appear on all user-accessible pages.
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {howToUseVideo ? (
          <div className='space-y-4'>
            <div className='relative w-full max-w-2xl'>
              <video
                src={howToUseVideo}
                controls
                className='w-full rounded-lg border border-gray-700'
              >
                Your browser does not support the video tag.
              </video>
              <Button
                variant='destructive'
                size='sm'
                className='absolute top-2 right-2'
                onClick={handleRemoveVideo}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
            <p className='text-sm text-gray-400'>
              Current video is set. Users will see this video when they click the "How to Use" button.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            <Label>Upload Video</Label>
            <UploadButton
              endpoint='videoUploader'
              onClientUploadComplete={(res) => {
                if (res && res[0]) {
                  handleVideoUpload(res[0].url)
                }
              }}
              onUploadError={(error: Error) => {
                toast({
                  title: 'Upload Error',
                  description: `Failed to upload video: ${error.message}`,
                  variant: 'destructive'
                })
              }}
              appearance={{
                button: 'ut-ready:bg-purple-500 ut-ready:bg-opacity-20 ut-uploading:cursor-not-allowed ut-uploading:bg-gray-500 ut-uploading:bg-opacity-20 bg-gray-800 text-white border border-gray-700 cursor-pointer rounded-lg px-4 py-2 text-sm',
                container: 'w-full',
                allowedContent: 'text-gray-400 text-xs mt-2',
              }}
            />
            <p className='text-sm text-gray-400'>
              Upload a video file (max 100MB). This video will be displayed on the "How to Use" page.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

