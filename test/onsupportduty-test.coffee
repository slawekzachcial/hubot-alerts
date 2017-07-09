Helper = require('hubot-test-helper')
chai = require 'chai'

expect = chai.expect

helper = new Helper('../src/onsupportduty.coffee')

describe 'onsupportduty', ->
  beforeEach ->
    @room = helper.createRoom()

  afterEach ->
    @room.destroy()

  it 'responds to shifts', ->
    @room.user.say('alice', '@hubot shifts').then =>
      expect(@room.messages).to.eql [
        ['alice', '@hubot shifts']
        ['hubot', '@alice *AMS']
      ]

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
