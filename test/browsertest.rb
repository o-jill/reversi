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

  TESTTBL = %w[simpleaccess learning].freeze

  def getkifu
    driver.find_element(:id, 'kifu').attribute(:value)
  end

  def loadkifu(path)
    driver.execute_script("kifu.value=arguments[0];", File.read(path))
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

  def playr(idx)
    puts "starting game #{idx}"
    clickbtn(:id, 'btninit')
    sleep 0.5

    clickbtn(:id, 'btncommvr')
    old = ""
    kifu = ""
    loop do
      sleep 1
      kifu = getkifu

      if old != kifu
        print kifu[old.size, kifu.size]
        old = kifu
      end

      break if kifu.include?('の勝ち')
      break if kifu.include?('引き分け')
    end

    # puts "button read"
    # clickbtn(:id, 'btnread')
    # loop do
    #   elem = driver.find_element(:id, 'btnread')
    #   break if elem.enabled?
    #   sleep 0.5
    # end

    path = format("kifu/kifu%09d.txt", idx)
    puts path
    kifu2file(path, kifu)
    # puts "result:\n#{kifu}\n"
    # puts File.read(path)
  end

  # load evaltable from test/evaltable.txt.
  def load_evaltable
    # clickbtn(:id, 'btnevaltbl')
    # sleep 1
    # hintt = driver.find_element(:id, 'hintt')
    # puts "-----\n#{hintt.attribute(:value)}\n-----\n"

    # hintt.clear()
    # File.read('./test/evaltable.txt').each_char do |c|
    #   hintt.send_keys(c)
    # end
    # sleep 5
    jscmd = format("hintt.value=\"#{File.read('./test/evaltable.txt')}\";")
    driver.execute_script(jscmd)
    # sleep 5
    clickbtn(:id, 'btnupdate')
    sleep 1
    clickbtn(:id, 'btnevaltbl')
    # puts "=====\n#{hintt.attribute(:value)}\n=====\n"
  end

  def simpleaccess
    simplecheck 'index.html'

    load_evaltable

    clickbtn(:id, 'acmchk')
    clickbtn(:id, 'acmachk')

    1.times do |idx|
      playr idx
    end
  end

  def enumeratekifu
    files = Dir.children('kifu').map do |path|
      "./kifu/#{path}"
    end
    files.select do |path|
      /kifu\d+\.txt/ =~ path
    end
  end

  def learning
    simplecheck 'index.html'

    load_evaltable

    # enumerate txt in kifu dir.
    list = enumeratekifu

    list.each do |path|
      puts "[#{path}]"
      loadkifu(path)

      clickbtn(:id, 'btnread')
      loop do
        elem = driver.find_element(:id, 'btnread')
        break if elem.enabled?
        sleep 0.5
      end
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
