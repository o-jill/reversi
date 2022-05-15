# for testing on a browser.
# frozen_string_literal: true

require 'selenium-webdriver'

require './test/testresult.rb'

# base for testing pages on a browser
class BrowserTestAbstract
  def initialize
    # Firefox用のドライバを使う
    @driver = Selenium::WebDriver.for :firefox
    @wait = Selenium::WebDriver::Wait.new(timeout: 10)
    @res = Result.new(driver)
  end

  attr_reader :driver, :res

  # ok, ngのカウントをゼロにする
  def reset
    res.reset
  end

  BASE_URL = 'http://localhost:3000/'

  def simplecheck(pageurl)
    driver.navigate.to BASE_URL + pageurl
    sleep 0.1
    # res.checktitle
    # puts driver.page_source
    # res.checkfooter
  end

  def simpleurlcheck(url)
    res.checkurl(BASE_URL + url)
    sleep 0.1
    # res.checktitle
    # puts driver.page_source
    # res.checkfooter
  end

  def simplecheckmatch(url, rex)
    driver.navigate.to BASE_URL + url
    sleep 0.1
    # puts driver.title
    # puts driver.page_source
    res.checkmatch(rex)
  end

  # 文字列入力
  def inputbox(key, name, txt)
    driver.find_element(key, name).send_keys(txt)
  end

  # ボタンをクリック
  def clickbtn(key, val)
    driver.find_element(key, val).click
  end

  # テスト結果の表示
  #
  # @return ng数
  def showresult
    print res.ng.zero? ? "\e[32m" : "\e[31m"
    puts "ok:#{res.ok}, ng:#{res.ng}\e[0m"
    res.ng
  end

  def fold_begin(grp, msg)
    warn "travis_fold:start:#{grp}\033[33;1m#{msg}\033[0m"
  end

  def fold_end(grp)
    warn "\ntravis_fold:end:#{grp}\r"
  end
end

# memo

# Googleにアクセス
# driver.navigate.to "http://google.com"
# driver.navigate.to "http://localhost/"

# `q`というnameを持つ要素を取得
# element = driver.find_element(:name, 'q')

# `Hello WebDriver!`という文字を、上記で取得したinput要素に入力
# element.send_keys "Hello WebDriver!"

# submitを実行する（つまり検索する）
# element.submit

# 表示されたページのタイトルをコンソールに出力
# puts driver.title
