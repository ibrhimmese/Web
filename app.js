// Import necessary modules
const express = require('express');
const { Pool } = require('pg'); // Used for PostgreSQL database connection
const multer = require('multer'); // Used for file upload operations
const path = require('path'); // Used for working with file paths
const bodyParser = require('body-parser'); // Used to parse HTTP request bodies

// Initialize Express app
const app = express();
const port = 3000; // Server port

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres', // Database username
  password: process.env.DB_PASSWORD || '123456', // Database password
  host: process.env.DB_HOST || 'postgres-db', // Database server address
  database: process.env.DB_NAME || 'vehicle_db', // Database name
  port: process.env.DB_PORT || 5432, // Database port
});

// Function to connect to the database with retries
const connectWithRetry = async (maxAttempts = 5) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect(); // Test the database connection
      console.log('Database connected successfully'); // Successful connection
      client.release(); // Release the connection
      return true;
    } catch (err) {
      console.error(`Attempt ${attempt}/${maxAttempts} - Database connection failed:`, err.message);
      if (attempt === maxAttempts) {
        throw err; // Throw error if the connection fails after max attempts
      }
      // Wait for 5 seconds and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Directory where uploaded files will be saved
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp as the file name
  }
});
const upload = multer({ storage: storage }); // Configure multer to handle file uploads

// Middleware settings
app.set('view engine', 'ejs'); // Use EJS templating engine
app.use(express.static('public')); // Serve static files (images, CSS, JS)
app.use(bodyParser.urlencoded({ extended: true })); // Allow URL-encoded data
app.use(bodyParser.json()); // Allow JSON data

// Initialize database tables if they don't exist
async function initDB() {
  try {
    await connectWithRetry(); // Try to connect to the database
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        image_path VARCHAR(255),
        technical_specs TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `); // Create the 'vehicles' table if it doesn't exist
    console.log('Database initialized successfully'); // Success message
  } catch (err) {
    console.error('Error initializing database:', err); // Error message if there is a failure
    process.exit(1); // Exit the application if there is an error
  }
}

// Home page (list all vehicles)
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC'); // Get all vehicles
    res.render('index', { vehicles: result.rows }); // Render the 'index' page with vehicle data
  } catch (err) {
    console.error('Database query error:', err); // Log query error
    res.status(500).send('Database error: ' + err.message); // Send error message
  }
});

// Add a vehicle (POST request)
app.post('/vehicles', upload.single('image'), async (req, res) => {
  const { brand, model, technical_specs } = req.body; // Data from the form
  const image_path = req.file ? '/uploads/' + req.file.filename : null; // File path of the uploaded image

  try {
    // Insert the vehicle data into the database
    await pool.query(
      'INSERT INTO vehicles (brand, model, image_path, technical_specs) VALUES ($1, $2, $3, $4)',
      [brand, model, image_path, technical_specs]
    );
    res.redirect('/'); // Redirect to home page
  } catch (err) {
    res.status(500).send('Error adding vehicle'); // Send error message if adding vehicle fails
  }
});

// Delete a vehicle (POST request)
app.post('/vehicles/:id/delete', async (req, res) => {
  try {
    // Delete the vehicle from the database
    await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    res.redirect('/'); // Redirect to home page
  } catch (err) {
    res.status(500).send('Error deleting vehicle'); // Send error message if deletion fails
  }
});

// Update a vehicle (POST request)
app.post('/vehicles/:id/update', upload.single('image'), async (req, res) => {
  const { brand, model, technical_specs } = req.body; // Data from the form
  const image_path = req.file ? '/uploads/' + req.file.filename : null; // File path of the uploaded image

  try {
    if (image_path) {
      // If there's an image, update the record with the new image
      await pool.query(
        'UPDATE vehicles SET brand = $1, model = $2, technical_specs = $3, image_path = $4 WHERE id = $5',
        [brand, model, technical_specs, image_path, req.params.id]
      );
    } else {
      // If there's no image, only update the text fields
      await pool.query(
        'UPDATE vehicles SET brand = $1, model = $2, technical_specs = $3 WHERE id = $4',
        [brand, model, technical_specs, req.params.id]
      );
    }
    res.redirect('/'); // Redirect to home page
  } catch (err) {
    res.status(500).send('Error updating vehicle'); // Send error message if updating vehicle fails
  }
});

// Initialize the database and start the server
initDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`); // Log a message when the server starts
  });
});
