/*!
 * sort-prompt <https://github.com/doowb/sort-prompt>
 *
 * This prompt is based on the default `list` prompt with changes for moving the items around in the list.
 *
 * Copyright (c) 2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var util = require('util');
var Separator = require('inquirer2/lib/objects/separator');
var Paginator = require('inquirer2/lib/utils/paginator');
var observe = require('inquirer2/lib/utils/events');
var Base = require('inquirer2/lib/prompts/base');
var utils = require('inquirer2/lib/utils/');

/**
 * Sort prompt constructor. Register with [inquirer2][] to use.
 *
 * ```js
 * var inquirer = require('inquirer2');
 * inquirer.registerPrompt('sort', require('sort-prompt'));
 * inquirer.prompt([
 *   {
 *     type: 'sort',
 *     name: 'menu',
 *     message: 'Sort the menu items in the order you prefer.',
 *     choices: [
 *       'Home',
 *       new inquirer.Seperator(),
 *       'About',
 *       'FAQ'
 *     ]
 *   }
 * ], function(answers) {
 *   console.log(JSON.stringify(answers, null, 2));
 * });
 *
 * //=> {
 * //=>   "menu": [
 * //=>     "Home",
 * //=>     "------------",
 * //=>     "About",
 * //=>     "FAQ"
 * //=>   ]
 * //=> }
 * ```
 */

function Prompt() {
  Base.apply(this, arguments);

  if (!this.opt.choices) {
    this.throwParamError('choices');
  }

  this.selected = 0;

  var def = this.opt.default;

  // Default being a Number
  if (utils.isNumber(def) && def >= 0 && def < this.opt.choices.realLength) {
    this.selected = def;
  }

  // Default being a String
  if (typeof def === 'string') {
    this.selected = this.opt.choices.pluck('value').indexOf(def);
  }

  // Make sure no default is set (so it won't be printed)
  this.opt.default = null;
  this.paginator = new Paginator();
  this.decorateChoices();
}

/**
 * Extend `Base`
 */

util.inherits(Prompt, Base);

/**
 * Add convience methods to `this.opt.choices`
 */

Prompt.prototype.decorateChoices = function() {

  /**
   * Swap 2 items in the `choices` array and ensure the `realChoices` array is updated.
   */

  this.opt.choices.swap = function(a, b) {
    this.choices.splice(b, 0, this.choices.splice(a, 1)[0]);
    this.realChoices = this.choices.filter(Separator.exclude);
    return this.choices;
  };

  /**
   * Map over the `choices` array.
   */

  this.opt.choices.map = function(fn) {
    return this.choices.map(fn);
  };
};

/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function (cb) {
  this.done = cb;

  var events = observe(this.rl);
  events.normalizedUpKey.takeUntil(events.line).forEach(this.onUpKey.bind(this));
  events.normalizedDownKey.takeUntil(events.line).forEach(this.onDownKey.bind(this));
  events.numberKey.takeUntil(events.line).forEach(this.onNumberKey.bind(this));
  events.line.take(1).forEach(this.onSubmit.bind(this));

  // Init the prompt
  utils.cliCursor.hide();
  this.render();

  return this;
};

/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function () {
  // Render question
  var message = this.getQuestion();

  // Render choices or answer depending on the state
  if (this.status === 'answered') {
    message += utils.chalk.cyan(this.opt.choices.map(function(choice) {
      if (choice.type === 'separator') {
        return '<Separator>';
      }
      return choice.short
    }).join(', '));
  } else {
    var choicesStr = listRender(this.opt.choices, this.selected);
    message += '\n' + utils.chalk.bold('  (Use arrow keys to move. Hold down Shift to move item.)');
    message += '\n' + this.paginator.paginate(choicesStr, this.selected, this.opt.pageSize);
  }

  this.screen.render(message);
  return this;
};

/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function () {
  this.status = 'answered';
  var choices = this.opt.choices.map(function(choice) {
    if (choice.type === 'separator') {
      return choice;
    }
    return choice.value;
  });

  // Rerender prompt
  this.render();

  this.screen.done();
  utils.cliCursor.show();
  this.done(choices);
};

/**
 * When user presses Up key
 */

Prompt.prototype.onUpKey = function (e) {
  // if `shift` key is pressed, move the up
  if (e.key.shift === true) {
    this.moveUp();
  }
  var len = this.opt.choices.length;
  this.selected = (this.selected > 0) ? this.selected - 1 : len - 1;
  this.render();
};

/**
 * Move the currently selected item up.
 */

Prompt.prototype.moveUp = function() {
  var idx = this.selected;
  var len = this.opt.choices.length;
  if (idx > 0) {
    this.opt.choices.swap(idx - 1, idx);
  } else {
    this.opt.choices.swap(idx, len - 1);
  }
};


/**
 * When user presses Down key
 */

Prompt.prototype.onDownKey = function (e) {
  // if `shift` key is pressed, move the down
  if (e.key.shift === true) {
    this.moveDown();
  }
  var len = this.opt.choices.length;
  this.selected = (this.selected < len - 1) ? this.selected + 1 : 0;
  this.render();
};

/**
 * Move the currently selected item down.
 */

Prompt.prototype.moveDown = function() {
  var idx = this.selected;
  var len = this.opt.choices.length;
  if (idx < len - 1) {
    this.opt.choices.swap(idx + 1, idx);
  } else {
    this.opt.choices.swap(idx, 0);
  }
};

/**
 * Jump to an item in the list
 */

Prompt.prototype.onNumberKey = function (input) {
  if (input <= this.opt.choices.length) {
    this.selected = input - 1;
  }
  this.render();
};

/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function listRender(choices, pointer) {
  var output = '';

  choices.forEach(function (choice, i) {
    var isSelected = (i === pointer);
    var line = (isSelected ? utils.figures.pointer + ' ' : '  ') + (choice.type === 'separator' ? choice : choice.name);
    if (isSelected) {
      line = utils.chalk.cyan(line);
    }
    output += line + ' \n';
  });

  return output.replace(/\n$/, '');
}

/**
 * Expose `Prompt`
 */

module.exports = Prompt;
