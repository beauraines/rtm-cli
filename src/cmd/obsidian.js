'use strict';

const log = require('../utils/log.js');
const config = require('../utils/config.js');
const finish = require('../utils/finish.js');
const filter = require('../utils/filter');
const { indexPrompt } = require('../utils/prompt');
const debug = require('debug')('rtm-cli-obsidian');

let TASKS = [];

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
  const { name, priority, start, due, completed, tags = [], added, url, _list, list_id } = task;

  // TODO: lookup list_id to convert to actual list name when API provides list object
  const listName = _list && _list.name ? _list.name : list_id;
  const checkbox = completed ? 'x' : ' ';
  let line = `- [${checkbox}] ${name}`;
  // Append URL immediately after task name
  if (url) {
    line += ` [${url}](${url})`;
  }

  // TODO figure out approach for notes. Any meta data or links must come BEFORE the emoji tags

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
  }

const priorityMap = { '1': '🔺', '2': '🔼', '3': '🔽' };
  if (priority && priorityMap[priority]) {
    line += ` ${priorityMap[priority]}`;
  }

  // Add list tag first, then other tags
  const allTags = [`#${listName}`, ...tags.map(t => `#${t}`)];
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
