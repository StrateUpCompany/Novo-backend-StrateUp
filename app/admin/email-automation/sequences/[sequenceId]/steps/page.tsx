"use client"

import type React from "react"

import {
  getSequenceSteps,
  createSequenceStep,
  updateSequenceStep,
  deleteSequenceStep,
  getEmailTemplates,
  type SequenceStep,
  type EmailTemplate,
} from "@/app/actions/email-automation-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash2, Save, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useParams } from "next/navigation"

// Componente para o formulário de criação/edição de passo
function StepForm({
  initialData,
  templates,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData?: SequenceStep
  templates: EmailTemplate[]
  onSave: (data: Partial<SequenceStep>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [templateId, setTemplateId] = useState(initialData?.template_id || "")
  const [stepOrder, setStepOrder] = useState(initialData?.step_order.toString() || "")
  const [delayDays, setDelayDays] = useState(initialData?.delay_days.toString() || "0")
  const [delayHours, setDelayHours] = useState(initialData?.delay_hours.toString() || "0")
  const [delayMinutes, setDelayMinutes] = useState(initialData?.delay_minutes.toString() || "0")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      template_id: templateId,
      step_order: Number.parseInt(stepOrder),
      delay_days: Number.parseInt(delayDays),
      delay_hours: Number.parseInt(delayHours),
      delay_minutes: Number.parseInt(delayMinutes),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="templateId">Template de E-mail</Label>
        <Select value={templateId} onValueChange={setTemplateId} disabled={isSaving}>
          <SelectTrigger id="templateId">
            <SelectValue placeholder="Selecione um template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="stepOrder">Ordem do Passo</Label>
        <Input
          id="stepOrder"
          type="number"
          value={stepOrder}
          onChange={(e) => setStepOrder(e.target.value)}
          required
          min="1"
          disabled={isSaving}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="delayDays">Atraso (Dias)</Label>
          <Input
            id="delayDays"
            type="number"
            value={delayDays}
            onChange={(e) => setDelayDays(e.target.value)}
            min="0"
            disabled={isSaving}
          />
        </div>
        <div>
          <Label htmlFor="delayHours">Atraso (Horas)</Label>
          <Input
            id="delayHours"
            type="number"
            value={delayHours}
            onChange={(e) => setDelayHours(e.target.value)}
            min="0"
            max="23"
            disabled={isSaving}
          />
        </div>
        <div>
          <Label htmlFor="delayMinutes">Atraso (Minutos)</Label>
          <Input
            id="delayMinutes"
            type="number"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(e.target.value)}
            min="0"
            max="59"
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <XCircle className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {initialData ? "Salvar Alterações" : "Adicionar Passo"}
        </Button>
      </div>
    </form>
  )
}

export default function SequenceStepsPage() {
  const params = useParams()
  const sequenceId = params.sequenceId as string

  const [steps, setSteps] = useState<SequenceStep[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const { steps: fetchedSteps, error: stepsError } = await getSequenceSteps(sequenceId)
        const { templates: fetchedTemplates, error: templatesError } = await getEmailTemplates()

        if (stepsError) throw new Error(`Erro ao carregar passos: ${stepsError}`)
        if (templatesError) throw new Error(`Erro ao carregar templates: ${templatesError}`)

        setSteps(fetchedSteps || [])
        setTemplates(fetchedTemplates || [])
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [sequenceId])

  const handleCreateStep = async (data: Partial<SequenceStep>) => {
    setIsSaving(true)
    const result = await createSequenceStep({ ...data, sequence_id: sequenceId } as any)
    if (result.step) {
      toast.success("Passo criado com sucesso!")
      setSteps((prev) => [...prev, result.step!].sort((a, b) => a.step_order - b.step_order))
      setIsCreating(false)
    } else {
      toast.error(`Erro ao criar passo: ${result.error}`)
    }
    setIsSaving(false)
  }

  const handleUpdateStep = async (data: Partial<SequenceStep>) => {
    if (!editingStep) return
    setIsSaving(true)
    const result = await updateSequenceStep({ ...data, id: editingStep.id } as any)
    if (result.step) {
      toast.success("Passo atualizado com sucesso!")
      setSteps((prev) =>
        prev.map((s) => (s.id === result.step!.id ? result.step! : s)).sort((a, b) => a.step_order - b.step_order),
      )
      setEditingStep(null)
    } else {
      toast.error(`Erro ao atualizar passo: ${result.error}`)
    }
    setIsSaving(false)
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Tem certeza que deseja deletar este passo?")) return
    const result = await deleteSequenceStep(stepId)
    if (result.success) {
      toast.success("Passo deletado com sucesso!")
      setSteps((prev) => prev.filter((s) => s.id !== stepId))
    } else {
      toast.error(`Erro ao deletar passo: ${result.error}`)
    }
  }

  const getTemplateName = (templateId: string) => {
    return templates.find((t) => t.id === templateId)?.name || "Template Desconhecido"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando passos da sequência...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-2xl font-bold">Erro ao carregar passos da sequência:</h2>
        <p>{error}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/email-automation/sequences">Voltar para Sequências</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/email-automation/sequences">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar para Sequências</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Gerenciamento de Passos da Sequência</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{isCreating ? "Novo Passo da Sequência" : "Adicionar Novo Passo"}</CardTitle>
          <CardDescription>
            {isCreating
              ? "Preencha os detalhes para adicionar um novo passo a esta sequência."
              : "Clique no botão abaixo para adicionar um novo passo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating ? (
            <StepForm
              templates={templates}
              onSave={handleCreateStep}
              onCancel={() => setIsCreating(false)}
              isSaving={isSaving}
            />
          ) : (
            <Button onClick={() => setIsCreating(true)} className="w-full" disabled={templates.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Novo Passo
            </Button>
          )}
          {templates.length === 0 && (
            <p className="text-sm text-destructive mt-2">
              Você precisa criar templates de e-mail antes de adicionar passos.{" "}
              <Link href="/admin/email-automation/templates" className="underline">
                Criar templates
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Passos Existentes</h2>
      {steps.length === 0 ? (
        <p className="text-muted-foreground">Nenhum passo encontrado para esta sequência. Comece adicionando um!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Passo {step.step_order}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditingStep(step)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteStep(step.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Deletar</span>
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>Template: {getTemplateName(step.template_id)}</CardDescription>
              </CardHeader>
              <CardContent>
                {editingStep?.id === step.id ? (
                  <StepForm
                    initialData={editingStep}
                    templates={templates}
                    onSave={handleUpdateStep}
                    onCancel={() => setEditingStep(null)}
                    isSaving={isSaving}
                  />
                ) : (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Atraso: {step.delay_days} dias, {step.delay_hours} horas, {step.delay_minutes} minutos
                    </p>
                    <p>
                      <small>Criado em: {new Date(step.created_at).toLocaleDateString()}</small>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
