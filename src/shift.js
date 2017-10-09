'use strict'

// shiftsStore - a hash that maps shift names to shift objects
module.exports.use = (shiftsStore) => {
  const Shift = class {
    constructor (name, start, end, users = []) {
      if (!name) {
        throw new Error('Shift name cannot be empty')
      }
      this.name = name

      const parsehhmm = (value, what) => {
        const hhmmRe = /^(\d\d):(\d\d)$/
        const match = hhmmRe.exec(value)
        if (!match) {
          throw new Error(`${what} does not match format: 'hh:mm' (00 <= hh <= 23, 00 <= mm <= 59)`)
        }
        const hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          throw new Error(`${what} does not match format: 'hh:mm' (00 <= hh <= 23, 00 <= mm <= 59)`)
        }

        return {
          hours: hours,
          minutes: minutes,
          toString: () => value
        }
      }

      this.start = parsehhmm(start, 'Shift start')
      this.end = parsehhmm(end, 'Shift end')
      this.users = users
    }

    toString () {
      return `${this.name}: ${this.start}-${this.end} UTC => ${this.users.length === 0 ? '[]' : this.users}`
    }

    remember () {
      shiftsStore[this.name] = this
    }

    matches (alert) {
      const alertStart = alert.startsAt.getUTCHours() * 60 + alert.startsAt.getUTCMinutes()
      const shiftStart = this.start.hours * 60 + this.start.minutes
      const shiftEnd = this.end.hours * 60 + this.end.minutes

      if (shiftStart <= shiftEnd) {
        return shiftStart <= alertStart && alertStart < shiftEnd
      } else {
        return (shiftStart <= alertStart && alertStart < 24 * 60) ||
          (alertStart >= 0 && alertStart < shiftEnd)
      }
    }

    static fromString (shiftString) {
      const matches = shiftString.match(/(.*)=(\d\d:\d\d)-(\d\d:\d\d)/)
      if (!matches || matches.length !== 4) {
        throw new Error(`Shift format error: expected name=ss:ss-ee:ee but got: ${shiftString}`)
      }
      // ignore first element of the array returned by "matches"
      const [, name, start, end] = matches
      return new Shift(name, start, end)
    }

    static find (name) {
      return shiftsStore[name]
    }

    static all () {
      return Object.entries(shiftsStore)
        .map(([name, shift]) => shift)
    }

    static parse (shiftsString) {
      return shiftsString.split(',').map(s => Shift.fromString(s))
    }
  }

  return Shift
}
