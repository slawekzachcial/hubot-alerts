'use strict'

/* global describe, beforeEach, it */

const chai = require('chai')
const expect = chai.expect

const Shift = require('../src/shift.js')

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
