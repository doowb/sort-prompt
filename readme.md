# sort-prompt [![NPM version](https://img.shields.io/npm/v/sort-prompt.svg)](https://www.npmjs.com/package/sort-prompt)

> Create a prompt that allows sorting a list of values.

## Install
Install with [npm](https://www.npmjs.com/)

```sh
$ npm i sort-prompt --save
```

## Usage

Register prompt with [inquirer2][] and use like other prompts.

```js
var inquirer = require('inquirer2');
inquirer.register('sort', require('sort-prompt'));
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
```

The example will output these results:

![image](https://cloud.githubusercontent.com/assets/995160/11916001/dffefd1a-a68f-11e5-8ca6-e70ec8134d76.png)

## Related projects
[inquirer2](https://github.com/jonschlinkert/inquirer2): Faster, more performant fork of inquirer. | [homepage](https://github.com/jonschlinkert/inquirer2)

## Running tests
Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/doowb/sort-prompt/issues/new).

## Author
**Brian Woodward**

+ [github/doowb](https://github.com/doowb)
+ [twitter/doowb](http://twitter.com/doowb)

## License
Copyright © 2015 [Brian Woodward](https://github.com/doowb)
Released under the MIT license.

***

_This file was generated by [verb](https://github.com/verbose/verb) on December 19, 2015._

[inquirer2]: https://github.com/jonschlinkert/inquirer2

