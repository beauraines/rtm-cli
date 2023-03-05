'use strict';

const log = require('../utils/log.js');
const config = require('../utils/config.js');
const finish = require('../utils/finish.js');
const filter = require('../utils/filter');
const { indexPrompt } = require('../utils/prompt')
const opn = require('opn');


let URLS = [];
let OPEN = false;

// Get Display Styles
let styles = config.get().styles;

/**
 * This command displays all task details
 * @param args index
 * @param env
 */
async function action(args, env) {

  // TODO clean up URLS
  // Reset URLs
  URLS = [];

  // Set Open flag // TODO this isn't needed
  OPEN = env.open === undefined ? false : env.open;

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
          // TODO this filter isn't needed
          const filterString = filter('hasUrl:true');
          let task =  await user.tasks.rtmIndexFetchTask(index,filterString)
          if (task.err == undefined ) {
              task = task.task
          } else {
            log.spinner.warn('Task #' + index + ' is not found');
          }

          // FIXME clean up URL names
          // Push to URLS
          if ( task && task.url !== undefined ) {
            URLS.push({
            index: index,
            task
            });
          }         
      }
  }
  // Print URLs
  log.spinner.stop();
  for ( let i = 0; i < URLS.length; i++ ) {
    // TODO clean up the output
    log(URLS[i].index + " " + URLS[i].task.name);
    // eslint-disable-next-line no-unused-vars
    const { _list, list_id, taskseries_id, task_id, _index, ...task} = URLS[i].task
    for (const [key, value] of Object.entries(task)) {
      log.style(`${key}:`,styles.index,false)
      log(`${value}`);
    }
  }

  // Open URL // TODO clean up URLS
  // if ( OPEN ) {
  //   for ( let i = 0; i < URLS.length; i++ ) {
  //     opn(URLS[i].url, {wait: false})//.then(function() {});
  //   }
  // }
  

  finish()
  

}


module.exports = {
    command: 'task [indices...]',
    options: [
      // TODO should there be options?
      {
        option: "-o, --open",
        description: "Open the URLs in a browser"
      }
    ],
    description: 'Display the Task details',
    action: action
  };