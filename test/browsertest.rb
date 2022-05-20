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

  def getkifu
    driver.find_element(:id, 'kifu').attribute(:value)
  end

  def kifu2file(path, txt = nil)
    File.write(path, txt || getkifu)
  end

  def play(idx)
    clickbtn(:id, 'btninit')
    sleep 0.5

    old = ""
    kifu = ""
    loop do
      clickbtn(:id, 'btncommv')

      loop do
        sleep 0.5
        kifu = getkifu
        break if old != kifu
      end

      break if kifu.include?('の勝ち')
      break if kifu.include?('引き分け')

      old = kifu
    end

    path = format("kifu/kifu%09d.txt", idx)
    kifu2file(path, kifu)
    # puts "result:\n#{kifu}\n"
    puts File.read(path)
  end

  def simpleaccess
    simplecheck 'index.html'
    3.times do |idx|
      play idx
    end
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
