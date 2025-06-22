# Lead Wise CRM

A modern SaaS CRM powered by Firebase and AI, designed for comprehensive lead management and intelligent sales strategies.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0-green.svg)

## 🚀 Features

- **Secure Authentication**: Robust user management with Firebase Auth.
- **Dynamic Dashboard**: Real-time overview of key metrics and activities.
- **Advanced Contact Management**: Create, edit, and manage contacts with ease.
- **Data Import/Export**: Bulk import contacts via CSV and export data to Excel.
- **AI-Powered Insights**:
  - Automated lead scoring with Google Gemini.
  - AI-generated sales strategies for each contact.
- **In-Depth Analytics**: Visualize sales funnels, lead sources, and performance trends.
- **Customization**: Custom fields for contacts and configurable settings.
- **Internationalization**: Full support for English (en) and French (fr).

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15+ (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn/ui](https://ui.shadcn.com/) for components.
- **Backend & DB**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Functions)
- **AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **State Management**: [TanStack Query v5](https://tanstack.com/query/latest) for server state.
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.
- **Charts**: [Recharts](https://recharts.org/)
- **Internationalization**: [next-intl](https://next-intl.vercel.app/)
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Component Library**: Storybook

## 🚀 Getting Started

### Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
```

### Installation

1.  Clone the repository

    ```bash
    git clone https://github.com/adamsbarry18/lead-wise-crm.next.git
    cd lead-wise-crm.next
    ```

2.  Install dependencies

    ```bash
    npm install
    ```

3.  Set up environment variables

    ```bash
    # Copy the example file. This will be ignored by git.
    cp .env.example .env.local
    ```

    Fill in your Firebase and Google Gemini API credentials in `.env.local`.

4.  Run the development server

    ```bash
    npm run dev
    ```

## 🐳 Docker Deployment

### Prerequisites

```bash
docker >= 20.0.0
docker-compose >= 2.0.0
```

### Quick Start with Docker

1. **Clone the repository**

   ```bash
   git clone https://github.com/adamsbarry18/lead-wise-crm.next.git
   cd lead-wise-crm.next
   ```

2. **Set up environment variables**

   Create a `.env` file in the root directory with your Firebase and Google Gemini API credentials:

   ```bash
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id

   # Google Gemini AI
   GOOGLE_GENAI_API_KEY=your_google_genai_api_key

   # Application URL (optional, defaults to http://localhost:3000)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Build and start the application**

   ```bash
   docker-compose up --build
   ```

4. **Access the application**

   Navigate to **http://localhost:3000** in your browser to access the Lead Wise CRM application.

### Docker Commands

```bash
# Start the application
docker-compose up

# Start in background
docker-compose up -d

# Stop the application
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f app

# Stop and remove volumes
docker-compose down -v
```

### Docker Configuration

The application uses a multi-stage Dockerfile for optimized production builds:

- **Stage 1 (deps)**: Installs dependencies
- **Stage 2 (builder)**: Builds the Next.js application
- **Stage 3 (runner)**: Creates the production runtime with minimal footprint

The `docker-compose.yml` file includes:

- Application container with all necessary environment variables
- Volume mounts for development
- Network configuration
- Optional Redis service (commented out)

### Environment Variables for Docker

Make sure your `.env` file contains all required variables:

| Variable                       | Description                  | Required                               |
| ------------------------------ | ---------------------------- | -------------------------------------- |
| `FIREBASE_API_KEY`             | Firebase API key             | Yes                                    |
| `FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | Yes                                    |
| `FIREBASE_PROJECT_ID`          | Firebase project ID          | Yes                                    |
| `FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | Yes                                    |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes                                    |
| `FIREBASE_APP_ID`              | Firebase app ID              | Yes                                    |
| `GOOGLE_GENAI_API_KEY`         | Google Gemini AI API key     | Yes                                    |
| `NEXT_PUBLIC_APP_URL`          | Application URL              | No (defaults to http://localhost:3000) |

## 📥 Data Import

You can bulk-import contacts using a CSV file. Go to the Contacts page and use the "Import" feature.

### Contact Import Schema

The CSV file must have a header row with the following columns. The order of columns does not matter.

| Header                    | Required | Type     | Description                                                                    | Example                |
| ------------------------- | -------- | -------- | ------------------------------------------------------------------------------ | ---------------------- | ---------------------------- |
| `id`                      | No       | `string` | Provide an existing contact ID to update it. Leave empty for new contacts.     | `abcdef1234567890`     |
| `fullName`                | **Yes**  | `string` | The full name of the contact.                                                  | `John Doe`             |
| `type`                    | No       | `string` | One of: `Prospect`, `Lead`, `MQL`, `Customer`, `Partner`. Default: `Prospect`. | `Lead`                 |
| `jobTitle`                | No       | `string` | The contact's job title.                                                       | `Marketing Director`   |
| `email`                   | No       | `string` | A valid email address.                                                         | `john.doe@example.com` |
| `phone`                   | No       | `string` | The contact's phone number.                                                    | `+1 123 456 7890`      |
| `tags`                    | No       | `string` | A list of tags separated by a pipe (`                                          | `).                    | `marketing\|lead\|budget-q3` |
| `timezone`                | No       | `string` | The contact's timezone (e.g., from IANA database).                             | `Europe/Paris`         |
| `lastCommunicationDate`   | No       | `date`   | The date of the last interaction in `YYYY-MM-DD` format.                       | `2024-05-21`           |
| `lastCommunicationMethod` | No       | `string` | The method used for the last interaction.                                      | `Email`                |
| `communicationSummary`    | No       | `string` | A summary of the last interaction.                                             | `Discussed Q3 budget.` |
| `communicatedBy`          | No       | `string` | The agent who had the last interaction.                                        | `Jane Smith`           |

### Testing with Sample Data

To quickly test the application with realistic data, you can import the sample file located at `data/init-contact.csv`. This file contains 20 sample contacts and is ready to be imported.

_Note: You can also create a `contacts_import_template.csv` file in the `/public` directory to offer a downloadable template for your users._

## 📁 Project Structure

```bash
├── src/
│ ├── ai/                     # AI integration with Genkit
│ │ ├── flows/                # AI workflow definitions
│ │ └── ai-instance.ts        # AI configuration
│ ├── app/                    # Next.js app router
│ │ ├── (app)/                # Protected routes (dashboard, contacts, etc.)
│ │ └── (auth)/               # Authentication routes (login, signup)
│ ├── components/
│ │ ├── providers/            # React context providers (Auth, Theme)
│ │ └── ui/                   # Reusable UI components (from Shadcn)
│ ├── hooks/                  # Custom React hooks
│ ├── i18n/                   # Internationalization setup
│ ├── lib/                    # Utility functions (Firebase, helpers)
│ └── types/                  # TypeScript type definitions
├── messages/                 # i18n translation files (en.json, fr.json)
├── public/                   # Static assets
├── scripts/                  # Shell scripts for Docker
└── ...                       # Root configuration files
```

## 🔐 Security & Compliance

- GDPR compliant data handling
- End-to-end encryption for sensitive data
- Regular security audits
- Comprehensive audit logging

## 🌍 Internationalization

Currently supported languages:

- English (en)
- French (fr)
