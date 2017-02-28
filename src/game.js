module.exports = (function () {
    "use strict";

    const assert = require("assert");
    const space = require("color-space");

    /**
     * Represents a point in two dimensions.
     * @constructor
     * @param {number} x
     * @param {number} y
     */
    const Coordinates = function (x, y) {
        assert(Number.isInteger(x));
        assert(Number.isInteger(y));

        this.getX = function () {
            return x;
        };

        this.getY = function () {
            return y;
        };
    };

    /**
     * Adds numeric offsets.
     * @param {Array.<Array.<number>>} offsets In the form of: [[offsetToX, offsetToY], ...]
     * @returns {Array.<Coordinates>}
     */
    Coordinates.prototype.addOffsets = function (offsets) {
        return offsets.map(function (offset) {
            return new Coordinates(this.getX() + offset[0], this.getY() + offset[1]);
        }, this);
    };

    /** This must be unique for each coordinates as certain functions rely on this. */
    Coordinates.prototype.toString = function () {
        return this.getX().toString() + "," + this.getY().toString();
    };

    /**
     * Represents a cell in the grid.
     *
     * Cells are initially dead upon instantiation.
     *
     * Cells are also potentially colored. If they're alive, they have a color.
     * @constructor
     * @param {Coordinates} coordinates
     */
    const Cell = function (coordinates) {
        assert(coordinates instanceof Coordinates);

        let alive = false;
        let color = null;

        this.getCoordinates = function () {
            return coordinates;
        };

        /** @returns {?Array.<number>} */
        this.getColor = function () {
            return color;
        };

        /**
         * Sets the color of this cell.
         * @param {Array.<number>} newColor An RGB triplet.
         * @returns {Cell} This instance.
         */
        this.setColor = function (newColor) {
            assert(newColor.length === 3);
            assert(Number.isInteger(newColor[0]) && newColor[0] >= 0 && newColor[0] <= 255);
            assert(Number.isInteger(newColor[1]) && newColor[1] >= 0 && newColor[1] <= 255);
            assert(Number.isInteger(newColor[2]) && newColor[2] >= 0 && newColor[2] <= 255);

            color = newColor;
            return this;
        };

        /** @returns {boolean} */
        this.isAlive = function () {
            return alive;
        };

        /**
         * Sets the cell as alive.
         *
         * You must set a valid color before calling this method.
         * @returns {Cell} This instance.
         */
        this.setAlive = function () {
            assert(color);

            alive = true;
            return this;
        };

        /**
         * Sets the cell as dead.
         *
         * The color of this cell will be cleared.
         * @returns {Cell} This instance.
         */
        this.setDead = function () {
            alive = false;
            color = null;
            return this;
        };
    };

    /**
     * Represents the universe for the Game of Life.
     *
     * The coordinates for the top left cell is (0, 0).
     *
     * There's no limit on the size of the grid, as long as you have the memory.
     * @constructor
     * @param {number} maxX
     * @param {number} maxY
     */
    const Grid = function (maxX, maxY) {
        assert(Number.isInteger(maxX));
        assert(Number.isInteger(maxY));

        const grid = new Map();    // Key is Coordinates.toString(). Value is the cell.

        this.getMaxX = function () {
            return maxX;
        };

        this.getMaxY = function () {
            return maxY;
        };

        /**
         * Returns a cell in the grid.
         * @param {Coordinates} coordinates
         * @returns {Cell}
         */
        this.getCell = function (coordinates) {
            assert(coordinates instanceof Coordinates);
            assert(coordinates.getX() >= 0 && coordinates.getX() <= this.getMaxX());
            assert(coordinates.getY() >= 0 && coordinates.getY() <= this.getMaxY());

            return grid.get(coordinates.toString()) || this.setCell(new Cell(coordinates));
        };

        /**
         * Replaces a cell in the grid.
         * @param {Cell} cell
         * @returns {Cell} The set cell.
         */
        this.setCell = function (cell) {
            assert(cell instanceof Cell);
            assert(cell.getCoordinates().getX() >= 0);
            assert(cell.getCoordinates().getX() <= this.getMaxX());
            assert(cell.getCoordinates().getY() >= 0);
            assert(cell.getCoordinates().getY() <= this.getMaxY());

            grid.set(cell.getCoordinates().toString(), cell);
            return cell;
        };

        /**
         * Transition the grid to the next generation.
         *
         * This will first check all live cells against the first 3 rules.
         * Afterwards, their dead neighbors will be checked against the last rule.
         *
         * This minimizes the number of cells we have to check.
         */
        this.tick = function () {
            const cellsChecked = new Set();
            const cellsToSwitch = [];

            let cellsToCheck = Array.from(grid.values()).filter(function (cell) {
                return cell.isAlive();
            });

            while (cellsToCheck.length > 0) {
                const cell = cellsToCheck.pop();
                if (cellsChecked.has(cell)) {
                    continue;
                }

                const neighbors = Array.from(this.neighbors(cell));
                const liveNeighbors = neighbors.filter(function (cell) {
                    return cell.isAlive();
                });

                if (cell.isAlive() && (liveNeighbors.length < 2 || liveNeighbors.length > 3)) {
                    cellsToSwitch.push(cell);
                } else if (!cell.isAlive() && liveNeighbors.length === 3) {
                    // If a cell is revived, its color is the average of its live neighbors'.
                    const labColors = [
                        space.rgb.lab(liveNeighbors[0].getColor()),
                        space.rgb.lab(liveNeighbors[1].getColor()),
                        space.rgb.lab(liveNeighbors[2].getColor())
                    ];
                    cell.setColor(space.lab.rgb([
                        (labColors[0][0] + labColors[1][0] + labColors[2][0]) / 3,
                        (labColors[0][1] + labColors[1][1] + labColors[2][1]) / 3,
                        (labColors[0][2] + labColors[1][2] + labColors[2][2]) / 3
                    ]).map(Math.round));
                    cellsToSwitch.push(cell);
                }

                cellsChecked.add(cell);

                // Cells that are alive may revive their dead neighbors, so check them.
                if (cell.isAlive()) {
                    cellsToCheck = cellsToCheck.concat(neighbors);
                }
            }

            cellsToSwitch.forEach(function (cell) {
                if (cell.isAlive()) {
                    cell.setDead();
                } else {
                    cell.setAlive();
                }
            });
        };

        /**
         * Serializes the grid into the following format:
         *
         * HHMMSS|x,y,R,G,B|...
         *
         * Only live cells will be included in the string.
         * @returns {string}
         */
        this.serialize = function () {
            const date = [
                ("0" + new Date().getHours().toString()).slice(-2),
                ("0" + new Date().getMinutes().toString()).slice(-2),
                ("0" + new Date().getSeconds().toString()).slice(-2)
            ].join("");

            const cells = Array.from(grid.values()).filter(function (cell) {
                return cell.isAlive();
            }).map(function (cell) {
                const coordinates = cell.getCoordinates();
                return [
                    coordinates.getX().toString(),
                    coordinates.getY().toString(),
                    cell.getColor().join(",")
                ].join(",");
            }).join("|");

            return cells.length > 0 ? [date, cells].join("|") : date;
        };

        /**
         * This section contains methods to generate patterns at random places.
         *
         * The strategy is to find all dead cells and probe each one to see if they have enough dead
         * neighbors to hold the entire pattern.
         *
         * This shouldn't take too long. If there are lots of dead cells to probe, this implies the
         * grid is empty and more likely for us to land on an empty block on our first few tries.
         */

        /**
         * The set of all valid coordinates for the grid in the form of: x,y
         * @type {Set.<string>}
         */
        const allCoordinates = (function () {
            const set = new Set();
            for (let y = 0; y <= maxY; ++y) {
                for (let x = 0; x <= maxX; ++x) {
                    set.add(new Coordinates(x, y).toString());
                }
            }

            return set;
        }());

        /**
         * Returns all dead cells, including those which has not been set before.
         * @returns {Array.<Cell>}
         */
        const getAllDeadCells = function () {
            const deadCoordinates = new Set(allCoordinates);
            Array.from(grid.values()).forEach(function (cell) {
                if (cell.isAlive()) {
                    deadCoordinates.delete(cell.getCoordinates().toString());
                }
            });

            return Array.from(deadCoordinates.values()).map(function (string) {
                const [x, y] = string.split(",");
                return this.getCell(new Coordinates(parseInt(x), parseInt(y)));
            }, this);
        };

        /**
         * A pattern may have multiple variations. A blinker has two: horizontal and vertical.
         *
         * This function tries to find space to instantiate any variation of a pattern.
         *
         * This is accomplished by taking a dead cell as the center of a pattern, then checking its
         * neighbors to see if there are enough dead cells in the right place.
         *
         * The coordinates offsets you pass in should not cause out of bounds errors! Make sure your
         * dead cells are properly filtered.
         * @param {Array.<Cell>} deadCells Candidates for the center of a pattern.
         * @param {Array.<Array.<Array.<number>>>} variations Coordinates offsets for the pattern.
         * @param {Array.<number>} color
         */
        const tryInstantiatePattern = (function () {
            const filterValidVariations = function (cell, variations) {
                return variations.map(function (variation) {
                    return cell.getCoordinates().addOffsets(variation).map(this.getCell, this);
                }, this).filter(function (variation) {
                    // If one of the cells for a variation is alive, that variant is unusable.
                    return variation.filter(function (cell) {
                        return !cell.isAlive();
                    }).length === variation.length;
                });
            }.bind(this);

            const randomPop = function (array) {
                const index = Math.floor(Math.random() * array.length);
                const element = array[index];
                array.splice(index, 1);
                return element;
            };

            return function (deadCells, variations, color) {
                let cellsToSet;
                while (deadCells.length > 0) {
                    const validVariations = filterValidVariations(randomPop(deadCells), variations);
                    if (validVariations.length > 0) {
                        cellsToSet = randomPop(validVariations);
                        break;
                    }
                }

                if (cellsToSet) {
                    cellsToSet.forEach(function (cell) {
                        cell.setColor(color).setAlive();
                    });
                }
            };
        }.call(this));

        this.tryGenerateBlock = function (color) {
            const deadCells = getAllDeadCells.call(this).filter(function (cell) {
                // A block needs a 2 by 2 block. Ignore the rightmost column and bottom row.
                const coordinates = cell.getCoordinates();
                const x = coordinates.getX();
                const y = coordinates.getY();

                return x < this.getMaxX() && y < this.getMaxY();
            }, this);

            tryInstantiatePattern(deadCells, [[[0, 0], [1, 0], [0, 1], [1, 1]]], color);
        };

        this.tryGenerateBlinker = function (color) {
            const deadCells = getAllDeadCells.call(this).filter(function (cell) {
                // A blinker needs a 3 by 3 block. Ignore corner cells.
                const coordinates = cell.getCoordinates();
                const x = coordinates.getX();
                const y = coordinates.getY();

                return x > 0 && x < this.getMaxX() && y > 0 && y < this.getMaxY();
            }, this);

            tryInstantiatePattern(deadCells, [
                [[-1, 0], [0, 0], [1, 0]],
                [[0, -1], [0, 0], [0, 1]]
            ], color);
        };

        this.tryGenerateGlider = function (color) {
            const deadCells = getAllDeadCells.call(this).filter(function (cell) {
                // A glider needs a 3 by 3 block. Ignore corner cells.
                const coordinates = cell.getCoordinates();
                const x = coordinates.getX();
                const y = coordinates.getY();

                return x > 0 && x < this.getMaxX() && y > 0 && y < this.getMaxY();
            }, this);

            tryInstantiatePattern(deadCells, [
                [[0, -1], [1, 0], [-1, 1], [0, 1], [1, 1]],
                [[-1, -1], [1, -1], [0, 0], [1, 0], [0, 1]],
                [[-1, 0], [0, 1], [1, 1], [1, 0], [1, -1]],
                [[-1, -1], [0, 0], [1, 0], [-1, 1], [0, 1]]
            ], color);
        };
    };

    /**
     * Returns the neighbors of a cell.
     * @param {Cell} cell
     * @returns {Set.<Cell>}
     */
    Grid.prototype.neighbors = function (cell) {
        assert(cell instanceof Cell);

        const offsets = [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1]
        ];
        return cell.getCoordinates().addOffsets(offsets).filter(function (coordinates) {
            const x = coordinates.getX();
            const y = coordinates.getY();

            // Corner cells may have neighbors that are out of bounds.
            return x >= 0 && x <= this.getMaxX() && y >= 0 && y <= this.getMaxY();
        }, this).map(this.getCell, this);
    };

    Grid.prototype.toString = function () {
        let string = "";

        for (let y = 0; y <= this.getMaxY(); ++y) {
            for (let x = 0; x <= this.getMaxX(); ++x) {
                if (this.getCell(new Coordinates(x, y)).isAlive()) {
                    string += "+";
                } else {
                    string += "-";
                }
            }

            if (y < this.getMaxY()) {
                string += "\n";
            }
        }

        return string;
    };

    return {
        "Coordinates": Coordinates,
        "Cell": Cell,
        "Grid": Grid
    };
}());
