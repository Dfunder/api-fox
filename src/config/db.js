const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(" MongoDB connection failed:", error.message);

    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn(" MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

module.exports = connectDB;