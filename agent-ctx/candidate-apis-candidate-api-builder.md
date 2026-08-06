# Task ID: candidate-apis — Work Record

## Summary
Created 6 backend API routes for the Candidate Portal and extended the Prisma schema with 2 new models and several new fields.

## Schema Changes (prisma/schema.prisma)
- Added `userId String? @unique` to Candidate (auth link)
- Added `education String?`, `summary String?` to Candidate (resume data)
- Added `isPublic Boolean @default(true)`, `accountId String?` to JobPosting
- Added `CANDIDATE` role to User model comment
- Added `candidate Candidate?` relation to User model
- Created `CandidateApplication` model with unique constraint (candidateId, jobPostingId)
- Created `Interview` model with relations to Candidate, JobPosting, CandidateApplication
- Added Account relations for all new models

## API Routes Created
1. `src/app/api/candidate/dashboard/route.ts` — GET
2. `src/app/api/candidate/jobs/route.ts` — GET
3. `src/app/api/candidate/applications/route.ts` — GET, POST
4. `src/app/api/candidate/interviews/route.ts` — GET
5. `src/app/api/candidate/resume/route.ts` — GET, PUT
6. `src/app/api/candidate/notifications/route.ts` — GET, PATCH

## Verification
- `bun run db:push` succeeded
- ESLint passed on all new files (pre-existing page.tsx error unrelated)
