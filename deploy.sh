echo "Reading config"
source buildcfg/root

OLD_ROOT="http://localhost:8082/"
OLD_ROLE="http://127.0.0.1:8073/"
OLD_LAS="http://localhost:1232"
OLD_Y="http://yjs.dbis.rwth-aachen.de:5079"

echo "Updating dependencies"
bower install

echo "Moving files"
rm -rf html
mkdir html
cp -r src html/
cp -r img html/

echo "Adjusting paths"
grep -rl $OLD_ROOT html/src | xargs sed -i s@$OLD_ROOT@$ROOT@g
grep -rl $OLD_ROLE html/src | xargs sed -i s@$OLD_ROLE@$ROLE@g
grep -rl $OLD_LAS html/src | xargs sed -i s@$OLD_LAS@$LAS@g
grep -rl $OLD_Y html/src | xargs sed -i s@$OLD_Y@$Y@g

echo "Done"
