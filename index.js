#!/usr/bin/env node
// Have nice colors for our console logging
require('paint-console')
const ArgumentParser = require('argparse').ArgumentParser
const ClementineClient = require('clementine-remote').Client
const PowerMate = require('node-powermate')
const packageInfo = require('./package.json')

// Parse arguments
var parser = new ArgumentParser({ version: packageInfo.version, addHelp: true, description: packageInfo.description })
parser.addArgument(['-t', '--host'], { help: 'Clementine Host (default: 127.0.0.1)', defaultValue: '127.0.0.1'})
parser.addArgument(['-p', '--port'], { help: 'Clementine Port (default: 5500)', defaultValue: 5500})
parser.addArgument(['-c', '--code'], { help: 'Auth code to use with Clementine (default: 43304)', defaultValue: 43304})
var args = parser.parseArgs()

class ClementineRemote {
    constructor(host, port, authCode) {
        this.host = host
        this.port = port
        this.authCode = authCode
        this.playing = false
        this.buttonPressed = false
        this.volume = 0
        // How many seconds until reconnecting
        this.reconnectTime = 10
        // How far to turn the wheel to trigger a track change when 
        // button is down
        this.trackChangeThreshold = 6
        this.trackChangeDelta = 0
        this.trackChanged = false
        // Connect to devices
        this.connectPlayer()
        this.connectHardware()
    }
    // Button click does play/pause if wheel is not moved
    // otherwise, track next/prev
    buttonDown() {
        this.powermate.setBrightness(0)
        this.buttonPressed = true
    }
    buttonUp() {
        this.powermate.setBrightness(255)
        if (this.trackChanged) {
            this.trackChanged = false
            this.trackChangeDelta = 0
        }
        else {
            this.playing = !this.playing
            console.log((this.playing ? "Resuming" : "Pausing") + " Playback")
            this.client.playpause()
        }
        this.buttonPressed = false
    }
    connectPlayer() {
        this.client = new ClementineClient({
            host: this.host,
            port: this.port,
            auth_code: this.authCode
        })
        this.client.on('connect', this.connected.bind(this))
        this.client.on('error', this.error.bind(this))
        this.client.on('play', () => this.playing = true)
        this.client.on('volume', (volume) => this.volume = volume)
        this.client.on('song', this.songChanged.bind(this))
        this.client.on('end', this.disconnected.bind(this))
    }
    connectHardware() {
        try {
            this.powermate = new PowerMate()
        }
        catch(e) {
            console.error("Error: " + e.message + ". Trying to reconnect in " + this.reconnectTime + " seconds.")
            setTimeout(this.connectHardware.bind(this), this.reconnectTime * 1000)
            return
        }
        console.info("Connected to Powermate!")
        this.powermate.setBrightness(255)
        this.powermate.on('buttonDown', this.buttonDown.bind(this))
        this.powermate.on('buttonUp', this.buttonUp.bind(this))
        this.powermate.on('wheelTurn', this.wheelTurn.bind(this))
        this.powermate.on('disconnected', this.disconnectedHardware.bind(this))
    }
    connected() {
        console.info('Connected to Clementine!')
    }
    disconnected() {
        console.info("Disconnected from Clementine.")
        console.log("Trying to reconnect in " + this.reconnectTime + " seconds...")
        setTimeout(this.connectPlayer.bind(this), this.reconnectTime * 1000)
    }
    disconnectedHardware() {
        console.info("Disconnected Powermate.")
        console.log("Trying to reconnect in " + this.reconnectTime + " seconds...")
        setTimeout(this.connectHardware.bind(this), this.reconnectTime * 1000)
    }
    error(msg) {
        console.error("Error: " + msg + ". Reconnecting in " + this.reconnectTime + " seconds...")
        setTimeout(this.connectPlayer.bind(this), this.reconnectTime * 1000)   
    }
    songChanged(song) {
        if (!song.title) return
        console.info("Now playing: " + song.artist + ": " + song.title)
    }
    wheelTurn(delta) {
        // Modify volume if button is up
        if (!this.buttonPressed) {
            let volume = Math.max(0, Math.min(100, this.volume + delta))
            this.client.write({ type: 'SET_VOLUME', request_set_volume: { volume }})
        }
        // Change track if button is down and a minimum delta is met
        else {
            this.trackChangeDelta += delta
            if (this.trackChangeDelta > 4) {
                console.log("Playing next track")
                this.client.next()
                this.trackChanged = true
                this.trackChangeDelta = 0
            }
            else if (this.trackChangeDelta < -4) {
                console.log("Playing previous track")
                this.client.previous()
                this.trackChanged = true
                this.trackChangeDelta = 0
            }
        }
    }
}

const remote = new ClementineRemote(args.host, args.port, args.code)
