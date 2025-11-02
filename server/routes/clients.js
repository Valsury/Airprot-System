const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../db/init');

const router = express.Router();

// Get all clients with pagination
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString()
  ],
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      let queryText = 'SELECT * FROM clients';
      let queryParams = [];
      
      if (search) {
        queryText += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR passport_number ILIKE $1 OR email ILIKE $1`;
        queryParams.push(`%${search}%`);
      }
      
      queryText += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
      queryParams.push(limit, offset);

      const result = await pool.query(queryText, queryParams);
      const countResult = await pool.query('SELECT COUNT(*) FROM clients' + (search ? ' WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR passport_number ILIKE $1 OR email ILIKE $1' : ''), search ? [`%${search}%`] : []);

      res.json({
        clients: result.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      console.error('Get clients error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create client
router.post('/',
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('passport_number').notEmpty().withMessage('Passport number is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('date_of_birth').optional().isISO8601().withMessage('Valid date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { first_name, last_name, passport_number, phone, email, date_of_birth } = req.body;

      // Check if passport number already exists
      const existing = await pool.query('SELECT id FROM clients WHERE passport_number = $1', [passport_number]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Client with this passport number already exists' });
      }

      const result = await pool.query(
        `INSERT INTO clients (first_name, last_name, passport_number, phone, email, date_of_birth)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [first_name, last_name, passport_number, phone || null, email || null, date_of_birth || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create client error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Passport number already exists' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update client
router.put('/:id',
  [
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('date_of_birth').optional().isISO8601().withMessage('Valid date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { first_name, last_name, passport_number, phone, email, date_of_birth } = req.body;

      // Check if client exists
      const existing = await pool.query('SELECT id FROM clients WHERE id = $1', [req.params.id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check if passport number is being changed and if it already exists
      if (passport_number) {
        const passportCheck = await pool.query(
          'SELECT id FROM clients WHERE passport_number = $1 AND id != $2',
          [passport_number, req.params.id]
        );
        if (passportCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Passport number already exists' });
        }
      }

      const result = await pool.query(
        `UPDATE clients 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             passport_number = COALESCE($3, passport_number),
             phone = COALESCE($4, phone),
             email = COALESCE($5, email),
             date_of_birth = COALESCE($6, date_of_birth),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [first_name, last_name, passport_number, phone, email, date_of_birth, req.params.id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update client error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Passport number already exists' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
