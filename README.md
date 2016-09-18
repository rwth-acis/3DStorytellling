# 3DStorytellling

## Build steps
1. Make sure to have *bower*
    * Use your favorite package manager or grab *npm* from [here][2]
    * Use *npm* to install *bower*: ```npm install -g bower```
2. Install dependencies: ```bower install```
3. Adjust the fields in buildcfg/root.
    * *ROOT* is where the project will be deployed
    * *ROLE* is the URL of the ROLE SDK
    * *LAS* is the las2peer node with the CAE backend behind it (no trailing /)
    * *Y* should be the URL of the same Yjs websocket connector, which SyncMeta uses (no trailing /)
4. Run ./deploy.sh
   The exported widgets will be located under html/