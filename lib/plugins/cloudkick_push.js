/*
* Plugin which updates Cloudkick HTTP Push check - https://support.cloudkick.com/API/2.0/Checks.
 */
var util = require('util');
var http = require('http');
var url = require('url');

var sprintf = require('../extern/sprintf').sprintf;
var OAuth = require('oauth').OAuth;

var NotificationPlugin = require('./base').NotificationPlugin;

var config = {
  'supports_snapshot': false
};

var REQUIRED_OPTIONS = [ 'api_key', 'api_secret', 'check_id', 'node_id' ];
var DEFAULT_VALUES = {
  trigger_error_on_match: false,
  trigger_error_on_not_available: true
};

var URL_CHECK_STATUS = 'https://api.cloudkick.com/2.0/check/%s/update_status';
var URL_CHECK_DATA = 'https://api.cloudkick.com/2.0/data/check/%s';

function CloudkickPushNotificationPlugin(options) {
  NotificationPlugin.call(this, options, REQUIRED_OPTIONS, DEFAULT_VALUES);

  this.update_status_url = sprintf(URL_CHECK_STATUS, this._options.check_id);
  this.update_data_url = sprintf(URL_CHECK_DATA, this._options.check_id);
}

util.inherits(CloudkickPushNotificationPlugin, NotificationPlugin);

CloudkickPushNotificationPlugin.prototype._handle_match_found = function(file, pattern,
                                                                  time,
                                                                  matched_line,
                                                                  context,
                                                                  snapshot) {
    var arguments = {
                      'file': file,
                      'pattern': pattern.toString(),
                      'matched_line': matched_line,
                      'time': time
                    };
    this._send_payload('line_matched', arguments);
};

CloudkickPushNotificationPlugin.prototype._handle_file_not_available = function(file, time) {
  var arguments = {
                    'file': file,
                    'time': time
                    };
  this._send_payload('file_not_available', arguments);
};

CloudkickPushNotificationPlugin.prototype._send_payload = function(type, arguments) {
  var content_type, data_status, data_metrics_path, data_metrics_action;
  var data_metrics_matched_line, update_status_url, update_data_url;

  var noop = function() {};

  content_type = 'application/json';

  data_metrics_path = {
    'metric_name': 'file_path',
    'value': arguments.file,
    'check_type': 'str',
    'node_id': this._options.node_id
  };

  data_metrics_action = {
    'metric_name': 'action',
    'value': type,
    'check_type': 'str',
    'node_id': this._options.node_id
  };

  if (type === 'line_matched') {
    if (this._options.trigger_error_on_match) {
      data_status = {
        'status': 'err',
        'details': sprintf('Line %s matched defined pattern at %s', arguments.matched_line,
                                                                    arguments.time),
        'node_id': this._options.node_id
      };

      this._do_oauth_post_request(this.update_status_url, data_status,
                                  content_type, noop);
    }

    data_metrics_matched_line = {
      'metric_name': 'matched_line',
      'value': arguments.matched_line,
      'check_type': 'str',
      'node_id': this._options.node_id
    };

    this._do_oauth_post_request(this.update_data_url, data_metrics_path,
                                content_type, noop);
    this._do_oauth_post_request(this.update_data_url, data_metrics_action,
                                content_type, noop);
    this._do_oauth_post_request(this.update_data_url, data_metrics_matched_line,
                                content_type, noop);
  }


  if (type === 'file_not_available') {
    if (this._options.trigger_error_on_not_available) {
      data_status = {
        'status': 'err',
        'details': sprintf('File %s was removed at %s', arguments.file,
                           arguments.time),
        'node_id': this._options.node_id
      };

      this._do_oauth_post_request(this.update_status_url, data_status,
                                  content_type, noop);
    }

    this._do_oauth_post_request(this.update_data_url, data_metrics_path, noop,
                                content_type);
    this._do_oauth_post_request(this.update_data_url, data_metrics_action, noop,
                                content_type);
  }
};

CloudkickPushNotificationPlugin.prototype._do_oauth_post_request = function(url, data,
                                                                            content_type,
                                                                            callback) {
  var oauth;
  oauth = new OAuth('', '', this._options.api_key, this._options.api_secret, '1.0',
                    null, 'HMAC-SHA1');

  oauth.post(url, '', '', data, content_type, callback);
};

exports.config = config;
exports.klass = CloudkickPushNotificationPlugin;
