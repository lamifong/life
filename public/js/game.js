$(document).ready(function () {
    "use strict";

    const ws = new WebSocket("ws://" + document.location.host + document.location.pathname);
    let color;

    const initialize = function (newColor) {
        color = newColor;

        // Click on a cell to attempt to set it to live.
        $("td").click(function () {
            if (ws.readyState !== 1) {
                return;
            }

            // Set a transparent color to distinguish our attempt to set a cell v. a live cell.
            $(this).css("background-color", "rgba(" + color.join(", ") + ", 0.5)");

            const x = $(this).index();
            const y = $(this).parent().index();

            // Whether this succeeds or not will be known on the next tick.
            ws.send("Set|" + x.toString() + "," + y.toString());
        });

        $("#block").click(function () {
            ws.send("Block");
        });

        $("#blinker").click(function () {
            ws.send("Blinker");
        });

        $("#glider").click(function () {
            ws.send("Glider");
        });
    };

    // There's only one type of message the client will receive: the state of the grid.
    ws.onmessage = function (event) {
        const components = event.data && event.data.split("|");
        if (!color) {
            initialize(JSON.parse(components[0]));
        }

        const time = components[1];
        $("#time").text(time.substr(0, 2) + ":" + time.substr(2, 2) + ":" + time.substr(4));

        // The data only contains live cells, so assume all cells are dead first.
        $("td").css("background-color", "white");

        $.each(components.slice(2), function (index, cell) {
            const [x, y, r, g, b] = cell.split(",");
            const td = $("tr").eq(y).find("td").eq(x);
            td.css("background-color", "rgb(" + r + "," + g + "," + b + ")");
        });
    };
});
