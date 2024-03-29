#!/usr/bin/env node
// Have nice colors for our console logging
require('fresh-console')
const ArgumentParser = require('argparse').ArgumentParser
const ClementineClient = require('clementine-client')
const PowerMate = require('node-hid/src/powermate').PowerMate
const packageInfo = require('./package.json')

// Parse arguments
// eslint-disable-next-line camelcase
const parser = new ArgumentParser({ add_help: true, description: packageInfo.description })
parser.add_argument('-v', '--version', { action: 'version', version: packageInfo.version })
parser.add_argument('-t', '--host', { help: 'Clementine Host (default: 127.0.0.1)', default: '127.0.0.1' })
parser.add_argument('-p', '--port', { help: 'Clementine Port (default: 5500)', default: 5500 })
parser.add_argument('-c', '--code', { help: 'Auth code to use with Clementine (default: 43304)', default: 43304 })
const args = parser.parse_args()

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
        this.trackChangeThreshold = 10
        this.trackChangeDelta = 0
        this.trackChanged = false
        // Connect to devices
        this.connectPlayer()
        this.connectHardware()
    }
    // Button click does play/pause if wheel is not moved
    // otherwise, track next/prev
    buttonDown() {
        this.setLED(0)
        this.buttonPressed = true
    }
    buttonUp() {
        this.setLED(Math.round(this.volume * 2.55))
        if (this.trackChanged) {
            this.trackChanged = false
            this.trackChangeDelta = 0
        } else {
            this.playing = !this.playing
            console.info(`${this.playing ? 'Resuming' : 'Pausing'} Playback`)
            this.client.playpause()
        }
        this.buttonPressed = false
    }
    connectPlayer() {
        this.client = new ClementineClient({
            host: this.host,
            port: this.port,
            authCode: this.authCode
        })
        this.client.on('info', this.connected.bind(this))
        this.client.on('error', this.error.bind(this))
        this.client.on('play', () => this.playing = true)
        this.client.on('volume', volume => {
            this.volume = volume
            // Show volume with LED
            this.setLED(Math.round(volume * 2.55))
        })
        this.client.on('song', this.songChanged.bind(this))
        this.client.on('disconnect', this.disconnected.bind(this))
    }
    connectHardware() {
        try {
            this.powermate = new PowerMate()
        } catch (e) {
            console.error(`Error: ${e.message}. Trying to reconnect in ${this.reconnectTime} seconds.`)
            setTimeout(this.connectHardware.bind(this), this.reconnectTime * 1000)
            return
        }
        console.info('Connected to Powermate!')
        this.setLED(255)
        this.powermate.on('buttonDown', this.buttonDown.bind(this))
        this.powermate.on('buttonUp', this.buttonUp.bind(this))
        this.powermate.on('turn', this.wheelTurn.bind(this))
        this.powermate.on('disconnected', this.disconnectedHardware.bind(this))
    }
    // eslint-disable-next-line class-methods-use-this
    connected(version) {
        console.info(`Connected to ${version}!`)
    }
    disconnected(reason) {
        console.info(`Disconnected from Clementine (${reason}).`)
        console.info(`Trying to reconnect in ${this.reconnectTime} seconds...`)
        setTimeout(this.connectPlayer.bind(this), this.reconnectTime * 1000)
    }
    disconnectedHardware() {
        console.info('Disconnected Powermate.')
        console.info(`Trying to reconnect in ${this.reconnectTime} seconds...`)
        setTimeout(this.connectHardware.bind(this), this.reconnectTime * 1000)
    }
    error(msg) {
        console.error(`Error: ${msg}. Reconnecting in ${this.reconnectTime} seconds...`)
        setTimeout(this.connectPlayer.bind(this), this.reconnectTime * 1000)
    }
    // eslint-disable-next-line class-methods-use-this
    songChanged(song) {
        if (!song.title) return
        console.info(`Now playing: ${song.artist} - ${song.title}`)
    }
    setLED(brightness) {
        const featureReport = [0, 0x41, 1, 0x01, 0, brightness, 0, 0, 0]
        try {
            if (this.powermate) this.powermate.hid.sendFeatureReport(featureReport)
        } catch (e) {
            // Swallow any feature report send failures
        }
    }
    wheelTurn(delta) {
        // Modify volume if button is up
        if (!this.buttonPressed) {
            const volume = Math.max(0, Math.min(100, this.volume + delta))
            this.client.setVolume(volume)
        // Change track if button is down and a minimum delta is met
        } else {
            this.trackChangeDelta += delta
            if (this.trackChangeDelta > this.trackChangeThreshold) {
                console.info('Playing next track')
                this.client.next()
                this.trackChanged = true
                this.trackChangeDelta = 0
            } else if (this.trackChangeDelta < -this.trackChangeThreshold) {
                console.info('Playing previous track')
                this.client.previous()
                this.trackChanged = true
                this.trackChangeDelta = 0
            }
        }
    }
}

new ClementineRemote(args.host, args.port, args.code)
