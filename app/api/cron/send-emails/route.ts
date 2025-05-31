import { NextResponse } from "next/server"
import {
  getUsersReadyForNextStep,
  sendEmailAndRecord,
  updateUserSequenceProgress,
  getSequenceSteps,
} from "@/app/actions/email-automation-actions"

export async function GET() {
  // Adicione uma verificação de segurança para garantir que esta rota só seja acessada por um cron job autorizado.
  // Por exemplo, você pode usar uma chave secreta no cabeçalho ou em uma query param.
  // if (process.env.CRON_SECRET && req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  try {
    console.log("Iniciando execução do cron job de envio de e-mails...")

    const { usersProgress, error: fetchError } = await getUsersReadyForNextStep()

    if (fetchError) {
      console.error("Erro ao buscar usuários prontos para o próximo passo:", fetchError)
      return NextResponse.json({ success: false, message: fetchError }, { status: 500 })
    }

    if (usersProgress.length === 0) {
      console.log("Nenhum usuário pronto para o próximo passo no momento.")
      return NextResponse.json({ success: true, message: "Nenhum e-mail para enviar." })
    }

    console.log(`Encontrados ${usersProgress.length} usuários para processar.`)

    for (const userProgress of usersProgress) {
      const { sequence_steps: currentStep, email_templates: emailTemplate } = userProgress

      if (!currentStep || !emailTemplate) {
        console.warn(`Dados incompletos para o progresso do usuário ${userProgress.id}. Pulando.`, userProgress)
        continue
      }

      console.log(
        `Processando usuário ${userProgress.user_id} para sequência ${userProgress.sequence_id}, passo ${currentStep.step_order}`,
      )

      // 1. Enviar o e-mail
      const {
        success: emailSent,
        messageId,
        error: sendError,
      } = await sendEmailAndRecord({
        to: "recipient@example.com", // TODO: Substituir pelo e-mail real do usuário
        from: "onboarding@strateup.com.br", // TODO: Configurar o remetente apropriado
        subject: emailTemplate.subject,
        html: emailTemplate.html_content,
        text: emailTemplate.text_content || undefined,
        templateId: emailTemplate.id,
        sequenceId: userProgress.sequence_id,
        stepId: currentStep.id,
        metadata: {
          userId: userProgress.user_id,
          sequenceName: userProgress.sequence_steps.sequence_id, // Isso é o ID da sequência, não o nome. Ajustar se necessário.
          stepOrder: currentStep.step_order,
        },
      })

      if (sendError) {
        console.error(
          `Falha ao enviar e-mail para ${userProgress.user_id} no passo ${currentStep.step_order}:`,
          sendError,
        )
        // Opcional: Atualizar o status do progresso para 'paused' ou 'error'
        await updateUserSequenceProgress({
          id: userProgress.id,
          status: "paused", // Ou 'error'
          metadata: { ...userProgress.metadata, lastError: sendError },
        })
        continue // Pular para o próximo usuário
      }

      console.log(
        `E-mail enviado com sucesso para ${userProgress.user_id} (Message ID: ${messageId}) no passo ${currentStep.step_order}.`,
      )

      // 2. Calcular o próximo passo e agendar o próximo envio
      const { steps: allStepsInSequence, error: stepsError } = await getSequenceSteps(userProgress.sequence_id)

      if (stepsError || !allStepsInSequence || allStepsInSequence.length === 0) {
        console.error(
          `Erro ao buscar passos para a sequência ${userProgress.sequence_id} ou sequência sem passos.`,
          stepsError,
        )
        await updateUserSequenceProgress({
          id: userProgress.id,
          status: "exited", // Marcar como saído se não há mais passos válidos
          metadata: { ...userProgress.metadata, error: "Sequência sem passos válidos." },
        })
        continue
      }

      const nextStep = allStepsInSequence.find((step) => step.step_order === currentStep.step_order + 1)

      if (nextStep) {
        // Há um próximo passo, agendar o envio
        const now = new Date()
        const nextSendAt = new Date(now.getTime())
        nextSendAt.setDate(now.getDate() + nextStep.delay_days)
        nextSendAt.setHours(now.getHours() + nextStep.delay_hours)
        nextSendAt.setMinutes(now.getMinutes() + nextStep.delay_minutes)

        await updateUserSequenceProgress({
          id: userProgress.id,
          current_step_id: currentStep.id, // Marcar o passo atual como concluído
          next_send_at: nextSendAt.toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        console.log(
          `Progresso do usuário ${userProgress.user_id} atualizado para o próximo passo ${nextStep.step_order}. Próximo envio agendado para ${nextSendAt.toLocaleString()}.`,
        )
      } else {
        // Não há mais passos na sequência, marcar como concluído
        await updateUserSequenceProgress({
          id: userProgress.id,
          current_step_id: currentStep.id, // Marcar o último passo como concluído
          next_send_at: null,
          status: "completed",
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        console.log(`Sequência ${userProgress.sequence_id} concluída para o usuário ${userProgress.user_id}.`)
      }
    }

    return NextResponse.json({ success: true, message: "E-mails processados com sucesso." })
  } catch (error: any) {
    console.error("Erro inesperado no cron job de envio de e-mails:", error)
    return NextResponse.json({ success: false, message: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}
