var util = require('util');

var optparse = require('optparse');

var LogWatcher = require('./lib/log_watcher').LogWatcher;

var switches = [
    ['-C', '--config PATH', 'Path to the config file'],
    ['-H', '--help', 'Shows help sections']
];

var parser = new optparse.OptionParser(switches);
parser.banner = 'Usage: log-watcher.js [options]';

var options = {
    config: null,
    print_help: false
};

parser.on('config', function(option, value) {
  options.config = value;
});

parser.on('help', function() {
  util.puts(parser.toString());
  options.print_help = true;
});

parser.parse(process.ARGV);

if (!options.config && !options.print_help) {
  util.puts(parser.toString());
  process.exit(1);
}

if (!options.print_help) {
  var log_watcher = new LogWatcher(options.config);
  log_watcher.start();
}

