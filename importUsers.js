const mongoose = require('mongoose');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('./schemas/users');
const Role = require('./schemas/roles');

// Mailtrap config
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "b76a95f8268ffd",
    pass: "c97073a4c8907d"
  }
});

const importUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-C2');
    console.log("Connected to MongoDB");

    // Get 'user' role
    let userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      console.log("Role 'user' not found, creating it.");
      userRole = new Role({ name: 'user', description: 'Regular User' });
      await userRole.save();
    }

    // Read users from file
    const usersData = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));

    for (const userData of usersData) {
      // Generate 16 characters random password
      const randomPassword = crypto.randomBytes(8).toString('hex');

      // Create new user
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        password: randomPassword,
        role: userRole._id
      });

      // Save user to database
      await newUser.save();
      console.log(`User ${userData.username} saved to database.`);

      // Send email logic
      const mailOptions = {
        from: '"Admin" <admin@example.com>',
        to: userData.email,
        subject: 'Welcome! Your Account Password',
        text: `Hello ${userData.username},\n\nYour account has been created.\nYour password is: ${randomPassword}\n\nPlease keep it safe.\n\nBest regards,\nAdmin`,
      };

      await transport.sendMail(mailOptions);
      console.log(`Email sent to ${userData.email}`);
    }

    console.log("Import users completed!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error importing users:", error);
    mongoose.connection.close();
  }
};

importUsers();
