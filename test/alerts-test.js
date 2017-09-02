'use strict'

/* global describe, beforeEach, afterEach, it */

const path = require('path')

const chai = require('chai')
const Hubot = require('hubot')

const expect = chai.expect
const Robot = Hubot.Robot
const TextMessage = Hubot.TextMessage

chai.use(require('sinon-chai'))

describe('require("alerts")', () => {
  it('exports a function', () => {
    expect(require('../index')).to.be.a('Function')
  })
})

describe('alerts', () => {
  let robot, user

  beforeEach(() => {
    robot = new Robot(null, 'mock-adapter-v3', false, 'hubot')
    robot.loadFile(path.resolve('src/'), 'alerts.js')
    robot.adapter.on('connected', () => {
      robot.brain.userForId('1', {
        name: 'alice',
        real_name: 'Alice A',
        room: '#test'
      })
    })
    robot.run()
    user = robot.brain.userForName('alice')
  })

  afterEach(() => {
    robot.shutdown()
  })


  it('responds to shifts', (done) => {
    robot.adapter.on('reply', function(envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('APJ').and.to.include('AMS').and.to.include('EMEA')
      done()
    })

    robot.adapter.receive(new TextMessage(user, 'hubot shifts'))
  })


  it('responds to shifts EMEA @bob @carol', (done) => {
    robot.adapter.on('reply', function(envelope, strings) {
      const answer = strings[0]
      expect(answer).to.include('Shift users recorded')
      done()
    })

    robot.adapter.receive(new TextMessage(user, '@hubot shifts EMEA @bob @carol'))
  })


  it('responds to shifts EMEA when users missing', (done) => {
    robot.adapter.on('reply', function(envelope, strings) {
      expect(strings[0]).to.include('Hmmm')
      done()
    })

    robot.adapter.receive(new TextMessage(user, '@hubot shifts EMEA'))
  })


  it('responds to shifts XXX @bob when shift undefined', (done) => {
    robot.adapter.on('reply', function(envelope, strings) {
      expect(strings[0]).to.include("not").and.to.include("defined")
      done()
    })
    robot.adapter.receive(new TextMessage(user, '@hubot shifts XXX @bob'))
  })


  it('responds to shifts when users assigned', (done) => {
    robot.adapter.on('reply', function(envelope, strings) {
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
    const shifts = robot.Shift.parse("XX=00:00-01:00,YY=01:00-03:00,ZZ=03:00-00:00")
    expect(shifts).to.have.lengthOf(3)
    expect(shifts[1].name).to.equal("YY")
    expect(shifts[2].start).to.equal("03:00")
    expect(shifts[0].end).to.equal("01:00")
    done()
  })


  it('detects error in shifts string', (done) => {
    const fromString = () => robot.Shift.fromString("XX=:00-01")
    expect(fromString).to.throw(/format/gi)
    done()
  })

})
