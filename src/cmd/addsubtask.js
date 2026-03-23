'use strict';

const log = require('../utils/log.js');
const config = require('../utils/config.js');
const { prompt } = require('../utils/prompt.js');

const finish = require('../utils/finish.js');


/**
 * This command adds a subtask to an existing task (Pro accounts only)
 * @param args [parentTaskIndex, subtaskName...]
 * @param env
 */
function action(args, env) {

  // Need at least a parent task index
  if ( args.length === 0 || args[0].length === 0 ) {
    prompt('Parent Task Index:', 'Subtask Name:', _promptFinished);
  }
  else if ( args[0].length === 1 ) {
    // Have parent index but no subtask name
    let parentIndex = parseInt(args[0][0]);
    if ( isNaN(parentIndex) ) {
      log.spinner.error("Parent task index must be a number");
      return finish();
    }
    prompt('Subtask Name:', function(answers) {
      for ( let i = 0; i < answers.length; i++ ) {
        _process(parentIndex, answers[i][0], i+1, answers.length);
      }
    });
  }
  else {
    // Have both parent index and subtask name
    let parentIndex = parseInt(args[0][0]);
    if ( isNaN(parentIndex) ) {
      log.spinner.error("Parent task index must be a number");
      return finish();
    }
    let subtaskName = args[0].slice(1).join(' ');
    _process(parentIndex, subtaskName);
  }

}


/**
 * Process the returned prompt answers
 * @private
 */
function _promptFinished(answers) {
  for ( let i = 0; i < answers.length; i++ ) {
    let parentIndex = parseInt(answers[i][0]);
    let subtaskName = answers[i][1];
    if ( isNaN(parentIndex) ) {
      log.spinner.error("Parent task index must be a number");
      continue;
    }
    _process(parentIndex, subtaskName, i+1, answers.length);
  }
}


/**
 * Process the request to add a subtask
 * @private
 */
function _process(parentIndex, subtaskName, count=1, max=1) {
  log.spinner.start("Adding Subtask...");
  config.user(function(user) {

    // Add Subtask
    user.tasks.addSubtask(parentIndex, subtaskName, function(err) {
      if ( err ) {
        if ( err.code === 4040 ) {
          log.spinner.error("Subtasks require a Pro account");
        }
        else if ( err.code === 4050 ) {
          log.spinner.error("Invalid parent task (index: " + parentIndex + ")");
        }
        else if ( err.code === 4060 ) {
          log.spinner.error("Subtask nested too deep (max 3 levels)");
        }
        else if ( err.code === 4070 ) {
          log.spinner.error("Cannot add subtask: repeating task in hierarchy");
        }
        else {
          log.spinner.error("Could not add subtask (" + err.msg + ")");
        }
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
  log.spinner.start("Adding Subtask [" + count + "/" + max + "]...");
  if ( count === max ) {
    log.spinner.success("Subtask(s) Added");
    return finish();
  }
}



module.exports = {
  command: 'addsubtask [args...]',
  alias: 'as',
  description: 'Add a subtask to an existing task (Pro accounts only)',
  action: action
};
