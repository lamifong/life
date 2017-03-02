(function () {
    "use strict";

    const chai = require("chai");
    const chaiHttp = require("chai-http");
    const expect = chai.expect;
    const app = require("../src/app");

    chai.use(chaiHttp);

    /* jshint expr: true */
    describe("Server", function () {
        describe("GET /", function () {
            it("should redirect to the game with a player ID", function () {
                return chai.request(app)
                    .get("/")
                    .then(function (res) {
                        expect(res).to.redirect;
                        expect(res.request.url).to.match(/\/player\/[A-Za-z0-9]{40}$/);
                    });
            });

            it("should generate a new player ID if the one given is invalid", function () {
                return chai.request(app)
                    .get("/player/a")
                    .then(function (res) {
                        expect(res).to.redirect;
                        expect(res.request.url).to.match(/\/player\/[A-Za-z0-9]{40}$/);
                    });
            });
        });

        describe("WebSocket /player/:id", function () {
            const WebSocket = require("ws");
            let ws = [];
            before(function () {
                app.listen(3001);

                const newPlayer = function () {
                    return chai.request("http://127.0.0.1:3001")
                        .get("/")
                        .then(function (res) {
                            ws.push(new WebSocket(res.request.url.replace("http://", "ws://")));
                        });
                };

                // Create a few players so we have different colors to test with.
                return Promise.all([newPlayer(), newPlayer()]);
            });

            it("should close connections without a valid player ID", function (done) {
                new WebSocket("ws://127.0.0.1:3001/player/a").on("close", function () {
                    done();
                });
            });

            it("should ignore invalid commands", function (done) {
                ws[0].send("");
                ws[0].send("a");

                let success;
                ws[0].on("message", function () {
                    if (!success) {
                        // Server didn't crash.
                        success = true;
                        done();
                    }
                });
            });

            it("should periodically receive the state of the grid", function (done) {
                let success;
                ws[0].on("message", function (msg) {
                    if (!success) {
                        expect(msg).to.match(/\|[0-9]{6}$/);
                        success = true;
                        done();
                    }
                });
            });

            it("should be able to turn a dead cell into a live one", function (done) {
                let success;
                ws[0].on("message", function (msg) {
                    if (!success) {
                        const components = msg.split("|");
                        const correct = components.length === 6 &&
                            /^[0-9]{6}$/.test(components[1]) &&
                            /^0,0,[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}$/.test(components[2]) &&
                            /^0,1,[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}$/.test(components[3]) &&
                            /^1,0,[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}$/.test(components[4]) &&
                            /^1,1,[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}$/.test(components[5]);

                        if (correct) {
                            success = true;
                            done();
                        }
                    }
                });

                ws[0].send("Set|0,0");
                ws[0].send("Set|0,1");
                ws[0].send("Set|1,0");
                ws[0].send("Set|1,1");
            });

            it("should ignore requests to set an already live cell", function (done) {
                ws[1].send("Set|3,3");
                ws[1].send("Set|3,4");
                ws[1].send("Set|4,3");
                ws[1].send("Set|4,4");

                let firstTime;
                let success;
                ws[1].on("message", function (msg) {
                    const components = msg.split("|");
                    if (!firstTime) {
                        firstTime = components[1];
                    }

                    const ourCell = components.filter(function (component) {
                        return /^3,3,[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}$/.test(component);
                    });
                    const otherPlayerCell = components.filter(function (component) {
                        return /^0,0,[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}$/.test(component);
                    });
                    expect(ourCell.length).to.be.equal(1);
                    expect(otherPlayerCell.length).to.be.equal(1);

                    const ourColor = JSON.stringify(ourCell[0].split(",").slice(2));
                    const otherPlayerColor = JSON.stringify(otherPlayerCell[0].split(",").slice(2));
                    expect(ourColor).to.not.equal(otherPlayerColor);

                    if (firstTime === components[0]) {
                        ws[1].send("Set|0,0");    // Attempt to overwrite the other player's cell.
                    } else if (firstTime < components[0] && !success) {
                        // If we reach here, that means the other player's cell was unchanged.
                        success = true;
                        done();
                    }
                });
            }).timeout(3000);

            it("should ignore invalid coordinates", function (done) {
                ws[0].send("Set|-1,0");
                ws[0].send("Set|0,999");
                ws[0].send("Set|a,0");
                ws[0].send("Set|0,NaN");

                let success;
                ws[0].on("message", function () {
                    if (!success) {
                        success = true;
                        done();
                    }
                });
            });
        });
    });
}());
