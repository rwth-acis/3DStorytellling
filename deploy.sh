echo "ROOT:"
read ROOT

OLD_ROOT="http://localhost:8082/"

rm -rf html
mkdir html
cp -r src html/
cp -r img html/

grep -rl $OLD_ROOT html/src | xargs sed -i s@$OLD_ROOT@$ROOT@g
