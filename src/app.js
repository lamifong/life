module.exports = (function () {
    "use strict";

    const path = require("path");
    const express = require("express");
    const app = express();
    require("express-ws")(app);

    const Game = require("./game");
    const Coordinates = Game.Coordinates;
    const Cell = Game.Cell;
    const Grid = Game.Grid;
    const grid = new Grid(9, 9);

    /**
     * A player ID maps to an RGB triplet corresponding to their color.
     *
     * RGB triplets are stored as JSON.stringify() for equality comparisons.
     * @type {Map.<string, string>}
     */
    const players = new Map();

    /** Entry point for a new player. Generate a player ID and color. */
    app.get("/", function (req, res) {
        let id;
        while (!id || players.has(id)) {
            id = require("crypto").randomBytes(20).toString("hex");
        }

        let color;
        const existingColors = new Set(players.values());
        while (!color || existingColors.has(color)) {
            color = JSON.stringify([
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256)
            ]);
        }

        players.set(id, color);

        res.redirect("/player/" + id);
    });

    app.get("/player/:id", function (req, res) {
        const id = req.params && req.params.id;
        if (!id || !players.has(id)) {
            res.redirect("/");
        } else {
            res.sendFile(path.join(__dirname, "game.html"));
        }
    });

    const webSockets = [];

    app.ws("/player/:id", function (ws, req) {
        const id = req.params && req.params.id;
        if (!id || !players.has(id)) {
            ws.close();
            return;
        }

        const color = JSON.parse(players.get(id));

        ws.on("message", function (msg) {
            const command = msg.split("|");

            if (command[0] === "Set") {
                const [x, y] = command[1].split(",").map(function (string) {
                    // For some reason, .map(parseInt) doesn't work.
                    return parseInt(string);
                });
                const validX = Number.isInteger(x) && x >= 0 && x <= grid.getMaxX();
                const validY = Number.isInteger(y) && y >= 0 && y <= grid.getMaxY();

                if (validX && validY) {
                    const coordinates = new Coordinates(x, y);

                    if (!grid.getCell(coordinates).isAlive()) {
                        grid.setCell(new Cell(coordinates).setColor(color).setAlive());
                    }
                }
            } else if (command[0] === "Block") {
                grid.tryGenerateBlock(color);
            } else if (command[0] === "Blinker") {
                grid.tryGenerateBlinker(color);
            } else if (command[0] === "Glider") {
                grid.tryGenerateGlider(color);
            }
        });

        ws.color = JSON.stringify(color);
        webSockets.push(ws);
    });

    app.use(express.static(path.join(__dirname, "../public")));

    /** The grid ticks every second. */
    setInterval(function () {
        grid.tick();

        webSockets.forEach(function (ws) {
            if (ws.readyState === 1) {
                ws.send(ws.color + "|" + grid.serialize());
            }
        });
    }, 1000);

    if (require.main === module) {
        app.listen(process.env.PORT || 3000);
    }

    return app;
}());
