<link rel="import" href="http://localhost:8082/src/js/lib/polymer/polymer.html">
<link rel="import" href="http://localhost:8082/src/js/lib/iron-pages/iron-pages.html">
<link rel="import" href="http://localhost:8082/src/js/lib/iron-icon/iron-icon.html">
<link rel="import" href="http://localhost:8082/src/js/lib/iron-icons/iron-icons.html">
<link rel="import" href="http://localhost:8082/src/js/lib/iron-flex-layout/iron-flex-layout-classes.html">
<link rel="import" href="http://localhost:8082/src/js/lib/app-layout/app-layout.html">
<link rel="import" href="http://localhost:8082/src/js/lib/paper-tabs/paper-tabs.html">
<link rel="import" href="http://localhost:8082/src/js/lib/paper-button/paper-button.html">
<link rel="import" href="http://localhost:8082/src/js/lib/paper-styles/typography.html">
<link rel="import" href="http://localhost:8082/src/js/lib/paper-toast/paper-toast.html">

<script src="http://open-app.googlecode.com/files/openapp.js"></script>
<script src="http://localhost:8082/src/js/lib/yjs/y.js"></script>
<script src="http://localhost:8082/src/js/yjs-sync.js"></script>
<script src="http://localhost:8082/src/js/lib/jquery/dist/jquery.min.js"></script>
<script src="http://dbis.rwth-aachen.de/gadgets/iwc/lib/iwc.js"></script>
<script src="http://localhost:8082/src/js/lib/las2peerWidgetLibrary.js"></script>
<script src="http://localhost:8082/src/js/conf.js"></script>
<script src="http://localhost:8082/src/js/util.js"></script>
<script src="http://localhost:8082/src/js/story.js"></script>
<script src="http://localhost:8082/src/js/narrator.js"></script>

<link rel="stylesheet" type="text/css" href="http://localhost:8082/src/js/lib/x3dom/x3dom.css"></link>
<link rel="import" href="http://localhost:8082/src/css/defaults.html">

<style is="custom-style" include="iron-flex"></style>

<dom-module id="polymer-test">
    <template>

        <style include="shared-styles"></style>
        <style>
         #elem {
             border: none;
         }
        </style>
        
        <paper-tabs class="l1" id="tabs" selected={{mode}}>
            <paper-tab>VIEW</paper-tab>
            <paper-tab>TAG</paper-tab>
        </paper-tabs>

        <div>
            <div class="l2">
                <iron-pages selected={{mode}}>
                    <div>
                        <input id="curr_view" onClick="viewer.toClipboard('view');" value='"position="0 0 0" orientation="0 0 0 0"'>
                        <button type="button" onclick="viewer.clipboardButton('view')">copy view</button> 
                    </div>
                    <div>
                        <input id="curr_tag" onClick="viewer.toClipboard('tag');" value='"position="0 0 0" orientation="0 0 0 0"'>
                        <button type="button" onclick="viewer.clipboardButton('tag')">copy tag</button> 
                    </div>
                </iron-pages>
                <paper-toast id="toast_cp" class="toast" text="Copied into clipboard"></paper-toast>
                <paper-toast id="toast_cp_fail" class="toast_bad" text="You have to copy manually"></paper-toast>
            </div>
            <div id="div_3d">
                <x3d id="elem" width="99vw" height="85vh"> 
                    <scene id="scene"">
                        <navigationInfo type='"any"' id="navType"></navigationInfo>
                        <transform>
	                    <inline onclick="viewer.handleClick(event);" id="inline" onload="viewer.onModelLoaded();"> </inline>
                        </transform>
                    </scene> 
                </x3d>
            </div>
        </div>

    </template>
</dom-module>

<script>
 Polymer({
     is: 'polymer-test',
     
     properties: {
         model: {
             type: String,
             value: '121'
         },

         mode: {
             type: Number,
             value: 0,
             observer: '_modeChanged'
         }
     },

     ready: function() {
         viewer.init(this.model);
     },

     _modeChanged: function(index) {
         if (index == 0) {
             viewer.leaveTagMode();
         } else {
             viewer.enterTagMode();
         }
     }
 });
</script>