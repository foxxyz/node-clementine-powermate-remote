Griffin Powermate Remote Control for Clementine 🍊
==================================================

Node-based remote control for the [Clementine music player](https://www.clementine-player.org/) using a [Griffin Powermate](https://griffintechnology.com/us/powermate)

Requirements
------------

### Node.js 7+

 * OSX: `brew install node` using [Homebrew](http://brew.sh/)
 * Linux: `apt install nodejs` ([see Ubuntu/Debian specific instructions](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)) or `pacman -S nodejs` (Arch Linux)
 * Windows: [Install](https://nodejs.org/en/download/)

Installation
------------

 1. Run `npm install` to install dependencies

Usage
-----

Make sure _Use a network remote control_ is enabled in _Clementine > Preferences > Network Remote_. For security, using an authentication code is recommended.

Using defaults:

`./index.js`

## CLI Options

 * `--host`: Set clementine host (default: `127.0.0.1`)
 * `--port`: Set clementine port (default: `5500`)
 * `--code`: Auth code to use with Clementine (default: `43304`)

For all CLI options, run `./index.js --help`.

Commands
--------

 * Wheel turn: Changes volume
 * Button press: Plays/pauses currently playing track
 * Hold button and turn wheel: Next/previous track
