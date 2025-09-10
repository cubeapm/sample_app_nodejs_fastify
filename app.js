const apm = require('elastic-apm-node').start()
const Fastify = require("fastify");
const axios = require("axios");
const mysql = require("mysql2");
const redis = require("redis");

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
  app.get("/", async () => "Hello");

  app.get("/param/:param", async (req) => `Got param ${req.params.param}`);

  app.get("/exception", async () => { throw new Error("Sample exception"); });

  app.get("/api", async () => { await axios.get("http://localhost:8000/"); return "API called"; });

  app.get("/mysql", async () => new Promise((resolve, reject) => {
    mysqlClient.query("SELECT NOW()", (err, results) => {
      if (err) reject(err);
      else resolve(results[0]["NOW()"]);
    });
  }));

  // Elastic apm agent does not support redis 5+ [https://www.elastic.co/docs/reference/apm/agents/nodejs/supported-technologies]
  app.get("/redis", async () => { await redisClient.set("foo", "bar"); return "Redis called"; });

  // --- Start server ---
  const PORT = parseInt(process.env.PORT || "8000");
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Listening on http://localhost:${PORT}`);
};

start();
