'use strict'

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
    this.startsAt = (startsAt ? new Date(Date.parse(startsAt)) : new Date())
    this.endsAt = (endsAt ? new Date(Date.parse(endsAt)) : new Date(this.startsAt.getTime() + 5 * 60 * 1000))
    this.generatorURL = generatorURL
  }

  toString () {
    return JSON.stringify(this)
  }
}

module.exports = Alert
