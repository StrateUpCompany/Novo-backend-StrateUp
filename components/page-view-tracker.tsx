"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { recordPageView } from "@/app/actions/analytics-actions"
import { v4 as uuidv4 } from "uuid" // Para gerar um ID de sessão único

// Importe o pacote 'uuid'
// Para Next.js, o pacote 'uuid' é inferido.

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Obter ou criar um ID de sessão
    let sessionId = localStorage.getItem("sessionId")
    if (!sessionId) {
      sessionId = uuidv4()
      localStorage.setItem("sessionId", sessionId)
    }

    const referrer = document.referrer || null
    const userAgent = navigator.userAgent || null

    // Registrar a visualização de página
    recordPageView(pathname, referrer, userAgent, sessionId)
      .then((response) => {
        if (response.error) {
          console.error("Falha ao registrar page view:", response.error)
        }
      })
      .catch((err) => {
        console.error("Erro inesperado ao chamar recordPageView:", err)
      })
  }, [pathname]) // Dispara sempre que o pathname muda (navegação entre páginas)

  return null // Este componente não renderiza nada visualmente
}
