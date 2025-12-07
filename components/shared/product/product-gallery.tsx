'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Zoom from 'react-medium-image-zoom'
import Script from 'next/script'
import 'react-medium-image-zoom/dist/styles.css'
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/utils'

type MediaItem = {
  type: 'image' | 'video'
  url: string
}

export default function ProductGallery({ 
  images, 
  videos = [] 
}: { 
  images: string[]
  videos?: string[]
}) {
  // Combine images and videos into a single array
  const mediaItems: MediaItem[] = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url }))
  ]

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [youtubeApiReady, setYoutubeApiReady] = useState(false)
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const selectedMedia = mediaItems[selectedIndex]

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if API is already loaded
      if ((window as any).YT && (window as any).YT.Player) {
        setYoutubeApiReady(true)
      } else {
        // Set up callback for when API loads
        (window as any).onYouTubeIframeAPIReady = () => {
          setYoutubeApiReady(true)
        }
      }
    }
  }, [])

  // Initialize YouTube player when video is selected and API is ready
  useEffect(() => {
    if (selectedMedia?.type === 'video' && youtubeApiReady && playerContainerRef.current) {
      const videoId = extractYouTubeVideoId(selectedMedia.url)
      if (!videoId) return

      // Destroy existing player if switching videos
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (error) {
          // Ignore cleanup errors
        }
        playerRef.current = null
      }

      // Create unique container ID
      const containerId = `youtube-player-${videoId}-${Date.now()}`
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = `<div id="${containerId}"></div>`
      }

      try {
        playerRef.current = new (window as any).YT.Player(containerId, {
          videoId: videoId,
          playerVars: {
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              // Set volume to 80%
              event.target.setVolume(80)
            },
          },
        })
      } catch (error) {
        console.error('Error initializing YouTube player:', error)
      }
    }

    // Cleanup player when switching videos or unmounting
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (error) {
          // Ignore cleanup errors
        }
        playerRef.current = null
      }
    }
  }, [selectedMedia, youtubeApiReady])

  return (
    <div className='flex gap-2'>
      <div className='flex flex-col gap-2 mt-8'>
        {mediaItems.map((item, index) => {
          const isSelected = selectedIndex === index
          
          if (item.type === 'video') {
            const videoId = extractYouTubeVideoId(item.url)
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
            
            return (
              <button
                key={`video-${index}`}
                onClick={() => {
                  setSelectedIndex(index)
                }}
                onMouseOver={() => {
                  setSelectedIndex(index)
                }}
                className={`bg-gray-900 rounded-lg overflow-hidden relative ${
                  isSelected
                    ? 'ring-2 ring-blue-500'
                    : 'ring-1 ring-gray-300'
                }`}
              >
                {thumbnailUrl ? (
                  <div className='relative w-12 h-12'>
                    <Image 
                      src={thumbnailUrl} 
                      alt={'video thumbnail'} 
                      width={48} 
                      height={48}
                      className='object-cover'
                    />
                    <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30'>
                      <div className='w-4 h-4 rounded-full bg-red-600 flex items-center justify-center'>
                        <svg className='w-2.5 h-2.5 text-white ml-0.5' fill='currentColor' viewBox='0 0 24 24'>
                          <path d='M8 5v14l11-7z' />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">VID</span>
                  </div>
                )}
              </button>
            )
          }
          
          return (
            <button
              key={`image-${index}`}
              onClick={() => {
                setSelectedIndex(index)
              }}
              onMouseOver={() => {
                setSelectedIndex(index)
              }}
              className={`bg-gray-900 rounded-lg overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-blue-500'
                  : 'ring-1 ring-gray-300'
              }`}
            >
              {item.url ? (
                <Image src={item.url} alt={'product image'} width={48} height={48} />
              ) : (
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">IMG</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className='w-full'>
        {/* YouTube IFrame API Script */}
        {typeof window !== 'undefined' && !(window as any).YT && (
          <Script
            src="https://www.youtube.com/iframe_api"
            strategy="lazyOnload"
          />
        )}
        
        {selectedMedia?.type === 'video' ? (
          <div className='relative h-[500px] w-full'>
            {(() => {
              const videoId = extractYouTubeVideoId(selectedMedia.url)
              if (!videoId) {
                return (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Invalid video URL</span>
                  </div>
                )
              }
              return (
                <div 
                  ref={playerContainerRef}
                  className='w-full h-full rounded-lg'
                  style={{ border: 'none' }}
                />
              )
            })()}
          </div>
        ) : (
          <Zoom>
            <div className='relative h-[500px]'>
              {selectedMedia?.url ? (
                <Image
                  src={selectedMedia.url}
                  alt={'product image'}
                  fill
                  sizes='90vw'
                  className='object-contain'
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">لا توجد صورة</span>
                </div>
              )}
            </div>
          </Zoom>
        )}
      </div>
    </div>
  )
}
