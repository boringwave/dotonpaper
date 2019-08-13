'use strict';
/*jshint esversion: 6 */

const electron = require('electron')
const path     = require('path')
const url      = require('url')

const {app, BrowserWindow} = electron

let win

// (dev-only) reload electron automatically 
require('electron-reload')(__dirname)
// require('electron-reload')(__dirname, {
//   electron: require(`${__dirname}/node_modules/electron`)
// });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready',  () => {

  const windowConfig = 
  {
    width: 1100,
    height: 600,
    center: true,
    resizable: false,   
    icon:'images/icon.svg',
    backgroundColor: '#1f1f1f',
    frame: false,
    autoHideMenuBar: true,
    webPreferences: 
    {      
      nodeIntegration: true,
    },
  }

  // Create the browser window.
  win = new BrowserWindow(windowConfig);
  
  win.once('ready-to-show', () => {
    win.show()
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Emitted when the window is closed.
  win.on('closed', () => {
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
