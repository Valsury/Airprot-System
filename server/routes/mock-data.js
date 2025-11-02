const express = require('express');
const { pool } = require('../db/init');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Mock data generator for testing
router.post('/generate', async (req, res) => {
  try {
    const clientCount = 15;
    const ticketCount = 30;

    // Russian names and data
    const firstNames = [
      'Иван', 'Александр', 'Дмитрий', 'Сергей', 'Андрей',
      'Алексей', 'Максим', 'Евгений', 'Владимир', 'Николай',
      'Анна', 'Мария', 'Елена', 'Ольга', 'Татьяна',
      'Наталья', 'Екатерина', 'Светлана', 'Ирина', 'Юлия'
    ];

    const lastNames = [
      'Иванов', 'Петров', 'Смирнов', 'Козлов', 'Новиков',
      'Морозов', 'Петров', 'Соколов', 'Лебедев', 'Козлов',
      'Новикова', 'Петрова', 'Смирнова', 'Козлова', 'Морозова',
      'Лебедева', 'Соколова', 'Васильева', 'Иванова', 'Попова'
    ];

    const airports = [
      'Шереметьево (Москва)', 'Домодедово (Москва)', 'Пулково (Санкт-Петербург)',
      'Толмачёво (Новосибирск)', 'Кольцово (Екатеринбург)', 'Владивосток',
      'Хабаровск', 'Калининград', 'Сочи', 'Краснодар',
      'Кемерово', 'Томск', 'Иркутск', 'Челябинск', 'Уфа'
    ];

    const flightNumbers = ['SU', 'S7', 'DP', '5N', 'FV', 'UT', 'U6', 'N4'];
    const ticketClasses = ['economy', 'business', 'first'];
    const statuses = ['active', 'cancelled', 'used'];

    // Generate clients
    const clientIds = [];
    for (let i = 0; i < clientCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const passportNumber = `${Math.floor(Math.random() * 9000000) + 1000000}`;
      const phone = `+7${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.ru`;
      
      // Random date of birth (between 18 and 70 years old)
      const birthYear = new Date().getFullYear() - Math.floor(Math.random() * 52) - 18;
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const dateOfBirth = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

      const result = await pool.query(
        `INSERT INTO clients (first_name, last_name, passport_number, phone, email, date_of_birth)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [firstName, lastName, passportNumber, phone, email, dateOfBirth]
      );

      clientIds.push(result.rows[0].id);
    }

    // Generate tickets
    for (let i = 0; i < ticketCount; i++) {
      const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
      const flightNumber = `${flightNumbers[Math.floor(Math.random() * flightNumbers.length)]}${Math.floor(Math.random() * 9000) + 1000}`;
      
      const departureAirport = airports[Math.floor(Math.random() * airports.length)];
      let arrivalAirport = airports[Math.floor(Math.random() * airports.length)];
      while (arrivalAirport === departureAirport) {
        arrivalAirport = airports[Math.floor(Math.random() * airports.length)];
      }

      // Random dates in the future (within next 3 months)
      const now = new Date();
      const daysFromNow = Math.floor(Math.random() * 90);
      const departureDate = new Date(now);
      departureDate.setDate(now.getDate() + daysFromNow);
      departureDate.setHours(Math.floor(Math.random() * 20) + 6, Math.floor(Math.random() * 60), 0, 0);

      const flightDuration = Math.floor(Math.random() * 8) + 1; // 1-9 hours
      const arrivalDate = new Date(departureDate);
      arrivalDate.setHours(departureDate.getHours() + flightDuration);

      const seatNumber = `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;
      const ticketClass = ticketClasses[Math.floor(Math.random() * ticketClasses.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Price based on class
      let basePrice = 5000;
      if (ticketClass === 'business') basePrice = 15000;
      if (ticketClass === 'first') basePrice = 30000;
      const price = basePrice + Math.floor(Math.random() * basePrice * 0.5);

      await pool.query(
        `INSERT INTO tickets (client_id, flight_number, departure_airport, arrival_airport, 
                             departure_date, arrival_date, seat_number, ticket_class, price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          clientId,
          flightNumber,
          departureAirport,
          arrivalAirport,
          departureDate.toISOString(),
          arrivalDate.toISOString(),
          seatNumber,
          ticketClass,
          price,
          status
        ]
      );
    }

    res.json({
      success: true,
      message: `Успешно создано ${clientCount} клиентов и ${ticketCount} билетов`,
      clientsCreated: clientCount,
      ticketsCreated: ticketCount
    });
  } catch (error) {
    console.error('Error generating mock data:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании тестовых данных',
      error: error.message
    });
  }
});

module.exports = router;




