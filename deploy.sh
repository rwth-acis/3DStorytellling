echo "ROOT:"
read ROOT
echo "OBJECT_ROOT:"
read OBJECT_ROOT

OLD_ROOT="http://localhost:8082/"
OLD_OBJECT_ROOT="http://localhost:8082/assets/"
grep -rl $OLD_ROOT src | xargs sed -i s@$OLD_ROOT@$ROOT@g
grep -rl $OLD_OBJECT_ROOT src | xargs sed -i s@$OLD_OBJECT_ROOT@$OBJECT_ROOT@g
