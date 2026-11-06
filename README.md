# TaskFlow AI

> Lightweight AI-powered project management & development tracking system

## Features

- Kanban board: Backlog, To Do, In Progress, UAT, AI Review, QA/BA, Completed
- AI Code Review before QA using OpenAI/DeepSeek/Claude
- Git integration: GitHub, Bitbucket, GitLab via webhooks
- AI Assistant chat, test case generation, daily summaries
- Real-time Socket.IO notifications
- Role-based access: Admin, PM, Team Lead, Developer, QA/BA

## Quick Start

```bash
cp .env.example .env
docker compose up -d
docker compose exec backend npx prisma migrate deploy
```

## Support

Donate via [PayPal](https://www.paypal.me/testingatwnl)

## License

MIT
