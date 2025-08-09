# Football Teamaker - Database Schema

## Overview
This document contains the complete database schema for the Football Teamaker application based on the Neon PostgreSQL database structure.

## Tables Summary

| Table | Description | Primary Key | Foreign Keys |
|-------|-------------|-------------|--------------|
| `users` | User accounts and profiles | id | - |
| `teams` | Football teams | id | created_by → users(id), captain_id → users(id) |
| `players` | Team players (junction between users and teams) | id | user_id → users(id), team_id → teams(id) |
| `matches` | Match schedules and results | id | team_id → teams(id) |
| `match_players` | Player participation in matches | id | match_id → matches(id), player_id → players(id) |
| `player_ratings` | Player performance ratings | id | Multiple FKs to players, matches, users |
| `team_formations` | Team tactical formations | id | team_id → teams(id) |
| `team_positions` | Player positions in formations | id | team_id → teams(id), player_id → players(id) |
| `team_invitations` | Team invitation system | id | team_id → teams(id), invited_user_id → users(id), invited_by → users(id) |
| `notifications` | User notifications | id | user_id → users(id) |

## Detailed Table Structures

### 1. users
**Primary Table - User Management**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    positions TEXT[] DEFAULT '{}',
    availability_status VARCHAR(20) DEFAULT 'available'
);
```

### 2. teams
**Team Management**
```sql
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    team_size INTEGER DEFAULT 11,
    authorized_members INTEGER[] DEFAULT '{}',
    captain_id INTEGER REFERENCES users(id)
);
```

### 3. players
**Junction Table - Users in Teams**
```sql
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    team_id INTEGER REFERENCES teams(id),
    position VARCHAR(50),
    skill_level INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. matches
**Match Management**
```sql
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    match_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opponent_team VARCHAR(100),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0
);
```

### 5. match_players
**Player Participation in Matches**
```sql
CREATE TABLE match_players (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id),
    player_id INTEGER REFERENCES players(id),
    team_side VARCHAR(1) CHECK (team_side IN ('A', 'B')),
    position VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. player_ratings
**Performance Rating System**
```sql
CREATE TABLE player_ratings (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    rating NUMERIC DEFAULT 0.0,
    notes TEXT,
    rated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rated_player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    rater_player_id INTEGER REFERENCES players(id) ON DELETE CASCADE
);
```

### 7. team_formations
**Tactical Formations**
```sql
CREATE TABLE team_formations (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    formation_name VARCHAR(20) NOT NULL,
    team_size INTEGER NOT NULL DEFAULT 11,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. team_positions
**Player Positions in Formations**
```sql
CREATE TABLE team_positions (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    position_id VARCHAR(50) NOT NULL,
    position_name VARCHAR(50) NOT NULL,
    x_coordinate NUMERIC NOT NULL,
    y_coordinate NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, position_id)
);
```

### 9. team_invitations
**Team Invitation System**
```sql
CREATE TABLE team_invitations (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    invited_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invited_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. notifications
**User Notification System**
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Foreign Key Relationships & Cascade Rules

### Critical Delete Relationships
| Source Table | Source Column | Target Table | Target Column | Delete Rule | Update Rule |
|--------------|---------------|--------------|---------------|-------------|-------------|
| **notifications** | user_id | users | id | **CASCADE** | NO ACTION |
| **player_ratings** | match_id | matches | id | **CASCADE** | NO ACTION |
| **player_ratings** | player_id | players | id | **CASCADE** | NO ACTION |
| **player_ratings** | rated_player_id | players | id | **CASCADE** | NO ACTION |
| **player_ratings** | rater_player_id | players | id | **CASCADE** | NO ACTION |
| **team_formations** | team_id | teams | id | **CASCADE** | NO ACTION |
| **team_invitations** | invited_user_id | users | id | **CASCADE** | NO ACTION |
| **team_invitations** | team_id | teams | id | **CASCADE** | NO ACTION |
| **team_positions** | player_id | players | id | **CASCADE** | NO ACTION |
| **team_positions** | team_id | teams | id | **CASCADE** | NO ACTION |

### No Cascade Relationships (Require Manual Handling)
| Source Table | Source Column | Target Table | Target Column | Delete Rule |
|--------------|---------------|--------------|---------------|-------------|
| **match_players** | match_id | matches | id | **NO ACTION** |
| **match_players** | player_id | players | id | **NO ACTION** |
| **matches** | team_id | teams | id | **NO ACTION** |
| **player_ratings** | rated_by | users | id | **NO ACTION** |
| **players** | team_id | teams | id | **NO ACTION** |
| **players** | user_id | users | id | **NO ACTION** ⚠️ |
| **team_invitations** | invited_by | users | id | **NO ACTION** |
| **teams** | captain_id | users | id | **NO ACTION** |
| **teams** | created_by | users | id | **NO ACTION** |

## Critical Issues Identified

### 1. User Deletion Problem
**Issue**: `players.user_id` has `NO ACTION` on delete, causing foreign key constraint violations.

**Current Dependencies Chain for User Deletion**:
```
users (target for deletion)
  ↓
players (user_id → users.id) [NO ACTION] ⚠️
  ↓
├── player_ratings (player_id → players.id) [CASCADE] ✅
├── player_ratings (rated_player_id → players.id) [CASCADE] ✅  
├── player_ratings (rater_player_id → players.id) [CASCADE] ✅
├── match_players (player_id → players.id) [NO ACTION] ⚠️
└── team_positions (player_id → players.id) [CASCADE] ✅
```

**Required Manual Deletion Order**:
1. Delete `match_players` records
2. Delete `player_ratings` records (automatically cascades)
3. Delete `team_positions` records (automatically cascades)
4. Delete `players` records
5. Update `teams` SET `created_by` = NULL, `captain_id` = NULL
6. Update `teams` SET `authorized_members` = array_remove()
7. Update `team_invitations` SET `invited_by` = NULL
8. Delete from `users`

### 2. Team Deletion Dependencies
Teams can be safely deleted as most related tables have CASCADE rules.

### 3. Match Deletion Dependencies
**Issue**: `match_players` has `NO ACTION`, requiring manual cleanup.

## Indexes
- All primary keys have automatic unique indexes
- `users.email` and `users.username` have unique indexes
- `team_positions` has unique index on `(team_id, position_id)`

## Recommendations

### 1. ✅ IMPLEMENTED: Auto-Fixing Foreign Key Constraints
The user deletion function now automatically migrates critical constraints to CASCADE:

**Auto-Migration Logic in `userDB.delete()`:**
```sql
-- Fix players.user_id relationship if needed
IF EXISTS (constraint with NO ACTION) THEN
  ALTER TABLE players DROP CONSTRAINT players_user_id_fkey;
  ALTER TABLE players ADD CONSTRAINT players_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END IF;

-- Fix match_players.player_id relationship if needed  
IF EXISTS (constraint with NO ACTION) THEN
  ALTER TABLE match_players DROP CONSTRAINT match_players_player_id_fkey;
  ALTER TABLE match_players ADD CONSTRAINT match_players_player_id_fkey 
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
END IF;
```

### 2. ✅ OPTIMIZED: Simplified User Deletion Process
**Before (Manual Transaction):**
```sql
BEGIN;
-- 1. Get player IDs
-- 2. Manually delete player_ratings
-- 3. Manually delete match_players  
-- 4. Manually delete team_positions
-- 5. Manually delete players
-- 6. Update teams (NULL values)
-- 7. Delete user
COMMIT;
```

**After (CASCADE + Minimal Manual Updates):**
```sql
BEGIN;
-- 1. Auto-fix constraints (one-time migration)
-- 2. Update teams SET created_by/captain_id = NULL (by design)
-- 3. Update teams authorized_members array
-- 4. Update team_invitations SET invited_by = NULL (by design)
-- 5. DELETE FROM users (CASCADE handles the rest automatically)
COMMIT;
```

**CASCADE Chain After Optimization:**
```
DELETE FROM users
  ↓ CASCADE
players (user_id)
  ↓ CASCADE  
├── player_ratings (all player_id columns)
├── match_players (player_id)
└── team_positions (player_id)

users
  ↓ CASCADE
├── notifications (user_id)
└── team_invitations (invited_user_id)
```

### 3. Design Decisions: Why Some Constraints Stay NO ACTION
These relationships intentionally remain NO ACTION to preserve data integrity:
- `teams.created_by → users.id` - Set to NULL to preserve team history
- `teams.captain_id → users.id` - Set to NULL, team can elect new captain
- `team_invitations.invited_by → users.id` - Set to NULL to preserve invitation history

### 4. Data Integrity
- ✅ Self-healing constraints: Function auto-migrates outdated constraints
- ✅ Atomic operations: All operations wrapped in transactions
- ✅ Cascade optimization: Automatic cleanup of dependent records
- ✅ Selective preservation: Critical business data preserved with NULL updates

---
*Generated on: $(date)*
*Database: Neon PostgreSQL*
*Application: Football Teamaker*
