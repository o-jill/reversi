# for testing on a browser.
# frozen_string_literal: true

require 'selenium-webdriver'

require './travisci/browsertestabs.rb'
require './travisci/testresult.rb'

# test pages on a browser
class BrowserTest < BrowserTestAbstract
  def initialize
    super
  end

  attr_reader :gameurl

  TESTTBL = %w[simpleaccess].freeze

  def simpleaccess
    simplecheck 'index.html'

    for n in 1..62 do
      clickbtn(:id, 'commv')
      sleep 0.5
    end

    puts "result:\n#{driver.find_element(:id, 'kifu').attribute(:value)}"
  end

  def run
    TESTTBL.each do |test|
      unless methods(true).include?(test.to_sym)
        puts "unknown test name '#{test}'..."
        exit(-9999)
      end
      puts test
      method(test.to_sym).call
    end

    # テストを終了する（ブラウザを終了させる）
    # driver.quit
  end

  def finalize(ret)
    # テストを終了する（ブラウザを終了させる）
    driver.quit
    exit(ret)
  end
end
