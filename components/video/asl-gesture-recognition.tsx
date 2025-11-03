"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Hand, Eye, Brain, Zap } from "lucide-react"

interface ASLGestureRecognitionProps {
  videoStream?: MediaStream
  tenantId: string
  roomId?: string
  onGestureDetected?: (gesture: DetectedGesture) => void
}

interface DetectedGesture {
  gesture: string
  confidence: number
  timestamp: Date
  landmarks?: Array<{ x: number; y: number; z: number }>
}

interface GestureStats {
  totalGestures: number
  averageConfidence: number
  mostCommonGesture: string
  sessionDuration: number
}

export function ASLGestureRecognition({
  videoStream,
  tenantId,
  roomId,
  onGestureDetected,
}: ASLGestureRecognitionProps) {
  const [isActive, setIsActive] = useState(false)
  const [detectedGestures, setDetectedGestures] = useState<DetectedGesture[]>([])
  const [currentGesture, setCurrentGesture] = useState<DetectedGesture | null>(null)
  const [gestureStats, setGestureStats] = useState<GestureStats>({
    totalGestures: 0,
    averageConfidence: 0,
    mostCommonGesture: "",
    sessionDuration: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationFrameRef = useRef<number>()
  const sessionStartTime = useRef<Date>(new Date())
  const { toast } = useToast()

  // Mock MediaPipe Hands integration (in real implementation, use @mediapipe/hands)
  const handsModel = useRef<any>(null)

  useEffect(() => {
    if (videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  useEffect(() => {
    if (isActive) {
      initializeGestureRecognition()
    } else {
      stopGestureRecognition()
    }

    return () => {
      stopGestureRecognition()
    }
  }, [isActive])

  const initializeGestureRecognition = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, initialize MediaPipe Hands here
      // handsModel.current = new Hands({
      //   locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      // })

      // Mock initialization
      await new Promise((resolve) => setTimeout(resolve, 1000))

      sessionStartTime.current = new Date()
      startDetection()

      toast({
        title: "ASL Recognition Active",
        description: "Hand gesture recognition is now running",
      })
    } catch (error) {
      console.error("Error initializing gesture recognition:", error)
      toast({
        title: "Initialization Error",
        description: "Could not start gesture recognition",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startDetection = () => {
    const detectGestures = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx || video.videoWidth === 0) {
        animationFrameRef.current = requestAnimationFrame(detectGestures)
        return
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Mock gesture detection (replace with actual MediaPipe processing)
      const mockGesture = await mockGestureDetection(canvas)

      if (mockGesture) {
        handleGestureDetected(mockGesture)
      }

      animationFrameRef.current = requestAnimationFrame(detectGestures)
    }

    detectGestures()
  }

  const mockGestureDetection = async (canvas: HTMLCanvasElement): Promise<DetectedGesture | null> => {
    // Mock implementation - replace with actual MediaPipe processing
    const gestures = ["hello", "thank_you", "please", "sorry", "yes", "no", "help", "good", "bad", "more"]

    // Simulate random gesture detection
    if (Math.random() > 0.95) {
      // 5% chance per frame
      const gesture = gestures[Math.floor(Math.random() * gestures.length)]
      const confidence = 0.7 + Math.random() * 0.3 // 70-100% confidence

      return {
        gesture,
        confidence,
        timestamp: new Date(),
        landmarks: generateMockLandmarks(),
      }
    }

    return null
  }

  const generateMockLandmarks = () => {
    // Generate 21 hand landmarks (MediaPipe standard)
    return Array.from({ length: 21 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.1 - 0.05, // Small z variation
    }))
  }

  const handleGestureDetected = async (gesture: DetectedGesture) => {
    setCurrentGesture(gesture)
    setDetectedGestures((prev) => [...prev.slice(-9), gesture]) // Keep last 10 gestures

    // Update statistics
    setGestureStats((prev) => {
      const newTotal = prev.totalGestures + 1
      const newAverage = (prev.averageConfidence * prev.totalGestures + gesture.confidence) / newTotal
      const sessionDuration = (Date.now() - sessionStartTime.current.getTime()) / 1000

      // Find most common gesture
      const gestureCount = detectedGestures.reduce(
        (acc, g) => {
          acc[g.gesture] = (acc[g.gesture] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const mostCommon =
        Object.entries(gestureCount).reduce((a, b) => (gestureCount[a[0]] > gestureCount[b[0]] ? a : b))?.[0] || ""

      return {
        totalGestures: newTotal,
        averageConfidence: newAverage,
        mostCommonGesture: mostCommon,
        sessionDuration,
      }
    })

    // Store gesture data
    if (roomId) {
      await storeGestureData(gesture)
    }

    // Callback for parent component
    onGestureDetected?.(gesture)

    // Clear current gesture after 2 seconds
    setTimeout(() => {
      setCurrentGesture(null)
    }, 2000)
  }

  const storeGestureData = async (gesture: DetectedGesture) => {
    try {
      await fetch("/api/video/gestures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          roomId,
          gestureData: {
            gesture: gesture.gesture,
            confidence: gesture.confidence,
            landmarks: gesture.landmarks,
            timestamp: gesture.timestamp.toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error("Error storing gesture data:", error)
    }
  }

  const stopGestureRecognition = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const toggleRecognition = () => {
    setIsActive(!isActive)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            ASL Gesture Recognition
          </CardTitle>
          <CardDescription>Real-time American Sign Language gesture detection and analysis [^2]</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={toggleRecognition} disabled={isLoading} variant={isActive ? "destructive" : "default"}>
                {isLoading ? (
                  "Initializing..."
                ) : isActive ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Stop Recognition
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Start Recognition
                  </>
                )}
              </Button>
              {isActive && (
                <Badge variant="secondary" className="animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </div>

          {/* Hidden video and canvas for processing */}
          <div className="hidden">
            <video ref={videoRef} autoPlay muted playsInline />
            <canvas ref={canvasRef} />
          </div>

          {/* Current Gesture Display */}
          {currentGesture && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800 capitalize">
                      {currentGesture.gesture.replace("_", " ")}
                    </h4>
                    <p className="text-sm text-green-600">Detected just now</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-800">
                      {Math.round(currentGesture.confidence * 100)}%
                    </div>
                    <Progress value={currentGesture.confidence * 100} className="w-20 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Statistics */}
          {isActive && gestureStats.totalGestures > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{gestureStats.totalGestures}</div>
                  <div className="text-xs text-muted-foreground">Total Gestures</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(gestureStats.averageConfidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Confidence</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-purple-600 capitalize">
                    {gestureStats.mostCommonGesture.replace("_", " ") || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Most Common</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(gestureStats.sessionDuration)}s</div>
                  <div className="text-xs text-muted-foreground">Session Time</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Gestures History */}
          {detectedGestures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Gestures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {detectedGestures
                    .slice(-5)
                    .reverse()
                    .map((gesture, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{gesture.gesture.replace("_", " ")}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(gesture.confidence * 100)}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {gesture.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
