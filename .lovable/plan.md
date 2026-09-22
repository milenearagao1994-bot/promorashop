# Atualização completa para PromoraShop

## Objetivo
Atualizar a plataforma existente de forma incremental: preservar banco, produtos, cupons, métricas, rotas e componentes; substituir a marca, ampliar o painel, ativar a Vivi como assistente de compras e concluir os testes responsivos e de segurança.

## 1. Marca e imagens oficiais
- Salvar as três imagens PNG enviadas no fluxo de assets do projeto, sem redesenhar, recolorir ou distorcer:
  - logomarca PromoraShop para cabeçalho, rodapé e apresentação;
  - Vivi de corpo inteiro para a landing e áreas amplas;
  - Vivi circular para o botão flutuante e identidade do chat.
- Gerar o favicon PNG a partir do símbolo da nova logomarca, preservando proporção e transparência.
- Substituir referências visíveis de PromoVip por PromoraShop em páginas, componentes, mensagens, acessibilidade, carregamento e painel.
- Atualizar títulos e descrições de todas as páginas para PromoraShop, incluindo Open Graph e Twitter Card, com a descrição: “Achadinhos, ofertas, promoções e produtos selecionados em um só lugar.”
- Manter histórico técnico de banco intacto; atualizar valores ativos que ainda exibam a marca anterior.

## 2. Landing e experiência pública
- Refinar a página inicial mobile-first sem alterar a identidade visual atual: mais espaço, hierarquia clara, sombras leves e imagens oficiais bem enquadradas.
- Atualizar a seção da Vivi com:
  - “Encontre o que você precisa por um preço que vale a pena.”
  - “A Vivi é sua assistente que vai te ajudar a encontrar o que você precisa, por um preço que vale a pena.”
- Criar botão flutuante circular da Vivi com a imagem circular, destaque discreto e acesso direto ao chat.
- Criar botão flutuante do WhatsApp para `https://wa.me/5571992600863`.
- Adicionar o Facebook oficial no rodapé, abrindo em nova aba.
- Organizar Vivi, WhatsApp e player em uma zona flutuante responsiva para não cobrir navegação, produtos ou ações de compra.
- Preservar navegação pública sem conta, links externos seguros e aviso discreto de afiliados.

## 3. Player oficial do YouTube
- Manter a playlist `PLepg7gx3R7I0` e trocar o embed simples pela API oficial do YouTube.
- Implementar play/pause, próxima, anterior, volume, silenciar, minimizar/restaurar e indicação da faixa quando a API fornecer o título.
- Manter o player oficial montado ao minimizar para a reprodução continuar, sem extrair ou retransmitir áudio.
- Criar apresentações compactas próprias para celular e computador, sem sobreposição com Vivi e WhatsApp.

## 4. Vivi como assistente de compras
- Manter uma conversa única salva apenas neste navegador, migrando o histórico para a nova chave da marca.
- Usar os componentes de chat já instalados para mensagens, rolagem, resposta em markdown, carregamento e campo de envio.
- Criar streaming seguro no servidor com `openai/gpt-6-astra`; a chave existente permanece somente no servidor.
- A cada conversa, consultar dados reais e ativos de produtos, categorias, lojas, avaliações e cupons.
- Restringir a resposta aos dados retornados pela plataforma: preços, descontos, cupons, avaliações, características, links e disponibilidade nunca serão inventados.
- Permitir conversa natural sobre compras e tendências, mas rotular como sugestão qualquer orientação sem fonte cadastrada e priorizar sempre produtos reais.
- Exibir cards dos produtos citados com link para a página interna antes da saída para a loja.
- Tratar falhas e falta de créditos com a mensagem segura recebida, sem respostas falsas nem reenvios indevidos.

## 5. Dados editáveis e painel administrativo
- Reaproveitar `site_settings` para textos, chamadas, redes sociais, WhatsApp, playlist e configurações futuras da Vivi.
- Adicionar estruturas somente quando necessárias:
  - banners/promoções com período, status, ordem, imagem, destino e produtos destacados;
  - relações entre produtos para sugestões reais.
- Manter RLS e permissões administrativas no backend para toda nova estrutura.
- Expandir o painel com abas de Conteúdo, Promoções/Banners, Redes sociais, Vivi e Segurança.
- Preservar e validar CRUD existente de produtos, cupons, avaliações, categorias e lojas; incluir relações de produtos e reordenação.
- Fazer a landing ler as configurações públicas, com valores atuais como padrão quando ainda não houver personalização.

## 6. Primeiro acesso e segurança
- Manter perfis de usuário, incluindo nome e foto, junto ao sistema de autenticação existente.
- Criar um estado público mínimo que informe apenas se o primeiro acesso já foi concluído, sem expor contas ou dados internos.
- Quando ainda não houver administrador, `/admin` encaminhará para a configuração exclusiva de `arianearagaocomercial@gmail.com`.
- O formulário solicitará senha e confirmação; a conta só receberá acesso após a confirmação enviada ao e-mail autorizado.
- Depois da confirmação, atribuir o papel administrativo no servidor de forma atômica e bloquear permanentemente novas configurações iniciais.
- Após configurado, `/admin` exibirá o login normal; visitantes e usuários sem papel administrativo continuarão bloqueados no backend e nas páginas protegidas.
- Adicionar “Esqueci minha senha” e uma página pública de redefinição que conclua a troca após o link recebido por e-mail.
- Em Configurações > Segurança: alterar senha com senha atual, solicitar mudança do e-mail administrativo com confirmação, encerrar todas as sessões, exibir status da autenticação e sair com limpeza dos dados privados em memória.
- Não armazenar senha, token ou segredo em código, configurações públicas ou banco da aplicação.

## 7. Validação final
- Executar verificação completa do projeto, lint e testes direcionados.
- Testar em celular, tablet e computador: landing, cabeçalho, logo, Vivi, botões flutuantes, player, cards e rodapé.
- Testar fluxos reais: primeiro acesso por confirmação de e-mail quando possível, login, recuperação, sessão, logout e bloqueio de usuário não autorizado.
- No painel, testar criação, edição, ocultação/reativação e exclusão de produto; CRUD de categorias, lojas, cupons e avaliações; conteúdo e promoções.
- Validar visualização de produto, link externo seguro e incremento real do clique no painel.
- Testar a Vivi com produto encontrado, orçamento, cupom inexistente e pergunta fora do catálogo; confirmar ausência de informações inventadas.
- Fazer busca final da marca anterior no código executável e no conteúdo público; referências históricas de migrações aplicadas não serão reescritas para não corromper o histórico do banco.

## Detalhes técnicos
- Stack e banco atuais permanecem; não haverá recriação ou troca de infraestrutura.
- Mudanças estruturais serão aditivas e aplicadas por migração, com GRANTs, RLS e políticas no mesmo arquivo.
- Atualizações de valores existentes serão aplicadas separadamente, preservando registros.
- A autorização administrativa continuará baseada em papel separado do perfil e validada no servidor.
- Imagens continuarão em PNG; somente o favicon será uma cópia física otimizada em `public/`, como exigido pelos navegadores.
