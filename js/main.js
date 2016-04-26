'use strict';

var COUNTER = 1;

var PPParser = function() {
  this.id = COUNTER++;
  this.verbose = false;
  this.interfaces = [];
};

PPParser.prototype.init = function() {
  this.container = document.getElementById('log_' + this.id);
  this.logPath = this.container.querySelector('.logPath');
  this.submitBtn = this.container.querySelector('.submitBtn');
  this.submitBtn.addEventListener('click', this.readLog.bind(this));
  this.verboseCheck = this.container.querySelector('.verbose');
  this.interfaceArea = this.container.querySelector('.interfacePicker');
  this.resultArea = this.container.querySelector('.result');
};

PPParser.prototype.readLog = function() {
  var path = this.logPath.value;
  this.verbose = this.verboseCheck.checked;
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = (function() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        this.handleLog(httpRequest.responseText);
      } else {
        alert('There was a problem with the request.');
      }
    }
  }).bind(this);
  httpRequest.open('GET', path);
  httpRequest.send();
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
    } else {  // PPAPI log
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
      var json = JSON.parse(msg);
      if (!this.interfaces.includes(json['__interface'])) {
        this.interfaces.push(json['__interface']);
      }
      div.dataset.interface = json['__interface'];
    }

    // append message
    div.classList.add('message', style);
    div.textContent = msg;
    fragment.appendChild(div);
  }).bind(this));
  this.resultArea.appendChild(fragment);
  console.log(fragment);

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
