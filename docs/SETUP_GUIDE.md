# Capture Studio - Setup Guide

## Local Development Setup

### 1. Requirements
- Operating System: Windows, macOS, or Linux
- Node.js: 18.0.0 or higher
- Git

### 2. Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "CAPTURE STUDIO"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   > **Note**: Guest mode works 100% offline without setting Supabase environment variables.

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

5. **Execute Test Suite:**
   ```bash
   npm test
   ```

6. **Create Production Build:**
   ```bash
   npm run build
   ```
