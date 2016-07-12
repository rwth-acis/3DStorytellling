echo "ROOT:"
read ROOT

OLD_ROOT="http://localhost:8082/"
grep -rl $OLD_ROOT src | xargs sed -i s@$OLD_ROOT@$ROOT@g
