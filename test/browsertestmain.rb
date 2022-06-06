# frozen_string_literal: true

# for testing on a browser.

# usage:
#    ruby test/browsertest.rb <options>

require 'selenium-webdriver'

require './test/browsertest.rb'


indexarr = ARGV.grep(/-N\d+/)
index = indexarr.size.zero? ? -1 : indexarr[0].slice(2, 10).to_i
# puts "indexarr:#{indexarr}, index:#{index}"

# main

test = BrowserTest.new
test.fold_begin('pages.1', 'pages tests')
test.run(index)
test.fold_end('pages.1')
succ = test.showresult

test.finalize(succ)
