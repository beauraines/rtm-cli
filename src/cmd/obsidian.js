'use strict';

const log = require('../utils/log.js');
const config = require('../utils/config.js');
const finish = require('../utils/finish.js');
const filter = require('../utils/filter');
const { indexPrompt } = require('../utils/prompt');
const debug = require('debug')('rtm-cli-obsidian');

let TASKS = [];
// Map of RTM list IDs to names
let LIST_MAP = new Map();

/**
 * This command outputs tasks in Obsidian Tasks markdown syntax
 * @param args indices
 * @param env
 */
async function action(args, env) {
  TASKS = [];
  const user = config.user(user => user);

  let indices;
  if (args.length < 1) {
    indices = indexPrompt('Task:');
  } else {
    // Support multiple indices array
    indices = Array.isArray(args[0]) ? args[0] : [args[0]];
  }

  // Fetch all RTM lists to map IDs to names
  try {
    log.spinner.start('Fetching Lists');
    const lists = await new Promise((res, rej) => user.lists.get((err, lists) => err ? rej(err) : res(lists)));
    LIST_MAP = new Map(lists.map(l => [l.id, l.name]));
  } catch (e) {
    log.spinner.warn(`Could not fetch lists: ${e.message || e}`);
  } finally {
    log.spinner.stop();
  }

  log.spinner.start('Getting Task(s)');
  for (const idx of indices) {
    const filterString = filter();
    let response = await user.tasks.rtmIndexFetchTask(idx, filterString);
    if (response.err) {
      log.spinner.warn(`Task #${idx} not found`);
      continue;
    }
    TASKS.push({ idx, task: response.task });
  }
  log.spinner.stop();

  for (const { idx, task } of TASKS) {
    displayObsidianTask(idx, task);
  }

  finish();
}

/**
 * Format and log a single task in Obsidian Tasks syntax
 */
function displayObsidianTask(idx, task) {
  debug(task);
  const { name, priority, start, due, completed, tags = [], added, url, list_id, notes = [], estimate, isRecurring, recurrence } = task;

  const listName = LIST_MAP.get(list_id) || list_id;
  // Slugify list name for Obsidian tag
  const listTag = listName.replace(/\s+/g, '-');
  const checkbox = completed ? 'x' : ' ';
  let line = `- [${checkbox}] ${name}`;
  // Append URL immediately after task name
  if (url) {
    line += ` [${url}](${url})`;
  }

  // TODO figure out approach for notes. Any meta data or links must come BEFORE the emoji tags
  if (notes.length) {
    line += ` 📓`;
  }

  if (added) {
    let createdISO = new Date(added).toISOString().split('T')[0];
    line += ` ➕ ${createdISO}`;
  }
  if (start) {
    let startISO = new Date(start).toISOString().split('T')[0];
    line += ` 🛫 ${startISO}`;
  }
  if (due) {
    let dueISO = new Date(due).toISOString().split('T')[0];
    line += ` 📅 ${dueISO}`;
    
    // TODO (depends on beauraines/rtm-api#66): add support for recurrence https://publish.obsidian.md/tasks/Getting+Started/Recurring+Tasks
    // Recurrence indicator
    // if (isRecurring) {
    //   // TODO (depends on beauraines/rtm-api#66): map RTM recurrence rule to Obsidian syntax (e.g. every 1 day)
    //   // ! rtm-api may need to be extended to include the recurrence interval
    //   if (recurrence) {
    //     line += ` 🔁 ${recurrence}`;
    //   } else {
    //     line += ` 🔁`;
    //   }
    // }
  }


// TODO Figure out approach for time estimates
  if (estimate) {
    line += ` ⌛`;
  }

  const priorityMap = { '1': '🔺', '2': '🔼', '3': '🔽' };
  if (priority && priorityMap[priority]) {
    line += ` ${priorityMap[priority]}`;
  }

  // Add list tag first, then other tags
  const allTags = [`#${listTag}`, ...tags.map(t => `#${t}`)];
  const tagStr = allTags.map(t => ` ${t}`).join('');
  line += `${tagStr}`;

  line += ` 🆔 ${idx}`;

  log(line);
}

module.exports = {
  command: 'obsidian [indices...]',
  options: [],
  description: 'Output tasks in Obsidian Tasks syntax',
  action: action
};
