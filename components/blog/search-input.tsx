"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface SearchInputProps {
  defaultValue?: string
}

export function SearchInput({ defaultValue = "" }: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(() => {
      // Construir a URL com base na localização atual
      const currentPath = window.location.pathname
      const searchQuery = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : ""

      router.push(`${currentPath}${searchQuery}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
      <Input
        type="search"
        placeholder="Buscar artigos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit" size="icon" disabled={isPending}>
        <Search className="h-4 w-4" />
        <span className="sr-only">Buscar</span>
      </Button>
    </form>
  )
}
