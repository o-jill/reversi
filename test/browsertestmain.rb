# frozen_string_literal: true

# for testing on a browser.

# usage:
#    ruby travisci/browsertest.rb <options>

require 'selenium-webdriver'

require './travisci/browsertest.rb'

# main

test = BrowserTest.new
test.fold_begin('pages.1', 'pages tests')
test.run
test.fold_end('pages.1')
succ = test.showresult

test.finalize(succ)
