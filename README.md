# Introduction

This is a multiplayer Game of Life with colored cells representing different players.

# Usage

```bash
$ npm install
$ PORT=3000 node src/app.js
```

Once the server is up, players can navigate to `http://127.0.0.1:3000` (assuming localhost) to join the game.

Players can click on any of the white cells to set it to live. Your selection will immediately be reflected in the next tick, so make sure you've clicked on enough cells to produce a live population!

Alternatively, you can click on the buttons at the top to generate patterns at random places.

# Troubleshooting

If your clicks aren't working, check out the time at the top right. If it's out of sync, you've probably lost connection with the server.

To resume the game, just refresh the page you're on and you'll be back where you left off!
