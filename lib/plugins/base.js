var util = require('util');

config = {
  'supports_snapshot': false
}

function NotificationPlugin(options) {
  this._options = options || {};

  this._initialize_listeners();
}

util.inherits(NotificationPlugin, process.EventEmitter);

NotificationPlugin.prototype._initialize_listeners = function() {
  this.addListener('match_found', this._handle_match_found);
  this.addListener('not_available', this._handle_file_not_available);
};

NotificationPlugin.prototype._handle_match_found = function(file, time, pattern,
                                                            matched_line, context,
                                                            snapshot) {
  throw new Error('Not implemented');
};

NotificationPlugin.prototype._handle_file_not_available = function(file, time) {
  throw new Error('Not implemented');
};

exports.NotificationPlugin = NotificationPlugin;
exports.config = config;
