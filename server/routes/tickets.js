const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../db/init');

const router = express.Router();

// Get all tickets with pagination
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('client_id').optional().isInt().toInt(),
    query('search').optional().isString()
  ],
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const clientId = req.query.client_id;
      const search = req.query.search || '';

      let queryText = `
        SELECT t.*, 
               c.first_name, c.last_name, c.passport_number
        FROM tickets t
        LEFT JOIN clients c ON t.client_id = c.id
      `;
      let conditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (clientId) {
        paramCount++;
        conditions.push(`t.client_id = $${paramCount}`);
        queryParams.push(clientId);
      }

      if (search) {
        paramCount++;
        conditions.push(`(t.flight_number ILIKE $${paramCount} OR t.departure_airport ILIKE $${paramCount} OR t.arrival_airport ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
      }

      queryText += ' ORDER BY t.created_at DESC';
      queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(queryText, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM tickets t';
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.json({
        tickets: result.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
              c.first_name, c.last_name, c.passport_number, c.email, c.phone
       FROM tickets t
       LEFT JOIN clients c ON t.client_id = c.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create ticket
router.post('/',
  [
    body('client_id').isInt().withMessage('Valid client ID is required'),
    body('flight_number').notEmpty().withMessage('Flight number is required'),
    body('departure_airport').notEmpty().withMessage('Departure airport is required'),
    body('arrival_airport').notEmpty().withMessage('Arrival airport is required'),
    body('departure_date').isISO8601().withMessage('Valid departure date is required'),
    body('arrival_date').isISO8601().withMessage('Valid arrival date is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        client_id,
        flight_number,
        departure_airport,
        arrival_airport,
        departure_date,
        arrival_date,
        seat_number,
        ticket_class,
        price,
        status
      } = req.body;

      // Check if client exists
      const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1', [client_id]);
      if (clientCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const result = await pool.query(
        `INSERT INTO tickets (client_id, flight_number, departure_airport, arrival_airport, 
                             departure_date, arrival_date, seat_number, ticket_class, price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [client_id, flight_number, departure_airport, arrival_airport, departure_date, 
         arrival_date, seat_number || null, ticket_class || 'economy', price, status || 'active']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update ticket
router.put('/:id',
  [
    body('flight_number').optional().notEmpty().withMessage('Flight number cannot be empty'),
    body('departure_date').optional().isISO8601().withMessage('Valid departure date is required'),
    body('arrival_date').optional().isISO8601().withMessage('Valid arrival date is required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        flight_number,
        departure_airport,
        arrival_airport,
        departure_date,
        arrival_date,
        seat_number,
        ticket_class,
        price,
        status
      } = req.body;

      // Check if ticket exists
      const existing = await pool.query('SELECT id FROM tickets WHERE id = $1', [req.params.id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const result = await pool.query(
        `UPDATE tickets 
         SET flight_number = COALESCE($1, flight_number),
             departure_airport = COALESCE($2, departure_airport),
             arrival_airport = COALESCE($3, arrival_airport),
             departure_date = COALESCE($4, departure_date),
             arrival_date = COALESCE($5, arrival_date),
             seat_number = COALESCE($6, seat_number),
             ticket_class = COALESCE($7, ticket_class),
             price = COALESCE($8, price),
             status = COALESCE($9, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [flight_number, departure_airport, arrival_airport, departure_date, arrival_date,
         seat_number, ticket_class, price, status, req.params.id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete ticket
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
