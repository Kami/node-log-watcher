var util = require('util');

var sprintf = require('../extern/sprintf').sprintf;

config = {
  'supports_snapshot': false
}

function NotificationPlugin(options, required_options) {
  var required_options = required_options || [];
  this._options = options || {};

  this._verify_options(required_options);
  this._initialize_listeners();
}

util.inherits(NotificationPlugin, process.EventEmitter);

NotificationPlugin.prototype._verify_options = function(required_options) {
  var i, arguments_count, argument, missing_options = [];

  arguments_count = required_options.length;
  for (i = 0; i < arguments_count; i++) {
    option = required_options[i];

    if (!this._options.hasOwnProperty(option)) {
      missing_options.push(option);
    }
  }

  if (missing_options.length > 0) {
    throw new Error(sprintf('Missing required options: %s',
                    missing_options.join(', ')));
  }
};

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
