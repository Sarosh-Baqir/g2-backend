const express = require("express");
const cors = require("cors");
const routes = require("../src/routes/index");

// Initialize the Express app
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Middleware to parse JSON requests
app.use(express.json());

// Test route to check server
app.get("/", (req, res) => {
  res.send("Welcome to the app!");
});
app.use("/api", routes);

// Start the server on a given port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
