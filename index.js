/*!
 * sort-prompt <https://github.com/doowb/sort-prompt>
 *
 * This prompt is based on the default `list` prompt with changes for moving the items around in the list.
 *
 * Copyright (c) 2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * `sort` type prompt
 */

var util = require('util');
var Separator = require('inquirer2/lib/objects/separator');
var Paginator = require('inquirer2/lib/utils/paginator');
var observe = require('inquirer2/lib/utils/events');
var Base = require('inquirer2/lib/prompts/base');
var utils = require('inquirer2/lib/utils/');

/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Constructor
 */

function Prompt() {
  Base.apply(this, arguments);

  if (!this.opt.choices) {
    this.throwParamError('choices');
  }

  this.firstRender = true;
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

util.inherits(Prompt, Base);

Prompt.prototype.decorateChoices = function() {
  this.opt.choices.swap = function(a, b) {
    this.choices.splice(b, 0, this.choices.splice(a, 1)[0]);
    this.realChoices = this.choices.filter(Separator.exclude);
    return this.choices;
  };

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

  if (this.firstRender) {
    message += utils.chalk.dim('(Use arrow keys to move. Hold down Shift to move item.)');
  }

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
    message += '\n' + this.paginator.paginate(choicesStr, this.selected, this.opt.pageSize);
  }

  this.firstRender = false;

  this.screen.render(message);
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
 * When user press a key
 */
Prompt.prototype.onUpKey = function (e) {
  if (e.key.shift === true) {
    this.moveUp();
  }
  var len = this.opt.choices.length;
  this.selected = (this.selected > 0) ? this.selected - 1 : len - 1;
  this.render();
};

Prompt.prototype.moveUp = function() {
  var idx = this.selected;
  var len = this.opt.choices.length;
  if (idx > 0) {
    this.opt.choices.swap(idx - 1, idx);
  } else {
    this.opt.choices.swap(idx, len - 1);
  }
};


Prompt.prototype.onDownKey = function (e) {
  if (e.key.shift === true) {
    this.moveDown();
  }
  var len = this.opt.choices.length;
  this.selected = (this.selected < len - 1) ? this.selected + 1 : 0;
  this.render();
};

Prompt.prototype.moveDown = function() {
  var idx = this.selected;
  var len = this.opt.choices.length;
  if (idx < len - 1) {
    this.opt.choices.swap(idx + 1, idx);
  } else {
    this.opt.choices.swap(idx, 0);
  }
};

Prompt.prototype.onNumberKey = function (input) {
  if (input <= this.opt.choices.realLength) {
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
