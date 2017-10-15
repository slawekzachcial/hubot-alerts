'use strict'

/* global describe, beforeEach, it */

const chai = require('chai')
const expect = chai.expect

const Shift = require('../src/shift.js')
const Alert = require('../src/alert.js')

describe('Shift', function () {
  it('can create shift from string', function () {
    const shift = Shift.fromString('EMEA=01:23-04:56')
    expect(shift.name).to.equal('EMEA')
    expect(shift.start.toString()).to.equal('01:23')
    expect(shift.end.toString()).to.equal('04:56')
    expect(shift.users).to.have.lengthOf(0)
  })

  it('detects error in shifts string', function () {
    const fromString = () => Shift.fromString('XX=:00-01')
    expect(fromString).to.throw(/format/gi)
  })

  it('may match alerts', function () {
    const test = (shiftStart, shiftEnd, alertStart) => {
      return {
        alert: new Alert({startsAt: alertStart, labels: {component: 'web'}}),
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
  })
})

describe('Shifts', function () {
  let Shifts

  beforeEach(function () {
    Shifts = Shift.manager({})
  })

  it('can parse shifts string', function () {
    const shifts = Shifts.parse('XX=00:00-01:00,YY=01:00-03:00,ZZ=03:00-00:00')
    expect(shifts).to.have.lengthOf(3)
    expect(shifts[1].name).to.equal('YY')
    expect(shifts[2].start.toString()).to.equal('03:00')
    expect(shifts[0].end.toString()).to.equal('01:00')
  })
})
