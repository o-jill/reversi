# frozen_string_literal: true

# require 'unindent'

#
# testresult
class Result
  def initialize(driver)
    @ok = 0
    @ng = 0
    @driver = driver
  end

  # ok, ngのカウントをゼロにする
  def reset
    @ok = 0
    @ng = 0
  end

  attr_reader :ok, :ng

  def put_sec_url(msg)
    puts "URL: #{@driver.current_url}\n#{msg}"
  end

  def put_caller
    puts "place:#{caller.join("\n")}"
  end

  # increment ok
  def succe
    @ok += 1
  end

  # increment ng
  def failu
    @ng += 1
  end

  # increment ok or ng
  #
  # @param b true:ok will be incremented, otherwise ng.
  def succfail(b)
    b ? succe : failu
    put_caller unless b
  end

  def checkproperty(a, b)
    # general function to check some property
    return succe if a == b

    failu

    put_sec_url("'#{a}' is not #{b}.")
  end

  # general function to check some property matches
  def matchproperty(rex, b)
    return succe if rex =~ b

    failu

    put_sec_url("'#{b}' does not match #{rex}.")
    put_caller
  end

  # check if title is t
  def checktitle(t = 'WashCrus')
    checkproperty(@driver.title, t)
  end

  # check if title is not t
  def checktitlenot(t = 'WashCrus')
    return succe if @driver.title != t

    failu

    put_sec_url("'#{@driver.title}' should not be #{t}.")
    put_caller
  end

  # check if current_url is url
  def checkurl(url)
    checkproperty(@driver.current_url, url)
  end

  # check if body is t
  def checkplaintext(t)
    body = @driver.find_element(:tag_name, 'body')
    checkproperty(body.text, t)
  end

  # check if regexp matches content
  def checkmatch(regexp)
    body = @driver.find_element(:tag_name, 'body')
    matchproperty(regexp, body.text)
  end

  # check if regexp matches content
  def checkchat(regexp)
    chat = @driver.find_element(:id, 'chatlog')
    matchproperty(regexp, chat.text)
  end

  # check footer
  def checkfooter(regexp = /ぢるっち/)
    ft = @driver.find_element(:tag_name, 'footer')
    unless ft
      put_sec_url('does not have any footer elements.')
      put_caller
      return failu
    end
    matchproperty(regexp, ft.text)
  end

  # check subject in a mail
  def checkmailsubject(json, sbj)
    unless json
      put_sec_url('JSON(mail?) is empty.')
      put_caller
      return failu
    end

    return succe if json['subject'] == sbj

    failu

    put_sec_url("'#{json['subject']}' is not '#{sbj}'.")
    put_caller
  end

  # check subject in a mail
  def matchmailsubject(json, sbjptn)
    unless json
      put_sec_url('JSON(mail?) is empty.')
      put_caller
      return failu
    end

    return succe if sbjptn =~ json['subject']

    failu

    put_sec_url("'#{json['subject']}' does not match '#{sbjptn}'.")
    put_caller
  end
end
