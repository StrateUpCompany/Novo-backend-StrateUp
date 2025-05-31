"use client"

import { Button } from "@/components/ui/button"
import { Facebook, Twitter, Linkedin, Link2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

interface SocialShareProps {
  url: string
  title: string
  compact?: boolean
}

export function SocialShare({ url, title, compact = false }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copiado para a área de transferência!")
    } catch (err) {
      toast.error("Erro ao copiar link")
    }
  }

  const openShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400")
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => openShare("twitter")}>
          <Twitter className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => openShare("facebook")}>
          <Facebook className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => openShare("linkedin")}>
          <Linkedin className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={copyToClipboard}>
          <Link2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full justify-start" onClick={() => openShare("twitter")}>
        <Twitter className="mr-2 h-4 w-4 text-blue-500" />
        Twitter
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={() => openShare("facebook")}>
        <Facebook className="mr-2 h-4 w-4 text-blue-600" />
        Facebook
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={() => openShare("linkedin")}>
        <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
        LinkedIn
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={() => openShare("whatsapp")}>
        <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
        WhatsApp
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={copyToClipboard}>
        <Link2 className="mr-2 h-4 w-4" />
        Copiar Link
      </Button>
    </div>
  )
}
