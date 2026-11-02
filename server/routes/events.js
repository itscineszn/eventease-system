const express = require("express");

module.exports = (pool) => {
  const router = express.Router();

  // GET /api/events - Kunin ang lahat ng events
  router.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM events ORDER BY id DESC");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events." });
    }
  });

  // POST /api/events - Gumawa ng event kasama ang start_time at end_time
  router.post("/", async (req, res) => {
    try {
      const { title, description, event_date, start_time, end_time, location, capacity, status } = req.body;

      const result = await pool.query(
        `INSERT INTO events (title, description, event_date, start_time, end_time, location, capacity, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, description, event_date, start_time, end_time, location, capacity, status]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event." });
    }
  });

  return router;
};