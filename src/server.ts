import express, { Request } from 'express'
import cors from 'cors'
import { Client } from 'pg'
import { PublicKey } from '@solana/web3.js'

export const startApiServer = (db: Client) => {
  const app = express()
  const port = process.env.PORT || 3001

  app.use(
    cors({
      origin: process.env.FRONT_END_URL, // allow your Next.js frontend
      credentials: true,
    }),
  )

  // Example endpoint to fetch recent events
  app.get('/events', async (_, res) => {
    try {
      const result = await db.query('SELECT * FROM events ORDER BY slot DESC LIMIT 10')
      res.json(result.rows)
    } catch (err) {
      console.error('Error fetching events:', err)
      res.status(500).send('Internal server error')
    }
  })

  app.get('/healthcheck', async (_, res) => {
    res.status(200).send('OK')
  })

  app.get('/latest-recipes', async (_, res) => {
    try {
      const result = await db.query('SELECT * FROM recipe_created_events ORDER BY slot DESC LIMIT 10')
      const mappedRows = result.rows.map((row) => {
        const parsedRow = {
          ...row,
          ingredient_0_amount: parseInt(row.ingredient_0_amount, 10),
          ingredient_1_amount: parseInt(row.ingredient_1_amount, 10),
          slot: parseInt(row.slot, 10),
        }
        delete parsedRow.created_at
        delete parsedRow.id
        return parsedRow
      })

      res.json(mappedRows)
    } catch (err) {
      console.error('Error fetching latest recipes:', err)
      res.status(500).send('Internal server error')
    }
  })

  app.get('/latest-offers', async (_, res) => {
    try {
      const result = await db.query('SELECT * FROM offer_created_events ORDER BY slot DESC LIMIT 10')
      const mappedRows = result.rows.map((row) => {
        const parsedRow = {
          ...row,
          price_per_token: parseInt(row.price_per_token, 10),
          slot: parseInt(row.slot, 10),
        }
        delete parsedRow.created_at
        delete parsedRow.id
        return parsedRow
      })
      res.json(mappedRows)
    } catch (err) {
      console.error('Error fetching latest offers:', err)
      res.status(500).send('Internal server error')
    }
  })

  app.get('/seed-stats', async (_, res) => {
    try {
      const result = await db.query('SELECT * FROM planted_seed_stats WHERE growing_count > 0')
      const mappedRows = result.rows.map((row) => {
        const parsedRow = {
          ...row,
          growing_count: parseInt(row.growing_count, 10),
        }
        delete parsedRow.created_at
        delete parsedRow.id
        return parsedRow
      })
      res.json(mappedRows)
    } catch (err) {
      console.error('Error fetching growing seeds:', err)
      res.status(500).send('Internal server error')
    }
  })

  app.get('/seeds/:seedId', async (req: Request<{ seedId: string }>, res) => {
    const { seedId } = req.params

    let seedIdPub
    try {
      seedIdPub = new PublicKey(seedId) // Validate if seedId is a valid Solana PublicKey
    } catch (err) {
      console.error('Invalid seedId:', err)
      res.status(400).send('Invalid seedId')
      return
    }
    try {
      const result = await db.query('SELECT * FROM seed_minted_events WHERE seed_id = $1', [seedIdPub.toString()])
      if (result.rows.length === 0) {
        res.status(404).send('Seed not found')
        return
      }
      // Currently possible
      // if (result.rows.length > 1) {
      //   console.error('Multiple seeds found for seedId:', seedId)
      //   res.status(500).send('Internal server error')
      //   return
      // }
      const mappedRows = result.rows.map((row) => {
        const parsedRow = {
          ...row,
        }
        delete parsedRow.created_at
        delete parsedRow.id
        return parsedRow
      })
      res.json(mappedRows[0])
    } catch (err) {
      console.error('Error fetching seed:', err)
      res.status(500).send('Internal server error')
    }
  })

  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`)
  })
}
