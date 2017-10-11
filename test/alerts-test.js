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
const Alert = require('../src/alert.js')

describe('require(\'alerts\')', () => {
  it('exports a function', () => {
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

  it('responds to shifts', (done) => {
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

  it('responds to shifts EMEA @bob @carol', (done) => {
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

  it('responds to shifts EMEA when users missing', (done) => {
    robot.adapter.on('reply', function (envelope, strings) {
      expect(strings[0]).to.include('Hmmm')
      done()
    })

    robot.adapter.receive(new TextMessage(user, '@hubot shifts EMEA'))
  })

  it('responds to shifts XXX @bob when shift undefined', (done) => {
    robot.adapter.on('reply', function (envelope, strings) {
      expect(strings[0]).to.include('not').and.to.include('defined')
      done()
    })
    robot.adapter.receive(new TextMessage(user, '@hubot shifts XXX @bob'))
  })

  it('responds to shifts when users assigned', (done) => {
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

  it('messageRoom delegates to adapter "send"', (done) => {
    robot.adapter.on('send', function (envelope, strings) {
      done()
    })

    robot.messageRoom('testRoom', 'message from robot to testRoom')
  })

  it('can create alert from empty data', (done) => {
    const createAlertFromEmptyData = () => new Alert({})
    expect(createAlertFromEmptyData).to.not.throw()
    const alert = createAlertFromEmptyData()
    expect(alert.status).to.equal('firing')
    expect(alert.labels).to.be.an('object')
    expect(alert.annotations).to.be.an('object')
    expect(alert.startsAt).to.be.a('Date')
    expect(alert.endsAt).to.be.a('Date')
    expect(alert.generatorURL).to.be.an('undefined')
    done()
  })

  it('can create alert from non-empty data', (done) => {
    const start = new Date(1970, 3, 14, 3, 7, 53)
    const end = new Date(1970, 3, 14, 3, 17, 53)
    const alert = new Alert({
      status: 'new',
      labels: { severity: 'page' },
      annotations: { summary: 'Oxygen tank explosion', description: 'Houston, we\'ve had a problem here' },
      startsAt: '1970-04-14T03:07:53Z',
      endsAt: '1970-04-14T03:17:53Z',
      generatorURL: 'https://apollo13.nasa.gov'
    })
    expect(alert.status).to.equal('firing')
    expect(alert.labels.severity).to.equal('page')
    expect(alert.annotations.summary).to.include('Oxygen')
    expect(alert.annotations.description).to.include('Houston')
    expect(alert.startsAt.getTime()).to.equal(start.getTime())
    expect(alert.endsAt.getTime()).to.equal(end.getTime())
    expect(alert.generatorURL).to.equal('https://apollo13.nasa.gov')
    done()
  })

  it('accepts empty alerts', (done) => {
    robot.adapter.on('send', function (envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('#alert')
      done()
    })

    robot.http(alertsUrl).post()((err, response, body) => {
      if (err) {
        console.log(`ERROR: ${err}`)
      } else {
        setTimeout(() => {}, 1000)
      }
    })
  })

  it('accepts alerts in JSON format', (done) => {
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
        labels: { severity: 'page' },
        annotations: { summary: 'Oxygen tank explosion', description: 'Houston, we\'ve had a problem here' },
        startsAt: '1970-04-14T03:07:53Z',
        endsAt: '1970-04-14T03:17:53Z',
        generatorURL: 'https://apollo13.nasa.gov'
      }))((err, response, body) => {
        if (err) {
          console.log(`ERROR: ${err}`)
        } else {
          setTimeout(() => {}, 1000)
        }
      })
  })

  it('has shifts matching alerts', (done) => {
    const test = (shiftStart, shiftEnd, alertStart) => {
      return {
        alert: new Alert({startsAt: alertStart}),
        shift: new Shift('s', shiftStart, shiftEnd)
      }
    }
    const matches = (t) => t.shift.matches(t.alert)

    const t1 = test('00:00', '08:00', '2000-01-01T02:04:00Z')
    expect(matches(t1), `${t1.shift} should match ${t1.alert.startsAt}`).to.equal(true)

    const t2 = test('08:00', '16:00', '2000-01-01T02:04:00Z')
    expect(matches(t2), `${t2.shift} should not match ${t2.alert.startsAt}`).to.equal(false)

    const t3 = test('22:00', '03:00', '2000-01-01T02:04:00Z')
    expect(matches(t3), `${t3.shift} should match ${t3.alert.startsAt}`).to.equal(true)

    const t4 = test('02:04', '03:00', '2000-01-01T02:04:00Z')
    expect(matches(t4), `${t4.shift} should match ${t4.alert.startsAt}`).to.equal(true)

    const t5 = test('02:05', '03:00', '2000-01-01T02:04:00Z')
    expect(matches(t5), `${t5.shift} should not match ${t5.alert.startsAt}`).to.equal(false)

    const t6 = test('01:05', '03:00', '2000-01-01T02:04:00Z')
    expect(matches(t6), `${t6.shift} should match ${t6.alert.startsAt}`).to.equal(true)

    const t7 = test('22:00', '03:00', '2000-01-01T23:45:00Z')
    expect(matches(t7), `${t7.shift} should match ${t7.alert.startsAt}`).to.equal(true)

    const t8 = test('16:00', '00:00', '2017-09-17T02:00:00Z')
    expect(matches(t8), `${t8.shift} should not match ${t8.alert.startsAt}`).to.equal(false)

    done()
  })

  it('finds matching shift\'s users', (done) => {
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
        startsAt: '2017-09-17T02:00:00Z'
      }))((err, resp, body) => {
        if (err) {
          console.log(`ERROR: ${err}`)
        } else {
          setTimeout(() => {}, 1000)
        }
      })
  })

  it('mentions team if no matching shift\'s users found', (done) => {
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
        startsAt: '2017-09-17T02:00:00Z'
      }))((err, resp, body) => {
        if (err) {
          console.log(`ERROR: ${err}`)
        } else {
          setTimeout(() => {}, 1000)
        }
      })
  })
})
