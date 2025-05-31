import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Política de Privacidade | StrateUp",
  description: "Política de Privacidade do StrateUp - Como coletamos, usamos e protegemos seus dados pessoais.",
  robots: "index, follow",
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Política de Privacidade</h1>
          <p className="text-lg text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                O StrateUp ("nós", "nosso" ou "empresa") está comprometido em proteger e respeitar sua privacidade. Esta
                Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando
                você utiliza nossos serviços.
              </p>
              <p>
                Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta
                política. Os termos utilizados nesta Política de Privacidade têm os mesmos significados que em nossos
                Termos de Uso.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Informações que Coletamos</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h4>2.1 Informações Fornecidas por Você</h4>
              <ul>
                <li>Nome e informações de contato (e-mail, telefone)</li>
                <li>Informações da empresa (nome, setor, tamanho)</li>
                <li>Respostas aos nossos diagnósticos e questionários</li>
                <li>Comunicações conosco (e-mails, mensagens, feedback)</li>
              </ul>

              <h4>2.2 Informações Coletadas Automaticamente</h4>
              <ul>
                <li>Dados de uso do site (páginas visitadas, tempo de permanência)</li>
                <li>Informações do dispositivo (tipo, sistema operacional, navegador)</li>
                <li>Endereço IP e dados de localização aproximada</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Como Usamos suas Informações</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>Utilizamos suas informações para:</p>
              <ul>
                <li>Fornecer e melhorar nossos serviços de consultoria</li>
                <li>Personalizar sua experiência e recomendações</li>
                <li>Comunicar sobre nossos serviços e atualizações</li>
                <li>Analisar o uso do site para melhorias</li>
                <li>Cumprir obrigações legais e regulamentares</li>
                <li>Prevenir fraudes e garantir a segurança</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Compartilhamento de Informações</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nas seguintes
                situações:
              </p>
              <ul>
                <li>Com seu consentimento explícito</li>
                <li>Para cumprir obrigações legais</li>
                <li>Com prestadores de serviços que nos auxiliam (sob acordos de confidencialidade)</li>
                <li>Em caso de fusão, aquisição ou venda de ativos da empresa</li>
                <li>Para proteger nossos direitos, propriedade ou segurança</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Segurança dos Dados</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações
                pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:
              </p>
              <ul>
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento regular de segurança</li>
                <li>Treinamento de funcionários sobre privacidade</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Seus Direitos</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>De acordo com a LGPD, você tem os seguintes direitos:</p>
              <ul>
                <li>Acesso aos seus dados pessoais</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados</li>
                <li>Eliminação dos dados tratados com consentimento</li>
                <li>Revogação do consentimento</li>
                <li>Oposição ao tratamento realizado com base no legítimo interesse</li>
              </ul>
              <p>
                Para exercer esses direitos, entre em contato conosco através do e-mail:{" "}
                <a href="mailto:privacidade@strateup.com.br" className="text-primary hover:underline">
                  privacidade@strateup.com.br
                </a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies e Tecnologias Similares</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do site e
                personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações do seu
                navegador.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Retenção de Dados</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos
                nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Alterações nesta Política</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças
                significativas através do nosso site ou por e-mail. Recomendamos que você revise esta política
                regularmente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contato</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais,
                entre em contato conosco:
              </p>
              <ul>
                <li>
                  E-mail:{" "}
                  <a href="mailto:privacidade@strateup.com.br" className="text-primary hover:underline">
                    privacidade@strateup.com.br
                  </a>
                </li>
                <li>
                  E-mail geral:{" "}
                  <a href="mailto:contato@strateup.com.br" className="text-primary hover:underline">
                    contato@strateup.com.br
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
