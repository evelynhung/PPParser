'use strict';

var COUNTER = 1;

var PPParser = function() {
  this.id = COUNTER++;
  this.verbose = false;
  this.interfaces = [];
};

PPParser.prototype.init = function() {
  this.container = document.getElementById('log_' + this.id);
  this.logFile = this.container.querySelector('.logFile');
  this.logFile.addEventListener('change', (function(evt) {
    var file = evt.target.files[0];
    // TODO file size check
    console.log(file.size);
    this.fileInfoArea.textContent = "file size: " + file.size + ' Bytes';
  }).bind(this));
  this.fileInfoArea = this.container.querySelector('.fileInfo');
  this.submitBtn = this.container.querySelector('.submitBtn');
  this.submitBtn.addEventListener('click', this.readLog.bind(this));
  // TODO listen to verbose state and show more logs
  this.verboseCheck = this.container.querySelector('.verbose');
  this.interfaceArea = this.container.querySelector('.interfacePicker');
  this.resultArea = this.container.querySelector('.result');
};

PPParser.prototype.readLog = function(evt) {
  // clean previous result
  this.interfaceArea.innerHTML = '';
  this.interfaces = [];
  this.resultArea.innerHTML = '';
  var file = this.logFile.files[0];
  var reader = new FileReader();
  reader.onload = (function(evt) {
    this.handleLog(evt.target.result);
  }).bind(this);
  reader.readAsText(file);
}

PPParser.prototype.handleLog = function(text) {
  var lines = text.split('\n');
  var fragment = document.createDocumentFragment();
  lines.forEach((function(line) {
    var style = 'unknown';
    var msg = '';
    var div = document.createElement('div');

    if (line.startsWith('Not implemented')) {  // highlight this
      msg = line;
    } else if (line.indexOf('__interface') == -1) {  // special format
      if (line.indexOf('RPC response') >= 0) {
        style = 'fromBrowser';
        msg = line.substring(line.indexOf('[', 2), line.lastIndexOf(']')+1)
      } else {
        if (!this.verbose) {
          return;  // ignore this record
        }
        msg = line;
      }
    } else {  // API log
      if (line.startsWith('callFromJSON')) {
        style = (line.indexOf(': <'))? 'fromPlugin' : 'fromBrowser';
      } else if (line.indexOf('From plugin') > 0) {
        style = 'fromPlugin';
      } else if (line.indexOf('To plugin') > 0) {
        style = 'fromBrowser';
      } else {
        style = 'fromPlugin';
      }
      msg = line.substring(line.indexOf('{'), line.lastIndexOf('}')+1);
      // record its interface
      try {
        var json = JSON.parse(msg);
        if (!this.interfaces.includes(json['__interface'])) {
          this.interfaces.push(json['__interface']);
        }
        div.dataset.interface = json['__interface'];
      } catch(e) {
        console.log(msg);
        console.log(e.error);
      }
    }

    // append message
    div.classList.add('message', style);
    div.textContent = msg;
    fragment.appendChild(div);
  }).bind(this));
  this.resultArea.appendChild(fragment);

  this.interfaces.forEach((function(name) {
    var span = document.createElement('span');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = name;
    checkbox.addEventListener('change', (function(evt) {
      var value = evt.target.value;
      var checked = evt.target.checked;
      var eles = this.resultArea.querySelectorAll('[data-interface=\"'+value+'\"]');
      for (var i=0; i<eles.length; ++i) {
        eles[i].style.backgroundColor = (checked)? 'yellowgreen' : '';
      }
      if (checked && eles[0]) eles[0].scrollIntoView({behavior: "smooth"});
    }).bind(this));
    var label = document.createElement('label');
    label.textContent = name;
    span.appendChild(checkbox);
    span.appendChild(label);
    fragment.appendChild(span);
  }).bind(this));
  this.interfaceArea.appendChild(fragment);
  this.interfaceArea.style.display = 'block';
}

window.addEventListener('load', function() {
  var parser = new PPParser();
  parser.init();
});
