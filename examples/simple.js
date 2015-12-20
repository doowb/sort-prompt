/**
 * Sort prompt example
 */

"use strict";
var colors = require('ansi-colors');
var inquirer = require("inquirer2")();
inquirer.registerPrompt('sort', require('../'));

inquirer.prompt([
  {
    type: 'sort',
    name: 'colors',
    message: 'Put the colors in order of most preferred to least.',
    choices: [
      'black',
      'blue',
      'green',
      'red',
      'white',
      'yellow'
    ]
  }
], function(answers) {
  console.log("You're preferred order of colors is:");
  console.log(answers.colors.map(function(color) {
    return colors[color](color);
  }).join('\n'));
});
