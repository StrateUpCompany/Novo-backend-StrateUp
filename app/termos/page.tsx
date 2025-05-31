import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Termos de Uso | StrateUp",
  description: "Termos de Uso do StrateUp - Condições para utilização dos nossos serviços de consultoria empresarial.",
  robots: "index, follow",
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Termos de Uso</h1>
          <p className="text-lg text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Aceitação dos Termos</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Bem-vindo ao StrateUp. Estes Termos de Uso ("Termos") regem o uso dos nossos serviços, incluindo nosso
                site, diagnósticos empresariais, consultoria e demais funcionalidades oferecidas pela StrateUp
                ("Serviços").
              </p>
              <p>
                Ao acessar ou usar nossos Serviços, você concorda em ficar vinculado a estes Termos. Se você não
                concordar com qualquer parte destes termos, não poderá acessar os Serviços.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Descrição dos Serviços</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>O StrateUp oferece:</p>
              <ul>
                <li>Diagnósticos empresariais online</li>
                <li>Consultoria em estratégia e gestão empresarial</li>
                <li>Análises e recomendações personalizadas</li>
                <li>Conteúdo educacional sobre gestão empresarial</li>
                <li>Ferramentas de análise e planejamento estratégico</li>
              </ul>
              <p>
                Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto dos Serviços a qualquer
                momento, com ou sem aviso prévio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Elegibilidade e Registro</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Para usar nossos Serviços, você deve ter pelo menos 18 anos de idade e capacidade legal para celebrar
                contratos. Ao se registrar, você concorda em:
              </p>
              <ul>
                <li>Fornecer informações precisas, atuais e completas</li>
                <li>Manter a segurança de sua conta e senha</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Uso Aceitável</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Você concorda em usar os Serviços apenas para fins legítimos e de acordo com estes Termos. É proibido:
              </p>
              <ul>
                <li>Usar os Serviços para qualquer finalidade ilegal ou não autorizada</li>
                <li>Interferir ou interromper os Serviços ou servidores conectados</li>
                <li>Tentar obter acesso não autorizado a qualquer parte dos Serviços</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Coletar informações de outros usuários sem consentimento</li>
                <li>Usar os Serviços para spam ou comunicações não solicitadas</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Propriedade Intelectual</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Os Serviços e todo o conteúdo, incluindo textos, gráficos, logotipos, ícones, imagens, clipes de áudio,
                downloads digitais e software, são propriedade do StrateUp ou de seus licenciadores e são protegidos por
                leis de direitos autorais e outras leis de propriedade intelectual.
              </p>
              <p>
                Você recebe uma licença limitada, não exclusiva e não transferível para acessar e usar os Serviços para
                fins pessoais e comerciais legítimos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Conteúdo do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Ao enviar conteúdo através dos Serviços (como respostas a diagnósticos, feedback ou comunicações), você:
              </p>
              <ul>
                <li>Mantém a propriedade de seu conteúdo</li>
                <li>
                  Concede-nos uma licença para usar, modificar e exibir esse conteúdo conforme necessário para fornecer
                  os Serviços
                </li>
                <li>Declara que possui todos os direitos necessários sobre o conteúdo</li>
                <li>Concorda que o conteúdo não viola direitos de terceiros</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Privacidade</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Sua privacidade é importante para nós. Nossa coleta e uso de informações pessoais são regidos por nossa{" "}
                <a href="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </a>
                , que é incorporada a estes Termos por referência.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Limitação de Responsabilidade</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Os Serviços são fornecidos "como estão" e "conforme disponíveis". Na máxima extensão permitida por lei,
                o StrateUp exclui todas as garantias, expressas ou implícitas.
              </p>
              <p>
                O StrateUp não será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou
                punitivos, incluindo perda de lucros, dados ou uso.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Indenização</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Você concorda em indenizar e isentar o StrateUp de qualquer reivindicação, dano, perda,
                responsabilidade, custo ou despesa (incluindo honorários advocatícios) decorrentes de:
              </p>
              <ul>
                <li>Seu uso dos Serviços</li>
                <li>Violação destes Termos</li>
                <li>Violação de direitos de terceiros</li>
                <li>Qualquer conteúdo que você enviar</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Rescisão</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Podemos rescindir ou suspender seu acesso aos Serviços imediatamente, sem aviso prévio, por qualquer
                motivo, incluindo violação destes Termos.
              </p>
              <p>
                Você pode encerrar sua conta a qualquer momento entrando em contato conosco. Após a rescisão, seu
                direito de usar os Serviços cessará imediatamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Lei Aplicável</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida
                nos tribunais competentes do Brasil.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Alterações nos Termos</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações entrarão em vigor
                imediatamente após a publicação. Seu uso continuado dos Serviços após as alterações constitui aceitação
                dos novos Termos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Contato</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:</p>
              <ul>
                <li>
                  E-mail:{" "}
                  <a href="mailto:contato@strateup.com.br" className="text-primary hover:underline">
                    contato@strateup.com.br
                  </a>
                </li>
                <li>
                  E-mail jurídico:{" "}
                  <a href="mailto:juridico@strateup.com.br" className="text-primary hover:underline">
                    juridico@strateup.com.br
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
