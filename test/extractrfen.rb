class ExtractRfen
  KIFUDIR = 'kifu'.freeze

  def initialize(dir)
    @kifudir = dir || KIFUDIR
  end

  def enumeratekifu
    puts "enumeratekifu in #{@kifudir}"
    files = Dir.entries(@kifudir).map do |path|
      "./#{@kifudir}/#{path}"
    end
    files = files.select do |path|
      /kifu\d+\.txt/ =~ path
    end
    files.sort
  end

  def read(path)
    File.open(path, 'r') do |f|
      return f.readlines
    end
  end

  BLK = "ABCDEFGH".freeze
  WHT = "abcdefgh".freeze

  def countmoves(rfen)
    moves = -4

    rfen.split('/').each do |rank|
      rank.each_char do |ch|
        idx = BLK.index(ch)
        if idx then
            moves += idx + 1
            next
        end
        idx = WHT.index(ch)
        if idx then
            moves += idx + 1
            next
        end
      end
    end
    moves
  end

  def extract(path)
    # path = "./kifu/kifu000000000.txt"
    lines = read(path)

    # line1 move1
    move1 = lines[0].split(' ')[1]
    # line2 move2
    move2 = lines[1].split(' ')[1]
    # line3 rfen
    elem = lines[2].split(' ')
    rfen = elem[-2] + ' ' + elem[-1]
    puts "'#{rfen}', # #{move1} #{move2} #{countmoves(elem[-2])}"
  end
end

if __FILE__ == $0
  unless ARGV.grep('--help').empty? then
    puts 'ruby test/extractrfen.rb <DIR>'
    exit
  end

  er = ExtractRfen.new(ARGV[0])
  er.enumeratekifu.each do |path|
    er.extract(path)
  end
end
