"use client"

import type React from "react"

import {
  createEmailSequence,
  updateEmailSequence,
  deleteEmailSequence,
  type EmailSequence,
} from "@/app/actions/email-automation-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash2, Save, XCircle, Loader2, LinkIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"

// Componente para el formulário de criação/edição de sequência
function SequenceForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData?: EmailSequence
  onSave: (data: Partial<EmailSequence>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, description: description || null, is_active: isActive })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da Sequência</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} disabled={isSaving} />
        <Label htmlFor="is-active">Ativa</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <XCircle className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {initialData ? "Salvar Alterações" : "Criar Sequência"}
        </Button>
      </div>
    </form>
  )
}

interface EmailSequencesClientProps {
  initialSequences: EmailSequence[]
  error?: string
}

export default function EmailSequencesClient({ initialSequences, error }: EmailSequencesClientProps) {
  const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentSequences, setCurrentSequences] = useState<EmailSequence[]>(initialSequences)

  const handleCreateSequence = async (data: Partial<EmailSequence>) => {
    try {
      setIsSaving(true)
      const result = await createEmailSequence(data as any)
      if (result.sequence) {
        toast.success("Sequência criada com sucesso!")
        setCurrentSequences((prev) => [...prev, result.sequence!])
        setIsCreating(false)
      } else {
        toast.error(`Erro ao criar sequência: ${result.error}`)
      }
    } catch (error) {
      toast.error("Erro inesperado ao criar sequência")
      console.error("Error creating sequence:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateSequence = async (data: Partial<EmailSequence>) => {
    if (!editingSequence) return
    try {
      setIsSaving(true)
      const result = await updateEmailSequence({ ...data, id: editingSequence.id } as any)
      if (result.sequence) {
        toast.success("Sequência atualizada com sucesso!")
        setCurrentSequences((prev) => prev.map((s) => (s.id === result.sequence!.id ? result.sequence! : s)))
        setEditingSequence(null)
      } else {
        toast.error(`Erro ao atualizar sequência: ${result.error}`)
      }
    } catch (error) {
      toast.error("Erro inesperado ao atualizar sequência")
      console.error("Error updating sequence:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSequence = async (sequenceId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta sequência? Isso também deletará todos os passos associados."))
      return

    try {
      const result = await deleteEmailSequence(sequenceId)
      if (result.success) {
        toast.success("Sequência deletada com sucesso!")
        setCurrentSequences((prev) => prev.filter((s) => s.id !== sequenceId))
      } else {
        toast.error(`Erro ao deletar sequência: ${result.error}`)
      }
    } catch (error) {
      toast.error("Erro inesperado ao deletar sequência")
      console.error("Error deleting sequence:", error)
    }
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-2xl font-bold">Erro ao carregar sequências de e-mail:</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Sequências de E-mail</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{isCreating ? "Nova Sequência de E-mail" : "Criar Nova Sequência"}</CardTitle>
          <CardDescription>
            {isCreating
              ? "Preencha os detalhes para criar uma nova sequência de e-mail."
              : "Clique no botão abaixo para adicionar uma nova sequência."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating ? (
            <SequenceForm onSave={handleCreateSequence} onCancel={() => setIsCreating(false)} isSaving={isSaving} />
          ) : (
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Nova Sequência
            </Button>
          )}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Sequências Existentes</h2>
      {currentSequences.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma sequência de e-mail encontrada. Comece criando uma!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentSequences.map((sequence) => (
            <Card key={sequence.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {sequence.name}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/admin/email-automation/sequences/${sequence.id}/steps`} title="Gerenciar Passos">
                        <LinkIcon className="h-4 w-4" />
                        <span className="sr-only">Gerenciar Passos</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setEditingSequence(sequence)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteSequence(sequence.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Deletar</span>
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {sequence.description || "Sem descrição."}
                  <br />
                  Status: {sequence.is_active ? "Ativa" : "Inativa"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingSequence?.id === sequence.id ? (
                  <SequenceForm
                    initialData={editingSequence}
                    onSave={handleUpdateSequence}
                    onCancel={() => setEditingSequence(null)}
                    isSaving={isSaving}
                  />
                ) : (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <small>Criada em: {new Date(sequence.created_at).toLocaleDateString()}</small>
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
