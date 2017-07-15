Helper = require('hubot-test-helper')
chai = require 'chai'

expect = chai.expect

helper = new Helper('../src/onsupportduty.coffee')

describe 'onsupportduty', ->
  beforeEach ->
    @room = helper.createRoom()
    @hubotReply = () ->
      hubotReplies = (reply[1] for reply in @room.messages when reply[0] is 'hubot')
      hubotReplies.join("\n")

  afterEach ->
    @room.destroy()

  it 'responds to shifts', ->
    @room.user.say('alice', '@hubot shifts').then =>
      # console.log(@hubotReply())
      expect(@hubotReply()).to.include("APJ").and.to.include("AMS").and.to.include("EMEA")

  it 'responds to shifts when users assigned', ->
    @room.user.say('bob', '@hubot onsupportduty APJ @alice @carol')
    @room.user.say('bob', '@hubot shifts').then =>
      expect(@hubotReply()).to.include("APJ").and.to.include("@carol")

  it 'responds to onsupportduty EMEA when users missing', ->
    @room.user.say('carol', '@hubot onsupportduty EMEA').then =>
      expect(@hubotReply()).to.include "Hmmm"

  it 'responds to onsupportduty EMEA @bob @carol', ->
    @room.user.say('alice', '@hubot onsupportduty EMEA @bob @carol').then =>
      expect(@hubotReply()).to.include "Shift users recorded"

  it 'responds to onsupportduty XXX @bob when shift undefined', ->
    @room.user.say('alice', '@hubot onsupportduty XXX @bob').then =>
      expect(@hubotReply()).to.include("not").and.to.include("defined")

  it 'can parse shifts string', ->
    shifts = @room.robot.Shift.parse("XX=00:00-01:00,YY=01:00-03:00,ZZ=03:00-00:00")
    expect(shifts).to.have.lengthOf(3)
    expect(shifts[1].name).to.equal("YY")
    expect(shifts[2].start).to.equal("03:00")
    expect(shifts[0].end).to.equal("01:00")

  it 'detects error in shifts string', ->
    # `fromString` variable is a function that returns a function.
    # The reason: `expect` requires a function. Passing directly a function
    # that closes over @room resulted in an `undefined` value error. In other
    # words: fromString = () -> @room.robot.Shift.fromString("...") and then
    # expect(fromString).to... did not work
    fromString = (robot) ->
      () -> robot.Shift.fromString("XX=:00-01")
    expect(fromString(@room.robot)).to.throw(/format/i)


  # it 'responds to hello', ->
  #   @room.user.say('alice', '@hubot hello').then =>
  #     expect(@room.messages).to.eql [
  #       ['alice', '@hubot hello']
  #       ['hubot', '@alice hello!']
  #     ]

  # it 'hears orly', ->
  #   @room.user.say('bob', 'just wanted to say orly').then =>
  #     expect(@room.messages).to.eql [
  #       ['bob', 'just wanted to say orly']
  #       ['hubot', 'yarly']
  #     ]
