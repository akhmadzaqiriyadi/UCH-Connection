# UCH Connection API - Feature-Based Architecture

## 📂 Folder Structure

```
src/
├── config/                 # Application configuration
│   └── index.ts           # Centralized config (port, env, swagger, etc)
│
├── features/              # Feature modules (feature-based architecture)
│   ├── health/           # Health check feature
│   │   └── health.controller.ts
│   ├── home/             # Home page feature
│   │   ├── home.controller.ts
│   │   └── home.view.ts
│   └── [feature-name]/   # Add new features here
│       ├── [feature].controller.ts   # Route handlers
│       ├── [feature].service.ts      # Business logic
│       ├── [feature].dto.ts          # Data Transfer Objects
│       └── [feature].types.ts        # Feature-specific types
│
├── lib/                   # Shared utilities
│   └── utils.ts          # Common helper functions
│
├── middlewares/           # Global middlewares
│   └── (add middleware files here)
│
├── types/                 # Shared TypeScript types
│   └── index.ts          # Global type definitions
│
└── index.ts              # Main application entry point
```

## 🎯 Adding a New Feature

To add a new feature (e.g., "users"):

1. Create folder: `src/features/users/`
2. Create files:
   - `users.controller.ts` - Route handlers
   - `users.service.ts` - Business logic
   - `users.dto.ts` - Data validation schemas
   - `users.types.ts` - TypeScript interfaces

3. Register in `src/index.ts`:
   ```typescript
   import { usersController } from './features/users/users.controller';
   
   .group('/api', (app) =>
     app
       .use(healthController)
       .use(usersController)  // Add here
   )
   ```

## 📝 File Naming Convention

- Controllers: `[feature].controller.ts`
- Services: `[feature].service.ts`
- DTOs: `[feature].dto.ts`
- Types: `[feature].types.ts`
- Views: `[feature].view.ts`

## 🚀 Benefits of This Structure

- ✅ **Scalable**: Easy to add new features
- ✅ **Maintainable**: Each feature is self-contained
- ✅ **Clear separation**: Controllers, services, types are organized
- ✅ **Testable**: Easy to test individual features
- ✅ **Team-friendly**: Multiple developers can work on different features
