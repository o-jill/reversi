# for testing on a browser.
# frozen_string_literal: true

require 'selenium-webdriver'

require './test/browsertestabs.rb'
require './test/testresult.rb'
require './test/initialpos.rb'
require './test/extractrfen.rb'


# test pages on a browser
class BrowserTest < BrowserTestAbstract
  def initialize(options)
    super
    @winlose = {black: 0, white: 0, draw:0 }
    @testtbl =
      options.include?('--learning') ? %w[learning] : TESTTBL
  end

  attr_reader :gameurl

  TESTTBL = %w[simpleaccess learning].freeze
  # TESTTBL = %w[learning].freeze

  def getkifu
    driver.find_element(:id, 'kifu').attribute(:value)
  end

  def loadkifu(path)
    driver.execute_script("kifu.value=arguments[0];", File.read(path))
  end

  def kifu2file(path, txt = nil)
    File.write(path, txt || getkifu)
  end

  def loadrfen(rfen)
    jscmd = format("hintt.value=\"#{rfen}\";")
    driver.execute_script(jscmd)
    # sleep 5
    clickbtn(:id, 'btnfromrfen')
    sleep 0.5
  end

  def print_winrate
    p @winlose
  end

  def countwinlose(kifu)
    return @winlose[:black] = @winlose[:black] + 1 if kifu.rindex('●の勝ち')

    return @winlose[:white] = @winlose[:white] + 1 if kifu.rindex('◯の勝ち')

    @winlose[:draw] = @winlose[:draw] + 1
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

    countwinlose(kifu)

    path = format("kifu/kifu%09d.txt", idx)
    kifu2file(path, kifu)
    # puts "result:\n#{kifu}\n"
    puts File.read(path)
  end

  def playr(idx, rfen)
    puts "starting game #{idx}"
    # clickbtn(:id, 'btninit')
    # sleep 0.5
    loadrfen(rfen)

    clickbtn(:id, 'btncommvab')
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

    countwinlose(kifu)

    path = format("kifu/kifu#{@section}%09d.txt", idx)
    puts path
    kifu2file(path, kifu)
    # puts "result:\n#{kifu}\n"
    # puts File.read(path)
  end

  def readevaltbl(path)
    File.open('./test/evaltable.txt', 'r') do |f|
      l = f.readline
      l.chomp!
      continue if l.empty?
      continue if l.start_with?('#')
      return l
    end
    ''
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
    # jscmd = format("hintt.value=\"#{readevaltbl('./test/evaltable.txt')}\";")
    # driver.execute_script(jscmd)
    # # sleep 5
    # clickbtn(:id, 'btnupdate')
    # sleep 1
    # clickbtn(:id, 'btnevaltbl')
    # puts "=====\n#{hintt.attribute(:value)}\n=====\n"

    # wait loading evaltable.txt
    loop do
      sleep 0.5
      ret = driver.execute_script('return initialized == true;');
      p ret
      break if ret
    end
  end

  def simpleaccess
    simplecheck 'index.html'

    load_evaltable

    clickbtn(:id, 'acmchk')
    clickbtn(:id, 'acmachk')

    # 1.times do |idx|
    #   playr(idx, RFENTBL[RFENTBL.size-1])
    # end
    @rfentbl.each_with_index do |rfen, idx|
      playr(idx, rfen)
    end
  end

  def enumeratekifu
    files = Dir.entries('kifu').map do |path|
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

    100.times do |it|
      puts "#{it}/100 ..."
      # list[0..1].each do |path|
      list.shuffle.each do |path|
        puts "[#{path}]"
        loadkifu(path)

        clickbtn(:id, 'btnread')
        loop do
          elem = driver.find_element(:id, 'btnread')
          break if elem.enabled?
          sleep 0.2
        end
      end
    end

    clickbtn(:id, 'btnevaltbl')
    sleep 0.5
    et = driver.find_element(:id, 'hintt').attribute(:value)
    puts "evaltbl:#{et}"
    File.open("kifu/newevaltable.csv", "w") do |f|
      f.write(et)
    end
  end

  DIV_RFENTABLE = 12

  def run(idx)
    starttime = Time.now

    if idx >= 0 then
      # @rfentbl = RFENTBL.slice(idx * DIV_RFENTABLE, 1)
      @rfentbl = RFENTBL.slice(idx * DIV_RFENTABLE, DIV_RFENTABLE)
      @section = idx
    else
      @rfentbl = RFENTBL
      @section = ''
    end

    puts "Started on #{starttime}"
    @testtbl.each do |test|
      unless methods(true).include?(test.to_sym)
        puts "unknown test name '#{test}'..."
        exit(-9999)
      end
      puts test
      method(test.to_sym).call
    end

    finishtime = Time.now
    puts "Finished on #{finishtime}"
    puts "it took #{(finishtime - starttime)/3600.0} hours."
    # テストを終了する（ブラウザを終了させる）
    # driver.quit
  end

  def finalize(ret)
    er = ExtractRfen.new(ARGV.grep(/^[^-]/)[0])
    er.enumeratekifu.each do |path|
      er.extract(path)
    end

    print_winrate

    # テストを終了する（ブラウザを終了させる）
    driver.quit
    exit(ret)
  end
end
