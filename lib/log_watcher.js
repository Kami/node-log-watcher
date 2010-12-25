var util = require('util');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var sprintf = require('./extern/sprintf').sprintf;

var constants = require('./constants');

function LogWatcher(config_file) {
  this._config_file = config_file;

  this._watched_files = {};
}

util.inherits(LogWatcher, process.EventEmitter);

/*
 * Parse the config file and populate private data structures.
 */
LogWatcher.prototype._parse_config = function() {
  var config_object, watched_files, file, values, patterns, options, notifications;
  var stat, watch_object, key;

  try {
    config_object = JSON.parse(fs.readFileSync(this._config_file, 'utf-8'));
  }
  catch (err) {
    throw new Error('Config file parsing failed: ' + err.message +
                    '\nYou can validate your config at http://www.jsonlint.com');
  }

  watched_files = Object.keys(this._watched_files);
  for (file in config_object) {
    if (watched_files.indexOf(file) !== -1) {
      console.log(sprintf('Skipping file %s, reason: already watching', file));
      continue;
    }

    try {
      stat = fs.statSync(file);
    }
    catch (err2) {
      console.log(sprintf('Skipping file %s, reason: %s', file, err2.message));
      continue;
    }

    values = config_object[file];
    patterns = values.patterns;
    options = values.options || {};
    notifications = values.notifications || {};

    if (Object.keys(patterns).length === 0) {
      console.log('No patterns set up, skipping...');
      continue;
    }

    if (Object.keys(notifications).length === 0) {
      console.log('No notifications set up, skipping...');
      continue;
    }

    for (key in options) {
      if (constants.VALID_OPTIONS.indexOf(key) === -1) {
        console.log(sprintf('Invalid option "%s", skipping...', key))
        delete options[key];
      }
    }

    for (key in notifications) {
      if (constants.NOTIFICATION_PLUGINS.indexOf(key) === -1) {
        console.log(sprintf('Invalid notification plugin "%s", skipping...', key))
        delete notifications[key];
      }
    }


    watch_object = { 'options': {
                        'patterns': patterns,
                        'options': options,
                        'notifications': notifications,
                      },
                      'notification_instances': {},
                     'is_watched': false,
                     'watch_handle': null
                   };
    this._watched_files[file] = watch_object;
  }
};

/*
 * Set up watchers for all the tracked files.
 */
LogWatcher.prototype._initialize = function() {
  var i, file, options, notifications, pattern, pattern_object, case_sensitive;
  var watched_file, pattern_escaped, flags, patterns, plugins_count, plugin_name;
  var plugin_module, plugin_settings, plugin_object;

  // Initialize named pipe
  this._initialize_named_pipe(constants.NAMED_PIPE_PATH);

  for (file in this._watched_files) {
    watched_file = this._watched_files[file];
    options = watched_file.options;
    notifications = options.notifications;

    // Compile regexps
    for (pattern in options.patterns) {
      pattern_object = options.patterns[pattern];

      flags = '';
      if (!pattern_object.case_sensitive) {
        flags = 'i';
      }

      pattern_escaped = pattern_object.pattern;
      pattern_object.pattern = new RegExp(pattern_escaped, flags);

      this._watched_files[file].options.patterns[pattern] = pattern_object;

      // Create plugin instances
      for (plugin_name in notifications) {
        plugin_settings = notifications[plugin_name];

        plugin_module = require('./plugins/' + plugin_name);
        plugin_object = { 'instance': new plugin_module.klass(plugin_settings),
                          'config': plugin_module.config }

        this._watched_files[file].notification_instances[plugin_name] = plugin_object;
      }
    }

    // Add watcher
    this._add_watcher(file);
  }

  console.log(sprintf('Log watcher initialized, watching %s files', Object.keys(this._watched_files).length));
};

/*
 *
 * Create a named if (if it doesn't exist already) and set up interval which
 * periodically checks pipe for new data.
 *
 * @param {String} pipe_path Path where a named pipe will be created.
 */
LogWatcher.prototype._initialize_named_pipe = function(pipe_path) {
  var self = this;
  var pipe_file, command;

  pipe_file = sprintf('%s/log-watcher-control', pipe_path);
  var read_data_from_pipe = function() {
    fs.readFile(pipe_file, function(err, data) {
      // This callback is called when data is available on pipe
      var i, characters, character;

      if (err) {
        console.log(sprintf('Reading from pipe failed, reason: %s', err.message));
        return;
      }

      characters = data.toString().trim().split('');
      characters = characters.filter(function(character) {
        return (constants.VALID_PIPE_CONTROL_CHARACTERS.indexOf(character) !== -1);
      });

      for (i = 0; i < characters.length; i++) {
        character = characters[i];
        self._handle_pipe_control_character(character);
      }

      read_data_from_pipe();
    });
  };

  path.exists(pipe_file, function(exists) {
    if (exists) {
      read_data_from_pipe();
      return;
    }

    command = sprintf('mkfifo %s', pipe_file);
    exec(command, function(err, stdout, stderr) {
      if (err) {
        console.log(sprintf('Creating named pipe failed, reason: %s', err.message));
        return;
      }

     read_data_from_pipe();
    });
  });
};

/*
 * Call function corresponding to the control character.
 *
 * @param {String} character Control character. Currently supported charactery:
 *                           r - reload the config file
 */
LogWatcher.prototype._handle_pipe_control_character = function(character) {
  if (constants.VALID_PIPE_CONTROL_CHARACTERS.indexOf(character) == -1) {
    console.log(sprintf('Unrecognized control character %s', character));
    return;
  }

  PIPE_CONTROL_CHARACTER_MAPPINGS[character].call(this);
};

LogWatcher.prototype._add_watcher = function(file_path) {
  var self = this;
  var stat;

  var watch_file_listener = function(curr, prev) {
    path.exists(file_path, function(exists) {
      var size_curr = curr.size;
      var size_prev = prev.size;
      var size_diff = size_curr - size_prev;

      if (!exists) {
        // File was removed
        self._dispatch_notifications(file_path, 'file_not_available');
        return
      }

      if (size_diff === 0 || size_curr == 0) {
        // Nothing has changed or the file was re-created
        return;
      }

      start = size_prev;
      end = size_curr;

      self._handle_data(file_path, start, end);
    });
  };

  stat = fs.watchFile(file_path, watch_file_listener);
  this._watched_files[file_path].is_watched = true;
  this._watched_files[file_path].watch_handle = stat;
};

LogWatcher.prototype.start = function() {
  this._parse_config();

  if (Object.keys(this._watched_files).length > 0) {
    this._initialize();
  }
};

LogWatcher.prototype._remove_watcher = function(file_path) {
  var stat;

  stat = this._watched_files[file_path] = watch_handle;
  stat.removeAllListeners('change');
  stat.unwatchFile(file_path);
  this._watched_files[file_path].is_watched = false;
  this._watched_files[file_path].watch_handle = null;
};

/*
 * Reload the config file.
 */
LogWatcher.prototype.reload_config = function() {
};

LogWatcher.prototype._handle_data = function(file, start, end) {
  var self = this;
  var i, file, watched_file, patterns, patterns_len, pattern, pattern_re;

  watched_file = this._watched_files[file];

  if (!watched_file.is_watched) {
    continue;
  }

  patterns = watched_file.options.patterns;

  var read_file = function(file, start, end, callback) {
     var file_stream = fs.createReadStream(file, {start: start, end: end});

    file_stream.on('error', function(err) {
      console.log('Error while reading file %s: %s', file, err.message);
      self._watched_files[file].file_stream = null;
      file_stream.destroy();
    });

    file_stream.on('close', function() {
      file_stream.removeAllListeners('data');
      self._watched_files[file].file_stream = null;
    });

    file_stream.on('data', function(data) {
      var i, lines, lines_length, line;

      lines = data.toString().split('\n');
      lines_length = lines.length;

      for (i = 0; i < lines_length; i++) {
        line = lines[i];

        for (pattern in patterns) {
          pattern_re = patterns[pattern].pattern;

          if (!pattern_re.exec(line)) {
            continue;
          }

          self._dispatch_notifications(file, 'line_match', pattern_re, line);
        }
      }
    });
  };

  read_file(file, start, end);
};

/*
 * Dispatch notifications.
 *
 * @param {String} file Watched file
 * @param {String} type Notification type - 'line_match' or 'file_not_available'
 * @param {String} line Pattern which matched the line (only required if type is
 *                      'line_match')
 * @param {String} line Matched line (only required if type is 'line_match')
 */
LogWatcher.prototype._dispatch_notifications = function(file, type, pattern, line) {
  var watched_file, options, notifications, notification, time, key, event_name;
  var event_args;

  watched_file = this._watched_files[file];
  options = watched_file.options;
  if (!options.options.notify_on_not_available &&
      type == 'file_not_available') {
    return
  }

  time = new Date();
  event_name = (type === 'line_match') ? 'match_found' : 'not_available';

  if (event_name === 'match_found') {
    event_args = [ event_name, file, pattern, time, line, null, null ];
  }
  else if (event_name == 'not_available') {
    event_args = [ event_name, file, time ];
  }

  notifications = options.notifications;
  for (key in notifications) {
    notification_instance = watched_file.notification_instances[key].instance;
    notification_instance.emit.apply(notification_instance, event_args);
  }
}

constants.PIPE_CONTROL_CHARACTER_MAPPINGS.r = LogWatcher.prototype.reload_config;

process.addListener('unhandlerException', function(err) {
  util.error(err.message);
  process.exit(1);
});

exports.LogWatcher = LogWatcher;
