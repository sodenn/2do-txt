## [1.17.4](https://github.com/sodenn/2do-txt/compare/v1.17.3...v1.17.4) (2023-02-13)


### Bug Fixes

* **Tauri:** incorrect mention combobox position ([#755](https://github.com/sodenn/2do-txt/issues/755)) ([142d83b](https://github.com/sodenn/2do-txt/commit/142d83b8547db9a5873850f9e95650dc2bf35dcf))

## [1.17.3](https://github.com/sodenn/2do-txt/compare/v1.17.2...v1.17.3) (2023-02-10)


### Bug Fixes

* keyboard shortcuts don't work ([#751](https://github.com/sodenn/2do-txt/issues/751)) ([bb8f74b](https://github.com/sodenn/2do-txt/commit/bb8f74b7714fb78b077202b4553ac214b65525a0))

## [1.17.2](https://github.com/sodenn/2do-txt/compare/v1.17.1...v1.17.2) (2023-02-06)


### Bug Fixes

* **Release:** checkout release commit in tauri build job ([#748](https://github.com/sodenn/2do-txt/issues/748)) ([0c1751f](https://github.com/sodenn/2do-txt/commit/0c1751f2aa150d5d46fbc48c2523015d305990c9))

## [1.17.1](https://github.com/sodenn/2do-txt/compare/v1.17.0...v1.17.1) (2023-02-06)


### Bug Fixes

* **Release:** use the latest version number when building the tauri app ([#747](https://github.com/sodenn/2do-txt/issues/747)) ([100f788](https://github.com/sodenn/2do-txt/commit/100f788295bccf115023c92000647ee4eb1e7299))

# [1.17.0](https://github.com/sodenn/2do-txt/compare/v1.16.1...v1.17.0) (2023-02-06)


### Bug Fixes

* **Clipboard:** allow todo.txt content to be copied to the clipboard in Safari ([#719](https://github.com/sodenn/2do-txt/issues/719)) ([1b486a5](https://github.com/sodenn/2do-txt/commit/1b486a50965c702bf1fe395dca23946b7c51739a))
* **deps:** update dependencies (non-major) ([#697](https://github.com/sodenn/2do-txt/issues/697)) ([60ddf69](https://github.com/sodenn/2do-txt/commit/60ddf6995cdc04a18fb05118946923ada0581fb3))
* **Desktop:** update task list after adding a new todo.txt file ([#744](https://github.com/sodenn/2do-txt/issues/744)) ([a2213f3](https://github.com/sodenn/2do-txt/commit/a2213f3592fe842bb7a6832088b0345d1ef64afe))


### Features

* improved synchronization with cloud storages ([#732](https://github.com/sodenn/2do-txt/issues/732)) ([3d60e02](https://github.com/sodenn/2do-txt/commit/3d60e027c150bbdfcd05a6a58f4bb1296bca2e53))
* **Timeline:** scroll to today's date ([#716](https://github.com/sodenn/2do-txt/issues/716)) ([609a205](https://github.com/sodenn/2do-txt/commit/609a205ccc6911bd411fe54f509e0db94f26cc2c))


### Performance Improvements

* prevent unnecessary re-renders when interacting with dropzone ([#718](https://github.com/sodenn/2do-txt/issues/718)) ([f0f9470](https://github.com/sodenn/2do-txt/commit/f0f9470962acd8b880019c38f484286636203646))

## [1.16.1](https://github.com/sodenn/2do-txt/compare/v1.16.0...v1.16.1) (2022-12-07)


### Bug Fixes

* **CloudStorage:** save done.txt in the same cloud directory as the todo.txt ([#709](https://github.com/sodenn/2do-txt/issues/709)) ([1553dc2](https://github.com/sodenn/2do-txt/commit/1553dc2059923a7669519b8f778e95398fe7f0ab))
* **SplashScreen:** fix app stuck on the splash screen ([#705](https://github.com/sodenn/2do-txt/issues/705)) ([37803ab](https://github.com/sodenn/2do-txt/commit/37803abf7d5b5a3a0d75cd02c5276538ed0677f4))
* **SplashScreen:** hide splash screen after applying the theme mode ([#708](https://github.com/sodenn/2do-txt/issues/708)) ([ba6147b](https://github.com/sodenn/2do-txt/commit/ba6147badaefc6803eb159910678eb60a895df02))
* **SplashScreen:** run electron specific method only under the electron platform ([#712](https://github.com/sodenn/2do-txt/issues/712)) ([904d7aa](https://github.com/sodenn/2do-txt/commit/904d7aa3b9515d3e4950e1ddcc9ac8f39f4e97f3))

# [1.16.0](https://github.com/sodenn/2do-txt/compare/v1.15.0...v1.16.0) (2022-12-04)


### Bug Fixes

* **deps:** update dependencies (non-major) ([#677](https://github.com/sodenn/2do-txt/issues/677)) ([69ba4b1](https://github.com/sodenn/2do-txt/commit/69ba4b1e79417c4bc973b337ac46405173304ec0))
* **deps:** update dependencies (non-major) ([#689](https://github.com/sodenn/2do-txt/issues/689)) ([8d5720f](https://github.com/sodenn/2do-txt/commit/8d5720fc817658ee357a38bed01132870ae3399a))
* **deps:** update dependency i18next to v22 ([#691](https://github.com/sodenn/2do-txt/issues/691)) ([79c7931](https://github.com/sodenn/2do-txt/commit/79c79316235cef9bac9b75dea6485a63791abae9))
* **deps:** update dependency i18next-browser-languagedetector to v7 ([#695](https://github.com/sodenn/2do-txt/issues/695)) ([eda75a5](https://github.com/sodenn/2do-txt/commit/eda75a50162f47e9e8e7520c70aac6ef0ec1e913))
* **deps:** update dependency i18next-http-backend to v2 ([#696](https://github.com/sodenn/2do-txt/issues/696)) ([379cacf](https://github.com/sodenn/2do-txt/commit/379cacf1f79601c188f8106b8745fef6acd91f8f))
* **deps:** update dependency react-i18next to v12 ([#692](https://github.com/sodenn/2do-txt/issues/692)) ([71adefb](https://github.com/sodenn/2do-txt/commit/71adefb000a91cf146e62da89ebc69d14c63e349))


### Features

* dropbox support for the desktop app ([#693](https://github.com/sodenn/2do-txt/issues/693)) ([7811953](https://github.com/sodenn/2do-txt/commit/7811953f67066050b5474a02280ef6cc01c36ea8))
* webdav file sync ([#699](https://github.com/sodenn/2do-txt/issues/699)) ([7be3de0](https://github.com/sodenn/2do-txt/commit/7be3de0edbeef2a0aca83446981c233b23cd7728))

# [1.16.0](https://github.com/sodenn/2do-txt/compare/v1.15.0...v1.16.0) (2022-12-04)


### Bug Fixes

* **deps:** update dependencies (non-major) ([#677](https://github.com/sodenn/2do-txt/issues/677)) ([69ba4b1](https://github.com/sodenn/2do-txt/commit/69ba4b1e79417c4bc973b337ac46405173304ec0))
* **deps:** update dependencies (non-major) ([#689](https://github.com/sodenn/2do-txt/issues/689)) ([8d5720f](https://github.com/sodenn/2do-txt/commit/8d5720fc817658ee357a38bed01132870ae3399a))
* **deps:** update dependency i18next to v22 ([#691](https://github.com/sodenn/2do-txt/issues/691)) ([79c7931](https://github.com/sodenn/2do-txt/commit/79c79316235cef9bac9b75dea6485a63791abae9))
* **deps:** update dependency i18next-browser-languagedetector to v7 ([#695](https://github.com/sodenn/2do-txt/issues/695)) ([eda75a5](https://github.com/sodenn/2do-txt/commit/eda75a50162f47e9e8e7520c70aac6ef0ec1e913))
* **deps:** update dependency i18next-http-backend to v2 ([#696](https://github.com/sodenn/2do-txt/issues/696)) ([379cacf](https://github.com/sodenn/2do-txt/commit/379cacf1f79601c188f8106b8745fef6acd91f8f))
* **deps:** update dependency react-i18next to v12 ([#692](https://github.com/sodenn/2do-txt/issues/692)) ([71adefb](https://github.com/sodenn/2do-txt/commit/71adefb000a91cf146e62da89ebc69d14c63e349))


### Features

* dropbox support for the desktop app ([#693](https://github.com/sodenn/2do-txt/issues/693)) ([7811953](https://github.com/sodenn/2do-txt/commit/7811953f67066050b5474a02280ef6cc01c36ea8))

# [1.15.0](https://github.com/sodenn/2do-txt/compare/v1.14.1...v1.15.0) (2022-10-12)


### Bug Fixes

* **deps:** update dependencies (non-major) ([#666](https://github.com/sodenn/2do-txt/issues/666)) ([52172ca](https://github.com/sodenn/2do-txt/commit/52172ca3a46a1adfa7a30ec4bca29e8d5eda8199))
* **TaskForm:** make sure that the due date can always be updated ([#683](https://github.com/sodenn/2do-txt/issues/683)) ([9f294df](https://github.com/sodenn/2do-txt/commit/9f294dfecdfd3cadb902613a850359acd5b086d5))


### Features

* timeline view ([#670](https://github.com/sodenn/2do-txt/issues/670)) ([84ca081](https://github.com/sodenn/2do-txt/commit/84ca081102083892d7236ead952765ac293af1cb))

## [1.14.1](https://github.com/sodenn/2do-txt/compare/v1.14.0...v1.14.1) (2022-09-29)


### Bug Fixes

* **deps:** pin dependencies ([#569](https://github.com/sodenn/2do-txt/issues/569)) ([3022ae9](https://github.com/sodenn/2do-txt/commit/3022ae9870ea1824f8f55ea13ab5e05c4720ec7a))
* **deps:** pin dependency @mui/x-date-pickers to 5.0.0-beta.2 ([#586](https://github.com/sodenn/2do-txt/issues/586)) ([fafa829](https://github.com/sodenn/2do-txt/commit/fafa829d5742712eb2f9367e952eb90c51a8fe64))
* **deps:** update dependencies (non-major) ([#664](https://github.com/sodenn/2do-txt/issues/664)) ([935b7c8](https://github.com/sodenn/2do-txt/commit/935b7c8c949d2dc51703d9f4c3fd6397fdfd2312))
* **deps:** update dependency @capacitor/filesystem to v4.1.0 ([#645](https://github.com/sodenn/2do-txt/issues/645)) ([b3dd5ef](https://github.com/sodenn/2do-txt/commit/b3dd5efebfbbfd1061beb80e43a9747037e321a0))
* **deps:** update dependency @date-io/date-fns to v2.15.0 ([#614](https://github.com/sodenn/2do-txt/issues/614)) ([4eede29](https://github.com/sodenn/2do-txt/commit/4eede295c956cdbf31d0c98a0c1f10a6be04dc10))
* **deps:** update dependency @mui/material to v5.10.1 ([#626](https://github.com/sodenn/2do-txt/issues/626)) ([1e65e50](https://github.com/sodenn/2do-txt/commit/1e65e50f5a923d7e49c593d227a7e302301dbbf5))
* **deps:** update dependency @mui/x-date-pickers to v5.0.0-beta.4 ([#608](https://github.com/sodenn/2do-txt/issues/608)) ([184f545](https://github.com/sodenn/2do-txt/commit/184f545a03a01fdb938acd048e0d41f4ccb9ad0b))
* **deps:** update dependency capacitor-rate-app to v3 ([#620](https://github.com/sodenn/2do-txt/issues/620)) ([d19fcd1](https://github.com/sodenn/2do-txt/commit/d19fcd11235d0315d8f524b7ee1126e3ee892222))
* **deps:** update dependency date-fns to v2.29.1 ([#579](https://github.com/sodenn/2do-txt/issues/579)) ([59f9906](https://github.com/sodenn/2do-txt/commit/59f99067ff51ab255a97522eedc900f3d7238418))
* **deps:** update dependency date-fns to v2.29.2 ([#630](https://github.com/sodenn/2do-txt/issues/630)) ([ac9d521](https://github.com/sodenn/2do-txt/commit/ac9d521b3c136f6ccb211614366864e1cef86bbe))
* **deps:** update dependency i18next to v21.8.16 ([#596](https://github.com/sodenn/2do-txt/issues/596)) ([76f6fde](https://github.com/sodenn/2do-txt/commit/76f6fde12af5ed41d6e5864e3c351747151524c7))
* **deps:** update dependency i18next to v21.9.0 ([#611](https://github.com/sodenn/2do-txt/issues/611)) ([3a55f2d](https://github.com/sodenn/2do-txt/commit/3a55f2d6c92338f1e998d60ba15133aa090e3e0b))
* **deps:** update dependency i18next to v21.9.1 ([#628](https://github.com/sodenn/2do-txt/issues/628)) ([fef86f2](https://github.com/sodenn/2do-txt/commit/fef86f2fe1ba0f000ff70d3f24245e7879f470ca))
* **deps:** update dependency i18next-browser-languagedetector to v6.1.5 ([#616](https://github.com/sodenn/2do-txt/issues/616)) ([6eae659](https://github.com/sodenn/2do-txt/commit/6eae659d50967f540e2df6524dd3b8dbfc8e90a6))
* **deps:** update dependency jszip to v3.10.1 ([#605](https://github.com/sodenn/2do-txt/issues/605)) ([06ec304](https://github.com/sodenn/2do-txt/commit/06ec304dd53dbb14b7751162066b23583ce81cd3))
* **deps:** update dependency react-i18next to v11.18.3 ([#590](https://github.com/sodenn/2do-txt/issues/590)) ([ac6bf3d](https://github.com/sodenn/2do-txt/commit/ac6bf3da00310e09f1b55b4f9ec8ddf123456b7b))
* **deps:** update dependency react-i18next to v11.18.4 ([#622](https://github.com/sodenn/2do-txt/issues/622)) ([666315e](https://github.com/sodenn/2do-txt/commit/666315e844bef4a7f079332231f3945e580f4e07))
* **deps:** update dependency react-i18next to v11.18.5 ([#642](https://github.com/sodenn/2do-txt/issues/642)) ([34b6152](https://github.com/sodenn/2do-txt/commit/34b61520c2e33c574e63d8b2c610fa00cae1ea60))
* **deps:** update dependency slate to v0.82.0 ([#593](https://github.com/sodenn/2do-txt/issues/593)) ([d5a1ad7](https://github.com/sodenn/2do-txt/commit/d5a1ad7abe2b136a23d3bbaccb795d58ec6d9f15))
* **deps:** update dependency slate-react to v0.82.0 ([#594](https://github.com/sodenn/2do-txt/issues/594)) ([b43f8cd](https://github.com/sodenn/2do-txt/commit/b43f8cdee7a8c1a13f1dc9cefeb39328f45d6582))
* **deps:** update emotion monorepo to v11.10.0 ([#598](https://github.com/sodenn/2do-txt/issues/598)) ([6e9a0a8](https://github.com/sodenn/2do-txt/commit/6e9a0a8997044f0e100b2c11ab01fa5244b707ff))
* **deps:** update emotion monorepo to v11.10.4 ([#652](https://github.com/sodenn/2do-txt/issues/652)) ([56e27a9](https://github.com/sodenn/2do-txt/commit/56e27a9980091a5fa89dc8aad41b6df5b0a94272))
* **deps:** update material-ui monorepo ([#577](https://github.com/sodenn/2do-txt/issues/577)) ([2a220ad](https://github.com/sodenn/2do-txt/commit/2a220ad1c095e169594a4fce6c45bc739a427afe))
* **deps:** update material-ui monorepo ([#588](https://github.com/sodenn/2do-txt/issues/588)) ([a9617bb](https://github.com/sodenn/2do-txt/commit/a9617bbedb6b48384380bb92a35a7d579266ba23))
* **deps:** update material-ui monorepo ([#603](https://github.com/sodenn/2do-txt/issues/603)) ([9e6a488](https://github.com/sodenn/2do-txt/commit/9e6a488e2bf1a3437cce3aa2b605174601da6ae2))
* **deps:** update material-ui monorepo ([#612](https://github.com/sodenn/2do-txt/issues/612)) ([733df80](https://github.com/sodenn/2do-txt/commit/733df80235d923680c9093963503fa629b6323fe))
* **deps:** update material-ui monorepo ([#619](https://github.com/sodenn/2do-txt/issues/619)) ([2dcec16](https://github.com/sodenn/2do-txt/commit/2dcec168d95b29237b17e729f6eb35863c972acc))
* **deps:** update material-ui monorepo ([#633](https://github.com/sodenn/2do-txt/issues/633)) ([ab79e4b](https://github.com/sodenn/2do-txt/commit/ab79e4bbba17e78bb7be9164eca1633f428b40e2))
* **deps:** update material-ui monorepo ([#650](https://github.com/sodenn/2do-txt/issues/650)) ([a5be08b](https://github.com/sodenn/2do-txt/commit/a5be08ba5ba10ee0c7401d7849a1bb104de1b2d7))
* **FilePicker:** make files in the 2do.txt folder selectable via the file picker ([#676](https://github.com/sodenn/2do-txt/issues/676)) ([f8bc7d4](https://github.com/sodenn/2do-txt/commit/f8bc7d44d5e6e6618613c55242195819c2740290))

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
