# phylo-js: how to contribute

## Introduction

This package, phylo-js, is a partial port of [ETE3 toolkit](https://github.com/etetoolkit/ete) to enable parsing, viewing and manipulation of phylogenetic trees in a browser window.  Not all functions of ETE3 are implemented yet, so a help with the missing functionality is appreciated. Of course if you have a great idea not yet implemented in ETE3, you are welcome to add it to phylo-js too!

This HowTo is intended for Python programmers who might not be familiar with Typescript. We explain you how to install Typescript, how to write your own module and how to submit it to phylo-js.

## Installation

### Installation of npm

We use [`npm`](https://docs.npmjs.com/about-npm) for this project. There are different ways to install it. Some are documented in [the official guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). Mac OS X users might prefer `brew install npm`. Linux users might use the version in their repository with `sudo apt install npm` or `sudo yum install nodejs` or a similar command. 

### Installation of phylo-js and dependencies

We suggest the standard fork-edit-pull request model. Fork the repository from [https://github.com/chanzuckerberg/phylo-js](https://github.com/chanzuckerberg/phylo-js). Clone the forked repository on your computer. Then change to the project directory and run

    npm install
	
This will automatically install Typescript and other dependencies.

## Adding modules

Add modules to the `src` directory. 

We use [Typescript](https://www.typescriptlang.org/) for this package. The community has [many handy documents and tutorials](https://www.typescriptlang.org/docs/) to learn Typescript. 

We recommend [Google Typescript style guide](https://google.github.io/styleguide/tsguide.html) for this package. 

We use [Jest testing framework](https://jestjs.io/) for this package. Do not forget to add `foo.test.js` to the `test` directory for the module `foo`. Look at the other files in this directory for the hints on the testing environment.  Then run 

    npm test
	
to check everything is correct.

Please add documentation for the added functionality.

Then create a pull request.  We will be happy to work with you on it!

Happy tree work!
