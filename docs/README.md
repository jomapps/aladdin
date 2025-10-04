# Aladdin AI Movie Production Platform - Documentation

**Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Status**: Production Ready

---

## 📚 Table of Contents

### [01. Getting Started](./01-getting-started/)
- [Quick Start Guide](./01-getting-started/quick-start.md)
- [System Requirements](./01-getting-started/requirements.md)
- [Installation Guide](./01-getting-started/installation.md)
- [Environment Configuration](./01-getting-started/environment.md)
- [First Project Setup](./01-getting-started/first-project.md)

### [02. Architecture](./02-architecture/)
- [System Overview](./02-architecture/system-overview.md)
- [Technology Stack](./02-architecture/tech-stack.md)
- [Database Architecture](./02-architecture/database.md)
- [The Brain (Neo4j)](./02-architecture/brain.md)
- [Agent System](./02-architecture/agent-system.md)

### [03. Development](./03-development/)
- [Development Workflow](./03-development/workflow.md)
- [Code Organization](./03-development/code-structure.md)
- [Testing Strategy](./03-development/testing.md)
- [Contributing Guidelines](./03-development/contributing.md)
- [Debugging Guide](./03-development/debugging.md)

### [04. AI Agents](./04-ai-agents/)
- [Agent Framework](./04-ai-agents/framework.md)
- [Vercel AI SDK Integration](./04-ai-agents/vercel-ai-sdk.md)
- [Agent Configuration](./04-ai-agents/configuration.md)
- [Custom Agents](./04-ai-agents/custom-agents.md)
- [Agent Best Practices](./04-ai-agents/best-practices.md)

### [05. Features](./05-features/)
- [Chat Interface](./05-features/chat-interface.md)
- [Content Generation](./05-features/content-generation.md)
- [Quality Validation](./05-features/quality-validation.md)
- [Media Management](./05-features/media-management.md)
- [Collaboration](./05-features/collaboration.md)

### [06. APIs](./06-apis/)
- [REST API Reference](./06-apis/rest-api.md)
- [WebSocket API](./06-apis/websocket-api.md)
- [Authentication](./06-apis/authentication.md)
- [Rate Limiting](./06-apis/rate-limiting.md)
- [API Examples](./06-apis/examples.md)

### [07. Deployment](./07-deployment/)
- [Deployment Prerequisites](./07-deployment/deployment-prerequisites.md)
- [Application Deployment](./07-deployment/application-deployment.md)
- [Production Operations](./07-deployment/production-operations.md)
- [Environment Variables](./07-deployment/environment-variables.md)
- [SSL Configuration](./07-deployment/ssl.md)
- [Monitoring Setup](./07-deployment/monitoring.md)
- [Backup Strategy](./07-deployment/backup.md)

### [08. Operations](./08-operations/)
- [Performance Monitoring](./08-operations/performance.md)
- [Logging](./08-operations/logging.md)
- [Scaling Guide](./08-operations/scaling.md)
- [Security Best Practices](./08-operations/security.md)
- [Maintenance Tasks](./08-operations/maintenance.md)

### [09. Troubleshooting](./09-troubleshooting/)
- [Common Issues](./09-troubleshooting/common-issues.md)
- [Debugging Techniques](./09-troubleshooting/debugging.md)
- [Performance Issues](./09-troubleshooting/performance.md)
- [Database Issues](./09-troubleshooting/database.md)
- [Network Issues](./09-troubleshooting/network.md)

### [10. Appendix](./10-appendix/)
- [Glossary](./10-appendix/glossary.md)
- [FAQ](./10-appendix/faq.md)
- [Migration History](./10-appendix/migration-history.md)
- [Changelog](./10-appendix/changelog.md)
- [References](./10-appendix/references.md)

---

## 🎯 Quick Navigation

### For New Users
1. Read [Quick Start Guide](./01-getting-started/quick-start.md)
2. Follow [Installation Guide](./01-getting-started/installation.md)
3. Create your [First Project](./01-getting-started/first-project.md)

### For Developers
1. Understand the [System Architecture](./02-architecture/system-overview.md)
2. Learn the [Development Workflow](./03-development/workflow.md)
3. Review [AI Agent Framework](./04-ai-agents/framework.md)

### For DevOps Engineers
1. Follow [Deployment Prerequisites](./07-deployment/deployment-prerequisites.md)
2. Configure [Application Deployment](./07-deployment/application-deployment.md)
3. Set up [Production Operations](./07-deployment/production-operations.md)

### For System Administrators
1. Review [Operations Guide](./08-operations/)
2. Understand [Backup Strategy](./07-deployment/backup.md)
3. Learn [Troubleshooting](./09-troubleshooting/)

---

## 🏗️ System Overview

Aladdin is an AI-powered movie production platform that enables anyone to create professional-quality movies through an intelligent chat interface. The system uses specialized AI agents to guide users from initial concept to final video production.

### Key Components
- **Next.js Frontend**: Modern web interface with real-time chat
- **PayloadCMS**: Headless CMS for structured data management
- **MongoDB**: Dual database architecture (structured + open collections)
- **Neo4j Brain**: Knowledge graph for validation and consistency
- **Vercel AI SDK**: Agent orchestration and LLM integration
- **Redis**: Caching and job queue management
- **Cloudflare R2**: Media storage with CDN

### Core Features
- Chat-driven content creation
- 50+ specialized AI agents
- Quality validation system
- Image and video generation
- Real-time collaboration
- Cross-project content cloning

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd aladdin

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Required Environment Variables
```bash
# OpenRouter (AI operations)
OPENROUTER_API_KEY=your_key_here

# Database
DATABASE_URI=mongodb://localhost:27017/aladdin

# Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=aladdin-media

# Brain Service
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your_brain_key
```

---

## 📖 Documentation Standards

### File Naming Conventions
- Use kebab-case for all file names
- Include section numbers in folder names (01-, 02-, etc.)
- Keep file names descriptive but concise

### Content Guidelines
- Target ~300 lines per file for readability
- Use clear headings and subheadings
- Include code examples where applicable
- Add cross-references to related documentation

### Version Control
- Update the "Last Updated" date when making changes
- Use semantic versioning for major updates
- Include change notes in the [Changelog](./10-appendix/changelog.md)

---

## 🔍 Finding Information

### Search Tips
- Use your IDE's search functionality (Ctrl+Shift+F)
- Search for specific keywords related to your issue
- Check the [Glossary](./10-appendix/glossary.md) for term definitions

### Common Questions
- **How do I deploy to production?** → [Deployment Prerequisites](./07-deployment/deployment-prerequisites.md)
- **How do I configure the application?** → [Application Deployment](./07-deployment/application-deployment.md)
- **How do I manage production?** → [Production Operations](./07-deployment/production-operations.md)
- **How do I configure AI agents?** → [Agent Configuration](./04-ai-agents/configuration.md)
- **How does the Brain work?** → [The Brain (Neo4j)](./02-architecture/brain.md)
- **What's the technology stack?** → [Technology Stack](./02-architecture/tech-stack.md)

---

## 🤝 Contributing to Documentation

### How to Contribute
1. Fork the repository
2. Create a new branch for your documentation changes
3. Update or create documentation files
4. Update this README if adding new sections
5. Submit a pull request with clear description of changes

### Documentation Review Process
- All documentation changes require review
- Check for accuracy against current implementation
- Ensure cross-references are updated
- Verify code examples work correctly

---

## 📞 Getting Help

### Self-Service Resources
- Check [Troubleshooting](./09-troubleshooting/) for common issues
- Review [FAQ](./10-appendix/faq.md) for frequently asked questions
- Search existing documentation for your topic

### Community Support
- Check the project's issue tracker
- Review discussion forums
- Consult the [References](./10-appendix/references.md) for external resources

---

## 📄 License

This documentation is part of the Aladdin project and follows the same license terms as the main project.

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Next Review**: January 4, 2026