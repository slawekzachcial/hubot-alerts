'use strict'

/* global describe, beforeEach, afterEach, it */

const path = require('path')

const chai = require('chai')
const Hubot = require('hubot')

const expect = chai.expect
const Robot = Hubot.Robot
const TextMessage = Hubot.TextMessage

chai.use(require('sinon-chai'))

process.env.EXPRESS_PORT = 8089
const enableHttpd = true
const alertsUrl = `http://localhost:${process.env.EXPRESS_PORT}/hubot/alerts/testRoom`

const Shift = require('../src/shift.js')

describe('require(\'alerts\')', () => {
  it('exports a function', function () {
    expect(require('../index')).to.be.a('Function')
  })
})

describe('alerts', () => {
  let robot, user, Shifts

  beforeEach(() => {
    robot = new Robot(null, 'mock-adapter-v3', enableHttpd, 'hubot')
    robot.loadFile(path.resolve('src/'), 'alerts.js')
    Shifts = Shift.manager(robot.brain.get('shifts'))

    robot.adapter.on('connected', () => {
      robot.brain.userForId('1', {
        name: 'alice',
        real_name: 'Alice A',
        room: 'testRoom'
      })
    })
    robot.run()
    user = robot.brain.userForName('alice')
  })

  afterEach(() => {
    robot.shutdown()
  })

  it('responds to shifts', function (done) {
    [ new Shift('APJ', '00:00', '08:00'),
      new Shift('EMEA', '08:00', '16:00'),
      new Shift('AMS', '16:00', '00:00') ]
    .forEach(shift => Shifts.store(shift))

    robot.adapter.on('reply', function (envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('APJ').and.to.include('AMS').and.to.include('EMEA')
      done()
    })

    robot.adapter.receive(new TextMessage(user, 'hubot shifts'))
  })

  it('responds to shifts EMEA @bob @carol', function (done) {
    [ new Shift('APJ', '00:00', '08:00'),
      new Shift('EMEA', '08:00', '16:00'),
      new Shift('AMS', '16:00', '00:00') ]
    .forEach(shift => Shifts.store(shift))

    robot.adapter.on('reply', function (envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('Shift users recorded')
      done()
    })

    robot.adapter.receive(new TextMessage(user, '@hubot shifts EMEA @bob @carol'))
  })

  it('responds to shifts EMEA when users missing', function (done) {
    robot.adapter.on('reply', function (envelope, strings) {
      expect(strings[0]).to.include('Hmmm')
      done()
    })

    robot.adapter.receive(new TextMessage(user, '@hubot shifts EMEA'))
  })

  it('responds to shifts XXX @bob when shift undefined', function (done) {
    robot.adapter.on('reply', function (envelope, strings) {
      expect(strings[0]).to.include('not').and.to.include('defined')
      done()
    })
    robot.adapter.receive(new TextMessage(user, '@hubot shifts XXX @bob'))
  })

  it('responds to shifts when users assigned', function (done) {
    [ new Shift('APJ', '00:00', '08:00'),
      new Shift('EMEA', '08:00', '16:00'),
      new Shift('AMS', '16:00', '00:00') ]
    .forEach(shift => Shifts.store(shift))

    robot.adapter.on('reply', function (envelope, strings) {
      const answer = strings[0]
      if (answer.match(/recorded/gi)) {
        // TODO: is there a better way to chain messages sent to hubot?
        robot.adapter.receive(new TextMessage(user, 'hubot shifts'))
      } else {
        expect(answer).to.include('APJ').and.to.include('AMS').and.to.include('EMEA').and.to.include('@carol')
        done()
      }
    })

    robot.adapter.receive(new TextMessage(user, 'hubot shifts APJ @alice @carol'))
  })

  it('messageRoom delegates to adapter "send"', function (done) {
    robot.adapter.on('send', function (envelope, strings) {
      done()
    })

    robot.messageRoom('testRoom', 'message from robot to testRoom')
  })

  it('returns Bad Request for empty alerts', function (done) {
    robot.http(alertsUrl)
      .post()((err, response, body) => {
        if (err) {
          return done(err)
        }
        expect(response.statusCode).to.equal(400)
        done()
      })
  })

  it('accepts alerts having only labels', function (done) {
    robot.adapter.on('send', function (envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('#alert')
      done()
    })

    robot.http(alertsUrl)
      .header('Content-Type', 'application/json')
      .post(JSON.stringify({
        labels: { component: 'oxygen_tank' }
      }))((err, response, body) => {
        if (err) {
          return done(err)
        }
        setTimeout(() => {}, 1000)
      })
  })

  it('accepts alerts in JSON format', function (done) {
    robot.on('hubot-alerts:alert', function (alertData) {
      const room = alertData.room
      const alert = alertData.alert
      expect(room).to.equal('testRoom')
      expect(alert.generatorURL).to.equal('https://apollo13.nasa.gov')
      done()
    })

    robot.http(alertsUrl)
      .header('Content-Type', 'application/json')
      .post(JSON.stringify({
        status: 'new',
        labels: { component: 'oxygen_tank' },
        annotations: {
          summary: 'Oxygen tank explosion',
          description: 'Houston, we\'ve had a problem here'
        },
        startsAt: '1970-04-14T03:07:53Z',
        endsAt: '1970-04-14T03:17:53Z',
        generatorURL: 'https://apollo13.nasa.gov'
      }))((err, response, body) => {
        if (err) {
          return done(err)
        }
        setTimeout(() => {}, 1000)
      })
  })

  it('finds matching shift\'s users', function (done) {
    [ new Shift('APJ', '00:00', '08:00', ['@alice']),
      new Shift('EMEA', '08:00', '16:00', ['@bob']),
      new Shift('AMS', '16:00', '00:00', ['@charlie']) ].forEach(shift => Shifts.store(shift))

    robot.adapter.on('send', function (envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('alice')
      done()
    })

    robot.http(alertsUrl)
      .header('Content-Type', 'application/json')
      .post(JSON.stringify({
        startsAt: '2017-09-17T02:00:00Z',
        labels: { component: 'web' }
      }))((err, resp, body) => {
        if (err) {
          return done(err)
        }
        setTimeout(() => {}, 1000)
      })
  })

  it('mentions team if no matching shift\'s users found', function (done) {
    [ new Shift('APJ', '03:00', '08:00', ['@alice']),
      new Shift('EMEA', '08:00', '16:00', ['@bob']),
      new Shift('AMS', '16:00', '00:00', ['@charlie']) ].forEach(shift => Shifts.store(shift))

    robot.adapter.on('send', function (envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('team')
      done()
    })

    robot.http(alertsUrl)
      .header('Content-Type', 'application/json')
      .post(JSON.stringify({
        startsAt: '2017-09-17T02:00:00Z',
        labels: { component: 'web' }
      }))((err, resp, body) => {
        if (err) {
          return done(err)
        }
        setTimeout(() => {}, 1000)
      })
  })
})
