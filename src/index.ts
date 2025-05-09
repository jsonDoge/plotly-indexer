/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import 'dotenv/config'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor'

import { Client } from 'pg'
import idl from './farm.json' // your compiled Anchor IDL
import { startApiServer } from './server'
import { createAllEventTables } from './createAllTables'

if (!process.env.FRONT_END_URL) {
  console.error('Please set FRONT_END_URL in your .env file')
  process.exit(1)
}

if (!process.env.SOLANA_CLUSTER_URL) {
  console.error('Please set SOLANA_CLUSTER_URL in your .env file')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('Please set DATABASE_URL in your .env file')
  process.exit(1)
}

if (!process.env.PLOTLY_PROGRAM_ID) {
  console.error('Please set DATABASE_URL in your .env file')
  process.exit(1)
}
// ENV
const PROGRAM_ID = new PublicKey(process.env.PLOTLY_PROGRAM_ID)

const connection = new Connection(process.env.SOLANA_CLUSTER_URL, 'confirmed')

const provider = new AnchorProvider(connection, {} as any, {})
const program = new Program(idl as Idl, provider)

// PostgreSQL setup
const db = new Client({ connectionString: process.env.DATABASE_URL })

// TODO: anti-pattern should be separate functions
const parseAndStoreLog = async (db_: Client, event: any, slot: number) => {
  if (event.name === 'seedMinted') {
    const seedId = event.data.seedId.toString()
    const seedName = event.data.seedName.toString('utf-8').replace(/\0/g, '')
    await db_.query('INSERT INTO seed_minted_events (seed_id, seed_name, slot) VALUES ($1, $2, $3)', [
      seedId,
      seedName,
      slot,
    ])
    console.log('SeedMinted event:', seedId)
  } else if (event.name === 'seedPlanted') {
    const seedId = event.data.seedId.toString()
    await db_.query('INSERT INTO seed_planted_events (seed_id, slot) VALUES ($1, $2)', [seedId, slot])
    console.log('SeedPlanted event:', seedId)
  } else if (event.name === 'seedHarvested') {
    const seedId = event.data.seedId.toString()
    await db_.query('INSERT INTO seed_harvested_events (seed_id, slot) VALUES ($1, $2)', [seedId, slot])
    console.log('SeedHarvested event:', seedId)
  } else if (event.name === 'offerCreated') {
    const offerId = event.data.offerId.toString()
    const pricePerToken = event.data.pricePerToken.toString()
    const resultTokenId = event.data.resultTokenId.toString()
    await db_.query(
      'INSERT INTO offer_created_events (offer_id, price_per_token, result_token_id, slot) VALUES ($1, $2, $3, $4)',
      [offerId, pricePerToken, resultTokenId, slot],
    )
    console.log('OfferCreated event:', offerId)
  } else if (event.name === 'recipeCreated') {
    const recipeId = event.data.recipeId.toString()
    const ingredient0Id = event.data.ingredient0Id.toString()
    const ingredient0Amount = event.data.ingredient0Amount.toString()
    const ingredient1Id = event.data.ingredient1Id.toString()
    const ingredient1Amount = event.data.ingredient1Amount.toString()
    const resultTokenId = event.data.resultTokenId.toString()
    await db_.query(
      'INSERT INTO recipe_created_events (recipe_id, ingredient_0_id, ingredient_0_amount, ingredient_1_id, ingredient_1_amount, result_token_id, slot) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [recipeId, ingredient0Id, ingredient0Amount, ingredient1Id, ingredient1Amount, resultTokenId, slot],
    )
    console.log('RecipeCreated event:', recipeId)
  }

  // Update planted seed stats
  if (event.name === 'seedPlanted') {
    const seedId = event.data.seedId.toString()
    await db_.query(
      'INSERT INTO planted_seed_stats (seed_id, growing_count) VALUES ($1, 1) ON CONFLICT (seed_id) DO UPDATE SET growing_count = planted_seed_stats.growing_count + 1',
      [seedId],
    )
    console.log('Planted seed stats +1:', seedId)
  } else if (event.name === 'seedHarvested') {
    const seedId = event.data.seedId.toString()
    await db_.query(
      'UPDATE planted_seed_stats SET growing_count = growing_count - 1 WHERE seed_id = $1 AND growing_count > 0',
      [seedId],
    )
    console.log('Planted seed stats -1:', seedId)
  }
}

async function main() {
  await db.connect()
  console.log('Connected to DB')

  await createAllEventTables(db)

  console.log('Starting API server...')
  startApiServer(db)

  console.log('Listening for logs...')
  connection.onLogs(PROGRAM_ID, async (logInfo, ctx) => {
    const { logs } = logInfo

    for (const log of logs) {
      // console.log('Log:', log)

      if (log.startsWith('Program data: ')) {
        const logData = log.slice('Program data: '.length)

        // console.log('Parsed data:', logData)

        // Attempt to decode anchor event from log line
        try {
          const event: any = program.coder.events.decode(logData)
          parseAndStoreLog(db, event, ctx.slot)
          console.log('Event:', event.name)
        } catch (e) {
          console.log('Error decoding event:', e)
        }
      }
    }
  })
}

main().catch(console.error)
