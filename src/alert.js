'use strict'

// Based on:
// - https://prometheus.io/docs/alerting/notifications/#alert
// - https://prometheus.io/docs/alerting/clients
// Alert properties
// - status: firing or resolved
// - labels: alert metadata, e.g. { app: "orders", instance: "web1", check:
//   "http" }; labels are used to identify identical instances of an alert and to
//   perform deduplication
// - annotations: additional information, e.g. { summary: "Server XYZ down",
//   description: "Server XYZ has been down for 5 minutes" }; annotations are
//   not identifying an alert
// - startsAt: the time the alert started firing; if omitted the current time
//   is assigned
// - endsAt: only set if the end time of an alert is known; otherwise set to a
//   configurable timeout period from the time since the last alert was
//   received
// - generatorURL: the backlink to the entity that fired the alert
class Alert {
  constructor ({status, labels, annotations, startsAt, endsAt, generatorURL}) {
    if (!labels || Object.keys(labels) === 0 || labels.constructor !== Object) {
      throw Error('Non-empty hash expected for Alert labels')
    }
    this.status = (status && status.toLowerCase() === 'resolved' ? 'resolved' : 'firing')
    this.labels = labels
    this.annotations = annotations || {}
    this.startsAt = (startsAt ? new Date(Date.parse(startsAt)) : new Date())
    this.endsAt = (endsAt ? new Date(Date.parse(endsAt)) : new Date(this.startsAt.getTime() + Alert.endTimeoutMillis))
    this.generatorURL = generatorURL
  }

  toString () {
    return JSON.stringify(this)
  }
}

Alert.endTimeoutMillis = 5 * 60 * 1000

module.exports = Alert
