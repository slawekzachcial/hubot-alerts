# Description
#   A hubot script that manages on-support-duty shifts and alerts
#
# Configuration:
#   HUBOT_ON_SUPPORT_DUTY_SHIFTS="shift1=00:00-06:00,shift2=06:00-12:00,..."
#
# Commands:
#   hubot shifts - prints UTC shifts hours
#   hubot onsupportduty - prints people on shifts
#   hubot onsupportduty <shift> @user1 @user3 - assign users to shift
#   hubot alerts - prints current alerts with assignees
#   hubot alert ack <id> - accept working on alert
#   hubot alert done <id> - confirm alerted problem fixed
#
# Notes:
#   <optional notes required for the script>
#
# Author:
#   Slawek Zachcial

shifts = [{ "name": "APJ", "start": "00:00", "end": "08:00" },
{ "name": "EMEA", "start": "08:00", "end": "16:00" },
{ "name": "AMS", "start": "16:00", "end": "00:00" }]

shiftAsString = (shift) ->
  "#{shift.name}: #{shift.start}-#{shift.end} UTC"

module.exports = (robot) ->
  robot.respond /shifts/, (res) ->
    markdown = ("* #{shiftAsString(shift)}" for shift in shifts).join("\n")
    res.reply markdown

  robot.respond /hello/, (res) ->
    res.reply "hello!"

  robot.hear /orly/, (res) ->
    res.send "yarly"
