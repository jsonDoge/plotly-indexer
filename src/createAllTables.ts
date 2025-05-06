import { Client } from 'pg'

export const createAllEventTables = async (db: Client) => {
  await db.query(`
        CREATE TABLE IF NOT EXISTS seed_minted_events (
          id SERIAL PRIMARY KEY,
          seed_name TEXT,
          seed_id TEXT,
          slot BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)

  await db.query(`
        CREATE TABLE IF NOT EXISTS seed_planted_events (
          id SERIAL PRIMARY KEY,
          seed_id TEXT,
          slot BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)

  await db.query(`
        CREATE TABLE IF NOT EXISTS seed_harvested_events (
          id SERIAL PRIMARY KEY,
          seed_id TEXT,
          slot BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)

  await db.query(`
        CREATE TABLE IF NOT EXISTS offer_created_events (
          id SERIAL PRIMARY KEY,
          offer_id TEXT,
          price_per_token BIGINT,
          result_token_id TEXT,
          slot BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)

  await db.query(`
        CREATE TABLE IF NOT EXISTS recipe_created_events (
          id SERIAL PRIMARY KEY,
          recipe_id TEXT,
          ingredient_0_id TEXT,
          ingredient_0_amount BIGINT,
          ingredient_1_id TEXT,
          ingredient_1_amount BIGINT,
          result_token_id TEXT,
          slot BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)

  await db.query(`
        CREATE TABLE IF NOT EXISTS planted_seed_stats (
          seed_id TEXT PRIMARY KEY,
          growing_count BIGINT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)
}
