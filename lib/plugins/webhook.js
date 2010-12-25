/*
* Plugin which hits a single or multiple URLs with a notification payload.
 */
var util = require('util');
var http = require('http');
var url = require('url');

var sprintf = require('../extern/sprintf').sprintf;

var NotificationPlugin = require('./base').NotificationPlugin;

config = {
  'supports_snapshot': false
}

var REQUIRED_OPTIONS = [ 'urls' ];

function WebhookNotificationPlugin(options) {
  NotificationPlugin.call(this, options, REQUIRED_OPTIONS);
}

util.inherits(WebhookNotificationPlugin, NotificationPlugin);

WebhookNotificationPlugin.prototype._handle_match_found = function(file, pattern,
                                                                  time,
                                                                  matched_line,
                                                                  context,
                                                                  snapshot) {
    var arguments = {
                      'type': 'line_matched',
                      'file': file,
                      'pattern': pattern.toString(),
                      'matched_line': matched_line,
                      'time': time
                    };
    this._send_payload(this._options.urls, arguments);
};

WebhookNotificationPlugin.prototype._handle_file_not_available = function(file, time) {
  var arguments = {
                    'type': 'file_not_available',
                    'file': file,
                    'time': time
                    };
  this._send_payload(this._options.urls, arguments);
};

WebhookNotificationPlugin.prototype._send_payload = function(urls, arguments) {
  var i, urls_count, url_address, body, client, request;
  var url_object, url_port, url_host, url_path;

  body = JSON.stringify(arguments);

  urls_count = urls.length;
  for (i = 0; i < urls_count; i++) {
    url_address = urls[i];
    url_object = url.parse(url_address);
    url_port = url_object.port || 80;
    url_host = url_object.host;
    url_path = url_object.pathname;

    client = http.createClient(url_port, url_host);
    request = client.request('POST', url_path, {
                                                  'host': url_host,
                                                  'Content-length': body.length,
                                                  'Content-type': 'application/json'
                                                });
    request.end(body);
  }
};

exports.config = config;
exports.klass = WebhookNotificationPlugin;
