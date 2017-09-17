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

describe('require(\'alerts\')', () => {
  it('exports a function', () => {
    expect(require('../index')).to.be.a('Function')
  })
})

describe('alerts', () => {
  let robot, user

  beforeEach(() => {
    robot = new Robot(null, 'mock-adapter-v3', enableHttpd, 'hubot')
    robot.loadFile(path.resolve('src/'), 'alerts.js')

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
    robot.adapter.on('reply', function (envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('APJ').and.to.include('AMS').and.to.include('EMEA')
      done()
    })

    robot.adapter.receive(new TextMessage(user, 'hubot shifts'))
  })

  it('responds to shifts EMEA @bob @carol', (done) => {
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

  it('can parse shifts string', (done) => {
    const shifts = robot.Shift.parse('XX=00:00-01:00,YY=01:00-03:00,ZZ=03:00-00:00')
    expect(shifts).to.have.lengthOf(3)
    expect(shifts[1].name).to.equal('YY')
    expect(shifts[2].start).to.equal('03:00')
    expect(shifts[0].end).to.equal('01:00')
    done()
  })

  it('detects error in shifts string', (done) => {
    const fromString = () => robot.Shift.fromString('XX=:00-01')
    expect(fromString).to.throw(/format/gi)
    done()
  })

  it('messageRoom delegates to adapter "send"', (done) => {
    robot.adapter.on('send', function (envelope, strings) {
      done()
    })

    robot.messageRoom('testRoom', 'message from robot to testRoom')
  })

  it('can create alert from empty data', (done) => {
    const createAlertFromEmptyData = () => new robot.Alert({})
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
    const alert = new robot.Alert({
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
    expect(alert.startsAt).to.equal(start.getTime())
    expect(alert.endsAt).to.equal(end.getTime())
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

  it('accepts alert in JSON format', (done) => {
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
})
