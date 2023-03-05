'use strict';

const log = require('../utils/log.js');
const config = require('../utils/config.js');
const finish = require('../utils/finish.js');
const filter = require('../utils/filter');
const { indexPrompt } = require('../utils/prompt')


let TASKS = [];

// Get Display Styles
let styles = config.get().styles;

/**
 * This command displays all task details
 * @param args index
 * @param env
 */
async function action(args, env) {

  // Reset TASKS
  TASKS = [];

  const user = config.user(user => user)

  let indices = []

  // Prompt for task
  if ( args.length < 1 ) {
    indices = indexPrompt('Task:')
    args[0] = indices
  }


  log.spinner.start("Getting Task(s)");
  // Use provided args
  for (const arg in args[0]) {
      if (Object.hasOwnProperty.call(args[0], arg)) {
          const index = args[0][arg];
          const filterString = filter();
          let task =  await user.tasks.rtmIndexFetchTask(index,filterString)
          if (task.err == undefined ) {
              task = task.task
          } else {
            log.spinner.warn('Task #' + index + ' is not found');
          }

          // Push to TASKS
          if ( task && task.url !== undefined ) {
            TASKS.push({
            index: index,
            task
            });
          }         
      }
  }
  // Print TASKS
  log.spinner.stop();
  for ( let i = 0; i < TASKS.length; i++ ) {
    // TODO clean up the output - move this to function
    let index = TASKS[i].index
    // eslint-disable-next-line no-unused-vars
    const { _list, list_id, taskseries_id, task_id, _index, name, ...task} = TASKS[i].task
    log(index + " " + name);
    for (const [key, value] of Object.entries(task)) {
      log.style(`${key}:`,styles.index,false)
      log(`${value}`);
    }
    //! end of function
  }


  finish()
  

}


module.exports = {
    command: 'task [indices...]',
    options: [],
    description: 'Display the Task details',
    action: action
  };