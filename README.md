# Log Watcher
Watches log files for changes and sends a notification / alert using one or more of the available methods provided by a plugin (stdout, email and webhook) if a pre-defined pattern is detected or a tracked file is deleted.

# Installation

    npm install log-watcher

# Configuration

In a configuration file you specify which files to watch for changes, match patterns and notification options.

## Example configuration

   {
      "/var/log/messages": {
        "patterns": {
            "usb_disconnect": {
              "pattern": "USB disconnect, address \\d+",
              "case_sensitive": false,
              "description": "USB device has been disconnected"
            },

            "usb_connect": {
              "pattern": "new low|full speed USB device",
              "case_sensitive": false,
              "description": "USB device has been connected"
            }
        },

        "options": {
          "notify_on_not_available": true
        },

        "notifications": {
          "webhook": {
            "urls": [ "http://example.foo.bar/hook" ]
          },
          "email": {
            "from": "notifications@foo.bar",
            "addresses": [ "example@foo.bar" ]
          },
          "stdout": {
          }
        }
      }
    }

## Configuration options

* Object keys are tracked file paths. In this case, one file is tracked - `/var/log/messages`

* `patterns` - object where a key is a short pattern name ([a-zA-Z0-9\-_]+) and a value is a pattern object with the following keys:
  * `pattern` - regular expression match pattern
  * `case_sensitive` - true if you want the pattern to be case sensitive, false otherwise (if `case_sensitive` is false, 'i' flag is added to the created RegExp object).  
  * `description` - pattern description

* `options` - object with the following keys:
  * `notify_on_not_available` - true to send a notification when a file is unavailable (deleted)

* `notification` - object which defines how to send a notification if a defined pattern is detected or a file is deleted. Key is a plugin name and a value is an object with the plugin options. Currently available plugins are:
  * `stdout` - prints notification to standard output
  * `email` - sends a notification to a single or multiple email addresses
  * `webhook` - sends a notification payload as a POST request to a single or multiple URLs
  * cloudkick_push - not working yet, because https in node 0.x.3 is currently broken

For the available plugin options, view the corresponding plugin source code: `lib/plugins/<plugin_name>.js`

  *Note #1: Because a pattern value is a string not a RegExp object, all the backslashes before special regular expression characters must be escaped. For example: `\d+` -> `\\d+`, `\w` -> `\\w`*

  *Note #2: Notifications are common to a tracked file a not a pattern which means that if you define two patters for a single file, same notification methods will be used for both patterns.*

# Usage

log_watcher --config <path to the config file>

# Reloading configuration without restarting the program

Work in progress.

# History

26.12.2010 - Initial release
