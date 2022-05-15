# for testing on a browser.
# frozen_string_literal: true

require 'selenium-webdriver'

require './test/browsertestabs.rb'
require './test/testresult.rb'

# test pages on a browser
class BrowserTest < BrowserTestAbstract
  def initialize
    super
  end

  attr_reader :gameurl

  TESTTBL = %w[simpleaccess].freeze

  def simpleaccess
    simplecheck 'index.html'

    old = ""
    kifu = ""
    loop do
      clickbtn(:id, 'btncommv')

      loop do
        sleep 0.5
        kifu = driver.find_element(:id, 'kifu').attribute(:value)
        break if old != kifu
      end

      break if kifu.include?('の勝ち')
      break if kifu.include?('引き分け')

      old = kifu
    end

    puts "result:\n#{kifu}\n"
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
