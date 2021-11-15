# Introduction

Overlay for Age of Empires 4

- Does OCR
- Shows the result in the loading screen

# Todos
* Start button loading animation
* Test with full-hd
* Test with 8 players
* Nicer splashscreen
* app.on('ready', () => setTimeout(createWindow, 400)); can prob be reduced
* Once minimaps are available somewhere: Recognize and show map

## Main Dependencies
* Angular
* Electron
* fs for file handling
* tesseract.js for OCR

## Notes
* Built based on https://github.com/maximegris/angular-electron.git

*Install NodeJS dependencies with npm (used by Electron main process):*

``` bash
cd app/
npm install
```

Why two package.json ? This project follow [Electron Builder two package.json structure](https://www.electron.build/tutorials/two-package-structure) in order to optimize final bundle and be still able to use Angular `ng add` feature.

## To build for development

## Project structure

|Folder|Description|
| ---- | ---- |
| app | Electron main process folder (NodeJS) |
| src | Electron renderer process folder (Web / Angular) |

## How to import 3rd party libraries

This sample project runs in both modes (web and electron). To make this work, **you have to import your dependencies the right way**. \

There are two kind of 3rd party libraries :
- NodeJS's one (like an ORM, Database...)
    - Used in electron's Main process (app folder) have to be added in `dependencies` of `app/package.json`
    - Used in electron's Renderer process (src folder) have to be added in `dependencies` of both `app/package.json` and `package.json (root folder)`

Please check `providers/electron.service.ts` to watch how conditional import of libraries has to be done when using NodeJS / 3rd party libraries in renderer context (i.e. Angular).

- Web's one (like bootstrap, material, tailwind...)
    - It have to be added in `dependencies` of `package.json  (root folder)`

## Included Commands

|Command|Description|
| ---- | ---- |
|`npm run ng:serve`| Execute the app in the browser |
|`npm run build`| Build the app. Your built files are in the /dist folder. |
|`npm run build:prod`| Build the app with Angular aot. Your built files are in the /dist folder. |
|`npm run electron:local`| Builds your application and start electron
|`npm run electron:build`| Builds your application and creates an app consumable based on your operating system |
