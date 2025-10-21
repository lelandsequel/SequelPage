# CandlPage

A comprehensive professional audit and content generation suite built for C&L Strategy clients. This platform combines AI-powered analysis, security scanning, content creation, and automated lead generation into a single powerful toolset.

## Features

### SEO/AEO Audit
- Comprehensive website analysis with 0-100 scoring
- Answer Engine Optimization recommendations
- Code snippets for implementation
- Priority rankings for improvements
- Export results to CSV

### Security Scanner
- In-depth cybersecurity vulnerability detection
- CVE tracking and risk assessment
- Copy-paste remediation fixes
- Strategic security reports

### Content Suite
- AI-powered keyword research
- Press release generation
- SEO-optimized article creation
- Multiple content format support

### Lead Generator
- Intelligent business lead discovery
- Automated SEO scoring and metrics
- Detailed opportunity reports
- CSV export functionality

### Automated Discovery
- Weekly automated lead generation campaigns
- Industry analysis and identification
- Email delivery of reports
- Campaign management dashboard

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Claude 3.5 Sonnet & GPT-4o
- **Backend**: Supabase Edge Functions
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd candlpage
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Database Schema

The application uses Supabase with the following main tables:

- `leads` - Stores discovered business leads with SEO metrics
- `seo_audits` - SEO audit results and recommendations
- `security_scans` - Security vulnerability scan results
- `generated_content` - AI-generated content pieces
- `automated_campaigns` - Automated lead discovery campaigns
- `industry_analyses` - Industry-specific analysis reports

All tables include Row Level Security (RLS) policies for data protection.

## Edge Functions

The platform leverages Supabase Edge Functions for backend processing:

- `analyze-claude` - Claude AI integration for analysis
- `analyze-industry` - Industry analysis processing
- `automated-lead-discovery` - Weekly automated lead finding
- `enrich-lead-metrics` - Lead data enrichment
- `find-leads` - Manual lead discovery
- `generate-content` - Content generation
- `send-campaign-report` - Email report delivery

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Security

- Password-protected access
- Row Level Security (RLS) on all database tables
- Secure API key management through environment variables
- HTTPS-only communication

## License

© 2025 C&L Strategy. All rights reserved.

## Support

For support, please contact C&L Strategy
