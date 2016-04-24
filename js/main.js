'use strict';

var COUNTER = 1;

var PPParser = function() {
  this.id = COUNTER++;
  this.verbose = false;
};

PPParser.prototype.init = function() {
  this.container = document.getElementById('log_' + this.id);
  this.logPath = this.container.querySelector('.logPath');
  this.submitBtn = this.container.querySelector('.submitBtn');
  this.submitBtn.addEventListener('click', this.readLog.bind(this));
  this.verboseCheck = this.container.querySelector('.verbose');
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
  //console.log(text);
  var fragment = document.createDocumentFragment();
  lines.forEach((function(line) {
    var style = 'unknown';
    var msg = '';

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
    }

    // append message
    var ele = document.createElement('div');
    ele.classList.add('message', style);
    ele.textContent = msg;
    fragment.appendChild(ele);
  }).bind(this));

  this.resultArea.appendChild(fragment);
}

window.addEventListener('load', function() {
  var parser = new PPParser();
  parser.init();
});
