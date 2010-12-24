/* List of the available options */
VALID_OPTIONS = [ 'notify_on_not_available' ];

/* List of the available notification plugins */
NOTIFICATION_PLUGINS = [ 'stdout', 'email', 'webhook' ];

/* Path to a folder where the named pipe file is created */
NAMED_PIPE_PATH = '/tmp';

/* Pipe control character to function mappings */
PIPE_CONTROL_CHARACTER_MAPPINGS = {
  'r': null,
};
VALID_PIPE_CONTROL_CHARACTERS = Object.keys(PIPE_CONTROL_CHARACTER_MAPPINGS);

exports.VALID_OPTIONS = VALID_OPTIONS;
exports.NOTIFICATION_PLUGINS = NOTIFICATION_PLUGINS;
exports.NAMED_PIPE_PATH = NAMED_PIPE_PATH;
exports.PIPE_CONTROL_CHARACTER_MAPPINGS = PIPE_CONTROL_CHARACTER_MAPPINGS;
exports.VALID_PIPE_CONTROL_CHARACTERS = VALID_PIPE_CONTROL_CHARACTERS;
