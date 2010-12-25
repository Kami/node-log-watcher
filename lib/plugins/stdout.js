/*
* Plugin which prints matched line to standard output
 */
var util = require('util');

var sprintf = require('../extern/sprintf').sprintf;

var NotificationPlugin = require('./base').NotificationPlugin;

config = {
  'supports_snapshot': false
}

var REQUIRED_OPTIONS = [];
var DEFAULT_VALUES = {};

function StdoutNotificationPlugin(options) {
  NotificationPlugin.call(this, options, REQUIRED_OPTIONS, DEFAULT_VALUES);
}

util.inherits(StdoutNotificationPlugin, NotificationPlugin);

StdoutNotificationPlugin.prototype._handle_match_found = function(file, pattern,
                                                                  time,
                                                                  matched_line,
                                                                  context,
                                                                  snapshot) {
  util.puts(sprintf('file: %s, time: %s, pattern: %s, matched line: %s',
                    file, time, pattern, matched_line));
};

StdoutNotificationPlugin.prototype._handle_file_not_available = function(file, time) {
  util.puts(sprintf('file %s has been removed at %s', file, time));
};

exports.config = config;
exports.klass = StdoutNotificationPlugin;
