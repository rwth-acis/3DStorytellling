require.config({
  paths: {
    jquery: 'libs/jquery/jquery',
    x3dom: 'libs/x3dom/x3dom',
    underscore: 'underscore/underscore-min'
  }
});

require([
  'app',
], function(App){
  App.initialize();
});
