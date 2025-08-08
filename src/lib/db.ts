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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        team_id INTEGER REFERENCES teams(id),
        position VARCHAR(50),
        skill_level INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id),
        match_date TIMESTAMP NOT NULL,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS match_players (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id),
        player_id INTEGER REFERENCES players(id),
        team_side VARCHAR(1) CHECK (team_side IN ('A', 'B')),
        position VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
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
  
  create: async (userData: { username: string; email: string; password_hash: string; full_name: string }) => {
    const result = await sql`
      INSERT INTO users (username, email, password_hash, full_name)
      VALUES (${userData.username}, ${userData.email}, ${userData.password_hash}, ${userData.full_name})
      RETURNING *
    `;
    return result[0] || null;
  },
  
  update: async (id: number, userData: Partial<{ username: string; email: string; full_name: string }>) => {
    const fields = Object.keys(userData).map(key => `${key} = ${userData[key as keyof typeof userData]}`).join(', ');
    const result = await sql`
      UPDATE users 
      SET ${sql.unsafe(fields)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
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
    const result = await sql`SELECT * FROM teams WHERE created_by = ${userId} ORDER BY created_at DESC`;
    return result;
  },
  
  create: async (teamData: { name: string; description?: string; created_by: number }) => {
    const result = await sql`
      INSERT INTO teams (name, description, created_by)
      VALUES (${teamData.name}, ${teamData.description || null}, ${teamData.created_by})
      RETURNING *
    `;
    return result[0] || null;
  }
};

// Oyuncu işlemleri
export const playerDB = {
  getAll: async () => {
    const result = await sql`SELECT * FROM players ORDER BY created_at DESC`;
    return result;
  },
  
  getById: async (id: number) => {
    const result = await sql`SELECT * FROM players WHERE id = ${id}`;
    return result[0] || null;
  },
  
  getByTeamId: async (teamId: number) => {
    const result = await sql`SELECT * FROM players WHERE team_id = ${teamId} AND is_active = true ORDER BY created_at DESC`;
    return result;
  },
  
  create: async (playerData: { user_id: number; team_id: number; position?: string; skill_level?: number }) => {
    const result = await sql`
      INSERT INTO players (user_id, team_id, position, skill_level)
      VALUES (${playerData.user_id}, ${playerData.team_id}, ${playerData.position || null}, ${playerData.skill_level || 5})
      RETURNING *
    `;
    return result[0] || null;
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
  
  create: async (matchData: { team_id: number; match_date: string; location?: string; status?: string }) => {
    const result = await sql`
      INSERT INTO matches (team_id, match_date, location, status)
      VALUES (${matchData.team_id}, ${matchData.match_date}, ${matchData.location || null}, ${matchData.status || 'scheduled'})
      RETURNING *
    `;
    return result[0] || null;
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

// Veritabanını başlat
initializeDatabase(); 