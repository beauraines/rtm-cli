'use strict';

const log = require('../utils/log.js');
const config = require('../utils/config.js');
const { prompt } = require('../utils/prompt.js');

const finish = require('../utils/finish.js');


/**
 * This command displays a task url
 * @param args index
 * @param env
 */
function action(args, env) {

  // Prompt for task
  if ( args.length < 1 ) {
    prompt('Task:', 'Title:', 'Body:', _promptFinished);
  } else if (args.length = 2 ) {
    _process(args[0],'',args[1])
  }

  // Use provided args
  else {
    _process(args[0], args[1], args[2]);
  }

}


/**
 * Process the returned answers
 * @private
 */
function _promptFinished(answers) {
  for ( let i = 0; i < answers.length; i++ ) {
    let answer = answers[i];
    _process(answer[0], answer[1], answer[2],i+1, answers.length);
  }
}


/**
 * Process the request
 * @private
 */
function _process(index, title, body, count=1, max=1) {

  // Display info
  log.spinner.start("Updating Task(s)...");

  // Get User
  config.user(function(user) {

    // Parse arguments
    index = parseInt(index.trim());

    // Add Notes
    user.tasks.addNotes(index, title, body, function(err) {
      if ( err ) {
        log.spinner.error("Could not add notes for Task #" + index + " (" + err.msg + ")");
      }
      _processFinished(count, max);
    });

  });

}

/**
 * Request Callback
 * @private
 */
function _processFinished(count, max) {
  log.spinner.start("Updating Task [" + count + "/" + max + "]...");

  // All tasks returned...
  if ( count === max ) {
    log.spinner.stop();
    return finish();
  }


}


module.exports = {
  command: 'addNote [index] [title] [body]',
  alias:'addNotes',
  description: 'Add note or prompt for the title and body of the note. If only an index and text are included the text will be the body of the note without a title',
  action: action
};