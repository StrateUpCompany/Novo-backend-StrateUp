"use client"
import { getEmailSequences } from "@/app/actions/email-automation-actions"
import EmailSequencesClient from "@/components/email-automation/email-sequences-client"

export default async function EmailSequencesPage() {
  const { sequences, error } = await getEmailSequences()

  return <EmailSequencesClient initialSequences={sequences || []} error={error} />
}
