# R2 File Manager

A modern, open-source web-based file manager for [Cloudflare R2](https://developers.cloudflare.com/r2/) storage. Built with Next.js, shadcn/ui, and the AWS S3 SDK.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Folder Navigation** — Browse your bucket with folder-by-folder navigation, breadcrumb path bar, and back button
- **File Operations** — Upload, download, rename, and delete files
- **Bulk Delete** — Select multiple files and delete them at once
- **Folder & Bucket Analytics** — See total size, file count, and average file size for the entire bucket and per-folder
- **Folder Size Display** — Each folder shows its total size and file count inline
- **Search** — Filter files in the current directory
- **Sorting** — Sort by name, size, or last modified date
- **Multi-Bucket Support** — Switch between all your R2 buckets from a dropdown
- **Dark/Light Theme** — Toggle between dark and light mode
- **Responsive** — Works on desktop and mobile screens

## Screenshots

<!-- Add screenshots here -->

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Cloudflare](https://dash.cloudflare.com/) account with R2 enabled
- R2 API credentials (Access Key ID + Secret Access Key)

### 1. Clone the repository

```bash
git clone https://github.com/abu-tahir-0/r2-file-manager
cd r2-file-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Cloudflare R2 credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

**Where to find these values:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the sidebar
3. **Account ID** is shown in the right sidebar on the R2 overview page
4. Click **Manage R2 API Tokens** → **Create API Token**
5. Give it **Object Read & Write** permissions for your buckets
6. Copy the **Access Key ID** and **Secret Access Key**

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/)
3. Add environment variables (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) in Project Settings → Environment Variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> **Note:** For Docker, enable standalone output in `next.config.ts`:
> ```ts
> const nextConfig: NextConfig = {
>   output: "standalone",
> };
> ```

### Self-Hosted

Any platform that supports Node.js can run this app. Just set the environment variables and run `npm start` after building.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── buckets/          # GET — List all R2 buckets
│   │   └── files/
│   │       ├── route.ts      # GET — List files & folders in a prefix
│   │       ├── delete/       # POST — Delete one or more files
│   │       ├── download/     # GET — Stream file download
│   │       ├── rename/       # POST — Rename/move a file
│   │       ├── stats/        # GET — Folder/bucket size stats
│   │       └── upload/       # POST — Upload a file
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── file-manager.tsx      # Main orchestrator component
│   ├── file-table.tsx        # File/folder listing table
│   ├── file-toolbar.tsx      # Search, bucket selector, breadcrumbs
│   ├── rename-dialog.tsx     # Rename modal
│   ├── upload-dialog.tsx     # Upload modal
│   ├── theme-provider.tsx    # Dark/light theme
│   ├── theme-toggle.tsx      # Theme switch button
│   └── ui/                   # shadcn/ui primitives
└── lib/
    ├── r2.ts                 # R2/S3 SDK operations
    └── utils.ts              # Utility functions
```

## API Reference

All API routes are server-side Next.js route handlers. They are **not** meant to be exposed publicly without authentication in production.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buckets` | List all R2 buckets |
| GET | `/api/files?bucket=X&prefix=Y` | List files/folders at prefix |
| GET | `/api/files/stats?bucket=X&prefix=Y` | Get size/count for a prefix |
| GET | `/api/files/stats?bucket=X&prefixes=A,B` | Batch stats for multiple prefixes |
| GET | `/api/files/download?bucket=X&key=Y` | Download a file |
| POST | `/api/files/upload` | Upload a file (multipart form) |
| POST | `/api/files/delete` | Delete files `{ bucket, keys[] }` |
| POST | `/api/files/rename` | Rename a file `{ bucket, oldKey, newKey }` |

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **S3 Client:** [@aws-sdk/client-s3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- **Toasts:** [Sonner](https://sonner.emilkowal.dev/)

## Security Notes

- **No built-in auth** — This app assumes you'll deploy it behind your own authentication layer (VPN, Cloudflare Access, Vercel Auth, etc.). The API routes have no authentication checks.
- **Server-side only** — R2 credentials are only used on the server. They are never exposed to the client browser.
- **Input validation** — All API routes validate parameters before executing operations.
- **Content-Disposition** — Download filenames are sanitized to prevent header injection.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
