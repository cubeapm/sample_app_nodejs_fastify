const Fastify = require("fastify");
const axios = require("axios");
const mysql = require("mysql2");
const redis = require("redis");
const { createLogger, format, transports } = require('winston');
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;

const start = async () => {
  const app = Fastify({ logger: true });

  // --- MySQL connection ---
  const mysqlClient = mysql.createConnection({
    host: "mysql",
    user: "root",
    password: "root",
    database: "test",
  });

  mysqlClient.connect(err => {
    if (err && process.env.CUBE_DOCKER_COMPOSE) throw err;
    console.log("mysql connected!");
  });

  // --- Redis connection ---
  const redisClient = redis.createClient({ url: "redis://redis:6379" });
  await redisClient.connect();
  console.log("redis connected!");

  // --- Routes ---
    app.get("/", async () => {
    logger.info("root called");
    return "Hello"
  });

  app.get("/param/:param", async (req) => {
    logger.info("param called");
    return `Got param ${req.params.param}`;
  });

  app.get("/exception", async () => {
    logger.info("exception called");
    throw new Error("Sample exception");
  });

  app.get("/api", async () => { 
    logger.info("api called");
    await axios.get("http://localhost:8000/"); return "API called"; });

  app.get("/mysql", async () => new Promise((resolve, reject) => {
    logger.info("mysql called");
    mysqlClient.query("SELECT NOW()", (err, results) => {
      if (err) reject(err);
      else resolve(results[0]["NOW()"]);
    });
  }));

  app.get("/redis", async () => { 
    logger.info("redis called");
    await redisClient.set("foo", "bar"); return "Redis called"; 
  });

  // --- Start server ---
  const PORT = parseInt(process.env.PORT || "8000");
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Listening on http://localhost:${PORT}`);
};

start();
