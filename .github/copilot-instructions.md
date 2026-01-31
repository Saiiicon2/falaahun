# Copilot Custom Instructions

This file provides custom instructions for GitHub Copilot in this workspace.

## Project Overview

Dawah CRM - A comprehensive Customer Relationship Management system for Dawah organizations.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript + PostgreSQL
- Frontend port: 5173
- Backend port: 3000

## Code Style & Conventions

- Use TypeScript for all new code
- Follow ESLint configuration in each project
- Use functional components in React
- Use React hooks for state management
- Use Tailwind CSS for styling
- Use absolute imports where possible

## Project Structure

**Frontend (/frontend):**
- `/src/components` - Reusable React components
- `/src/pages` - Page-level components
- `/src/hooks` - Custom React hooks
- `/src/services` - API service calls
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions

**Backend (/backend):**
- `/src/routes` - API route definitions
- `/src/controllers` - Request handlers
- `/src/models` - Database models
- `/src/db` - Database connection
- `/src/middleware` - Express middleware
- `/src/types` - TypeScript type definitions

## Key Features to Implement

1. **Contacts Management** - CRUD operations, custom fields, companies, labels
2. **Activities** - Log calls, emails, social media, WhatsApp, notes
3. **Projects & Deals** - Pipeline management, fundraising tracking
4. **Financial Tracking** - Pledges, donations, revenue reporting
5. **Team Collaboration** - Activity history, team views
6. **Reporting** - Analytics dashboards, activity summaries

## Naming Conventions

- React components: PascalCase (e.g., ContactForm.tsx)
- Functions/variables: camelCase (e.g., fetchContacts)
- Types/Interfaces: PascalCase (e.g., Contact, Activity)
- Files: lowercase with hyphens for components (e.g., contact-form.tsx)
- Database tables: lowercase with underscores (e.g., contacts, pipeline_stages)

## Database Schema Notes

Tables needed:
- contacts
- organizations
- activities
- projects
- pipeline_stages
- deals
- pledges
- custom_fields
- users
- teams
