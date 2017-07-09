Helper = require('hubot-test-helper')
chai = require 'chai'

expect = chai.expect

helper = new Helper('../src/onsupportduty.coffee')

describe 'onsupportduty', ->
  beforeEach ->
    @room = helper.createRoom()
    @hubotReply = () -> @room.messages[1][1]

  afterEach ->
    @room.destroy()

  it 'responds to shifts', ->
    @room.user.say('alice', '@hubot shifts').then =>
      # console.log(@hubotReply())
      expect(@hubotReply()).to.include "currently defined shifts"

  it 'responds to onsupportduty', ->
    # TODO: don't use the key directly but rather a function to store shift
    @room.robot.brain.set "shifts", { "APJ": ["@alice", "@carol"] }
    @room.user.say('bob', '@hubot onsupportduty').then =>
      expect(@hubotReply()).to.include("APJ").and.to.include("@carol")

  it 'reponds to onsupportduty EMEA when users missing', ->
    @room.user.say('carol', '@hubot onsupportduty EMEA').then =>
      expect(@hubotReply()).to.include "Hmmm"

  it 'responds to onsupportduty EMEA @bob @carol', ->
    @room.user.say('alice', '@hubot onsupportduty EMEA @bob @carol').then =>
      expect(@hubotReply()).to.include "Shift users recorded"

  it 'responds to onsupportduty XXX @bob when shift undefined', ->
    @room.user.say('alice', '@hubot onsupportduty XXX @bob').then =>
      expect(@hubotReply()).to.include("not").and.to.include("defined")

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
