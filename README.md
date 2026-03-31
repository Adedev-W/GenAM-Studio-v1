# GenAM Studio

AI agent platform for Indonesian SMEs. Build, deploy, and manage AI-powered sales and customer service agents — no coding required.

## Problem

Small businesses in Indonesia lack the resources to provide 24/7 customer support, answer repetitive product questions, and process orders at scale. Hiring staff is expensive; building custom chatbots requires technical expertise most SME owners don't have.

## Solution

GenAM Studio lets business owners create AI agents that understand their products, talk to customers in natural Indonesian, and display rich visual catalogs — all set up in minutes through a guided wizard.

## Use Cases

- **Online stores** — AI agent answers product questions, shows catalog via interactive canvas, and guides customers to purchase
- **Restaurants & food businesses** — Display menu, handle orders, answer availability and pricing questions 24/7
- **Service businesses (salons, courses, repair shops)** — Book appointments, explain services, handle FAQs without manual effort
- **Multi-channel sellers** — Deploy one agent across website embed, shareable link, and WhatsApp

## Key Features

- **Agent Builder** — Create AI agents with custom persona, tone, and knowledge base. Choose from multiple OpenAI models
- **Product Catalog** — Manage products with variants, pricing, and stock. AI auto-generates catalog from descriptions
- **Canvas System** — Visual widgets (menus, price lists, product showcases) rendered inside chat conversations
- **Workflow Automation** — Visual workflow builder with triggers, conditions, and actions
- **Usage & Budget Control** — Track token usage per agent, set spending limits and alert thresholds
- **Analytics Dashboard** — Monitor agent performance, conversation metrics, and order stats
- **Multi-Business Support** — Manage multiple businesses from one account with role-based access

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI |
| Database | Supabase (PostgreSQL) |
| AI | OpenAI API (GPT-4o, GPT-4.1) |
| Charts | Recharts |
| Workflows | XyFlow |
| Validation | Zod, React Hook Form |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    (landing)/        # Public landing page
    (auth)/           # Login, register, forgot password
    (app)/            # Authenticated app pages
      dashboard/      # Overview stats and charts
      agents/         # AI agent management
      products/       # Product catalog
      orders/         # Order management
      workflows/      # Visual workflow builder
      canvas/         # Interactive widget layouts
      chat/           # Conversation interface
      settings/       # Business configuration
      akun/           # Account settings
    api/              # API routes
  components/
    ui/               # shadcn/ui primitives
    layout/           # Sidebar, header, shell
    dashboard/        # Dashboard widgets
  lib/
    supabase/         # Supabase client/server/middleware
    openai/           # AI tools and prompt builders
    workflows/        # Workflow execution engine
```

## License

Proprietary. All rights reserved.
