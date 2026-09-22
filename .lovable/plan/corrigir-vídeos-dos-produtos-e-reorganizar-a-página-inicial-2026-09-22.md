# Corrigir vídeos dos produtos e reorganizar a página inicial

## Alterações
- Ajustar a galeria pública para reconhecer tanto vídeos enviados pelo painel quanto links do YouTube.
- Manter vídeo ausente totalmente oculto e preservar controles nativos, volume e tela cheia quando suportados.
- Confirmar que o campo `video_url` salvo no produto percorre cadastro, consulta e exibição sem conversões incompatíveis.
- Reorganizar a página inicial na ordem fixa: painel principal da Vivi, Achadinhos em destaque, Categorias, Encontrou um produto?, Cupons.
- Preservar banners e a chamada final da Vivi sem interferir na sequência solicitada das cinco seções principais.

## Verificação
- Criar temporariamente um produto com foto e vídeo enviados pelo dispositivo, salvar e conferir ambos na página pública em celular e desktop.
- Conferir que um produto sem vídeo não mostra espaço vazio.
- Conferir visualmente a ordem da página inicial nos dois tamanhos de tela.
- Remover o produto temporário após o teste.

## Detalhes técnicos
- Vídeos internos serão renderizados com o player nativo do navegador; links do YouTube continuarão usando incorporação oficial.
- Nenhum dado fictício permanecerá cadastrado após a validação.
