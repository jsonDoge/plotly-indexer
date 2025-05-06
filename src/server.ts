import express from 'express'
import { Client } from 'pg'

export const startApiServer = (db: Client) => {
  const app = express()
  const port = process.env.PORT || 3001

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

  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`)
  })
}
