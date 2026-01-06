# Testing Setup Guide

## Overview
All test scripts now support environment-based credential configuration for better security practices.

## Quick Start

### Option 1: Using .env.test File (Recommended for Local Development)

1. Copy the template:
```bash
cp .env.test.example .env.test
```

2. Edit `.env.test` with your actual test credentials:
```bash
ADMIN_EMAIL=admin@uty.ac.id
ADMIN_PASSWORD=password123
MAHASISWA_EMAIL=mahasiswa1@uch.ac.id
MAHASISWA_PASSWORD=mhs123
BASE_URL=https://dev-apps.utycreative.cloud/api
```

3. Run tests normally:
```bash
./test_events_dashboard.sh
```

### Option 2: Using Environment Variables

Export credentials before running tests:
```bash
export ADMIN_EMAIL=admin@uty.ac.id
export ADMIN_PASSWORD=password123
./test_events_dashboard.sh
```

### Option 3: Inline (One-time)

```bash
ADMIN_PASSWORD=password123 ./test_events_dashboard.sh
```

## Default Behavior

If no credentials are provided, scripts will use default values:
- **Admin Email:** `admin@uty.ac.id`
- **Admin Password:** `password123` (from seed data)
- **Mahasiswa Email:** `mahasiswa1@uch.ac.id`
- **Mahasiswa Password:** `mhs123` (from seed data)
- **Base URL:** `https://dev-apps.utycreative.cloud/api`

## Security Best Practices

✅ **DO:**
- Use `.env.test` for local development
- Keep `.env.test` private (already in `.gitignore`)
- Use environment variables in CI/CD pipelines
- Rotate test credentials periodically

❌ **DON'T:**
- Commit `.env.test` to git
- Hardcode credentials in scripts
- Use production credentials in test scripts
- Share credentials via chat/email

## Available Test Scripts

| Script | Purpose |
|--------|---------|
| `test_events.sh` | Basic event system flow |
| `test_events_cases.sh` | Advanced scenarios (quota, validation) |
| `test_events_dashboard.sh` | Dashboard stats endpoint |

## Credential Sources (Priority Order)

1. **`.env.test` file** - Loaded first if exists
2. **Environment variables** - Checked second
3. **Default values** - Used as fallback

## Notes

- These credentials match the seed data in `src/db/seed.ts`
- Test accounts are created automatically when running migrations
- For CI/CD, use GitHub Secrets or similar secure storage

## Troubleshooting

**Problem:** "Login Failed"
- **Solution:** Verify credentials match seed data
- Check `src/db/seed.ts` for actual passwords
- Ensure database has been seeded

**Problem:** "Unauthorized"
- **Solution:** Token might be expired
- Scripts auto-login on each run
- Check if API is accessible

---

For security incident history, see: [Implementation Plan](file:///Users/zaq/.gemini/antigravity/brain/c8c1a7b1-daf5-4f26-8ad5-04834843928f/implementation_plan.md)
