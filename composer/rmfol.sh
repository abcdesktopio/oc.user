while read -r line
do
    # echo "$line";
    if [[ -L "${line}" ]]; then echo "$line is a symlink"; rm "${line}"; fi
    if [[ -f "${line}" ]]; then echo "$line is a file";    rm "${line}"; fi
done
