'use strict'

/* global describe, it */

const chai = require('chai')
const expect = chai.expect

const Alert = require('../src/alert.js')

describe('Alert', function () {
  it('throws error if no labels provided', function () {
    const createAlertFromEmptyData = () => new Alert({})
    expect(createAlertFromEmptyData).to.throw()
  })

  it('requires only labels to create alert', function () {
    const createAlert = () => new Alert({labels: {instance: 'web'}})
    expect(createAlert).to.not.throw()
    const alert = createAlert()
    expect(alert.status).to.equal('firing')
    expect(alert.labels).to.be.an('object')
    expect(alert.annotations).to.be.an('object')
    expect(alert.startsAt).to.be.a('Date')
    expect(alert.endsAt).to.be.a('Date')
    expect(alert.generatorURL).to.be.an('undefined')
  })

  it('can create alert from non-empty data', function () {
    const start = new Date(1970, 3, 14, 3, 7, 53)
    const end = new Date(1970, 3, 14, 3, 17, 53)
    const alert = new Alert({
      status: 'new',
      labels: { component: 'oxygen_tank' },
      annotations: {
        summary: 'Oxygen tank explosion',
        description: 'Houston, we\'ve had a problem here'
      },
      startsAt: '1970-04-14T03:07:53Z',
      endsAt: '1970-04-14T03:17:53Z',
      generatorURL: 'https://apollo13.nasa.gov'
    })
    expect(alert.status).to.equal('firing')
    expect(alert.labels.component).to.equal('oxygen_tank')
    expect(alert.annotations.summary).to.include('Oxygen')
    expect(alert.annotations.description).to.include('Houston')
    expect(alert.startsAt.getTime()).to.equal(start.getTime())
    expect(alert.endsAt.getTime()).to.equal(end.getTime())
    expect(alert.generatorURL).to.equal('https://apollo13.nasa.gov')
  })
})
