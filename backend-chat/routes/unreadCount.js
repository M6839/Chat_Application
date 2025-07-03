const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

router.get("/unread-count", async (req, res) => {
  const { userId } = req.query;
  try {
    const count = await Message.countDocuments({ receiver: userId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

router.post("/mark-as-read", async (req, res) => {
  const { senderId, receiverId } = req.body;
  await Message.updateMany(
    { sender: senderId, receiver: receiverId, isRead: false },
    { $set: { isRead: true } }
  );
  res.sendStatus(200);
});


module.exports = router;
