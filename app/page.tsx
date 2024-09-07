'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Upload, Download, Lock, Unlock, Copy, RefreshCw } from "lucide-react"
import quantize from 'quantize'
import namer from 'color-namer'

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [palette, setPalette] = useState<Array<{ color: string; locked: boolean }>>([])
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pixelArray, setPixelArray] = useState<number[][]>([])
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        setImageUrl(dataUrl)
        extractColors(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const extractColors = async (imageUrl: string) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, img.width, img.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      const pixelCount = img.width * img.height
      const newPixelArray = []

      for (let i = 0; i < pixelCount; i++) {
        const offset = i * 4
        const r = pixels[offset]
        const g = pixels[offset + 1]
        const b = pixels[offset + 2]
        const a = pixels[offset + 3]

        if (a === 0) continue
        newPixelArray.push([r, g, b])
      }

      setPixelArray(newPixelArray)
      generatePalette(newPixelArray)
    }
  }

  const generatePalette = (pixels: number[][]) => {
    const lockedColors = palette.filter(c => c.locked).map(c => c.color)
    const colorMap = quantize(pixels, colorCount - lockedColors.length)
    const newPalette = colorMap.palette().map(color => rgbToHex(color[0], color[1], color[2]))
    
    const updatedPalette = [
      ...palette.filter(c => c.locked),
      ...newPalette.map(color => ({ color, locked: false }))
    ].slice(0, colorCount)

    setPalette(updatedPalette)
  }

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const downloadPalette = () => {
    const paletteText = palette.map(c => c.color).join('\n')
    const blob = new Blob([paletteText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'color-palette.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const toggleLock = (index: number) => {
    const newPalette = [...palette]
    newPalette[index].locked = !newPalette[index].locked
    setPalette(newPalette)
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen p-8 bg-background text-foreground">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Color Palette Extractor</h1>
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>
          
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button variant="outline" onClick={triggerFileInput} className="mb-4">
                  <Upload className="mr-2 h-4 w-4" /> Upload Image
                </Button>
                {imageUrl && (
                  <div className="w-full max-w-[1024px] aspect-square relative overflow-hidden rounded-lg">
                    <img 
                      src={imageUrl} 
                      alt="Uploaded image" 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {palette.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Extracted Palette</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Colors: {colorCount}</span>
                      <Slider
                        value={[colorCount]}
                        onValueChange={(value) => setColorCount(value[0])}
                        min={2}
                        max={10}
                        step={1}
                        className={`w-32 ${
                          theme === 'dark'
                            ? '[&_[role=slider]]:bg-gray-200 [&_[role=slider]]:border-gray-300'
                            : '[&_[role=slider]]:bg-gray-800 [&_[role=slider]]:border-gray-700'
                        }`}
                      />
                    </div>
                    <Button 
                      onClick={() => generatePalette(pixelArray)} 
                      size="sm"
                      className={`
                        ${theme === 'dark' 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        } 
                        transition-colors duration-200
                      `}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Generate
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {palette.map(({ color, locked }, index) => {
                    const colorName = namer(color).ntc[0].name;
                    return (
                      <div key={index} className="relative group">
                        <div
                          className={`h-32 rounded-lg shadow-md transition-all duration-300 ease-in-out ${
                            locked ? 'ring-2 ring-yellow-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black bg-opacity-50 text-white rounded-b-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{color}</span>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white hover:text-yellow-400 transition-colors"
                                onClick={() => toggleLock(index)}
                              >
                                {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white hover:text-blue-400 transition-colors"
                                onClick={() => copyToClipboard(color)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <span className="text-xs">{colorName}</span>
                        </div>
                        {copiedColor === color && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg animate-fade-in">
                            <span className="text-white font-medium">Copied!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 text-center">
                  <Button 
                    onClick={downloadPalette}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Palette
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </TooltipProvider>
  )
}