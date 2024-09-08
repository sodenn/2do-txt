<p align="center">
  <img width="150" src="public/logo.png" alt="2do.txt logo">
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
  <img width="600" style="border-radius: 6px;" src="./resources/screenshot1.png" alt="Screenshot">
  <img width="600" style="border-radius: 6px;" src="./resources/screenshot2.png" alt="Screenshot">
  <img width="600" style="border-radius: 6px;" src="./resources/screenshot3.png" alt="Screenshot">
</p>

## Progressive Web App (PWA)

While **2do.txt** is fully functional in any modern web browser, the user experience is significantly enhanced when installed as a Progressive Web App (PWA). This installation offers a more native-like experience, including offline capabilities and faster access.

## Browser Compatibility

It is important to note that not all browsers fully support the File System API. For example, Safari writes files to the Origin Private File System, which is isolated from the user’s local filesystem. As a result, files saved within this system may not be accessible in the same way as they would be on a traditional filesystem. For the best experience, it is recommended to use a browser that fully supports the File System API, such as Chrome.

## About todo.txt

The **todo.txt** format is a simple set of rules that make todo.txt both human and machine-readable. The format supports priorities, creation and completion dates, projects and contexts. For more information please see http://todotxt.org/.

## Features

- Filter tasks by projects, contexts, tags, priority and lists
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
- Dark mode
- Two different views: list and timeline
- Markdown support
