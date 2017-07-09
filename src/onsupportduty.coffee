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

shiftsBrainKey = "shifts"

module.exports = (robot) ->

  robot.respond /shifts/, (res) ->
    markdownList = ("* #{shiftAsString(shift)}" for shift in shifts).join("\n")
    res.reply "Here are currently defined shifts:\n#{markdownList}"


  robot.respond /onsupportduty (.*)/, (res) ->
    words = res.match[1].split(/[\s,]+/)

    if words.length < 2
      res.reply "Hmmm, I need you to tell me the shift and user(s)"
      return

    shiftName = words[0]
    users = words[1..]

    existingShift = s for s in shifts when s.name is shiftName
    if not existingShift?
      res.reply "Hmmm, it seems #{shiftName} shift has not been defined"
      return

    storedShifts = robot.brain.get shiftsBrainKey
    if not storedShifts?
      storedShifts = {}
      robot.brain.set shiftsBrainKey, storedShifts

    storedShifts[shiftName] = users

    res.reply "Shift users recorded: \
      #{shiftAsString(existingShift)} => #{robot.brain.get(shiftsBrainKey)[shiftName]}"


  robot.respond /onsupportduty/, (res) ->
    storedShifts = robot.brain.get shiftsBrainKey
    storedShifts = {} if not storedShifts?

    markdownList = ("* #{shiftAsString(shift)} => #{storedShifts[shift.name] or "nobody yet"}" for shift in shifts).join("\n")
    res.reply "Here are shifts with users:\n#{markdownList}"


  # robot.respond /hello/, (res) ->
  #   res.reply "hello!"

  # robot.hear /orly/, (res) ->
  #   res.send "yarly"
