# Plano da primeira versão da PromoVip

## Objetivo
Entregar uma plataforma mobile-first de descobertas e afiliados, sem checkout, usando somente conteúdo cadastrado e métricas reais. A Vivi terá várias conversas salvas neste navegador. O painel será exclusivo de `arianearagaocomercial@gmail.com`.

## Etapas

### 1. Dados, permissões e conta proprietária
- Ampliar o banco para categorias ocultáveis, ordem de produtos, moeda e atualização de preço, características técnicas, avaliações editoriais separadas, condições de cupons, dados administrativos de lojas, configurações e eventos de visualização/clique.
- Manter leitura pública apenas do conteúdo ativo e operações administrativas protegidas por autenticação e papel de administradora no servidor.
- Vincular o papel de administradora somente à conta proprietária informada, quando ela existir no sistema de acesso.
- Registrar eventos sem dados pessoais desnecessários e diferenciar claramente clique, visualização, compra e comissão.

### 2. Experiência pública mobile-first
- Criar início com marca, busca, Vivi, categorias, produtos em destaque, cupons, convite para conversa e transparência de afiliados.
- Criar catálogo pesquisável e filtrável, detalhes completos de produto, cupons, sobre, privacidade e termos.
- Usar estados vazios honestos enquanto não houver produtos cadastrados; nenhum produto, preço, avaliação ou métrica fictícia.
- Validar links externos e registrar o clique antes de abrir a loja parceira.

### 3. Vivi
- Criar várias conversas com URL própria e histórico separado em armazenamento local do navegador.
- Usar os componentes de conversa já instalados, a imagem oficial da Vivi e respostas em streaming.
- Consultar somente o catálogo público real e exibir cards apenas para produtos encontrados.
- Aplicar regras para não inventar preço, disponibilidade, cupom, avaliação ou característica.
- Manter credenciais e instruções da assistente somente no servidor.

### 4. Player de música
- Integrar a playlist oficial pelo player incorporado do YouTube.
- Criar mini-player minimizável com play/pause, volume, silêncio, anterior/próxima quando a API realmente oferecer esses controles.
- Iniciar somente por ação do visitante e respeitar as limitações do navegador e do YouTube.

### 5. Painel administrativo
- Criar tela de acesso, logout e páginas privadas para dashboard, produtos, avaliações, cupons, categorias e lojas.
- Implementar formulários validados para criar, editar, ocultar, reativar, destacar, ordenar e excluir registros.
- Mostrar apenas métricas registradas, com seleção de período e avisos para cupons próximos da expiração.
- Autorizar cada leitura e alteração administrativa também no servidor; esconder botões não será tratado como segurança.

### 6. Validação final
- Testar acesso e bloqueio administrativo, criação/edição/exclusão/ocultação, cupons, links externos, analytics, player e Vivi.
- Conferir celular e desktop, acessibilidade, estados de carregamento/erro e metadados próprios de cada página.
- Corrigir falhas encontradas antes de considerar a primeira versão concluída.

## Decisões técnicas
- Lovable Cloud para dados e autenticação; páginas administrativas sob a proteção de acesso gerenciada e funções autenticadas no servidor.
- Lovable AI com `openai/gpt-6-astra` para a Vivi, em streaming e com histórico completo reenviado a cada mensagem.
- Conversas da Vivi em registros locais `{ id, title, updatedAt, messages }`, com a conversa ativa definida pela URL.
- Sem cadastro obrigatório para visitantes e sem persistência de conversa no banco nesta versão.
- Assets oficiais da PromoVip e da Vivi hospedados pelo fluxo de mídia do projeto; sem imagens externas improvisadas.
