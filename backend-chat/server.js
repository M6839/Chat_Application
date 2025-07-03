const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const Message = require("./models/Message");
const User = require("./models/User");
const unreadCountRoute = require("./routes/unreadCount");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", unreadCountRoute);
// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
// GET /api/messages/:senderId/:receiverId
app.get("/api/messages/:senderId/:receiverId", async (req, res) => {
  const { senderId, receiverId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  }).sort({ timestamp: 1 }); // oldest first

  res.json(messages);
});

// ✅ Get chat messages between two users
app.get("/api/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 }); // Sort oldest to newest

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// WebSocket
io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      const msg = await Message.create({
        sender: senderId,
        receiver: receiverId,
        message,
        timestamp: new Date(),
      });

      const roomId = [senderId, receiverId].sort().join("_");
      io.to(roomId).emit("receiveMessage", msg);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Start Server
server.listen(5000, () => console.log("Server running on port 5000"));
