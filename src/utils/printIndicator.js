'use strict';

const config = require('./config.js');
const log = require('./log.js');

/**
 * 
 * @param {string} type note|url|recurring
 * @param {object} task the task to print the indicator
 * @param {string} style emoji|text
 */
function printIndicator(type,task) {
    let styles = config.get().styles;
    let iconType = config.get().iconType;

    let indicatorStyle = task.isCompleted ? styles.completed : styles[type];
    let notesIndicator,urlIndicator,recurringIndicator,subTaskIndicator,parentTaskIndicator;
    iconType = iconType || 'text'; // defaults to text if nothing included
    switch (iconType) {
        case 'emoji':
            notesIndicator = '📓';
            urlIndicator = '🔗';
            recurringIndicator = '🔁';
            subTaskIndicator = '⤴️ '
            parentTaskIndicator = '📋 '
        break;
        case 'text':  
        default:
            notesIndicator = '*';
            urlIndicator = '+';
            recurringIndicator = 'r';
            subTaskIndicator = '(s) '
            parentTaskIndicator = '(p) '
        break;
    }
    let indicators = {
        notes: notesIndicator,
        url: urlIndicator,
        recurring: recurringIndicator,
        subtask: subTaskIndicator,
        parentTask: parentTaskIndicator
    }
    log.style(indicators[type], indicatorStyle);
}

module.exports = printIndicator;