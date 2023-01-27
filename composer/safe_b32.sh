#!/bin/bash

# safe_b32
# add missing '=' to a b32 string

# dummy test
# echo 'A' |base32 | tr -d '=' |./safe_b32.sh | base32 -d
# echo 'AB' |base32 | tr -d '=' |./safe_b32.sh | base32 -d
# echo 'ABC' |base32 | tr -d '=' |./safe_b32.sh | base32 -d
# echo 'ABCD' |base32 | tr -d '=' |./safe_b32.sh | base32 -d
# echo 'ABCDE' |base32 | tr -d '=' |./safe_b32.sh | base32 -d
# echo 'ABCDEF' |base32 | tr -d '=' |./safe_b32.sh | base32 -d
# echo 'ABCDEFG' |base32 | tr -d '=' |./safe_b32.sh | base32 -d
# echo 'ABCDEFGH' |base32 | tr -d '=' |./safe_b32.sh | base32 -d


function pad_decode {
  _l=$((${#1} % 8))
  # echo "_l=$_l"
  # value can be only 0 2 4 5 7 
  if   [ $_l -eq 7 ]; then
     _s="$1"'='
  elif [ $_l -eq 5 ]; then
     _s="$1"'==='
  elif [ $_l -eq 4 ]; then
     _s="$1"'===='
  elif [ $_l -eq 2 ]; then 
     _s="$1"'======'
  else 
     _s="$1" ; 
  fi
  echo $_s
}

d=$(cat /dev/stdin)
pad_decode $d

