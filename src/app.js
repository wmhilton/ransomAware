'use strict'
if(require('electron-squirrel-startup')) return
const updater = require('./updater')
updater.check()
const os = require('os')
const path = require('path')
const electron = require('electron')
const startup = require('user-startup')
const ransomAware = require('./ransomAware')
const settings = require('./settings')

let tray = null
let settingsWindow = null

function showSettings () {
  if (settingsWindow) {
    settingsWindow.show()
  } else {
    settingsWindow = new electron.BrowserWindow({show: false, backgroundColor: 'rgb(0,245,245)'})
    settingsWindow.setMenuBarVisibility(false)
    // settingsWindow.toggleDevTools()
    settingsWindow.on('closed', () => settingsWindow = null)
    settingsWindow.once('ready-to-show', settingsWindow.show)
    settingsWindow.loadURL(`file://${__dirname}/settings.html`)
  }
}

settings.watch('startOnLogin', () => {
  if (settings.get('startOnLogin')) {
    startup.add('ransomAware', process.execPath, [__filename], path.join(os.tmpdir(), 'ransomAware.log'))
  } else {
    startup.remove('ransomAware')
  }
})

settings.watch('watchDir', () => {
  // restart file watcher
  ransomAware.stop()
  ransomAware.start()
})

electron.app.on('ready', () => {
  tray = new electron.Tray(`${__dirname}/folder-saved-search-32px.png`)
  tray.setToolTip('Ransom Aware')
  tray.on('double-click', showSettings)
  ransomAware.start()
  let running = ransomAware.running()
  let menu = electron.Menu.buildFromTemplate([
    {
      label: 'Start Scanner',
      type: 'radio',
      checked: running,
      click: ransomAware.start
    },
    {
      label: 'Pause Scanner',
      type: 'radio',
      checked: !running,
      click: ransomAware.stop
    },
    {
      label: 'Notifications',
      type: 'checkbox',
      checked: settings.get('notifications'),
      click: (menuItem, browserWindow, event) => settings.set('notifications', menuItem.checked)
    },
    {
      label: 'Settings',
      click: showSettings
    },
    {
      label: 'Check for Updates',
      click: updater.check
    },
    {
      role: 'quit'
    }
  ])
  tray.setContextMenu(menu)
})

// Don't exit program win settings window closed
electron.app.on('window-all-closed', () => {})
