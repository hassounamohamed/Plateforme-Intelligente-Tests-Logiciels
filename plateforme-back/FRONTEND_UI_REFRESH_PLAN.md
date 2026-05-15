# Frontend UI Refresh Testing Plan

## Current Implementation Analysis

### Data Loading
- Initial load: on mount via `useEffect(() => { loadCahier() }, [projectId])`
- The `loadCahier()` function fetches:
  - Cahier details with all test cases
  - Statistics
  - Cahier versions
  - QA Report

### Refresh Mechanisms
1. **Manual Refresh**: `onRefresh={loadCahier}` passed to CasTestsTable
2. **Post-Operation Refresh**: After creating/updating test cases, `loadCahier()` is called
3. **Auto-Refresh**: None currently implemented

### Current Issues
1. **No Real-time Updates**: If backend changes a test case status (e.g., via test automation or another user), the UI won't reflect it until manual refresh
2. **Stale Data**: Long editing sessions could show outdated status information
3. **Missing Polling**: No background polling mechanism to keep UI in sync with backend

## Test Requirements

### Test 1: Manual Refresh After Backend Update
**Scenario**: 
1. Frontend displays test case with status "Non exécuté"
2. Backend API updates the test case to status "Réussi"
3. Frontend calls manual refresh (loadCahier)
4. Verify UI reflects the new status

### Test 2: Automatic Refresh After User Action
**Scenario**:
1. User updates test case status via UI
2. Verify API is called with new status
3. Verify UI updates immediately with new status
4. Verify refresh doesn't cause flickering or duplicate renders

### Test 3: User Story Status Reflection
**Scenario**:
1. All test cases pass (Réussi)
2. Backend transitions user story to "done"
3. After refresh, verify UI shows user story as "done"
4. Verify status propagation throughout the UI

## Recommended Improvements

### Option 1: Add Polling (Simple)
- Add `useEffect` with `setInterval` to call `loadCahier()` every 30-60 seconds
- Reduces frequency to prevent unnecessary updates

### Option 2: WebSocket Integration (Ideal)
- Add real-time update notifications via WebSocket
- Backend sends updates when test cases change
- Frontend receives updates and refreshes specific components

### Option 3: Hybrid Approach
- WebSocket for real-time updates
- Polling as fallback if WebSocket disconnects
- Manual refresh button always available

## Test Execution Plan
1. Manual Refresh Test: Use Playwright/Cypress to simulate backend change and manual refresh
2. Automatic Update Test: Verify UI updates immediately after status change
3. Status Propagation Test: Verify user story status reflects test case changes

## Implementation Status
- [x] Backend workflow verification (test_workflow.py)
- [x] Bug context attachment (test_bug_context.py)
- [x] All cases pass → done transition (test_all_success.py)
- [ ] Frontend UI refresh verification (TODO)
- [ ] Optional: Add polling mechanism
- [ ] Optional: Add WebSocket integration
