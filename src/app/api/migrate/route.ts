import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { neon } from '@neondatabase/serverless';

export async function POST() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    console.log('Starting database migration...');
    
    // 1. Önce veritabanını başlat (eksik sütunları eklemek için)
    await initializeDatabase();
    console.log('✅ Database initialization completed');
    
    // 2. Foreign Key Constraint'lerini düzelt
    console.log('🔧 Fixing foreign key constraints...');
    
          const _constraintMigration = await sql`
        DO $$ 
        DECLARE
          constraint_fixed_count INTEGER := 0;
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
            constraint_fixed_count := constraint_fixed_count + 1;
            RAISE NOTICE 'Fixed players.user_id constraint to CASCADE';
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
            constraint_fixed_count := constraint_fixed_count + 1;
            RAISE NOTICE 'Fixed match_players.player_id constraint to CASCADE';
          END IF;
          
          -- Fix match_players.match_id constraint if it's not CASCADE
          IF EXISTS (
            SELECT 1 FROM information_schema.referential_constraints 
            WHERE constraint_name = 'match_players_match_id_fkey' 
            AND delete_rule = 'NO ACTION'
          ) THEN
            ALTER TABLE match_players DROP CONSTRAINT match_players_match_id_fkey;
            ALTER TABLE match_players ADD CONSTRAINT match_players_match_id_fkey 
              FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            constraint_fixed_count := constraint_fixed_count + 1;
            RAISE NOTICE 'Fixed match_players.match_id constraint to CASCADE';
          END IF;
          
          RAISE NOTICE 'Migration completed. Fixed % constraints.', constraint_fixed_count;
        END $$;
    `;
    
    console.log('✅ Foreign key constraints migration completed');
    
    // 3. Constraint durumunu kontrol et
    const constraintStatus = await sql`
      SELECT 
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column,
        tc.constraint_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      LEFT JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND (tc.table_name = 'players' OR tc.table_name = 'match_players')
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    console.log('Database migration completed successfully');
    
    return NextResponse.json({ 
      message: 'Veritabanı migration başarıyla tamamlandı',
      timestamp: new Date().toISOString(),
      status: 'success',
      constraintStatus: constraintStatus,
      migrations: [
        '✅ Database initialization (missing columns)',
        '✅ Foreign key constraints optimization', 
        '✅ User deletion CASCADE setup'
      ]
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration hatası', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const sql = neon(process.env.DATABASE_URL!);
  const { searchParams } = new URL(request.url);
  const runMigration = searchParams.get('run') === 'true';
  
  try {
    // Eğer ?run=true parametresi varsa migration çalıştır
    if (runMigration) {
      console.log('Running migration via GET request...');
      
      // 1. Database initialization
      await initializeDatabase();
      console.log('✅ Database initialization completed');
      
      // 2. Foreign Key Constraint'lerini düzelt
      console.log('🔧 Fixing foreign key constraints...');
      
      const _constraintMigration = await sql`
        DO $$ 
        DECLARE
          constraint_fixed_count INTEGER := 0;
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
            constraint_fixed_count := constraint_fixed_count + 1;
            RAISE NOTICE 'Fixed players.user_id constraint to CASCADE';
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
            constraint_fixed_count := constraint_fixed_count + 1;
            RAISE NOTICE 'Fixed match_players.player_id constraint to CASCADE';
          END IF;
          
          -- Fix match_players.match_id constraint if it's not CASCADE
          IF EXISTS (
            SELECT 1 FROM information_schema.referential_constraints 
            WHERE constraint_name = 'match_players_match_id_fkey' 
            AND delete_rule = 'NO ACTION'
          ) THEN
            ALTER TABLE match_players DROP CONSTRAINT match_players_match_id_fkey;
            ALTER TABLE match_players ADD CONSTRAINT match_players_match_id_fkey 
              FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
            constraint_fixed_count := constraint_fixed_count + 1;
            RAISE NOTICE 'Fixed match_players.match_id constraint to CASCADE';
          END IF;
          
          RAISE NOTICE 'Migration completed. Fixed % constraints.', constraint_fixed_count;
        END $$;
      `;
      
      console.log('✅ Foreign key constraints migration completed');
      
      // Migration sonrası durumu kontrol et
      const constraintStatus = await sql`
        SELECT 
          tc.table_name AS source_table,
          kcu.column_name AS source_column,
          ccu.table_name AS target_table,
          ccu.column_name AS target_column,
          tc.constraint_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        LEFT JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND (tc.table_name = 'players' OR tc.table_name = 'match_players')
        ORDER BY tc.table_name, kcu.column_name;
      `;
      
      return NextResponse.json({ 
        message: '🚀 Migration başarıyla tamamlandı!',
        timestamp: new Date().toISOString(),
        status: 'migration_completed',
        constraintStatus: constraintStatus,
        migrations: [
          '✅ Database initialization (missing columns)',
          '✅ Foreign key constraints optimization', 
          '✅ User deletion CASCADE setup'
        ]
      });
    }
    
    console.log('Checking database migration status...');
    
    // Migration durumunu kontrol et
    const constraintStatus = await sql`
      SELECT 
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column,
        tc.constraint_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      LEFT JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND (tc.table_name = 'players' OR tc.table_name = 'match_players')
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    // Cascade durumunu analiz et
    const cascadeStatus = constraintStatus.map((constraint: any) => ({
      table: constraint.source_table,
      column: constraint.source_column,
      target: `${constraint.target_table}.${constraint.target_column}`,
      deleteRule: constraint.delete_rule,
      needsUpdate: constraint.delete_rule === 'NO ACTION'
    }));
    
    const needsUpdate = cascadeStatus.filter((c: any) => c.needsUpdate).length > 0;
    
    return NextResponse.json({ 
      message: 'Migration endpoint hazır',
      instructions: [
        'Migration çalıştırmak için ?run=true parametresi ekleyin',
        'URL: /api/migrate?run=true',
        'Method: GET (tarayıcıda açılabilir)'
      ],
      timestamp: new Date().toISOString(),
      status: needsUpdate ? 'needs_migration' : 'up_to_date',
      constraintStatus: cascadeStatus,
      needsUpdate: needsUpdate,
      migrationUrl: '/api/migrate?run=true'
    });
    
  } catch (error) {
    console.error('Migration status check error:', error);
    return NextResponse.json(
      { 
        error: 'Migration durumu kontrol edilemedi', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
} 