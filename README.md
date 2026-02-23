# Zambia Fund Hub

A comprehensive funding platform connecting Zambian entrepreneurs with investors to facilitate business growth and economic development.

## About the Project

Zambia Fund Hub is a web-based platform that enables:

- **Entrepreneurs/Founders**: Create business profiles, launch funding campaigns with multiple funding types (equity, revenue share, crowdfunding, loans), and track investments
- **Investors**: Browse verified businesses, view funding opportunities, invest in campaigns, and track their investments and returns
- **Diaspora Investors**: Connect with Zambian businesses for remote investment opportunities
- **Administrators**: Manage business verification, approve campaigns, monitor transactions, and oversee the platform

### Key Features

- **Multiple Funding Types**: Support for equity investments, revenue sharing, crowdfunding, and loan-based financing
- **Business Verification**: Verified business profiles with pitch decks and financial projections
- **Campaign Management**: Entrepreneurs can create and manage fundraising campaigns with specific goals
- **Investment Tracking**: Real-time tracking of investments, payments, and returns
- **User Roles**: Admin, moderator, and user roles with appropriate access controls
- **Secure Transactions**: Integration with payment providers and transaction management
- **Dashboard**: Personalized dashboards for different user types to monitor activity and performance

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

The only requirement is having Node.js & Bun installed.

Follow these steps to set up the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd zambia-fund-hub

# Step 3: Install dependencies using Bun
bun install

# Step 4: Set up environment variables
# Create a .env file with your Supabase configuration
cp .env.example .env.local

# Step 5: Start the development server
bun run dev
```

**Available Scripts**

```sh
bun run dev          # Start development server on http://localhost:5173
bun run build        # Build for production
bun run build:dev    # Build in development mode
bun run lint         # Run ESLint
bun run preview      # Preview production build
bun run test         # Run tests once
bun run test:watch   # Run tests in watch mode
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Technology Stack

This project is built with:

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (built on Radix UI)
- **Backend**: Supabase (PostgreSQL + Auth)
- **HTTP Client**: Axios
- **Form Management**: React Hook Form with Zod validation
- **State Management**: TanStack React Query
- **Routing**: React Router
- **Package Manager**: Bun
- **Testing**: Vitest
- **Linting**: ESLint

## Environment Setup

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database

The project uses Supabase as the backend with the following main tables:

- **profiles**: User profiles with role information
- **businesses**: Business profiles with verification status
- **campaigns**: Funding campaigns with multiple funding types
- **investments**: Investment records and tracking
- **transactions**: Payment and financial transaction history
- **user_roles**: Role-based access control

All tables have Row Level Security (RLS) enabled with appropriate policies for different user roles.

## Project Structure

```
src/
├── pages/          # Main page components
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── integrations/   # External service integrations (Supabase, Lovable)
├── lib/            # Utility functions
└── assets/         # Static assets
```

## Deployment

The project can be deployed to any Node.js hosting platform (Vercel, Netlify, AWS, etc.). 

Key deployment considerations:
- Set environment variables on your hosting platform
- Configure Supabase project for production
- Build before deploying: `bun run build`

## How can I deploy this project?

Recommended deployment options:

- **Vercel**: Connect your GitHub repository to Vercel for automatic deployments
- **Netlify**: Similar GitHub integration with automatic deployments
- **Traditional Hosting**: Run `bun run build` and deploy the `dist` folder

## Contributing

When contributing to this project:

1. Create a new branch for your feature: `git checkout -b feature/your-feature`
2. Make your changes and test them locally
3. Push your changes to the repository
4. Create a pull request describing your changes

## Can I connect a custom domain to my project?

Yes! You can connect a custom domain through your hosting platform's domain settings (Vercel, Netlify, etc.).
