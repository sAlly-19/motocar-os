# 🏍️ MotoCar Premium Workshop Manager

Um sistema inteligente e moderno construído com React Native e Expo focado na gestão de ponta a ponta de oficinas mecânicas de alto padrão. Crie orçamentos, acompanhe a equipe, gerencie o estoque em tempo real e emita faturamentos elegantes com relatórios nativos, tudo integrado na nuvem pelo Firebase.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Zustand](https://img.shields.io/badge/Zustand-4A4A4A?style=for-the-badge&logo=react&logoColor=white)

---

## 🌟 Funcionalidades Principais

- **OS e Orçamentos Rápidos:** Crie, acompanhe e duplique Orçamentos e Ordens de Serviço. Com dois toques, converta um orçamento aprovado em uma OS rastreável.
- **Controle de Garantias Integrado:** Assinale individualmente o tempo de garantia oferecido para cada peça ou serviço, constando diretamente na OS oficial em PDF.
- **Relatórios Gerenciais Avançados:** Exiba métricas diárias, ranking de mecânicos e faturamentos com os dados plotados em gráficos em tempo real, gerando outputs detalhados para exportação em formato `.CSV` prontas para Excel.
- **Integração Externa Automática:** Envie orçamentos prévios e status atualizados diretamente para o **WhatsApp** do cliente.
- **Estoque Dinâmico:** Peças são deduzidas no ato da abertura da OS e devolvidas perfeitamente caso o orçamento seja cancelado, possuindo suporte a "Alertas de Baixo Estoque".
- **Gerenciamento Seguro da Equipe:** Contas divididas entre "Administrador" e "Mecânicos" via token gerado no próprio app, restringindo exclusão e acesso gerencial ao Firebase.

---

## 🚀 Arquitetura e Tecnologias

- **Expo SDK 56:** Aproveitamento total do ecossistema e das extensões rápidas da última *LTS* do Expo.
- **Expo Router v56:** Navegação baseada em arquivos (`app/`) super fluída que suporta de Web a iOS nativo de maneira inquebrável.
- **Zustand (`useShallow` e Persistência):** Estado reativo isolado otimizado que retém sessões nativas pelo Async Storage minimizando *re-renders*.
- **Firebase SDK (Firestore & Auth):** Comunicação baseada em Cloud conectada via Hooks com trancamento criptográfico de Segurança no banco de dados (`firestore.rules`).
- **Layouts Customizáveis:** Motor de temas integrado e Design System polido baseado em *Material You / Glassmorphism* (cartões translúcidos). 
- **Suporte 100% Offline e Responsivo:** Construído sob medida utilizando `FlatList` para scroll infinito na vertical adaptando interfaces que esticam lindamente do Mobile para Tablets/Desktop.

---

## 🛠️ Como Iniciar o Projeto (Desenvolvimento Local)

### 1. Requisitos Prévios
- Ter o [Node.js](https://nodejs.org/en) (versão 20+) instalado na máquina.
- Baixar o aplicativo **Expo Go** no seu celular iOS ou Android.

### 2. Configurando o Ambiente
Faça o clone ou baixe este repositório para o seu computador, instale as dependências e adicione o seu arquivo `.env`:
\`\`\`bash
# 1. Instale os módulos nativos
npm install

# 2. Crie seu arquivo .env mapeando as chaves do Google Firebase (substituindo com as do seu Console do Firebase) e sua Senha Master de Admin:
EXPO_PUBLIC_ADMIN_PASSWORD=SuaSenhaForteAqui
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx
\`\`\`

### 3. Rodando o Aplicativo
Inicie o motor do Expo via Metro Bundler:
\`\`\`bash
npm start
\`\`\`
Aparecerá um **QR Code** no terminal. Abra a câmera ou o Expo Go do seu celular e leia-o. O app irá compilar no aparelho.

---

## 📦 Como exportar e construir o Aplicativo (.APK / Lojas)

Todo o aplicativo já está sanitizado e pronto para as *App Stores*. Não é mais necessário instalar o ambiente massivo e pesado do *Android Studio* ou do *XCode* localmente no seu computador graças ao **EAS Build** da Expo. A compilação é feita inteiramente na nuvem!

### Para gerar um \`.APK\` diretamente
\`\`\`bash
# 1. Autentique-se ou registre-se na Expo:
npx eas login

# 2. Rode o comando pedindo o formato APK (Preview profile configurado):
npx eas build -p android --profile preview
\`\`\`
No final do processo (que leva cerca de 10 minutos nos servidores da Expo), o terminal te entregará um link direto. É só clicar e **baixar o .apk** direto no celular ou computador!

*(Dica: Se quiser subir direto pra loja Oficial da Google Play Store, o formato oficial de Produção Bundle é disparado com: `npx eas build -p android --profile production`)*.

---
📝 *Licença e Distruibuição gerida para a Oficina MotoCar Premium (Builds Seguras).*
