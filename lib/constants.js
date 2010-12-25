/* List of the available options */
var VALID_OPTIONS = [ 'notify_on_not_available' ];

/* List of the available notification plugins */
var NOTIFICATION_PLUGINS = [ 'stdout', 'email', 'webhook', 'cloudkick_push' ];

/* Path to a folder where the named pipe file is created */
var NAMED_PIPE_PATH = '/tmp';

/* Pipe control character to function mappings */
var PIPE_CONTROL_CHARACTER_MAPPINGS = {
  'r': null,
};
var VALID_PIPE_CONTROL_CHARACTERS = Object.keys(PIPE_CONTROL_CHARACTER_MAPPINGS);

exports.VALID_OPTIONS = VALID_OPTIONS;
exports.NOTIFICATION_PLUGINS = NOTIFICATION_PLUGINS;
exports.NAMED_PIPE_PATH = NAMED_PIPE_PATH;
exports.PIPE_CONTROL_CHARACTER_MAPPINGS = PIPE_CONTROL_CHARACTER_MAPPINGS;
exports.VALID_PIPE_CONTROL_CHARACTERS = VALID_PIPE_CONTROL_CHARACTERS;
