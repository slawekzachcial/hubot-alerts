'use strict'
// Description
//   A hubot script that manages on-support-duty shifts and alerts
//
// Configuration:
//   HUBOT_SHIFTS="shift1=00:00-06:00,shift2=06:00-12:00,..."
//
// Commands:
//   hubot shifts - prints shifts in UTC along assigned users
//   hubot shifts <shift> @user1 @user3 - assign users to shift
//   hubot alerts - prints current alerts with assignees
//   hubot alert ack <id> - accept working on alert
//   hubot alert done <id> - confirm alerted problem fixed
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   Slawek Zachcial
module.exports = (robot) => {
  // initialize it as empty so we don't have to check each time it was initialized
  // TODO: use 'on loaded' event to initialize it
  robot.brain.set('shifts', {})

  class Shift {
    constructor (name, start, end, users = []) {
      this.name = name
      this.start = start
      this.end = end
      this.users = users
    }

    toString () {
      return `${this.name}: ${this.start}-${this.end} UTC => ${this.users.length === 0 ? '[]' : this.users}`
    }

    remember () {
      robot.brain.get('shifts')[this.name] = this
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
      return robot.brain.get('shifts')[name]
    }

    static all () {
      const shiftsInBrain = robot.brain.get('shifts')
      return Object.entries(shiftsInBrain)
        .map(([name, shift]) => shift)
    }

    static parse (shiftsString) {
      return shiftsString.split(',').map(s => Shift.fromString(s))
    }
  }

  // Based on https://prometheus.io/docs/alerting/notifications/#alert
  // status: firing or resolved
  // labels: alert metadata, e.g. { severity: "page" }
  // annotations: additional information, e.g. { summary: "Server XYZ down", description: "Server XYZ has been down for 5 minutes" }
  // startsAt: the time the alert started firing
  // endsAt: the time the alert stopped firing
  // generatorURL: the backlink to the entity that fired the alert
  class Alert {
    constructor ({status, labels, annotations, startsAt, endsAt, generatorURL}) {
      this.status = (status && status.toLowerCase() === 'resolved' ? 'resolved' : 'firing')
      this.labels = labels || {}
      this.annotations = annotations || {}
      this.startsAt = (startsAt ? Date.parse(startsAt) : new Date())
      this.endsAt = (endsAt ? Date.parse(endsAt) : new Date(this.startsAt.getTime() + 5 * 60 * 1000))
      this.generatorURL = generatorURL
    }
  }

  // Give access to internal classes in tests
  if (robot.adapterName.match(/mock-adapter/gi)) {
    robot.Shift = Shift
    robot.Alert = Alert
  }

  (process.env.HUBOT_SHIFTS
    ? Shift.parse(process.env.HUBOT_SHIFTS)
    : [ new Shift('APJ', '00:00', '08:00'), new Shift('EMEA', '08:00', '16:00'), new Shift('AMS', '16:00', '00:00') ])
    .forEach(shift => shift.remember())

  robot.respond(/shifts$/, (res) => {
    const markdownList = Shift.all().map(s => `* ${s}`).join('\n')
    res.reply(`Here are currently defined shifts:\n${markdownList}`)
  })

  robot.respond(/shifts (.*)/, (res) => {
    const words = res.match[1].split(/[\s,]+/)

    if (words.length < 2) {
      res.reply('Hmmm, you need to tell me the shift name and user(s)')
      return
    }

    const shiftName = words[0]
    const users = words.slice(1)

    const existingShift = Shift.find(shiftName)
    if (!existingShift) {
      res.reply(`Hmmm, it seems ${shiftName} shift has not been defined`)
      return
    }

    existingShift.users = users

    res.reply(`Shift users recorded: ${existingShift}`)
  })

  robot.router.post('/hubot/alerts/:room', (request, response) => {
    const room = request.params.room
    const data = request.body
    robot.emit('hubot-alerts:alert', {
      room: room,
      alert: new Alert(data)
    })
    response.send('OK')
  })

  robot.on('hubot-alerts:alert', (data) => {
    const room = data.room
    const alert = data.alert
    robot.messageRoom(room, `Received #alert:\n${JSON.stringify(alert)}`)
  })
}
