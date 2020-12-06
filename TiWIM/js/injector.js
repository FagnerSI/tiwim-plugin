const links = [
  'css/tiwim.css',
  'css/jquery.contextMenu.css',
];

links.forEach(function (item) {
  var link = document.createElement('link');

  link.rel = "stylesheet";
  link.href = item;

  setTimeout(function () {
    document.head.appendChild(link);
  });
});

const scripts = [
  'js/jquery-1.4.2.min.js',
  'createVarJ',
  'js/jquery.contextMenu.js',
  'tiwim.js',
  'createTiwimInstance',
];

scripts.forEach(function (item, index) {
  var script = document.createElement('script');

  if (item === 'createVarJ') {
    script.innerHTML = "var $j = jQuery.noConflict(true);"

  } else if (item === 'createTiwimInstance') {
    script.innerHTML = "$j(document).ready(function() { document.tiwim = new Tiwim(); document.tiwim.init(); })";

  } else {
    script.setAttribute('type', 'text/javascript');
    script.src = chrome.extension.getURL(item);
  }

  setTimeout(function () {
    document.head.appendChild(script);
  }, index * 100);
})
