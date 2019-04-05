'use strict';
/*jshint esversion: 6 */
const electron = require('electron')
const {app, BrowserWindow} = electron
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
const userDataPath = (electron.app || electron.remote.app).getPath('userData');


// reload electron automatically
require('electron-reload')(__dirname)
// require('electron-reload')(__dirname, {
//   electron: require('electron')
// });


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready',  () => {

  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;

  const windowConfig = {
    width: 1100,
    height: 600,
    resizable: false,   
    // minWidth: 1150,
    // minHeight: 800,
    icon:'images/logo.png',
    transparent: false,
    backgroundColor: '#2e2c29', 
    // frame: false
  }

  // Create the browser window.
  win = new BrowserWindow(windowConfig);
  // win.setMenu(null);
  win.once('ready-to-show', () => {
    win.show()
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.setAutoHideMenuBar(true);
  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})
