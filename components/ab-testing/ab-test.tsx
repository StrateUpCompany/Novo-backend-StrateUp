"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getOrAssignVariant, recordABTestEvent, setABTestVariantCookie } from "@/app/actions/ab-testing-actions"
import { v4 as uuidv4 } from "uuid"

interface ABTestProps {
  testName: string
  variants: Record<string, React.ReactNode>
  onVariantSelected?: (variant: string) => void
  trackConversions?: boolean
}

export default function ABTest({ testName, variants, onVariantSelected, trackConversions = true }: ABTestProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function assignVariant() {
      try {
        // Obter ou criar um ID de sessão
        let sessionId = localStorage.getItem("sessionId")
        if (!sessionId) {
          sessionId = uuidv4()
          localStorage.setItem("sessionId", sessionId)
        }

        // Obter ou atribuir uma variante
        const { variant, error: variantError } = await getOrAssignVariant(testName, sessionId)

        if (variantError) {
          setError(variantError)
          // Em caso de erro, usar a primeira variante disponível como fallback
          const fallbackVariant = Object.keys(variants)[0]
          setSelectedVariant(fallbackVariant)
        } else if (variant) {
          setSelectedVariant(variant)

          // Definir cookie para persistir a variante
          await setABTestVariantCookie(testName, variant)

          // Registrar evento de impressão
          if (trackConversions) {
            await recordABTestEvent(testName, variant, "impression", sessionId)
          }

          // Registrar no Vercel Analytics (se disponível)
          if (typeof window !== "undefined" && window.va) {
            window.va.track("AB Test Impression", {
              test_name: testName,
              variant_name: variant,
            })
          }

          // Callback opcional
          if (onVariantSelected) {
            onVariantSelected(variant)
          }
        }
      } catch (err: any) {
        console.error("Erro no A/B testing:", err)
        setError(err.message)
        // Fallback para a primeira variante
        const fallbackVariant = Object.keys(variants)[0]
        setSelectedVariant(fallbackVariant)
      } finally {
        setIsLoading(false)
      }
    }

    assignVariant()
  }, [testName, variants, onVariantSelected, trackConversions])

  // Função para registrar conversões (pode ser chamada externamente)
  const trackConversion = async (additionalData?: Record<string, any>) => {
    if (!selectedVariant || !trackConversions) return

    try {
      let sessionId = localStorage.getItem("sessionId")
      if (!sessionId) {
        sessionId = uuidv4()
        localStorage.setItem("sessionId", sessionId)
      }

      await recordABTestEvent(testName, selectedVariant, "conversion", sessionId, additionalData)

      // Registrar no Vercel Analytics (se disponível)
      if (typeof window !== "undefined" && window.va) {
        window.va.track("AB Test Conversion", {
          test_name: testName,
          variant_name: selectedVariant,
          ...additionalData,
        })
      }
    } catch (err: any) {
      console.error("Erro ao registrar conversão:", err)
    }
  }

  // Expor a função trackConversion globalmente para uso externo
  useEffect(() => {
    if (selectedVariant && typeof window !== "undefined") {
      ;(window as any)[`trackConversion_${testName}`] = trackConversion
    }
  }, [selectedVariant, testName])

  if (isLoading) {
    // Renderizar a primeira variante durante o carregamento para evitar flickering
    const firstVariant = Object.keys(variants)[0]
    return <>{variants[firstVariant]}</>
  }

  if (error) {
    console.warn(`A/B Test Error (${testName}):`, error)
    // Em caso de erro, renderizar a primeira variante
    const firstVariant = Object.keys(variants)[0]
    return <>{variants[firstVariant]}</>
  }

  if (!selectedVariant || !variants[selectedVariant]) {
    // Fallback para a primeira variante se a selecionada não existir
    const firstVariant = Object.keys(variants)[0]
    return <>{variants[firstVariant]}</>
  }

  return <>{variants[selectedVariant]}</>
}

// Hook personalizado para facilitar o uso do A/B testing
export function useABTest(testName: string) {
  const [variant, setVariant] = useState<string | null>(null)

  const trackConversion = (additionalData?: Record<string, any>) => {
    if (typeof window !== "undefined" && (window as any)[`trackConversion_${testName}`]) {
      ;(window as any)[`trackConversion_${testName}`](additionalData)
    }
  }

  return { variant, trackConversion, setVariant }
}
