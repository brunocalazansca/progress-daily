# Leve (Nourish Now)

O **Leve** é um aplicativo mobile-first voltado para a saúde e nutrição, com o objetivo principal de auxiliar os usuários no processo de **emagrecimento de forma saudável e fundamentada**.

O app calcula metas personalizadas para cada indivíduo e ajuda a rastrear a ingestão de alimentos e água, fornecendo um feedback visual rápido sobre o progresso diário.

## 🚀 Como o Aplicativo Funciona

### 1. Autenticação e Primeiros Passos
Ao iniciar o aplicativo, o usuário é convidado a fazer **Login com sua conta Google** (gerenciado via Supabase). Se for a primeira vez utilizando o app, o sistema o guiará por um fluxo de *Onboarding*.

No onboarding, são coletados dados biométricos básicos, essenciais para o planejamento nutricional:
- Peso (kg) e Altura (cm)
- Idade
- Sexo biológico
- Nível de Atividade Física

### 2. O "Motor" de Cálculos (Metabolismo e Déficit)
A partir dos dados informados, o app aplica a **Fórmula de Harris-Benedict** para calcular a Taxa Metabólica Basal (TMB), ou seja, a energia que o corpo gasta apenas para se manter vivo, ajustada pelo fator de atividade física.

Como o foco do aplicativo é a **perda de peso**, ele aplica uma Regra de Ouro: **Um déficit calórico automático de 500 kcal** sobre o gasto energético total. 
- *Exemplo:* Se o corpo gasta 2.500 kcal/dia, a meta diária sugerida pelo app será de 2.000 kcal.
- O aplicativo também calcula automaticamente a necessidade de ingestão de água baseando-se na proporção de **35ml por kg** de peso corporal e estabelece as porcentagens recomendadas de Macronutrientes (Proteínas, Carboidratos e Gorduras).

### 3. Dashboard Central
O painel de controle do usuário resume todo o seu progresso diário em cards visuais e intuitivos:
- **Resumo Calórico:** Mostra as calorias consumidas versus a meta de calorias restantes do dia.
- **Macros:** Barras de progresso detalhando as gramas consumidas e as gramas faltantes de Proteínas, Carboidratos e Gorduras.
- **Hidratação:** Um card rápido para o usuário contabilizar copos d'água consumidos e atingir a meta diária.

### 4. Diário Alimentar e Busca Inteligente
Na página de Diário, o usuário pode adicionar tudo o que consumiu durante as refeições principais (Café da manhã, Almoço, Jantar e Lanches).
- O app conta com uma barra de busca que consome a **API pública do Open Food Facts**.
- Ao digitar um alimento (ex: "arroz"), o app retorna as opções, suas calorias e macronutrientes por porção. 
- O usuário informa a quantidade (em gramas) consumida e o sistema automaticamente calcula as calorias proporcionais e injeta esses dados nas métricas do Dashboard, atualizando quanto "falta" para a meta.
*(Nota: O app também possui um fallback offline inteligente caso a API pública passe por instabilidades)*.

## 🛠️ Stack de Tecnologias
- **Frontend:** React, TypeScript, Vite, Tailwind CSS e shadcn/ui.
- **Roteamento & Dados:** TanStack Router e TanStack Query (React Query).
- **Backend & Autenticação:** Supabase.
- **API Externa:** Open Food Facts.

## 💻 Desenvolvimento Local

Se você deseja rodar o projeto localmente, será necessário ter o Node.js e o npm instalados.

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta
cd fuel-progress-daily

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```
