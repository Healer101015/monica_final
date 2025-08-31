# 📦 Sistema de Controle de Estoque



## 🔴 Instalação
npm install

---

## 🔴como iniciar 
- npm run dev - raiz
- node server.js - pasta server

---




Este é um sistema simples de **controle de estoque** com suporte para **estoque mínimo** e **estoque máximo**, ideal para gerenciar produtos e evitar tanto a falta quanto o excesso de mercadorias.

---

## 🚀 Funcionalidades
- ✅ Cadastro de produtos
- ✅ Definição de estoque mínimo (inferior) e máximo (superior)
- ✅ Controle automático de alertas quando o estoque está baixo ou alto demais
- ✅ Listagem e busca de produtos
- ✅ Interface simples e intuitiva

---

## 📂 Estrutura do Projeto

A estrutura do projeto é organizada para facilitar o desenvolvimento, manutenção e escalabilidade do sistema de controle de estoque. Veja como ela está distribuída:

- **src/**: Contém todo o código-fonte da aplicação.
  - **pages/**: Páginas principais do sistema, como a tela de estoque e histórico.
  - **components/**: Componentes reutilizáveis da interface, como botões, tabelas, modais e formulários.
  - **assets/**: Imagens e outros arquivos estáticos, como o logo da loja.
  - **services/**: Funções para comunicação com APIs e manipulação de dados.
  - **index.js / main.jsx**: Arquivo de entrada da aplicação React.
  - **index.css**: Arquivo de estilos globais, geralmente configurado com Tailwind CSS.

- **public/**: Arquivos públicos acessíveis diretamente, como `logo.png` e `index.html`.

- **README.md**: Documentação do projeto.

- **package.json**: Gerenciamento de dependências e scripts do projeto.

