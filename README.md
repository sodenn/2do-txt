<p align="center">
  <img width="150" src="./public/logo192.png" alt="2do.txt logo">
</p>

<h1 align="center">2do.txt</h1>

[![CI status][github-action-image]][github-action-url]

[github-action-image]: https://github.com/sodenn/2do-txt/actions/workflows/ci.yml/badge.svg
[github-action-url]: https://github.com/sodenn/2do-txt/actions/workflows/ci.yml

**2do.txt** is a [todo.txt](http://todotxt.org) compatible task manager. It should simplify the work with the [todo.txt format](https://github.com/todotxt/todo.txt) by providing additional convenience functions such as autocomplete for contexts and projects or filtering and sorting.

<p align="center">
  <img width="600" src="./public/screenshot.png" alt="Screenshot">
</p>

## About todo.txt

**todo.txt** is a plain text syntax for tasks. You can open *todo.txt* files in every text editor. It is searchable, portable and operating system agnostic. todo.txt allows you to organize tasks by **projects** (+SomeProject), **contexts** (@SomeContext), **tags** (key:value) and **priorities** (A-Z).

## Features

- Filter tasks by projects, contexts and tags
- Sort tasks by due date or priority
- Search for tasks
- Shortcuts for the most important functions
- Due date notifications
- Autocomplete for projects, contexts and tags
- Dark mode
- Responsive Design

## Supported Platforms
- [Webbrowser](https://sodenn.github.io/2do-txt/)
- Desktop (Electron): macOS, Windows, Linux

## Known Issues

**todo.txt** uses [Draft.js](https://github.com/facebook/draft-js) to provide autocomplete for projects, contexts and tags. The library does not support mobile browsers at this point. See the current status for [Android](https://github.com/facebook/draft-js/labels/android) and [iOS](https://github.com/facebook/draft-js/labels/ios).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn electron:start`

Builds and opens the electron app in the development mode.
