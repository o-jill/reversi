# frozen_string_literal: true

# webserver for browser testing.

require 'webrick'

server =
  WEBrick::HTTPServer.new(
    BindAddress: '127.0.0.1',
    Port: '3000',
    DocumentRoot: './',
    # AccessLog: [],  # no access log
  )

Signal.trap(:INT) { server.shutdown }
server.start
