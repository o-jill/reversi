#!/bin/sh -x

if [ $# -ne 1 ]; then
  prefix='9'
else
  prefix=$1
fi

for entry in ./kifu*.txt
do
  #~ path=${entry#./}
  path=${entry#./kifu}
  #~ echo cp "$entry" "$prefix$path"
  #~ cp "$entry" "$prefix$path"
  cp "$entry" "kifu$prefix$path"
done
