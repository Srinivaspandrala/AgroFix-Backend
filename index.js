const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("./fruit_purchase.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
        db.run(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trackingId INTEGER,
                totalPrice REAL,
                status TEXT DEFAULT 'Pending'
            )
        `, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            }
        });
    }
});

app.post("/submitid", (req, res) => {
    const { trackingId, totalPrice } = req.body;

    if (!trackingId || !totalPrice) {
        return res.status(400).json({ error: "trackingId and Total Price are required." });
    }

    const query = `INSERT INTO purchases (trackingId, totalPrice) VALUES (?, ?)`;
    db.run(query, [trackingId, totalPrice], function (err) {
        if (err) {
            console.error("Error inserting data:", err.message);
            return res.status(500).json({ error: "Failed to save TrackingId." });
        }

        res.status(201).json({
            message: "trackingID saved successfully!",
            trackingId: trackingId,
        });
    });
});

app.get("/purchases", (req, res) => {
    db.all(`SELECT * FROM purchases`, [], (err, rows) => {
        if (err) {
            console.error("Error retrieving data:", err.message);
            return res.status(500).json({ error: "Failed to retrieve purchases." });
        }

        res.status(200).json(rows);
    });
});

app.put("/purchases/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "Status is required." });
    }

    const query = `UPDATE purchases SET status = ? WHERE id = ?`;
    db.run(query, [status, id], function (err) {
        if (err) {
            console.error("Error updating status:", err.message);
            return res.status(500).json({ error: "Failed to update status." });
        }

        res.status(200).json({ message: "Order status updated successfully!" });
    });
});

app.get("/track/:trackingId", (req, res) => {
    const { trackingId } = req.params;

    const query = `SELECT * FROM purchases WHERE trackingId = ?`;
    db.get(query, [trackingId], (err, row) => {
        if (err) {
            console.error("Error fetching order:", err.message);
            return res.status(500).json({ error: "Failed to fetch order details." });
        }
        if (!row) {
            return res.status(404).json({ error: "Order not found with this tracking ID." });
        }
        res.status(200).json(row);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
