(function () {
    "use strict";

    const assert = require("assert");
    const Game = require("../src/game");
    const Coordinates = Game.Coordinates;
    const Cell = Game.Cell;
    const Grid = Game.Grid;

    let grid;

    describe("Coordinates", function () {
        describe("#()", function () {
            it("should accept integers", function () {
                assert.doesNotThrow(function () {
                    new Coordinates(0, 0).toString();
                });
            });

            it("should reject floating point numbers", function () {
                assert.throws(function () {
                    new Coordinates(0.1, 0.1).toString();
                }, /false == true/);
            });

            it("should reject strings", function () {
                assert.throws(function () {
                    new Coordinates("0", 0).toString();
                }, /false == true/);
            });

            it("should reject NaN", function () {
                assert.throws(function () {
                    new Coordinates(0, NaN).toString();
                }, /false == true/);
            });

            it("should reject infinity", function () {
                assert.throws(function () {
                    new Coordinates(Number.POSITIVE_INFINITY, 0).toString();
                }, /false == true/);
            });
        });
    });

    describe("Cell", function () {
        describe("#()", function () {
            it("should accept Coordinates", function () {
                assert.doesNotThrow(function () {
                    new Cell(new Coordinates(0, 0)).toString();
                });
            });

            it("should reject non-Coordinates", function () {
                assert.throws(function () {
                    new Cell().toString();
                }, /false == true/);
            });
        });

        describe("#setColor()", function () {
            it("should change the Cell's state", function () {
                const cell = new Cell(new Coordinates(0, 0)).setColor([0, 100, 255]);
                assert.deepStrictEqual(cell.getColor(), [0, 100, 255]);
            });

            it("should reject invalid RGB values", function () {
                assert.throws(function () {
                    new Cell(new Coordinates(0, 0)).setColor([-1, 0, 0]);
                }, /false == true/);

                assert.throws(function () {
                    new Cell(new Coordinates(0, 0)).setColor([0, 0.1, 0]);
                }, /false == true/);

                assert.throws(function () {
                    new Cell(new Coordinates(0, 0)).setColor([0, 0, 256]);
                }, /false == true/);
            });
        });

        describe("#setAlive()", function () {
            it("should require a color to be set first", function () {
                assert.throws(function () {
                    new Cell().setAlive();
                }, /false == true/);
            });

            it("should change the Cell's state", function () {
                assert(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive().isAlive());
            });
        });

        describe("#setDead()", function () {
            it("should change the Cell's state", function () {
                const cell = new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive();
                assert(cell.isAlive());
                assert(!cell.setDead().isAlive());
            });

            it("should clear the color of the Cell", function () {
                const cell = new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive();
                assert(cell.getColor());
                assert(!cell.setDead().getColor());
            });
        });
    });

    describe("Grid", function () {
        beforeEach(function () {
            grid = new Grid(5, 5);
        });

        describe("#getCell()", function () {
            it("should reject coordinates that are out of bounds", function () {
                assert.throws(function () {
                    grid.getCell(new Cell(new Coordinates(-1, 0)));
                }, /false == true/);

                assert.throws(function () {
                    grid.getCell(new Cell(new Coordinates(0, 6)));
                }, /false == true/);
            });

            it("should return a cell even if it hasn't been set before", function () {
                assert(grid.getCell(new Coordinates(0, 0)) instanceof Cell);
            });

            it("should return a previously set cell", function () {
                const cell = new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive();
                grid.setCell(cell);
                assert.deepStrictEqual(grid.getCell(new Coordinates(0, 0)), cell);
            });
        });

        describe("#setCell()", function () {
            it("should reject coordinates that are out of bounds", function () {
                assert.throws(function () {
                    grid.setCell(new Cell(new Coordinates(-1, 0)));
                }, /false == true/);

                assert.throws(function () {
                    grid.setCell(new Cell(new Coordinates(0, 6)));
                }, /false == true/);
            });

            it("should overwrite a previously set cell", function () {
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive());
                const cell = grid.setCell(new Cell(new Coordinates(0, 0)).setColor([1, 1, 1]));
                assert.deepStrictEqual(grid.getCell(new Coordinates(0, 0)), cell);
            });
        });

        describe("#tick()", function () {
            it("should kill a live cell with 0 live neighbors", function () {
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive());
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
                grid.tick();
                assert(!grid.getCell(new Coordinates(0, 0)).isAlive());
            });

            it("should kill a live cell with 1 live neighbor", function () {
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([0, 0, 0]).setAlive());
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
                grid.tick();
                assert(!grid.getCell(new Coordinates(0, 0)).isAlive());
            });

            it("should spare a live cell with 2 live neighbors", function () {
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 0)).setColor([0, 0, 0]).setAlive());
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
                grid.tick();
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
            });

            it("should spare a live cell with 3 live neighbors", function () {
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 1)).setColor([0, 0, 0]).setAlive());
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
                grid.tick();
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
            });

            it("should kill a live cell with 4 live neighbors", function () {
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(0, 2)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 1)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(2, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(2, 2)).setColor([0, 0, 0]).setAlive());
                assert(grid.getCell(new Coordinates(1, 1)).isAlive());
                grid.tick();
                assert(!grid.getCell(new Coordinates(1, 1)).isAlive());
            });

            it("should revive a dead cell with 3 live neighbors", function () {
                assert(!grid.getCell(new Coordinates(1, 1)).isAlive());
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 0)).setColor([0, 0, 0]).setAlive());
                grid.tick();
                assert(grid.getCell(new Coordinates(1, 1)).isAlive());
            });

            it("should assign the average color of its neighbors to a revived cell", function () {
                grid.setCell(new Cell(new Coordinates(0, 0)).setColor([255, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([0, 255, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 0)).setColor([0, 0, 255]).setAlive());
                grid.tick();
                const color = grid.getCell(new Coordinates(1, 1)).getColor();
                assert.deepStrictEqual(color, [187, 122, 115]);
            });

            it("should host a glider", function () {
                grid.setCell(new Cell(new Coordinates(1, 0)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(2, 1)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(0, 2)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 2)).setColor([0, 0, 0]).setAlive());
                grid.setCell(new Cell(new Coordinates(2, 2)).setColor([0, 0, 0]).setAlive());
                assert.deepStrictEqual(grid.toString(),
                    "-+----\n" +
                    "--+---\n" +
                    "+++---\n" +
                    "------\n" +
                    "------\n" +
                    "------"
                );
                grid.tick();
                assert.deepStrictEqual(grid.toString(),
                    "------\n" +
                    "+-+---\n" +
                    "-++---\n" +
                    "-+----\n" +
                    "------\n" +
                    "------"
                );
                grid.tick();
                assert.deepStrictEqual(grid.toString(),
                    "------\n" +
                    "--+---\n" +
                    "+-+---\n" +
                    "-++---\n" +
                    "------\n" +
                    "------"
                );
                grid.tick();
                assert.deepStrictEqual(grid.toString(),
                    "------\n" +
                    "-+----\n" +
                    "--++--\n" +
                    "-++---\n" +
                    "------\n" +
                    "------"
                );
                grid.tick();
                assert.deepStrictEqual(grid.toString(),
                    "------\n" +
                    "--+---\n" +
                    "---+--\n" +
                    "-+++--\n" +
                    "------\n" +
                    "------"
                );
            });
        });

        describe("#serialize()", function () {
            it("should work even if there are no live cells", function () {
                assert(/^[0-9]{6}$/.test(grid.serialize()));
            });

            it("should work with 1 live cell", function () {
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([2, 3, 4]).setAlive());
                assert(/^[0-9]{6}\|0,1,2,3,4$/.test(grid.serialize()));
            });

            it("should work with 2 live cells", function () {
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([2, 3, 4]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 2)).setColor([3, 4, 5]).setAlive());
                assert(/^[0-9]{6}\|0,1,2,3,4\|1,2,3,4,5$/.test(grid.serialize()));
            });

            it("should ignore dead cells", function () {
                grid.setCell(new Cell(new Coordinates(0, 1)).setColor([2, 3, 4]).setAlive());
                grid.setCell(new Cell(new Coordinates(1, 2)).setColor([3, 4, 5]).setAlive());
                grid.getCell(new Coordinates(0, 1)).setDead();
                assert(/^[0-9]{6}\|1,2,3,4,5$/.test(grid.serialize()));
            });
        });

        describe("#tryGenerateBlock()", function () {
            it("should generate a block", function () {
                grid = new Grid(1, 1);
                grid.tryGenerateBlock([0, 0, 0]);
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
                assert(grid.getCell(new Coordinates(0, 1)).isAlive());
                assert(grid.getCell(new Coordinates(1, 0)).isAlive());
                assert(grid.getCell(new Coordinates(1, 1)).isAlive());
            });

            it("should do nothing if there's no space", function () {
                grid = new Grid(1, 1);
                grid.tryGenerateBlock([0, 0, 0]);
                grid.tryGenerateBlock([1, 1, 1]);
                assert(grid.getCell(new Coordinates(0, 0)).isAlive());
                assert(grid.getCell(new Coordinates(0, 1)).isAlive());
                assert(grid.getCell(new Coordinates(1, 0)).isAlive());
                assert(grid.getCell(new Coordinates(1, 1)).isAlive());
                assert.deepStrictEqual(grid.getCell(new Coordinates(0, 0)).getColor(), [0, 0, 0]);
                assert.deepStrictEqual(grid.getCell(new Coordinates(0, 1)).getColor(), [0, 0, 0]);
                assert.deepStrictEqual(grid.getCell(new Coordinates(1, 0)).getColor(), [0, 0, 0]);
                assert.deepStrictEqual(grid.getCell(new Coordinates(1, 1)).getColor(), [0, 0, 0]);
            });
        });

        describe("#tryGenerateBlinker()", function () {
            it("should generate a blinker", function () {
                grid = new Grid(2, 2);
                grid.tryGenerateBlinker([0, 0, 0]);

                const horizontal = grid.getCell(new Coordinates(1, 0)).isAlive() &&
                    grid.getCell(new Coordinates(1, 1)).isAlive() &&
                    grid.getCell(new Coordinates(1, 2)).isAlive();
                const vertical = grid.getCell(new Coordinates(0, 1)).isAlive() &&
                    grid.getCell(new Coordinates(1, 1)).isAlive() &&
                    grid.getCell(new Coordinates(2, 1)).isAlive();

                assert(horizontal || vertical);
            });
        });

        describe("#tryGenerateGlider()", function () {
            it("should generate a glider", function () {
                grid = new Grid(2, 2);
                grid.tryGenerateGlider([0, 0, 0]);

                const variationOne = grid.getCell(new Coordinates(1, 0)).isAlive() &&
                    grid.getCell(new Coordinates(2, 1)).isAlive() &&
                    grid.getCell(new Coordinates(0, 2)).isAlive() &&
                    grid.getCell(new Coordinates(1, 2)).isAlive() &&
                    grid.getCell(new Coordinates(2, 2)).isAlive();
                const variationTwo = grid.getCell(new Coordinates(0, 0)).isAlive() &&
                    grid.getCell(new Coordinates(2, 0)).isAlive() &&
                    grid.getCell(new Coordinates(1, 1)).isAlive() &&
                    grid.getCell(new Coordinates(2, 1)).isAlive() &&
                    grid.getCell(new Coordinates(1, 2)).isAlive();
                const variationThree = grid.getCell(new Coordinates(0, 1)).isAlive() &&
                    grid.getCell(new Coordinates(1, 2)).isAlive() &&
                    grid.getCell(new Coordinates(2, 0)).isAlive() &&
                    grid.getCell(new Coordinates(2, 1)).isAlive() &&
                    grid.getCell(new Coordinates(2, 2)).isAlive();
                const variationFour = grid.getCell(new Coordinates(0, 0)).isAlive() &&
                    grid.getCell(new Coordinates(0, 2)).isAlive() &&
                    grid.getCell(new Coordinates(1, 1)).isAlive() &&
                    grid.getCell(new Coordinates(1, 2)).isAlive() &&
                    grid.getCell(new Coordinates(2, 1)).isAlive();

                assert(variationOne || variationTwo || variationThree || variationFour);
            });
        });
    });
}());
