const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' }); // Exit here
    }

    const hashed = await bcrypt.hash(password, 10);
    const newuser = await User.create({ username, email, password: hashed });

    return res.status(201).json(newuser); // 201 for created
  } catch (err) {
    console.error('Internal server error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try{
    const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.status(201).json({ token, user });
  }
  catch(err){
    res.status(500).json({message:'internal server error'});
  }
  
});

module.exports = router;