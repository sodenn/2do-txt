# [1.14.0](https://github.com/sodenn/2do-txt/compare/v1.13.0...v1.14.0) (2022-05-27)


### Bug Fixes

* **MentionTextEditor:** zero-width chars handling ([#443](https://github.com/sodenn/2do-txt/issues/443)) ([a26bc03](https://github.com/sodenn/2do-txt/commit/a26bc03114ab75afabd8f95e7a08134da855f66f))
* **RecurrenceSelect:** trigger change event with the correct value ([#474](https://github.com/sodenn/2do-txt/issues/474)) ([a60c9d1](https://github.com/sodenn/2do-txt/commit/a60c9d1b44a7193f1f05c82b6c6480353126b97d))


### Features

* shortcut for clearing the task filter ([#480](https://github.com/sodenn/2do-txt/issues/480)) ([8fb7728](https://github.com/sodenn/2do-txt/commit/8fb77281888148279335cf11cf22703934721371))
* task recurrence ([#454](https://github.com/sodenn/2do-txt/issues/454)) ([ba66945](https://github.com/sodenn/2do-txt/commit/ba66945ece7f56f5c046f0d6e58cbf8301600507))

# [1.13.0](https://github.com/sodenn/2do-txt/compare/v1.12.0...v1.13.0) (2022-05-08)


### Bug Fixes

* **TaskForm:** remove spaces when due date is removed ([#412](https://github.com/sodenn/2do-txt/issues/412)) ([e5f21fa](https://github.com/sodenn/2do-txt/commit/e5f21fae3132f13ea4d9b286d8e3c92b209d4700))


### Features

* **Task:** remove or archive priority when task is completed ([#426](https://github.com/sodenn/2do-txt/issues/426)) ([fc2a00d](https://github.com/sodenn/2do-txt/commit/fc2a00dfb7b505cdec00b14eafc0a320e09aee5d))

# [1.12.0](https://github.com/sodenn/2do-txt/compare/v1.11.0...v1.12.0) (2022-05-01)


### Features

* **Onboarding:** create a sample todo.txt file ([#410](https://github.com/sodenn/2do-txt/issues/410)) ([2b05a94](https://github.com/sodenn/2do-txt/commit/2b05a94773b44580ea1dc99ed566a697c89da1ab))

# [1.11.0](https://github.com/sodenn/2do-txt/compare/v1.10.0...v1.11.0) (2022-04-30)


### Bug Fixes

* **FilePicker:** correct drag-n-drop validation ([#326](https://github.com/sodenn/2do-txt/issues/326)) ([b951f00](https://github.com/sodenn/2do-txt/commit/b951f00148aef2061ded3644bd2e326c7bcff0f7))
* only show notification when tasks have been archived ([#383](https://github.com/sodenn/2do-txt/issues/383)) ([ef9d79c](https://github.com/sodenn/2do-txt/commit/ef9d79ccd3fba93ba63358917c9b987b80427df2))
* prevent the access token from being refreshed twice ([#386](https://github.com/sodenn/2do-txt/issues/386)) ([9b5cdf7](https://github.com/sodenn/2do-txt/commit/9b5cdf7df3a547a8af7465e7f82065c3d704c99a))
* **TaskList:** hide completed tasks if set via settings ([#382](https://github.com/sodenn/2do-txt/issues/382)) ([0b98a8c](https://github.com/sodenn/2do-txt/commit/0b98a8c6a128281f4a7670062ff2e669574f1a57))


### Features

* archive completed tasks to done.txt ([#362](https://github.com/sodenn/2do-txt/issues/362)) ([f93e300](https://github.com/sodenn/2do-txt/commit/f93e3008fafe5d1eed69fb372df038a604cc1582))
* **Filter:** add option to set filter type ([b446269](https://github.com/sodenn/2do-txt/commit/b446269368c1e38a94ddb5b8640cad269f12e879))
* **Filter:** limit filter types to AND and OR ([#345](https://github.com/sodenn/2do-txt/issues/345)) ([8596493](https://github.com/sodenn/2do-txt/commit/8596493779ac7d7eaa6a2992733bb770e767ff66))
* **MentionTextField:** automatically add a space after a mention ([#378](https://github.com/sodenn/2do-txt/issues/378)) ([81edf00](https://github.com/sodenn/2do-txt/commit/81edf001510f9ae41b40e433888cf3a43a3292b6))
* **TaskForm:** open the task form in a full-screen dialog (iOS) ([#381](https://github.com/sodenn/2do-txt/issues/381)) ([8c4ad81](https://github.com/sodenn/2do-txt/commit/8c4ad81759cd998381fc15bd8f5a4dfc9f789c6f))

# [1.10.0](https://github.com/sodenn/2do-txt/compare/v1.9.0...v1.10.0) (2022-04-05)


### Bug Fixes

* **TaskForm:** do not focus the task description field after selecting a due date ([#324](https://github.com/sodenn/2do-txt/issues/324)) ([13d2ba1](https://github.com/sodenn/2do-txt/commit/13d2ba10212dc51ac92fbd1de414ce589193f304))
* **TaskForm:** prevent multiple spaces from being inserted into the task text when mention chooser is opened (mobile) ([#320](https://github.com/sodenn/2do-txt/issues/320)) ([02e2d63](https://github.com/sodenn/2do-txt/commit/02e2d636271b448b1973e6268e442db55e20894b))
* **TaskForm:** trim task text when adding mention trigger ([#323](https://github.com/sodenn/2do-txt/issues/323)) ([66f9e2d](https://github.com/sodenn/2do-txt/commit/66f9e2d5909d1e2c9152ba8eae0ad79e50dabfbb))


### Features

* **TaskDialog:** disable tab focus on cancel button to avoid accidental cancellation ([#319](https://github.com/sodenn/2do-txt/issues/319)) ([05558fe](https://github.com/sodenn/2do-txt/commit/05558fedc0ea975d4fe096d780c9f7f8ea0dc9b1))

# [1.9.0](https://github.com/sodenn/2do-txt/compare/v1.8.0...v1.9.0) (2022-04-02)


### Bug Fixes

* **PrioritySelect:** deactivate auto-selection if no priority was entered with the keyboard ([#312](https://github.com/sodenn/2do-txt/issues/312)) ([db918c8](https://github.com/sodenn/2do-txt/commit/db918c8d120415b0a7284ae7edf84a025c3bcd0b))
* **TaskEditor:** render mentions after copy & paste task text ([#309](https://github.com/sodenn/2do-txt/issues/309)) ([2e05282](https://github.com/sodenn/2do-txt/commit/2e0528217f24a3ff287879238eaec38cef7bb6b0))


### Features

* **CloudStorage:** extend "Session expired" toast with an action to login again ([#294](https://github.com/sodenn/2do-txt/issues/294)) ([653b4d0](https://github.com/sodenn/2do-txt/commit/653b4d06e6a89fcef1732bbb0031863526d3267e))
* **PrioritySelect:** better keyboard support for task priority selection ([#308](https://github.com/sodenn/2do-txt/issues/308)) ([103819e](https://github.com/sodenn/2do-txt/commit/103819e77bd2f0ee7e1b1233a58639f6f493a051))
* **TaskList:** multiple filter conditions are ANDed together ([#301](https://github.com/sodenn/2do-txt/issues/301)) ([6a71f0f](https://github.com/sodenn/2do-txt/commit/6a71f0f571d303bdfa899c0344bd52acaf295a20))

# [1.8.0](https://github.com/sodenn/2do-txt/compare/v1.7.0...v1.8.0) (2022-03-25)


### Bug Fixes

* reduce rating prompts ([#281](https://github.com/sodenn/2do-txt/issues/281)) ([bd9609b](https://github.com/sodenn/2do-txt/commit/bd9609b10182d6e8a69facc153aa1a52990a566a))
* **TaskEditor:** dropdown remains open ([#259](https://github.com/sodenn/2do-txt/issues/259)) ([cb661b9](https://github.com/sodenn/2do-txt/commit/cb661b983805a42c825b02f38e8527f3df7d2716))


### Features

* drag and drop support for todo.txt files ([#265](https://github.com/sodenn/2do-txt/issues/265)) ([a813970](https://github.com/sodenn/2do-txt/commit/a813970de99d4912d1e776ee25ecd10ef1a85a23))
* **TaskEditor:** improve suggestions of contexts, projects and tags ([#255](https://github.com/sodenn/2do-txt/issues/255)) ([f3d1646](https://github.com/sodenn/2do-txt/commit/f3d164660dbbeedf189ac36d1507b76eb080d030))

# [1.7.0](https://github.com/sodenn/2do-txt/compare/v1.6.0...v1.7.0) (2022-03-13)


### Features

* dropbox file sync ([#234](https://github.com/sodenn/2do-txt/issues/234)) ([48917ba](https://github.com/sodenn/2do-txt/commit/48917ba2a5e5bf1d01e31e56e8f32e78cf759b8f))
* improved file management ([#223](https://github.com/sodenn/2do-txt/issues/223)) ([0258665](https://github.com/sodenn/2do-txt/commit/02586655dd19bdf5158ad844fbb4d7bfcf77d7b9))

# [1.6.0](https://github.com/sodenn/2do-txt/compare/v1.5.0...v1.6.0) (2022-02-10)


### Features

* work with multiple todo.txt files ([#218](https://github.com/sodenn/2do-txt/issues/218)) ([4814280](https://github.com/sodenn/2do-txt/commit/4814280e15e144d31a68be1b15b353aaeaacd41a))

# [1.5.0](https://github.com/sodenn/2do-txt/compare/v1.4.0...v1.5.0) (2022-01-03)


### Bug Fixes

* **Filter:** only show filters for incomplete tasks when completed tasks are hidden ([#197](https://github.com/sodenn/2do-txt/issues/197)) ([5f75c6a](https://github.com/sodenn/2do-txt/commit/5f75c6a6ac7c77e324f5fcce38d25285b3a51610))


### Features

* **i18n:** improve German translation ([#199](https://github.com/sodenn/2do-txt/issues/199)) ([7b9eb7c](https://github.com/sodenn/2do-txt/commit/7b9eb7c259ea186c4ae4a0860dc979c54c039376))

# [1.4.0](https://github.com/sodenn/2do-txt/compare/v1.3.0...v1.4.0) (2021-12-13)


### Features

* add iOS platform ([#176](https://github.com/sodenn/2do-txt/issues/176)) ([fcc6584](https://github.com/sodenn/2do-txt/commit/fcc6584cd79b453bb349eb7fa329746f1b460086))
* code signing for macOS app ([#186](https://github.com/sodenn/2do-txt/issues/186)) ([f88710b](https://github.com/sodenn/2do-txt/commit/f88710b3ec83d83509fd474b028ba1e4a4730914))
* show confirmation dialog before deleting a task ([#187](https://github.com/sodenn/2do-txt/issues/187)) ([9117312](https://github.com/sodenn/2do-txt/commit/911731273994430b180cb5903b8dfdf8b26c8918))

# [1.3.0](https://github.com/sodenn/2do-txt/compare/v1.2.0...v1.3.0) (2021-12-03)


### Bug Fixes

* **react-router:** add basename for GitHub Pages ([#161](https://github.com/sodenn/2do-txt/issues/161)) ([3c705a1](https://github.com/sodenn/2do-txt/commit/3c705a1bd37ab32c66e411e82916862956121f52))
* update the raw property when editing a task ([#165](https://github.com/sodenn/2do-txt/issues/165)) ([22df1aa](https://github.com/sodenn/2do-txt/commit/22df1aac88195e2c9c75ce885df87f961f4ae63f))


### Features

* add privacy policy page ([#167](https://github.com/sodenn/2do-txt/issues/167)) ([772d671](https://github.com/sodenn/2do-txt/commit/772d67123a85234528c33a75c132d8ce243e7924))
* improve readability of notifications ([#164](https://github.com/sodenn/2do-txt/issues/164)) ([bd42cd7](https://github.com/sodenn/2do-txt/commit/bd42cd75bd88cc42f1471a41895330884b5d5e17))

# [1.2.0](https://github.com/sodenn/2do-txt/compare/v1.1.1...v1.2.0) (2021-11-25)


### Bug Fixes

* allow to reset task priority, creation date and due date ([#157](https://github.com/sodenn/2do-txt/issues/157)) ([94c9f96](https://github.com/sodenn/2do-txt/commit/94c9f96bfc7028dc00471156dd59e164a2bd13a7))


### Features

* new default values in the settings ([#160](https://github.com/sodenn/2do-txt/issues/160)) ([c624c2e](https://github.com/sodenn/2do-txt/commit/c624c2ea73d52c8b3be8aafa5cde7b303a2ba31f))

## [1.1.1](https://github.com/sodenn/2do-txt/compare/v1.1.0...v1.1.1) (2021-11-22)


### Bug Fixes

* **Button:** disable ripple effect to follow the same defaultProps as the ButtonGroup ([#144](https://github.com/sodenn/2do-txt/issues/144)) ([e920f54](https://github.com/sodenn/2do-txt/commit/e920f54e1d7810ca38682b7d8ff1caffc1b7c0c4))


# [1.1.0](https://github.com/sodenn/2do-txt/compare/v1.0.0...v1.1.0) (2021-11-21)


### Bug Fixes

* **Button:** disable ripple effect to follow the same defaultProps as the ButtonGroup ([#144](https://github.com/sodenn/2do-txt/issues/144)) ([e920f54](https://github.com/sodenn/2do-txt/commit/e920f54e1d7810ca38682b7d8ff1caffc1b7c0c4))
* **TaskListItem:** do not open the task dialog when checkbox was clicked ([#125](https://github.com/sodenn/2do-txt/issues/125)) ([bad374c](https://github.com/sodenn/2do-txt/commit/bad374cc38cef75a8ab5d50b454a12fe8e0df4c3))
* **TaskListItemMenu:** Do not open task dialog after clicking Delete in the menu ([#133](https://github.com/sodenn/2do-txt/issues/133)) ([7bce853](https://github.com/sodenn/2do-txt/commit/7bce8534e471ea10acf4e5d60116f929b97a7524))


### Features

* add more sorting options for the task list ([#115](https://github.com/sodenn/2do-txt/issues/115)) ([e587b56](https://github.com/sodenn/2do-txt/commit/e587b56f0ab6ba57153bd03e91a340c2bbe41cfa))
* **Kbd:** improve condition when shortcuts should be hidden ([#107](https://github.com/sodenn/2do-txt/issues/107)) ([712b284](https://github.com/sodenn/2do-txt/commit/712b28409c0d4dc4358e68547963eb18f8ed81d0))
* **TaskEditor:** better keyboard support for autocomplete operations ([#138](https://github.com/sodenn/2do-txt/issues/138)) ([f7cc6f3](https://github.com/sodenn/2do-txt/commit/f7cc6f3bf3c3412bbcf8e26d3fa49f6b1073cdfe))
* **TaskForm:** improve condition when input assistance should be displayed ([#108](https://github.com/sodenn/2do-txt/issues/108)) ([b40d70a](https://github.com/sodenn/2do-txt/commit/b40d70a7fee19e94ff5fa230a61fbec365bb3bbc))
