#!/bin/sh -x

if [ $# -ne 1 ]; then
  prefix='9'
else
  prefix=$1
fi

mv kifu000000000.txt kifu${prefix}000000000.txt
mv kifu000000001.txt kifu${prefix}000000001.txt
mv kifu000000002.txt kifu${prefix}000000002.txt
mv kifu000000003.txt kifu${prefix}000000003.txt
mv kifu000000004.txt kifu${prefix}000000004.txt
mv kifu000000005.txt kifu${prefix}000000005.txt
mv kifu000000006.txt kifu${prefix}000000006.txt
mv kifu000000007.txt kifu${prefix}000000007.txt
mv kifu000000008.txt kifu${prefix}000000008.txt
mv kifu000000009.txt kifu${prefix}000000009.txt
