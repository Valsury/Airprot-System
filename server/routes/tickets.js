const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../db/init');

const router = express.Router();

// Get all tickets with pagination
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('flight_number').optional().isString().trim(),
    query('departure_date').optional().isISO8601(),
    query('arrival_date').optional().isISO8601(),
    query('search').optional().isString().trim()
  ],
  async (req, res) => {
    try {
      // First, automatically update status of tickets where arrival_date has passed
      await pool.query(
        `UPDATE tickets 
         SET status = 'used', updated_at = CURRENT_TIMESTAMP 
         WHERE status = 'active' AND arrival_date < CURRENT_TIMESTAMP`
      );

      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const flightNumber = req.query.flight_number?.trim();
      const departureDate = req.query.departure_date;
      const arrivalDate = req.query.arrival_date;
      const search = req.query.search?.trim();

      let queryText = `
        SELECT t.*, 
               c.first_name, c.last_name, c.passport_number
        FROM tickets t
        LEFT JOIN clients c ON t.client_id = c.id
      `;
      let conditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (flightNumber && flightNumber.length > 0) {
        paramCount++;
        conditions.push(`t.flight_number ILIKE $${paramCount}`);
        queryParams.push(`%${flightNumber}%`);
      }

      if (departureDate) {
        paramCount++;
        conditions.push(`DATE(t.departure_date) = $${paramCount}`);
        queryParams.push(departureDate);
      }

      if (arrivalDate) {
        paramCount++;
        conditions.push(`DATE(t.arrival_date) = $${paramCount}`);
        queryParams.push(arrivalDate);
      }

      if (search && search.length > 0) {
        paramCount++;
        conditions.push(`(t.departure_airport ILIKE $${paramCount} OR t.arrival_airport ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
      }

      queryText += ' ORDER BY t.created_at DESC';
      queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(queryText, queryParams);

      // Get total count with same conditions (without limit and offset)
      let countQuery = 'SELECT COUNT(*) FROM tickets t';
      let countParams = [];
      let countParamNum = 0;
      
      if (conditions.length > 0) {
        // Rebuild conditions with correct parameter numbers for count query
        let countConditions = [];
        if (flightNumber && flightNumber.length > 0) {
          countParamNum++;
          countConditions.push(`t.flight_number ILIKE $${countParamNum}`);
          countParams.push(`%${flightNumber}%`);
        }
        if (departureDate) {
          countParamNum++;
          countConditions.push(`DATE(t.departure_date) = $${countParamNum}`);
          countParams.push(departureDate);
        }
        if (arrivalDate) {
          countParamNum++;
          countConditions.push(`DATE(t.arrival_date) = $${countParamNum}`);
          countParams.push(arrivalDate);
        }
        if (search && search.length > 0) {
          countParamNum++;
          countConditions.push(`(t.departure_airport ILIKE $${countParamNum} OR t.arrival_airport ILIKE $${countParamNum})`);
          countParams.push(`%${search}%`);
        }
        countQuery += ' WHERE ' + countConditions.join(' AND ');
      }
      const countResult = await pool.query(countQuery, countParams);

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
