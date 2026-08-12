---
Task ID: s2b-c
Agent: Mock Data Cleanup Agent
Task: Remove mock data from ApiManagement, FleetManagement, fix client download

Work Log:
- Removed MOCK_KEYS (6 fake API keys), MOCK_WEBHOOKS (3 fake webhooks), and MOCK_STATS (4 fake stat cards with fabricated numbers) from ApiManagement.tsx
- Replaced with empty arrays initialized via useState, added a brief loading skeleton state with useEffect timer
- Added professional "Configuration available via platform settings" notice card with Settings icon explaining the SaaS platform feature
- Replaced API keys table with EmptyState component showing "No API keys configured" when empty (table + filters only appear when keys exist)
- Replaced webhooks table with EmptyState showing "No webhooks configured" when empty
- Replaced MOCK_STATS with PLATFORM_STATS showing dashes/zeros instead of fake metrics
- Removed the API Usage Timeline placeholder card (was showing "chart will render here")
- Removed MOCK_VEHICLES (5 fake vehicles with Indian registration numbers) and MOCK_SERVICE_RECORDS (5 fake service records) from FleetManagement.tsx
- Removed hardcoded driver names array (Rajesh Kumar, Suresh M, etc.) that was used in the assign driver dropdown
- Replaced with empty arrays, added loading skeleton state
- Added professional "Configuration available via platform settings" notice card for fleet
- Replaced vehicle table with EmptyState showing "No vehicles registered" when empty
- Replaced service records table with EmptyState showing "No service records" when empty
- Changed "Schedule Service" button to show toast: "Fleet management is available in the enterprise plan. Contact your account manager."
- Removed the Schedule Service dialog entirely (was showing "module coming soon")
- Changed Assign Driver dialog from dropdown (with hardcoded names) to a simple text input
- Fixed ClientLayout.tsx download button: replaced `toast.info('File download is not available yet')` with actual file download via `/api/uploads/{filePath}`
- Updated document state type to include `filePath`, `storagePath`, and `source` fields
- Updated API response mapping to preserve these fields from the backend response
- Added `handleDownload` function that picks the correct path based on document source and opens via uploads endpoint
- Verified: `bun run lint` passes clean with no errors

Stage Summary:
- All mock data removed from ApiManagement and FleetManagement modules - no fake API keys, webhooks, vehicles, service records, or statistics visible
- Both modules show professional empty states with clear messaging that these are SaaS platform features
- Client download button now attempts real file download via `/api/uploads/` endpoint with proper fallback error toast
- FleetManagement Schedule Service button shows honest enterprise plan message
- No lint errors introduced