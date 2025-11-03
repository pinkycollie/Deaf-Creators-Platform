"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, Video, ImageIcon, FileText } from "lucide-react"

interface ContentUploadProps {
  tenantId: string
  onUploadComplete?: (content: any) => void
}

export function ContentUpload({ tenantId, onUploadComplete }: ContentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
      "text/*": [".txt", ".md"],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file || !formData.title) {
      toast({
        title: "Error",
        description: "Please select a file and provide a title.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get upload URL
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      })

      if (!uploadResponse.ok) throw new Error("Failed to get upload URL")

      const { uploadUrl, publicUrl } = await uploadResponse.json()

      // Upload file
      const uploadFileResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadFileResponse.ok) throw new Error("Failed to upload file")

      setUploadProgress(50)

      // Create content record
      const contentResponse = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          content_type: file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("image/")
              ? "image"
              : "document",
          file_url: publicUrl,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      })

      if (!contentResponse.ok) throw new Error("Failed to create content")

      const { content } = await contentResponse.json()
      setUploadProgress(100)

      toast({
        title: "Success",
        description: "Content uploaded successfully!",
      })

      // Reset form
      setFormData({ title: "", description: "", tags: "" })
      setFile(null)
      onUploadComplete?.(content)
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) return <Video className="h-8 w-8" />
    if (file.type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />
    return <FileText className="h-8 w-8" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Content</CardTitle>
        <CardDescription>Upload videos, images, or documents to tokenize and share</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter content title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your content"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="asl, education, tutorial"
            />
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="space-y-2">
              {getFileIcon(file)}
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p>{isDragActive ? "Drop the file here..." : "Drag & drop a file here, or click to select"}</p>
              <p className="text-sm text-muted-foreground">Supports videos, images, and documents up to 500MB</p>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <Button onClick={handleUpload} disabled={!file || !formData.title || isUploading} className="w-full">
          {isUploading ? "Uploading..." : "Upload Content"}
        </Button>
      </CardContent>
    </Card>
  )
}
