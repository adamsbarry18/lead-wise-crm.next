# LeadMaster CRM

A modern SaaS CRM powered by Firebase and AI, designed for comprehensive lead management and intelligent sales strategies.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## 🚀 Features

### 💼 Business Management

- Company profile creation and management
- Multi-user access with role-based permissions
- Secure authentication with Firebase Auth
- Customizable business settings

### 👥 Contact Management

- Customizable contact forms with drag-and-drop field builder
- Advanced contact listing with 50+ customizable columns
- Multi-criteria filtering and saved views
- Automated lead scoring powered by Google Gemini
- AI-generated sales strategies for each contact

### 📊 Analytics Dashboard

- Real-time performance metrics
- Activity tracking (emails, calls, meetings)
- Dynamic KPIs and conversion rates
- Custom report generation

### 🤖 AI Integration

- Automated lead scoring
- Intelligent sales strategy generation
- Communication analysis and insights
- Personalized action plans

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Shadcn UI
- **Backend**: Firebase Functions
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini
- **Internationalization**: i18n (EN/FR)

## 🚀 Getting Started

### Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/lead-master-crm.git
cd lead-master-crm
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Firebase and Google Gemini API credentials.

4. Run the development server

```bash
npm run dev
```

## 📚 Documentation

Detailed documentation is available in the `/docs` directory:

- [Architecture Overview](docs/architecture.md)
- [Firebase Setup](docs/firebase-setup.md)
- [AI Integration](docs/ai-integration.md)
- [Deployment Guide](docs/deployment.md)

## 🔐 Security & Compliance

- GDPR compliant data handling
- End-to-end encryption for sensitive data
- Regular security audits
- Comprehensive audit logging

## 🌍 Internationalization

Currently supported languages:

- English (en)
- French (fr)

```bash
├── src/
│ ├── ai/ # AI integration modules
│ │ ├── flows/ # AI workflow definitions
│ │ │ ├── generate-sales-strategy.ts
│ │ │ └── score-lead.ts
│ │ └── ai-instance.ts # AI configuration
│ ├── app/ # Next.js app router
│ │ ├── (app)/ # Protected routes
│ │ │ ├── analytics/ # Analytics dashboard
│ │ │ ├── contacts/ # Contact management
│ │ │ ├── dashboard/ # Main dashboard
│ │ │ └── settings/ # App settings
│ │ └── (auth)/ # Authentication routes
│ ├── components/
│ │ ├── providers/ # React context providers
│ │ └── ui/ # Reusable UI components
│ ├── hooks/ # Custom React hooks
│ ├── i18n/ # Internationalization
│ ├── lib/ # Utility functions
│ ├── services/ # API services
│ └── types/ # TypeScript definitions
├── messages/ # i18n translation files
│ ├── en.json
│ └── fr.json
├── docs/ # Documentation
├── public/ # Static assets
└── config files # Various configuration files
```
