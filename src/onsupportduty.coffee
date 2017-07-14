# Description
#   A hubot script that manages on-support-duty shifts and alerts
#
# Configuration:
#   HUBOT_ON_SUPPORT_DUTY_SHIFTS="shift1=00:00-06:00,shift2=06:00-12:00,..."
#
# Commands:
#   hubot shifts - prints shifts in UTC along assigned users
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

module.exports = (robot) ->

  # initialize it as empty so we don't have to check each time it was initialized
  robot.brain.set "shifts", {}


  class Shift
    constructor: (@name, @start, @end, @users=[]) ->

    toString: ->
      "#{@name}: #{@start}-#{@end} UTC => #{@users}"

    remember: ->
      shiftsInBrain = robot.brain.get "shifts"
      shiftsInBrain[@name] = this

    @find: (name) ->
      shiftsInBrain = robot.brain.get "shifts"
      shiftsInBrain[name]

    @all: ->
      shiftsInBrain = robot.brain.get "shifts"
      (shift for own name, shift of shiftsInBrain)


  shift.remember() for shift in \
    [ new Shift("APJ", "00:00", "08:00"),
      new Shift("EMEA", "08:00", "16:00"),
      new Shift("AMS", "16:00", "00:00") ]


  robot.respond /shifts/, (res) ->
    markdownList = ("* #{shift}" for shift in Shift.all()).join("\n")
    res.reply "Here are currently defined shifts:\n#{markdownList}"


  robot.respond /onsupportduty (.*)/, (res) ->
    words = res.match[1].split(/[\s,]+/)

    if words.length < 2
      res.reply "Hmmm, you need to tell me the shift name and user(s)"
      return

    shiftName = words[0]
    users = words[1..]

    existingShift = Shift.find shiftName
    if not existingShift?
      res.reply "Hmmm, it seems #{shiftName} shift has not been defined"
      return

    existingShift.users = users

    res.reply "Shift users recorded: #{existingShift}"


  # robot.respond /hello/, (res) ->
  #   res.reply "hello!"

  # robot.hear /orly/, (res) ->
  #   res.send "yarly"
