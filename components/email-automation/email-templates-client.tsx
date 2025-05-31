"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import {
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  type EmailTemplate,
} from "@/app/actions/email-automation-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash2, Save, XCircle, Loader2 } from "lucide-react"

// Componente para el formulário de criação/edição de template
function TemplateForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData?: EmailTemplate
  onSave: (data: Partial<EmailTemplate>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [name, setName] = useState(initialData?.name || "")
  const [subject, setSubject] = useState(initialData?.subject || "")
  const [htmlContent, setHtmlContent] = useState(initialData?.html_content || "")
  const [textContent, setTextContent] = useState(initialData?.text_content || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, subject, html_content: htmlContent, text_content: textContent || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Template</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="subject">Assunto do E-mail</Label>
        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="html_content">Conteúdo HTML</Label>
        <Textarea
          id="html_content"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          required
          className="min-h-[200px] font-mono"
        />
      </div>
      <div>
        <Label htmlFor="text_content">Conteúdo de Texto Simples (Opcional)</Label>
        <Textarea
          id="text_content"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="min-h-[100px] font-mono"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <XCircle className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {initialData ? "Salvar Alterações" : "Criar Template"}
        </Button>
      </div>
    </form>
  )
}

interface EmailTemplatesClientProps {
  initialTemplates: EmailTemplate[]
}

export default function EmailTemplatesClient({ initialTemplates }: EmailTemplatesClientProps) {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentTemplates, setCurrentTemplates] = useState<EmailTemplate[]>(initialTemplates)

  const handleCreateTemplate = async (data: Partial<EmailTemplate>) => {
    setIsSaving(true)
    try {
      const result = await createEmailTemplate(data as any) // 'as any' devido à tipagem parcial
      if (result.template) {
        toast.success("Template criado com sucesso!")
        setCurrentTemplates((prev) => [...prev, result.template!])
        setIsCreating(false)
      } else {
        toast.error(`Erro ao criar template: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Erro ao criar template: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTemplate = async (data: Partial<EmailTemplate>) => {
    if (!editingTemplate) return
    setIsSaving(true)
    try {
      const result = await updateEmailTemplate({ ...data, id: editingTemplate.id } as any)
      if (result.template) {
        toast.success("Template atualizado com sucesso!")
        setCurrentTemplates((prev) => prev.map((t) => (t.id === result.template!.id ? result.template! : t)))
        setEditingTemplate(null)
      } else {
        toast.error(`Erro ao atualizar template: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Erro ao atualizar template: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja deletar este template?")) return
    try {
      const result = await deleteEmailTemplate(templateId)
      if (result.success) {
        toast.success("Template deletado com sucesso!")
        setCurrentTemplates((prev) => prev.filter((t) => t.id !== templateId))
      } else {
        toast.error(`Erro ao deletar template: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Erro ao deletar template: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Templates de E-mail</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{isCreating ? "Novo Template de E-mail" : "Criar Novo Template"}</CardTitle>
          <CardDescription>
            {isCreating
              ? "Preencha os detalhes para criar um novo template de e-mail."
              : "Clique no botão abaixo para adicionar um novo template."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating ? (
            <TemplateForm onSave={handleCreateTemplate} onCancel={() => setIsCreating(false)} isSaving={isSaving} />
          ) : (
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Novo Template
            </Button>
          )}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Templates Existentes</h2>
      {currentTemplates.length === 0 ? (
        <p className="text-muted-foreground">Nenhum template de e-mail encontrado. Comece criando um!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {template.name}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditingTemplate(template)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Deletar</span>
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>Assunto: {template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                {editingTemplate?.id === template.id ? (
                  <TemplateForm
                    initialData={editingTemplate}
                    onSave={handleUpdateTemplate}
                    onCancel={() => setEditingTemplate(null)}
                    isSaving={isSaving}
                  />
                ) : (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="line-clamp-3">
                      <strong>HTML:</strong> {template.html_content}
                    </p>
                    {template.text_content && (
                      <p className="line-clamp-3">
                        <strong>Texto:</strong> {template.text_content}
                      </p>
                    )}
                    <p>
                      <small>Criado em: {new Date(template.created_at).toLocaleDateString()}</small>
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
