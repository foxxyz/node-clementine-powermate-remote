Griffin Powermate Remote Control for Clementine 🍊
==================================================

Node-based remote control for the [Clementine music player](https://www.clementine-player.org/) using a [Griffin Powermate](https://griffin.zendesk.com/hc/en-us/articles/206445584-PowerMate-USB)

 * Rotate wheel: Volume control
 * Button press: Plays/pauses currently playing track
 * Hold button and rotate clockwise: Next track
 * Hold button and rotate counter-clockwise: Previous track

![Running with npx](img/cli.gif)

Requirements
------------

### Node.js 10+

 * OSX: `brew install node` using [Homebrew](http://brew.sh/)
 * Linux: `apt install nodejs` ([see Ubuntu/Debian specific instructions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)) or `pacman -S nodejs` (Arch Linux)
 * Windows: `choco install nodejs` using [Chocolatey](https://chocolatey.org/)

Usage
-----

Make sure _Use a network remote control_ is enabled in _Clementine > Preferences > Network Remote_ (for security, using an authentication code is recommended.), then run:

```
npx clementine-powermate-remote [--options]
```

### Alternative Install

```
npm install -g clementine-powermate-remote
clementine-powermate-remote [--options]
```

Options
-------

 * `--host`: Set clementine host (default: `127.0.0.1`)
 * `--port`: Set clementine port (default: `5500`)
 * `--code`: Auth code to use with Clementine (default: `43304`)

For all CLI options, run `clementine-powermate-remote --help`.
