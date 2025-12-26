# localStorage Usage Analysis & Migration Plan

## Summary
Conducted thorough analysis of all localStorage usage in the frontend codebase.

## Current localStorage Usage

### 1. **Authentication Tokens** ✅ KEEP IN localStorage
**Location**: `frontend/contexts/AuthContext.tsx`, `frontend/api.ts`

**Keys**:
- `klyx_access_token` - JWT access token (1 hour expiry)
- `klyx_refresh_token` - JWT refresh token (30 days expiry)

**Usage**:
- Stored after login/signup
- Retrieved for API authentication headers
- Removed on logout

**Decision**: ✅ **KEEP in localStorage**
**Reason**: 
- Tokens are temporary and session-specific
- Standard practice for JWT storage
- No need for database persistence
- Browser-specific security boundary

---

### 2. **Debt Optimizer Scenarios** ⚠️ MIGRATE TO DATABASE
**Location**: `frontend/utils/debtStorage.ts`

**Keys**:
- `klyx_debt_optimizer_current` - Current working scenario
- `klyx_debt_optimizer_scenarios` - Saved scenarios list
- `klyx_debt_optimizer_settings` - User preferences

**Data Stored**:
```typescript
interface SavedScenario {
  id: string;
  name: string;
  debts: Debt[];
  monthlyBudget: number;
  createdAt: string;
  updatedAt: string;
}
```

**Current Issues**:
- User loses data when switching browsers/devices
- No cloud backup
- Limited to ~5-10MB browser storage
- Data not tied to user account

**Decision**: ⚠️ **MIGRATE TO DATABASE**
**Priority**: HIGH

**Migration Plan**:
1. Create `debt_scenarios` table with user_id FK
2. Create API endpoints:
   - `GET /api/debt-optimizer/scenarios` - Get user's scenarios
   - `POST /api/debt-optimizer/scenarios` - Create/update scenario
   - `DELETE /api/debt-optimizer/scenarios/:id` - Delete scenario
   - `GET /api/debt-optimizer/current` - Get current working scenario
   - `PUT /api/debt-optimizer/current` - Save current scenario
3. Update frontend to use API instead of localStorage
4. Add migration script to import existing localStorage data

---

### 3. **Portfolio Data** ✅ ALREADY MIGRATED
**Location**: Previously in `frontend/app/stocks/page.tsx`, `frontend/app/portfolio/page.tsx`

**Keys**:
- `user_portfolio` - List of stock names

**Status**: ✅ **ALREADY MIGRATED**
- Now using database API (`/api/portfolio`)
- Persists across devices
- Tied to user account

---

## Migration Priority

### HIGH PRIORITY
1. **Debt Optimizer Scenarios** ⚠️
   - User data loss risk
   - Multi-device sync needed
   - Current implementation incomplete

### LOW PRIORITY (Keep in localStorage)
1. **Authentication Tokens** ✅
   - Security best practice
   - Temporary by nature
   - Browser-specific

### COMPLETED
1. **Portfolio Data** ✅
   - Already migrated to database
   - Working correctly

---

## Recommended Database Schema

### Table: `debt_scenarios`

```sql
CREATE TABLE debt_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    debts JSON NOT NULL,
    monthly_budget DECIMAL(15, 2) NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

CREATE INDEX idx_debt_scenarios_user ON debt_scenarios(user_id);
CREATE INDEX idx_debt_scenarios_current ON debt_scenarios(user_id, is_current);
```

**Fields Explanation**:
- `user_id`: Links to authenticated user
- `name`: User-provided scenario name
- `debts`: JSON array of debt objects
- `monthly_budget`: User's available budget
- `is_current`: Marks the active working scenario (only one per user)
- Timestamps for tracking

### Table: `debt_optimizer_settings` (Optional)

```sql
CREATE TABLE debt_optimizer_settings (
    user_id VARCHAR(36) PRIMARY KEY,
    currency VARCHAR(10) DEFAULT 'INR',
    default_method VARCHAR(20) DEFAULT 'avalanche',
    auto_save BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Implementation Steps

### Phase 1: Backend Setup
1. ✅ Create database models
2. ✅ Create API endpoints
3. ✅ Add authentication middleware
4. ✅ Test endpoints

### Phase 2: Frontend Integration
1. Update `debtStorage.ts` to use API instead of localStorage
2. Add loading states for async operations
3. Handle offline scenarios gracefully
4. Test multi-device sync

### Phase 3: Migration
1. Create migration endpoint to import localStorage data
2. Add one-time migration prompt in UI
3. Backup localStorage data before migration
4. Clean up localStorage after successful migration

### Phase 4: Cleanup
1. Remove old localStorage code
2. Update documentation
3. Add unit tests for new API

---

## Files Requiring Changes

### Backend (New Files)
- `backend/models.py` - Add DebtScenario model
- `backend/debt_optimizer_routes.py` - API endpoints
- `backend/app.py` - Register blueprint

### Frontend (Modify)
- `frontend/utils/debtStorage.ts` - Replace localStorage with API calls
- `frontend/app/debt-optimizer/page.tsx` - Use API
- `frontend/api.ts` - Add debt optimizer API methods

---

## Risks & Mitigation

### Risk 1: Data Loss During Migration
**Mitigation**: 
- Keep localStorage as backup during transition
- Only clear localStorage after successful DB save
- Add export/import functionality

### Risk 2: Offline Access
**Mitigation**:
- Implement service worker for offline caching
- Show clear offline indicator
- Queue operations when offline

### Risk 3: API Performance
**Mitigation**:
- Debounce auto-save operations
- Use optimistic UI updates
- Cache responses in memory

---

## Current Status

✅ **Completed**:
- Portfolio migration to database
- Authentication tokens (staying in localStorage)

⚠️ **Pending**:
- Debt Optimizer scenarios migration (HIGH PRIORITY)

---

## Conclusion

**Total localStorage Keys Found**: 5
- 2 Authentication tokens (KEEP)
- 3 Debt Optimizer keys (MIGRATE)

**Migration Required**: YES
**Priority**: HIGH
**Estimated Effort**: 4-6 hours
**Risk Level**: MEDIUM (data backup required)
