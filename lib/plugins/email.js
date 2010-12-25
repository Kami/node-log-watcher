/*
* Plugin which send notification to single or multiple email addresses.
 */
var util = require('util');

var sprintf = require('../extern/sprintf').sprintf;
var email = require('mailer');

var NotificationPlugin = require('./base').NotificationPlugin;

var config = {
  'supports_snapshot': false
};

var REQUIRED_OPTIONS = [ 'host', 'port', 'from', 'addresses' ];
var DEFAULT_VALUES = {
  host: 'localhost',
  port: 25
};

var SUBJECT_MATCH_FOUND = 'Found pattern match in file %s [log watcher]';
var SUBJECT_FILE_REMOVED = '%s file has been removed [log watcher]';

var BODY_MATCH_FOUND = 'Found pattern match in file %s\n' +
                   'Pattern: %s\n' +
                   'Matched line: %s\n' +
                   'Time: %s';
var BODY_FILE_REMOVED = 'File %s has been removed at %s.';

function EmailNotificationPlugin(options) {
  NotificationPlugin.call(this, options, REQUIRED_OPTIONS, DEFAULT_VALUES);
}

util.inherits(EmailNotificationPlugin, NotificationPlugin);

EmailNotificationPlugin.prototype._handle_match_found = function(file, pattern,
                                                                  time,
                                                                  matched_line,
                                                                  context,
                                                                  snapshot) {
    var arguments = [ file, pattern, matched_line, time ];
    this._send_email(this._options.addresses, SUBJECT_MATCH_FOUND,
                     BODY_MATCH_FOUND, arguments);
};

EmailNotificationPlugin.prototype._handle_file_not_available = function(file, time) {
  var arguments = [ file, time ];
  this._send_email(this._options.addresses, SUBJECT_FILE_REMOVED,
                   BODY_FILE_REMOVED, arguments);
};

EmailNotificationPlugin.prototype._send_email = function(email_addresses, subject,
                                                         body, arguments) {
  var i, emails_count, email_address;
  var handle_email_result = function(err, result) {
    // noop
  };

  subject = sprintf(subject, arguments[0]);
  body = sprintf.apply(this, [ body ].concat(arguments));

  emails_count = email_addresses.length;
  for (i = 0; i < emails_count; i++) {
    email_address = email_addresses[i];
    email.send({
      'host': this._options.host,
      'port': this._options.port,
      'to': email_address,
      'from': this._options.from,
      'subject': subject,
      'body': body
    });
  }
};

exports.config = config;
exports.klass = EmailNotificationPlugin;
