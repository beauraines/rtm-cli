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
          TASKS.push({
            index: index,
            task
          });

      }
  }
  // Print TASKS
  log.spinner.stop();
  for ( let i = 0; i < TASKS.length; i++ ) {
    displayTask(TASKS[i]);
  }
  
  
  finish()
  
  
}


module.exports = {
  command: 'task [indices...]',
  options: [],
  description: 'Display the Task details',
  action: action
};

function displayTask(taskDetails) {
  let index = taskDetails.index;
  // eslint-disable-next-line no-unused-vars
  const { _list, list_id, taskseries_id, task_id, _index, name, priority, start, due, completed, isRecurring, isSubtask, estimate, url, tags, notes ,...otherAttributes } = taskDetails.task;
  log.style(index + " " + name,styles.list,true);
  log.style(`List: `,styles.index)
  log(`${list_id}`) // TODO lookup the list name
  log.style(`Priority: `,styles.index)
  log.style(`${priority}`,styles.priority[priority],true)
  log.style(`Start: `,styles.index)
  log(`${start}`)
  log.style(`Due: `,styles.index)
  log(`${due}`)
  log.style(`Completed: `,styles.index)
  log(`${completed}`)
  log.style(`Is Recurring: `,styles.index)
  log(`${isRecurring}`)
  log.style(`Is Subtask: `,styles.index)
  log(`${isSubtask}`)
  log.style(`Estimate: `,styles.index)
  log(`${estimate}`)
  log.style(`Url: `,styles.index)
  log(`${url}`)
  log.style(`Tags: `,styles.index)
  log.style(`${tags}`,styles.tags, true)
  log.style(`Notes: `,styles.index)
  for (const note of notes) {
    log.style(note.title ? note.title : '',true);
    log('========');
    log(note.body);
    log();
  }

  // Displays all the other attributes. This will allow more attributes to be added to a RTMTask and they'll still be displayed.
  for (const [key, value] of Object.entries(otherAttributes)) {
    log.style(`${key}: `, styles.index, false);
    log(`${value}`);
  }
  log()
}
