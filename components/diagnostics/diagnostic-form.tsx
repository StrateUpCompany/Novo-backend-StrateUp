"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { enrollLeadBasedOnDiagnostic } from "@/app/actions/email-automation-actions"
import { v4 as uuidv4 } from "uuid"

export default function DiagnosticForm() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [leadType, setLeadType] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Gerar um ID de sessão para tracking
    const sessionId = uuidv4()

    // Simular respostas de diagnóstico
    const mockAnswers = {
      question1: "Resposta simulada 1",
      question2: "Resposta simulada 2",
      leadType: leadType,
    }

    // Simular pontuação
    const mockScore = Math.floor(Math.random() * 100) + 1

    console.log(`Processando diagnóstico para: ${email}, Tipo de Lead: ${leadType}`)

    // Processar o lead e inscrever na sequência
    const { success, message, leadId, error } = await enrollLeadBasedOnDiagnostic(email, leadType, {
      name: name || undefined,
      company: company || undefined,
      answers: mockAnswers,
      score: mockScore,
      sessionId: sessionId,
      utmParams: {
        source: "diagnostic_form",
        medium: "website",
        campaign: "lead_generation",
      },
    })

    if (success) {
      toast.success(message || "Diagnóstico processado com sucesso!")
      console.log(`Lead ID criado/atualizado: ${leadId}`)

      // Limpar formulário
      setEmail("")
      setName("")
      setCompany("")
      setLeadType("")
    } else {
      toast.error(error || "Falha ao processar diagnóstico.")
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Diagnóstico Empresarial Avançado</CardTitle>
        <CardDescription>
          Sistema robusto de gerenciamento de leads com deduplicação e histórico de diagnósticos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Nome (Opcional)</Label>
            <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="company">Empresa (Opcional)</Label>
            <Input
              id="company"
              placeholder="Nome da empresa"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="leadType">Tipo de Lead *</Label>
            <Input
              id="leadType"
              placeholder="marketing, vendas, tecnologia, etc."
              value={leadType}
              onChange={(e) => setLeadType(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deve corresponder ao nome de uma sequência de e-mail ativa
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processando..." : "Enviar Diagnóstico"}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <p>
            <strong>Funcionalidades implementadas:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Deduplicação automática por e-mail</li>
            <li>Histórico de múltiplos diagnósticos</li>
            <li>Tracking de UTM e sessão</li>
            <li>Verificação inteligente de inscrição em sequências</li>
            <li>Metadados flexíveis para análise</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
