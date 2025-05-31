"use client"
import { getEmailTemplates } from "@/app/actions/email-automation-actions"
import EmailTemplatesClient from "@/components/email-automation/email-templates-client"

export default async function EmailTemplatesPage() {
  const { templates, error } = await getEmailTemplates()

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-2xl font-bold">Erro ao carregar templates de e-mail:</h2>
        <p>{error}</p>
      </div>
    )
  }

  return <EmailTemplatesClient initialTemplates={templates || []} />
}
