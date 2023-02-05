# Contributing to `2do.txt`

Here is a quick guide to doing code contributions to this app.

1. Fork this repository.
2. Clone your fork locally.
3. Install dependencies:
   ```sh
   npm install
   ```
4. Create a new branch following the convention `[type/scope]`. Type can be either `fix`, `feat`, or any other conventional commit type. Scope is a short describes of the work.
5. Start the app:
   ```sh
   npm start
   ```
6. Make and commit your changes following the [commit convention](https://www.conventionalcommits.org/en/v1.0.0/).
7. Ensure tests and build passes:
   ```sh
   npm test
   npm run test:e2e
   npm run build
   ```
8. Push your branch.
9. Submit a pull request to the upstream [2do.txt repository](https://github.com/sodenn/2do-txt/pulls).<br>
> Maintainers will merge the pull request by squashing all commits and editing the commit message if necessary.

### Tauri (Desktop App)
If you want to start the Desktop App, run the following command:
```sh
npm run tauri:start
```

### iOS
If you want to start the iOS App, run the following commands (⚠️ Hot Reload is not supported):
```sh
npm run build # Always necessary after code changes have been made
npm run ios:start
```
