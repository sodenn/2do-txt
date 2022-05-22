<p align="center">
  <img width="150" src="./public/logo192.png" alt="2do.txt logo">
</p>

<h1 align="center">2do.txt</h1>

[![CI status][github-ci-action-image]][github-ci-action-url]
[![CodeQL status][github-codeql-analysis-action-image]][github-codeql-analysis-action-url]

[github-ci-action-image]: https://github.com/sodenn/2do-txt/actions/workflows/ci.yml/badge.svg
[github-ci-action-url]: https://github.com/sodenn/2do-txt/actions/workflows/ci.yml
[github-codeql-analysis-action-image]: https://github.com/sodenn/2do-txt/actions/workflows/codeql-analysis.yml/badge.svg
[github-codeql-analysis-action-url]: https://github.com/sodenn/2do-txt/actions/workflows/codeql-analysis.yml

**2do.txt** is a task management that uses the [todo.txt](https://github.com/todotxt/todo.txt) format. 2do.txt simplifies the work with todo.txt files by providing convenience functions such as sorting and filtering of tasks, autocomplete or notifications for due tasks.

<p align="center">
  <img width="600" src="./resources/screenshot1.png" alt="Screenshot">
  <img width="600" src="./resources/screenshot2.png" alt="Screenshot">
</p>

## About todo.txt

The **todo.txt** format is a simple set of rules that make todo.txt both human and machine-readable. The format supports priorities, creation and completion dates, projects and contexts. For more information please see http://todotxt.org/.

## Features

- Filter tasks by projects, contexts and tags
- Sort tasks by due date or priority
- Group tasks by context, projects or tags
- Hide completed tasks
- Search for tasks
- Shortcuts for the most important functions
- Due date notifications
- Supports working with multiple todo.txt files
- Autocompletion for projects, contexts and tags
- Archive completed tasks to done.txt
- Task recurrence (`rec:` tag)
- Dropbox sync (iOS)
- Dark mode
- Responsive Design
- Drag and drop support for todo.txt files

## Supported Platforms
- [Webbrowser](https://sodenn.github.io/2do-txt/)
- iOS
- Desktop (Electron): macOS, Windows, Linux

## Known Issues

**2do.txt** uses [Slate](https://github.com/ianstormtaylor/slate) to provide autocomplete for projects, contexts and tags. The library does not officially support the [Android browser](https://docs.slatejs.org/general/faq#what-browsers-and-devices-does-slate-support).
