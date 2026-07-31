# E-mails

Templates de e-mail do projeto, escritos com React Email. Eles ficam em
`templates/<categoria>` e podem ser pré-visualizados localmente ou exportados
como HTML.

## Categorias

```text
templates/
  transactional/  # login, confirmação, cobrança e recibos
  lifecycle/      # onboarding, ativação e reengajamento
  marketing/      # newsletters, campanhas e lançamentos
  notifications/  # comentários, convites e atualizações do produto
  digest/         # resumos diário ou semanal
  operational/    # manutenção, incidentes e avisos de serviço
```

Use `transactional` para mensagens críticas disparadas por uma ação do usuário
ou do sistema. As outras categorias devem ser criadas somente quando tiverem o
primeiro template, evitando diretórios vazios.

## Desenvolvimento

Execute os comandos a partir da raiz do monorepo:

```bash
vp run emails#dev
vp run emails#export
```

O preview abre em `http://localhost:3000`. A exportação gera HTML em `out/`,
que não é versionado.

## Criando um template

Adicione um arquivo `.tsx` à categoria apropriada, com export default e
`PreviewProps` para que o preview tenha dados representativos. Por exemplo,
`templates/transactional/welcome.tsx` pode ser importado como:

```ts
import WelcomeEmail from "@workspace/emails/transactional/welcome";
```
