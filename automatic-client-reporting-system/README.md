# Automatic Client Reporting System

A full-stack automatic client reporting system built with React and Supabase, featuring AI-powered document summarization.

## Features

- 🔐 **Supabase Authentication** with GitHub OAuth
- 👥 **Role-based Access Control** (Admin, Client, Intern)
- 📁 **File Upload** (.txt, .csv) to Supabase Storage
- 🤖 **AI Summarization** using OpenAI GPT-3.5-turbo
- 📊 **Report History** with real-time updates
- 🛠️ **Admin Panel** for user role management
- 🎨 **Modern UI** with TailwindCSS

## Setup Instructions

### 1. Clone and Install

```bash
cd automatic-client-reporting-system
npm run setup
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Install Supabase CLI: `npm install -g supabase`
3. Run database migrations:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
4. Create a storage bucket named `client-files` in Supabase Dashboard
5. Enable GitHub OAuth in Authentication > Providers
6. Set up Edge Functions:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_api_key
   supabase functions deploy generate-summary
   ```

### 3. Environment Variables

Copy `.env.example` files and fill in your credentials:

**Frontend (.env):**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:5173` to access the application.

## Usage

1. **Login** with GitHub
2. **Create/Select** a project
3. **Upload** .txt or .csv files
4. **View** AI-generated summaries
5. **Manage** user roles (Admin only)

## Tech Stack

- **Frontend:** React, TailwindCSS, Lucide Icons
- **Backend:** Supabase (Database, Auth, Storage, Edge Functions)
- **AI:** OpenAI GPT-3.5-turbo
- **Build Tool:** Vite

## Project Structure

```
automatic-client-reporting-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── App.jsx
│   └── package.json
├── supabase/
│   ├── functions/
│   └── migrations/
└── README.md
```

## License

MIT License