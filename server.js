const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

// Initialize App
const app = express();
app.use(cors());

// Increase limit for JSON payload
app.use(bodyParser.json({ limit: '10mb' })); // Increase to 10 MB
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // Increase for URL-encoded data

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/usersDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('connected', () => console.log('Connected to MongoDB!'));
db.on('error', (err) => console.error(`Connection error: ${err}`));

// Create User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  image: { type: String },
});

const User = mongoose.model('User', userSchema);

// API Route to Handle Sign Up
app.post('/signup', async (req, res) => {
  const { username, email, password,image } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const newUser = new User({ username, email, password: hashedPassword,image });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully!', user: { username, email, profileImage: image || null }, });
  } catch (error) {
    console.error('Error during sign-up:', error.message);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});


// API Route to Handle Sign In
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up first.' });
    }

    // Compare plain-text password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password. Please try again.' });
    }

    const { username, email: userEmail, image } = user;
    res.status(200).json({ message: 'Sign in successful!',user: { username, email: userEmail, profileImage: image || null }, });
  } catch (error) {
    console.error('Error during sign-in:', error.message);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});

// API Route to Update User Data
app.put('/update-profile', async (req, res) => {
  const { email, username, image, password,newemail } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user details
    if (username) user.username = username;
    if(newemail) user.email = newemail;
    if (image) user.image = image;

    // Hash the password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.status(200).json({
      message: 'Profile updated successfully!',
      user: { username: user.username, email: user.email, profileImage: user.image || null,password:password },
    });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
