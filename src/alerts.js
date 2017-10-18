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

  const Shifts = require('./shift.js').manager(robot.brain.get('shifts'))
  const Alert = require('./alert.js')

  if (process.env.HUBOT_SHIFTS) {
    Shifts.parse(process.env.HUBOT_SHIFTS)
  }

  robot.respond(/shifts$/, (res) => {
    const markdownList = Shifts.all().map(s => `* ${s}`).join('\n')
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

    const existingShift = Shifts.find(shiftName)
    if (!existingShift) {
      res.reply(`Hmmm, it seems ${shiftName} shift has not been defined`)
      return
    }

    existingShift.users = users

    res.reply(`Shift users recorded: ${existingShift}`)
  })

  robot.router.post('/hubot/alerts/:room', (request, response) => {
    try {
      const room = request.params.room
      const data = request.body
      const alert = new Alert(data)
      robot.emit('hubot-alerts:alert', { room, alert })
      response.status(200).send(`Alert received: ${alert.hash}`)
    } catch (err) {
      response.status(400).send(err)
    }
  })

  robot.on('hubot-alerts:alert', (data) => {
    const room = data.room
    const alert = data.alert
    const shifts = Shifts.all().filter(shift => shift.matches(alert))
    const users = ((shifts && shifts.length > 0 && shifts[0].users.length > 0) ? shifts[0].users : ['@team'])

    robot.messageRoom(room, `${users.join(', ')}, received #alert:\n${JSON.stringify(alert)}`)
  })
}
