'use strict';

const df = require('dateformat');
const log = require('../utils/log.js');
const config = require('../utils/config.js');
const finish = require('../utils/finish.js');
const filter = require('../utils/filter');
const { indexPrompt } = require('../utils/prompt');
const debug = require('debug')('rtm-cli-obsidian');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
  const { name, priority, start, due, completed, tags = [], added, url, list_id, notes = [], estimate, isRecurring, recurrenceRuleRaw } = task;

  const listName = LIST_MAP.get(list_id) || list_id;
  // Slugify list name for Obsidian tag
  const listTag = listName.replace(/\s+/g, '-');
  const checkbox = completed ? 'x' : ' ';
  let line = `- [${checkbox}] ${name}`;

  if (estimate) {
    const dur = formatDuration(estimate);
    line += ` ⌛${dur}`;
  }

  if (notes.length) {
    line += ` 📓`;
  }

  if (url) {
    line += ` 🔗`;
  }

  // Add Obsidian wiki link to the exported detail file
  if (url || notes.length) {
    line += ` [[${idx}]]`;
  }

  if (added) {
    let createdISO = df(added,"isoDate");
    line += ` ➕ ${createdISO}`;
  }
  if (start) {
    let startISO = df(start,"isoDate");
    line += ` 🛫 ${startISO}`;
  }
  if (due) {
    let dueISO = df(due,"isoDate");
    line += ` 📅 ${dueISO}`;
    
    // Recurrence indicator
    if (isRecurring) {
      if (recurrenceRuleRaw) {
        const rec = formatRecurrence(recurrenceRuleRaw);
        line += ` 🔁 ${rec}`;
      } else {
        line += ` 🔁`;
      }
    }
  }



  const priorityMap = { '1': '🔺', '2': '🔼', '3': '🔽' };
  if (priority && priorityMap[priority]) {
    line += ` ${priorityMap[priority]}`;
  }

  // Add list tag first, then other tags
  const allTags = [`#${listTag}`, ...tags.map(t => `#${t}`)];
  // ! There is a problem with tags that include `@` maybe look at location:tag or context:tag or list:tag
  const tagStr = allTags.map(t => ` ${t}`).join('');
  line += `${tagStr}`;

  line += ` 🆔 ${idx}`;

  if (url || notes.length) {
    exportDetails(idx, url, notes);
  }

  log(line);
}

// Helper: format ISO8601 durations (e.g. PT1H30M) to human label
function formatDuration(iso) {
  const match = iso.match(/^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/);
  if (!match) return iso;
  const [, H, M, S] = match;
  const parts = [];
  if (H) parts.push(`${H}h`);
  if (M) parts.push(`${M}m`);
  if (S) parts.push(`${S}s`);
  return parts.join('') || iso;
}

// Helper: format RFC5545 recurrence to Obsidian Tasks syntax
function formatRecurrence(raw) {
  let rule = raw;
  if (typeof raw === 'string') {
    try {
      rule = JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }
  if (rule.$t) {
    const parts = rule.$t.split(';');
    const map = {};
    parts.forEach(p => {
      const [k, v] = p.split('=');
      map[k] = v;
    });
    const FREQ = map.FREQ;
    const INTERVAL = parseInt(map.INTERVAL) || 1;
    const BYDAY = map.BYDAY;
    const BYMONTH = map.BYMONTH;
    const BYMONTHDAY = map.BYMONTHDAY;
    const getOrdinal = n => {
      const s = ['th','st','nd','rd'];
      const v = n % 100;
      return s[(v-20)%10] || s[v] || s[0];
    };
    const weekdayNames = { MO:'Monday', TU:'Tuesday', WE:'Wednesday', TH:'Thursday', FR:'Friday', SA:'Saturday', SU:'Sunday' };
    const monthNames = { '1':'January','2':'February','3':'March','4':'April','5':'May','6':'June','7':'July','8':'August','9':'September','10':'October','11':'November','12':'December' };
    switch (FREQ) {
      case 'DAILY':
        return INTERVAL === 1 ? 'every day' : `every ${INTERVAL} days`;
      case 'WEEKLY': {
        const days = BYDAY ? BYDAY.split(',').map(d => weekdayNames[d] || d).join(', ') : '';
        if (INTERVAL > 1) {
          return days ? `every ${INTERVAL} weeks on ${days}` : `every ${INTERVAL} weeks`;
        }
        return days ? `every ${days}` : 'every week';
      }
      case 'MONTHLY':
        if (BYMONTHDAY) {
          const day = parseInt(BYMONTHDAY);
          const ord = getOrdinal(day);
          return INTERVAL > 1 ? `every ${INTERVAL} months on the ${day}${ord}` : `every month on the ${day}${ord}`;
        }
        return INTERVAL > 1 ? `every ${INTERVAL} months` : 'every month';
      case 'YEARLY':
        if (BYMONTH && BYMONTHDAY) {
          const month = monthNames[BYMONTH] || BYMONTH;
          const day = parseInt(BYMONTHDAY);
          const ord = getOrdinal(day);
          return INTERVAL > 1 ? `every ${INTERVAL} years on ${month} ${day}${ord}` : `every year on ${month} ${day}${ord}`;
        }
        return INTERVAL > 1 ? `every ${INTERVAL} years` : 'every year';
    }
  }
  if (rule.every) {
    return `every ${rule.every}`;
  }
  return '';
}

// Helper: export URL and notes to a file in /tmp
function exportDetails(idx, url, notes) {
  const fileName = `${idx}.md`;
  const exportDir = (process.env.NODE_ENV === 'test' ? os.tmpdir() : (config.config.obsidianTaskDir || os.tmpdir()));
  const filePath = path.join(exportDir, 'rtm', fileName);
  let content = '';
  if (url) {
    content += `🔗 [${url}](${url})\n\n---\n\n`;
  }
  if (notes && notes.length) {
    notes.forEach((n, i) => {
      const title = n.title || '';
      const body = n.content || n.body || n.text || '';
      if (title) content += `${title}\n`;
      if (body) content += `${body}\n`;
      content += `\n---\n\n`;
    });
  }
  // Trim trailing newline for combined URL and notes case
  if (url && notes && notes.length) {
    content = content.replace(/\n$/, '');
  }
  try {
    fs.writeFileSync(filePath, content);
  } catch (e) {
    console.error(`Failed to write details file for task ${idx}: ${e}`);
  }
}

module.exports = {
  command: 'obsidian [indices...]',
  options: [],
  description: 'Output tasks in Obsidian Task syntax. Export URLs and notes to configured directory (defaults to system temp dir)\n\nusage: rtm -x true ls due:today | cut -wf1 | sort | xargs ./src/cli.js -x true obsidian >> ~/LocalDocs/Test/Tasks/rtm.md',
  action: action,
  exportDetails
};
