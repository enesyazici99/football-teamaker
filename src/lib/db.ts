import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Veritabanı tablolarını oluştur
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        positions TEXT[], -- Oyuncunun mevkileri (3 tane kadar)
        availability_status VARCHAR(20) DEFAULT 'available', -- available, unavailable, maybe
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Eksik sütunları ekleme migration'ı
    await addMissingColumns();

    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        captain_id INTEGER REFERENCES users(id), -- Takım kaptanı
        authorized_members INTEGER[], -- Yetkili üyeler (user_id'ler)
        team_size INTEGER DEFAULT 11, -- Takım boyutu (6-11 arası)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        invited_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invited_by INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        position VARCHAR(50),
        skill_level INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT true,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        match_date TIMESTAMP NOT NULL,
        location VARCHAR(255),
        opponent_team VARCHAR(100), -- Rakip takım adı
        status VARCHAR(50) DEFAULT 'scheduled',
        home_score INTEGER DEFAULT 0, -- Ev sahibi skoru
        away_score INTEGER DEFAULT 0, -- Deplasman skoru
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS match_players (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        team_side VARCHAR(1) CHECK (team_side IN ('A', 'B')),
        position VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- team_invitation, match_reminder, etc.
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        related_id INTEGER, -- team_id, match_id, etc.
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS player_ratings (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        rated_player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        rater_player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 10),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(match_id, rated_player_id, rater_player_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS team_formations (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        formation_name VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS team_positions (
        id SERIAL PRIMARY KEY,
        formation_id INTEGER REFERENCES team_formations(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        position_name VARCHAR(50) NOT NULL,
        position_x INTEGER NOT NULL,
        position_y INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Mevki isimlerini güncelleme migration'ı
    await updatePositionNames();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Eksik sütunları ekleyen fonksiyon
async function addMissingColumns() {
  try {
    // Users tablosuna positions sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'positions'
        ) THEN
          ALTER TABLE users ADD COLUMN positions TEXT[];
        END IF;
      END $$;
    `;

    // Users tablosuna availability_status sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'availability_status'
        ) THEN
          ALTER TABLE users ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available';
        END IF;
      END $$;
    `;

    // Players tablosuna joined_at sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'players' AND column_name = 'joined_at'
        ) THEN
          ALTER TABLE players ADD COLUMN joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `;

    // Teams tablosuna team_size sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'teams' AND column_name = 'team_size'
        ) THEN
          ALTER TABLE teams ADD COLUMN team_size INTEGER DEFAULT 11;
        END IF;
      END $$;
    `;

    // Teams tablosuna authorized_members sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'teams' AND column_name = 'authorized_members'
        ) THEN
          ALTER TABLE teams ADD COLUMN authorized_members INTEGER[] DEFAULT '{}';
        END IF;
      END $$;
    `;

    // Teams tablosuna captain_id sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'teams' AND column_name = 'captain_id'
        ) THEN
          ALTER TABLE teams ADD COLUMN captain_id INTEGER REFERENCES users(id);
        END IF;
      END $$;
    `;

    // Matches tablosuna opponent_team sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'matches' AND column_name = 'opponent_team'
        ) THEN
          ALTER TABLE matches ADD COLUMN opponent_team VARCHAR(100);
        END IF;
      END $$;
    `;

    // Matches tablosuna home_score sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'matches' AND column_name = 'home_score'
        ) THEN
          ALTER TABLE matches ADD COLUMN home_score INTEGER DEFAULT 0;
        END IF;
      END $$;
    `;

    // Matches tablosuna away_score sütunu ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'matches' AND column_name = 'away_score'
        ) THEN
          ALTER TABLE matches ADD COLUMN away_score INTEGER DEFAULT 0;
        END IF;
      END $$;
    `;

    // Player_ratings tablosuna eksik sütunları ekle
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'player_ratings' AND column_name = 'rated_player_id'
        ) THEN
          ALTER TABLE player_ratings ADD COLUMN rated_player_id INTEGER REFERENCES players(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'player_ratings' AND column_name = 'rater_player_id'
        ) THEN
          ALTER TABLE player_ratings ADD COLUMN rater_player_id INTEGER REFERENCES players(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    console.log('Missing columns added successfully');
  } catch (error) {
    console.error('Error adding missing columns:', error);
  }
}

// Mevki isimlerini güncelleyen fonksiyon
async function updatePositionNames() {
  try {
    // Önce positions sütununun var olup olmadığını kontrol et
    const hasPositionsColumn = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'positions'
      ) as exists
    `;

    if (hasPositionsColumn[0]?.exists) {
      // Kullanıcıların positions alanındaki eski mevki isimlerini güncelle
      await sql`
        UPDATE users 
        SET positions = array(
          SELECT CASE 
            WHEN pos = 'Def O Saha' THEN 'Defansif Orta Saha'
            WHEN pos = 'Hücum Orta Saha' THEN '10 Numara'
            ELSE pos
          END
          FROM unnest(positions) AS pos
        )
        WHERE 'Def O Saha' = ANY(positions) OR 'Hücum Orta Saha' = ANY(positions)
      `;
    }

    // Players tablosundaki position alanını güncelle
    await sql`
      UPDATE players 
      SET position = 'Defansif Orta Saha'
      WHERE position = 'Def O Saha'
    `;

    await sql`
      UPDATE players 
      SET position = '10 Numara'
      WHERE position = 'Hücum Orta Saha'
    `;

    // Match_players tablosundaki position alanını güncelle
    await sql`
      UPDATE match_players 
      SET position = 'Defansif Orta Saha'
      WHERE position = 'Def O Saha'
    `;

    await sql`
      UPDATE match_players 
      SET position = '10 Numara'
      WHERE position = 'Hücum Orta Saha'
    `;

    console.log('Position names updated successfully');
  } catch (error) {
    console.error('Error updating position names:', error);
  }
}

// Kullanıcı işlemleri
export const userDB = {
  getAll: async () => {
    const result = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    return result;
  },
  
  getById: async (id: number) => {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result[0] || null;
  },
  
  getByUsername: async (username: string) => {
    const result = await sql`SELECT * FROM users WHERE username = ${username} OR email = ${username}`;
    return result[0] || null;
  },

  getByEmail: async (email: string) => {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result[0] || null;
  },
  
  create: async (userData: { username: string; email: string; password_hash: string; full_name: string; positions?: string[]; availability_status?: string }) => {
    // Önce positions ve availability_status sütunlarının var olup olmadığını kontrol et
    const hasPositionsColumn = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'positions'
      ) as exists
    `;
    
    const hasAvailabilityColumn = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'availability_status'
      ) as exists
    `;

    if (hasPositionsColumn[0]?.exists && hasAvailabilityColumn[0]?.exists) {
      const result = await sql`
        INSERT INTO users (username, email, password_hash, full_name, positions, availability_status)
        VALUES (${userData.username}, ${userData.email}, ${userData.password_hash}, ${userData.full_name}, ${userData.positions || null}, ${userData.availability_status || 'available'})
        RETURNING *
      `;
      return result[0] || null;
    } else {
      // Eski sütunlar yoksa sadece temel alanları ekle
      const result = await sql`
        INSERT INTO users (username, email, password_hash, full_name)
        VALUES (${userData.username}, ${userData.email}, ${userData.password_hash}, ${userData.full_name})
        RETURNING *
      `;
      return result[0] || null;
    }
  },
  
  update: async (id: number, userData: Partial<{ username: string; email: string; full_name: string; positions: string[]; availability_status: string }>) => {
    // Her alan için ayrı ayrı kontrol edip güncelleme yapalım
    if (userData.username !== undefined) {
      await sql`UPDATE users SET username = ${userData.username}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
    }
    if (userData.email !== undefined) {
      await sql`UPDATE users SET email = ${userData.email}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
    }
    if (userData.full_name !== undefined) {
      await sql`UPDATE users SET full_name = ${userData.full_name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
    }
    if (userData.positions !== undefined) {
      // Önce positions sütununun var olup olmadığını kontrol et
      const hasPositionsColumn = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'positions'
        ) as exists
      `;
      
      if (hasPositionsColumn[0]?.exists) {
        await sql`UPDATE users SET positions = ${userData.positions}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      }
    }
    if (userData.availability_status !== undefined) {
      // Önce availability_status sütununun var olup olmadığını kontrol et
      const hasAvailabilityColumn = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'availability_status'
        ) as exists
      `;
      
      if (hasAvailabilityColumn[0]?.exists) {
        await sql`UPDATE users SET availability_status = ${userData.availability_status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      }
    }
    
    return await userDB.getById(id);
  },

  updatePositions: async (id: number, positions: string[]) => {
    const result = await sql`
      UPDATE users 
      SET positions = ${positions}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
  },

  updateAvailability: async (id: number, availability_status: string) => {
    const result = await sql`
      UPDATE users 
      SET availability_status = ${availability_status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
  },

  delete: async (id: number) => {
    try {
      // Start a transaction
      await sql`BEGIN`;
      
      // Fix foreign key constraints if they are not CASCADE (migrate to CASCADE)
      await sql`
        DO $$ 
        BEGIN
          -- Fix players.user_id constraint if it's not CASCADE
          IF EXISTS (
            SELECT 1 FROM information_schema.referential_constraints 
            WHERE constraint_name = 'players_user_id_fkey' 
            AND delete_rule = 'NO ACTION'
          ) THEN
            ALTER TABLE players DROP CONSTRAINT players_user_id_fkey;
            ALTER TABLE players ADD CONSTRAINT players_user_id_fkey 
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
          END IF;
          
          -- Fix match_players.player_id constraint if it's not CASCADE
          IF EXISTS (
            SELECT 1 FROM information_schema.referential_constraints 
            WHERE constraint_name = 'match_players_player_id_fkey' 
            AND delete_rule = 'NO ACTION'
          ) THEN
            ALTER TABLE match_players DROP CONSTRAINT match_players_player_id_fkey;
            ALTER TABLE match_players ADD CONSTRAINT match_players_player_id_fkey 
              FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `;
      
      // Now we can use simplified deletion thanks to CASCADE
      // Update teams where this user is the creator or captain to NULL (these stay NO ACTION by design)
      await sql`UPDATE teams SET created_by = NULL WHERE created_by = ${id}`;
      await sql`UPDATE teams SET captain_id = NULL WHERE captain_id = ${id}`;
      
      // Remove user from authorized_members arrays
      await sql`
        UPDATE teams 
        SET authorized_members = array_remove(authorized_members, ${id})
        WHERE ${id} = ANY(authorized_members)
      `;
      
      // Update team_invitations where this user was the inviter (this stays NO ACTION by design)
      await sql`UPDATE team_invitations SET invited_by = NULL WHERE invited_by = ${id}`;
      
      // Delete the user - CASCADE will now handle:
      // - players records (and their related match_players, player_ratings, team_positions)
      // - notifications 
      // - team_invitations.invited_user_id
      const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING *`;
      
      // Commit the transaction
      await sql`COMMIT`;
      
      return result[0] || null;
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      throw error;
    }
  }
};

// Takım işlemleri
export const teamDB = {
  getAll: async () => {
    const result = await sql`SELECT * FROM teams ORDER BY created_at DESC`;
    return result;
  },
  
  getById: async (id: number) => {
    const result = await sql`SELECT * FROM teams WHERE id = ${id}`;
    return result[0] || null;
  },
  
  getByUserId: async (userId: number) => {
    // Kullanıcının sahip olduğu takımları getir
    const ownedTeams = await sql`SELECT * FROM teams WHERE created_by = ${userId} ORDER BY created_at DESC`;
    
    // Kullanıcının oyuncu olduğu takımları getir
    const playerTeams = await sql`
      SELECT t.*, p.position as player_position, p.skill_level, p.joined_at
      FROM teams t 
      JOIN players p ON t.id = p.team_id 
      WHERE p.user_id = ${userId} AND p.is_active = true 
      ORDER BY p.joined_at DESC
    `;
    
    // Birleştir ve tekrarları kaldır
    const allTeams = [...ownedTeams];
    playerTeams.forEach((playerTeam: { id: number }) => {
      if (!allTeams.some(team => team.id === playerTeam.id)) {
        allTeams.push(playerTeam);
      }
    });
    
    return allTeams.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  
  create: async (teamData: { name: string; description?: string; created_by: number }) => {
    const result = await sql`
      INSERT INTO teams (name, description, created_by)
      VALUES (${teamData.name}, ${teamData.description || null}, ${teamData.created_by})
      RETURNING *
    `;
    return result[0] || null;
  },

  updateCaptain: async (teamId: number, captainId: number) => {
    const result = await sql`
      UPDATE teams 
      SET captain_id = ${captainId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${teamId}
      RETURNING *
    `;
    return result[0] || null;
  },

  addAuthorizedMember: async (teamId: number, userId: number) => {
    // Önce mevcut yetkili üyeleri al
    const team = await teamDB.getById(teamId);
    if (!team) return null;
    
    const currentAuthorized = team.authorized_members || [];
    if (currentAuthorized.includes(userId)) {
      return team; // Zaten yetkili
    }
    
    // Yeni yetkili üyeyi ekle
    const newAuthorized = [...currentAuthorized, userId];
    const result = await sql`
      UPDATE teams 
      SET authorized_members = ${newAuthorized}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${teamId}
      RETURNING *
    `;
    return result[0] || null;
  },

  removeAuthorizedMember: async (teamId: number, userId: number) => {
    // Önce mevcut yetkili üyeleri al
    const team = await teamDB.getById(teamId);
    if (!team) return null;
    
    const currentAuthorized = team.authorized_members || [];
    const newAuthorized = currentAuthorized.filter((id: number) => id !== userId);
    
    const result = await sql`
      UPDATE teams 
      SET authorized_members = ${newAuthorized}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${teamId}
      RETURNING *
    `;
    return result[0] || null;
  },

  isAuthorizedMember: async (teamId: number, userId: number) => {
    const team = await teamDB.getById(teamId);
    if (!team) return false;
    
    const authorizedMembers = team.authorized_members || [];
    return authorizedMembers.includes(userId);
  },

  update: async (teamId: number, teamData: Partial<{ name: string; description: string; team_size: number }>) => {
    // Her alan için ayrı ayrı kontrol edip güncelleme yapalım
    if (teamData.name !== undefined) {
      await sql`UPDATE teams SET name = ${teamData.name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${teamId}`;
    }
    if (teamData.description !== undefined) {
      await sql`UPDATE teams SET description = ${teamData.description}, updated_at = CURRENT_TIMESTAMP WHERE id = ${teamId}`;
    }
    if (teamData.team_size !== undefined) {
      await sql`UPDATE teams SET team_size = ${teamData.team_size}, updated_at = CURRENT_TIMESTAMP WHERE id = ${teamId}`;
    }
    
    return await teamDB.getById(teamId);
  },

  delete: async (id: number) => {
    const result = await sql`DELETE FROM teams WHERE id = ${id} RETURNING *`;
    return result[0] || null;
  }
};

// Takım davet işlemleri
export const teamInvitationDB = {
  getAll: async () => {
    const result = await sql`SELECT * FROM team_invitations ORDER BY created_at DESC`;
    return result;
  },
  
  getById: async (id: number) => {
    const result = await sql`SELECT * FROM team_invitations WHERE id = ${id}`;
    return result[0] || null;
  },
  
  getByUserId: async (userId: number) => {
    const result = await sql`
      SELECT ti.*, t.name as team_name, u.full_name as invited_by_name 
      FROM team_invitations ti 
      JOIN teams t ON ti.team_id = t.id 
      JOIN users u ON ti.invited_by = u.id 
      WHERE ti.invited_user_id = ${userId} AND ti.status = 'pending'
      ORDER BY ti.created_at DESC
    `;
    return result;
  },
  
  getByTeamId: async (teamId: number) => {
    const result = await sql`
      SELECT ti.*, u.full_name as invited_user_name, u.username as invited_user_username
      FROM team_invitations ti 
      JOIN users u ON ti.invited_user_id = u.id 
      WHERE ti.team_id = ${teamId}
      ORDER BY ti.created_at DESC
    `;
    return result;
  },
  
  create: async (invitationData: { team_id: number; invited_user_id: number; invited_by: number; message?: string }) => {
    const result = await sql`
      INSERT INTO team_invitations (team_id, invited_user_id, invited_by, message)
      VALUES (${invitationData.team_id}, ${invitationData.invited_user_id}, ${invitationData.invited_by}, ${invitationData.message || null})
      RETURNING *
    `;
    return result[0] || null;
  },
  
  updateStatus: async (id: number, status: string) => {
    const result = await sql`
      UPDATE team_invitations 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
  },
  
  delete: async (id: number) => {
    const result = await sql`DELETE FROM team_invitations WHERE id = ${id} RETURNING *`;
    return result[0] || null;
  }
};

// Oyuncu işlemleri
export const playerDB = {
  getAll: async () => {
    const result = await sql`
      SELECT p.*, u.full_name, u.username, u.positions, u.availability_status
      FROM players p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.is_active = true 
      ORDER BY p.created_at ASC
    `;
    return result;
  },
  
  getById: async (id: number) => {
    const result = await sql`SELECT * FROM players WHERE id = ${id}`;
    return result[0] || null;
  },
  
  getByTeamId: async (teamId: number) => {
    const result = await sql`
      SELECT p.*, u.full_name, u.username, u.positions, u.availability_status
      FROM players p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.team_id = ${teamId} AND p.is_active = true 
      ORDER BY p.created_at ASC
    `;
    return result;
  },
  
  getByUserId: async (userId: number) => {
    const result = await sql`
      SELECT p.*, t.name as team_name, t.description as team_description
      FROM players p 
      JOIN teams t ON p.team_id = t.id 
      WHERE p.user_id = ${userId} AND p.is_active = true 
      ORDER BY p.joined_at DESC
    `;
    return result;
  },
  
  create: async (playerData: { user_id: number; team_id: number; position?: string; skill_level?: number; joined_at?: string }) => {
    const result = await sql`
      INSERT INTO players (user_id, team_id, position, skill_level, joined_at)
      VALUES (${playerData.user_id}, ${playerData.team_id}, ${playerData.position || null}, ${playerData.skill_level || 5}, ${playerData.joined_at || new Date().toISOString()})
      RETURNING *
    `;
    return result[0] || null;
  },
  
  leaveTeam: async (userId: number, teamId: number) => {
    const result = await sql`
      UPDATE players 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND team_id = ${teamId}
      RETURNING *
    `;
    return result[0] || null;
  }
};

// Bildirim işlemleri
export const notificationDB = {
  getAll: async () => {
    const result = await sql`SELECT * FROM notifications ORDER BY created_at DESC`;
    return result;
  },
  
  getByUserId: async (userId: number) => {
    const result = await sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `;
    return result;
  },
  
  getUnreadByUserId: async (userId: number) => {
    const result = await sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId} AND is_read = false
      ORDER BY created_at DESC
    `;
    return result;
  },
  
  create: async (notificationData: { user_id: number; type: string; title: string; message: string; related_id?: number }) => {
    const result = await sql`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (${notificationData.user_id}, ${notificationData.type}, ${notificationData.title}, ${notificationData.message}, ${notificationData.related_id || null})
      RETURNING *
    `;
    return result[0] || null;
  },
  
  markAsRead: async (id: number) => {
    const result = await sql`
      UPDATE notifications 
      SET is_read = true
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
  },
  
  markAllAsRead: async (userId: number) => {
    const result = await sql`
      UPDATE notifications 
      SET is_read = true
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result;
  },

  getByUserAndType: async (userId: number, type: string, relatedId?: number) => {
    if (relatedId) {
      const result = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND type = ${type} AND related_id = ${relatedId}
        LIMIT 1
      `;
      return result[0] || null;
    } else {
      const result = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND type = ${type}
        LIMIT 1
      `;
      return result[0] || null;
    }
  },
  
  delete: async (id: number) => {
    const result = await sql`DELETE FROM notifications WHERE id = ${id} RETURNING *`;
    return result[0] || null;
  }
};

// Formasyon işlemleri
export const formationDB = {
  getByTeamId: async (teamId: number) => {
    const result = await sql`
      SELECT * FROM team_formations 
      WHERE team_id = ${teamId} 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    return result[0] || null;
  },
  
  create: async (formationData: { team_id: number; formation_name: string; team_size: number }) => {
    const result = await sql`
      INSERT INTO team_formations (team_id, formation_name, team_size)
      VALUES (${formationData.team_id}, ${formationData.formation_name}, ${formationData.team_size})
      RETURNING *
    `;
    return result[0] || null;
  },
  
  update: async (teamId: number, formationData: { formation_name: string; team_size: number }) => {
    const result = await sql`
      UPDATE team_formations 
      SET formation_name = ${formationData.formation_name}, 
          team_size = ${formationData.team_size}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE team_id = ${teamId}
      RETURNING *
    `;
    return result[0] || null;
  },
  
  upsert: async (formationData: { team_id: number; formation_name: string; team_size: number }) => {
    const existing = await formationDB.getByTeamId(formationData.team_id);
    if (existing) {
      return await formationDB.update(formationData.team_id, formationData);
    } else {
      return await formationDB.create(formationData);
    }
  }
};

// Mevkilendirme işlemleri
export const positionDB = {
  getByTeamId: async (teamId: number) => {
    const result = await sql`
      SELECT tp.*, p.user_id, u.full_name, u.username
      FROM team_positions tp
      JOIN players p ON tp.player_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE tp.team_id = ${teamId}
      ORDER BY tp.position_id
    `;
    return result;
  },
  
  create: async (positionData: { team_id: number; player_id: number; position_id: string; position_name: string; x_coordinate: number; y_coordinate: number }) => {
    const result = await sql`
      INSERT INTO team_positions (team_id, player_id, position_id, position_name, x_coordinate, y_coordinate)
      VALUES (${positionData.team_id}, ${positionData.player_id}, ${positionData.position_id}, ${positionData.position_name}, ${positionData.x_coordinate}, ${positionData.y_coordinate})
      ON CONFLICT (team_id, position_id) 
      DO UPDATE SET 
        player_id = EXCLUDED.player_id,
        position_name = EXCLUDED.position_name,
        x_coordinate = EXCLUDED.x_coordinate,
        y_coordinate = EXCLUDED.y_coordinate,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0] || null;
  },
  
  deleteByTeamId: async (teamId: number) => {
    const result = await sql`DELETE FROM team_positions WHERE team_id = ${teamId}`;
    return result;
  },
  
  saveFormation: async (teamId: number, positions: Array<{ player_id: number; position_id: string; position_name: string; x_coordinate: number; y_coordinate: number }>) => {
    // Önce mevcut pozisyonları temizle
    await positionDB.deleteByTeamId(teamId);
    
    // Yeni pozisyonları kaydet
    const results = [];
    for (const position of positions) {
      const result = await positionDB.create({
        team_id: teamId,
        ...position
      });
      results.push(result);
    }
    return results;
  }
};

// Maç işlemleri
export const matchDB = {
  getAll: async () => {
    const result = await sql`SELECT * FROM matches ORDER BY match_date DESC`;
    return result;
  },
  
  getById: async (id: number) => {
    const result = await sql`SELECT * FROM matches WHERE id = ${id}`;
    return result[0] || null;
  },
  
  getByTeamId: async (teamId: number) => {
    const result = await sql`SELECT * FROM matches WHERE team_id = ${teamId} ORDER BY match_date DESC`;
    return result;
  },

  getUpcomingMatchesByUserId: async (userId: number) => {
    console.log('Fetching upcoming matches for user:', userId);
    
    const result = await sql`
      SELECT m.*, t.name as team_name
      FROM matches m
      JOIN teams t ON m.team_id = t.id
      JOIN players p ON t.id = p.team_id
      WHERE p.user_id = ${userId} 
        AND p.is_active = true 
        AND m.match_date > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        AND m.status = 'scheduled'
      ORDER BY m.match_date ASC
      LIMIT 5
    `;
    
    console.log('Upcoming matches found:', result.length);
    return result;
  },

  getMatchesByDateRange: async (startDate: string, endDate: string) => {
    const result = await sql`
      SELECT m.*, t.name as team_name
      FROM matches m
      JOIN teams t ON m.team_id = t.id
      WHERE m.match_date >= ${startDate} 
        AND m.match_date < ${endDate}
        AND m.status = 'scheduled'
      ORDER BY m.match_date ASC
    `;
    return result;
  },
  
  create: async (matchData: { team_id: number; match_date: string; location?: string; opponent_team?: string; status?: string }) => {
    const result = await sql`
      INSERT INTO matches (team_id, match_date, location, opponent_team, status)
      VALUES (${matchData.team_id}, ${matchData.match_date}, ${matchData.location || null}, ${matchData.opponent_team || null}, ${matchData.status || 'scheduled'})
      RETURNING *
    `;
    return result[0] || null;
  },

  update: async (matchId: number, matchData: Partial<{ home_score: number; away_score: number; status: string; location: string; match_date: string; opponent_team: string }>) => {
    try {
      console.log('Updating match:', matchId, 'with data:', matchData);
      
      if (matchData.home_score !== undefined) {
        await sql`UPDATE matches SET home_score = ${matchData.home_score}, updated_at = CURRENT_TIMESTAMP WHERE id = ${matchId}`;
      }
      
      if (matchData.away_score !== undefined) {
        await sql`UPDATE matches SET away_score = ${matchData.away_score}, updated_at = CURRENT_TIMESTAMP WHERE id = ${matchId}`;
      }
      
      if (matchData.status !== undefined) {
        await sql`UPDATE matches SET status = ${matchData.status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${matchId}`;
      }

      if (matchData.location !== undefined) {
        await sql`UPDATE matches SET location = ${matchData.location}, updated_at = CURRENT_TIMESTAMP WHERE id = ${matchId}`;
      }

      if (matchData.match_date !== undefined) {
        await sql`UPDATE matches SET match_date = ${matchData.match_date}, updated_at = CURRENT_TIMESTAMP WHERE id = ${matchId}`;
      }

      if (matchData.opponent_team !== undefined) {
        await sql`UPDATE matches SET opponent_team = ${matchData.opponent_team}, updated_at = CURRENT_TIMESTAMP WHERE id = ${matchId}`;
      }
      
      const updatedMatch = await matchDB.getById(matchId);
      console.log('Updated match:', updatedMatch);
      return updatedMatch;
    } catch (error) {
      console.error('Error in matchDB.update:', error);
      throw error;
    }
  },

  delete: async (matchId: number) => {
    const result = await sql`DELETE FROM matches WHERE id = ${matchId}`;
    return result;
  }
};

// Maç oyuncuları işlemleri
export const matchPlayerDB = {
  getByMatchId: async (matchId: number) => {
    const result = await sql`SELECT * FROM match_players WHERE match_id = ${matchId}`;
    return result;
  },
  
  create: async (matchPlayerData: { match_id: number; player_id: number; team_side: 'A' | 'B'; position?: string }) => {
    const result = await sql`
      INSERT INTO match_players (match_id, player_id, team_side, position)
      VALUES (${matchPlayerData.match_id}, ${matchPlayerData.player_id}, ${matchPlayerData.team_side}, ${matchPlayerData.position || null})
      RETURNING *
    `;
    return result[0] || null;
  }
};

// Formasyon algoritması için yardımcı fonksiyonlar
export const formationUtils = {
  // Takım boyutuna göre mevcut formasyonları listele
  getAvailableFormations: (teamSize: number) => {
    switch (teamSize) {
      case 6:
        return [
          { name: '1-3-1-1', description: '1 Kaleci, 3 Defans, 1 Orta Saha, 1 Forvet' },
          { name: '1-2-2-1', description: '1 Kaleci, 2 Defans, 2 Orta Saha, 1 Forvet' },
          { name: '1-3-2', description: '1 Kaleci, 3 Defans, 2 Orta Saha' }
        ];
      case 7:
        return [
          { name: '1-3-2-1', description: '1 Kaleci, 3 Defans, 2 Orta Saha, 1 Forvet' },
          { name: '1-2-3-1', description: '1 Kaleci, 2 Defans, 3 Orta Saha, 1 Forvet' },
          { name: '1-3-3', description: '1 Kaleci, 3 Defans, 3 Orta Saha' }
        ];
      case 8:
        return [
          { name: '1-3-3-1', description: '1 Kaleci, 3 Defans, 3 Orta Saha, 1 Forvet' },
          { name: '1-2-4-1', description: '1 Kaleci, 2 Defans, 4 Orta Saha, 1 Forvet' },
          { name: '1-3-4', description: '1 Kaleci, 3 Defans, 4 Orta Saha' }
        ];
      case 9:
        return [
          { name: '1-3-4-1', description: '1 Kaleci, 3 Defans, 4 Orta Saha, 1 Forvet' },
          { name: '1-2-5-1', description: '1 Kaleci, 2 Defans, 5 Orta Saha, 1 Forvet' },
          { name: '1-3-5', description: '1 Kaleci, 3 Defans, 5 Orta Saha' }
        ];
      case 10:
        return [
          { name: '1-3-5-1', description: '1 Kaleci, 3 Defans, 5 Orta Saha, 1 Forvet' },
          { name: '1-2-6-1', description: '1 Kaleci, 2 Defans, 6 Orta Saha, 1 Forvet' },
          { name: '1-3-6', description: '1 Kaleci, 3 Defans, 6 Orta Saha' }
        ];
      case 11:
        return [
          { name: '1-3-6-1', description: '1 Kaleci, 3 Defans, 6 Orta Saha, 1 Forvet' },
          { name: '1-2-7-1', description: '1 Kaleci, 2 Defans, 7 Orta Saha, 1 Forvet' },
          { name: '1-3-7', description: '1 Kaleci, 3 Defans, 7 Orta Saha' }
        ];
      default:
        return [
          { name: '1-3-3-1', description: '1 Kaleci, 3 Defans, 3 Orta Saha, 1 Forvet' }
        ];
    }
  },

  // Formasyon adına göre pozisyonları hesapla
  calculatePositions: (formationName: string): Array<{ id: string; name: string; x: number; y: number }> => {
    const positions: Array<{ id: string; name: string; x: number; y: number }> = [];
    
    // Kaleci - her zaman sabit
    positions.push({ id: 'gk', name: 'Kaleci', x: 50, y: 92 });
    
    // Formasyon adını parçala (örn: "3-3-1" -> [3, 3, 1])
    const formationParts = formationName.split('-').map(Number);
    
    if (formationParts.length === 3) {
      // 3 parçalı formasyon: 3-3-1 gibi (defans, orta saha, forvet)
      const [def, mid, fwd] = formationParts;
      
      // Defans pozisyonları
      if (def === 2) {
        positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
        positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
      } else if (def === 3) {
        positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
        positions.push({ id: 'cb', name: 'Stoper', x: 50, y: 75 });
        positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
      }
      
      // Orta saha pozisyonları
      if (mid === 1) {
        positions.push({ id: 'cm', name: 'Orta Saha', x: 50, y: 50 });
      } else if (mid === 2) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 70, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 30, y: 50 });
      } else if (mid === 3) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 80, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 50, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 20, y: 50 });
      } else if (mid === 4) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 85, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 60, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 40, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 15, y: 50 });
      } else if (mid === 5) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 70, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 50, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 30, y: 50 });
        positions.push({ id: 'cm5', name: 'Orta Saha', x: 10, y: 50 });
      } else if (mid === 6) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 75, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 60, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 40, y: 50 });
        positions.push({ id: 'cm5', name: 'Orta Saha', x: 25, y: 50 });
        positions.push({ id: 'cm6', name: 'Orta Saha', x: 10, y: 50 });
      } else if (mid === 7) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 95, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 80, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 65, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 50, y: 50 });
        positions.push({ id: 'cm5', name: 'Orta Saha', x: 35, y: 50 });
        positions.push({ id: 'cm6', name: 'Orta Saha', x: 20, y: 50 });
        positions.push({ id: 'cm7', name: 'Orta Saha', x: 5, y: 50 });
      }
      
      // Forvet pozisyonları
      if (fwd === 1) {
        positions.push({ id: 'st', name: 'Forvet', x: 50, y: 25 });
      }
    } else if (formationParts.length === 2) {
      // 2 parçalı formasyon: 3-3 gibi (defans, orta saha)
      const [def, mid] = formationParts;
      
      // Defans pozisyonları
      if (def === 2) {
        positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
        positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
      } else if (def === 3) {
        positions.push({ id: 'rb', name: 'Sağ Bek', x: 80, y: 75 });
        positions.push({ id: 'cb', name: 'Stoper', x: 50, y: 75 });
        positions.push({ id: 'lb', name: 'Sol Bek', x: 20, y: 75 });
      }
      
      // Orta saha pozisyonları
      if (mid === 1) {
        positions.push({ id: 'cm', name: 'Orta Saha', x: 50, y: 50 });
      } else if (mid === 2) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 70, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 30, y: 50 });
      } else if (mid === 3) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 80, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 50, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 20, y: 50 });
      } else if (mid === 4) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 85, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 60, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 40, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 15, y: 50 });
      } else if (mid === 5) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 70, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 50, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 30, y: 50 });
        positions.push({ id: 'cm5', name: 'Orta Saha', x: 10, y: 50 });
      } else if (mid === 6) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 90, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 75, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 60, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 40, y: 50 });
        positions.push({ id: 'cm5', name: 'Orta Saha', x: 25, y: 50 });
        positions.push({ id: 'cm6', name: 'Orta Saha', x: 10, y: 50 });
      } else if (mid === 7) {
        positions.push({ id: 'cm1', name: 'Orta Saha', x: 95, y: 50 });
        positions.push({ id: 'cm2', name: 'Orta Saha', x: 80, y: 50 });
        positions.push({ id: 'cm3', name: 'Orta Saha', x: 65, y: 50 });
        positions.push({ id: 'cm4', name: 'Orta Saha', x: 50, y: 50 });
        positions.push({ id: 'cm5', name: 'Orta Saha', x: 35, y: 50 });
        positions.push({ id: 'cm6', name: 'Orta Saha', x: 20, y: 50 });
        positions.push({ id: 'cm7', name: 'Orta Saha', x: 5, y: 50 });
      }
    }
    
    return positions;
  }
};

// Player Rating Database Functions
export const playerRatingDB = {
  // Belirli bir maç için tüm puanlamaları getir
  getByMatchId: async (matchId: number) => {
    return await sql`
      SELECT 
        pr.*,
        rated.full_name as rated_player_name,
        rated.username as rated_player_username,
        rater.full_name as rater_player_name,
        rater.username as rater_player_username
      FROM player_ratings pr
      JOIN players rated ON pr.rated_player_id = rated.id
      JOIN players rater ON pr.rater_player_id = rater.id
      WHERE pr.match_id = ${matchId}
      ORDER BY pr.created_at DESC
    `;
  },

  // Belirli bir oyuncunun belirli bir maçtaki puanlamalarını getir
  getByPlayerAndMatch: async (playerId: number, matchId: number) => {
    return await sql`
      SELECT 
        pr.*,
        rated.full_name as rated_player_name,
        rated.username as rated_player_username,
        rater.full_name as rater_player_name,
        rater.username as rater_player_username
      FROM player_ratings pr
      JOIN players rated ON pr.rated_player_id = rated.id
      JOIN players rater ON pr.rater_player_id = rater.id
      WHERE pr.rated_player_id = ${playerId} AND pr.match_id = ${matchId}
      ORDER BY pr.created_at DESC
    `;
  },

  // Belirli bir oyuncunun tüm maçlardaki ortalama puanını hesapla
  getAverageRatingByPlayer: async (playerId: number) => {
    const result = await sql`
      SELECT 
        AVG(pr.rating) as average_rating,
        COUNT(pr.id) as total_ratings,
        COUNT(DISTINCT pr.match_id) as total_matches
      FROM player_ratings pr
      WHERE pr.rated_player_id = ${playerId}
    `;
    return result[0];
  },

  // Belirli bir maçta belirli bir oyuncunun ortalama puanını hesapla
  getAverageRatingByPlayerAndMatch: async (playerId: number, matchId: number) => {
    const result = await sql`
      SELECT 
        AVG(pr.rating) as average_rating,
        COUNT(pr.id) as total_ratings
      FROM player_ratings pr
      WHERE pr.rated_player_id = ${playerId} AND pr.match_id = ${matchId}
    `;
    return result[0];
  },

  // Puanlama ekle veya güncelle
  upsert: async (data: {
    match_id: number;
    rated_player_id: number;
    rater_player_id: number;
    rating: number;
    notes?: string;
  }) => {
    return await sql`
      INSERT INTO player_ratings (match_id, rated_player_id, rater_player_id, rating, notes)
      VALUES (${data.match_id}, ${data.rated_player_id}, ${data.rater_player_id}, ${data.rating}, ${data.notes || null})
      ON CONFLICT (match_id, rated_player_id, rater_player_id)
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
  },

  // Puanlama sil
  delete: async (id: number) => {
    return await sql`DELETE FROM player_ratings WHERE id = ${id}`;
  },

  // Belirli bir maçta bir oyuncunun puanladığı oyuncuları getir
  getRatedPlayersByRater: async (raterPlayerId: number, matchId: number) => {
    return await sql`
      SELECT 
        pr.*,
        rated.full_name as rated_player_name,
        rated.username as rated_player_username
      FROM player_ratings pr
      JOIN players rated ON pr.rated_player_id = rated.id
      WHERE pr.rater_player_id = ${raterPlayerId} AND pr.match_id = ${matchId}
    `;
  }
};

// Veritabanını başlat
initializeDatabase(); 