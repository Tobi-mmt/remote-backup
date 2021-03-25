/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import sudo from 'sudo-prompt';
import MenuBuilder from './menu';

const backupFilePath =
  '/Volumes/GoogleDrive/Meine Ablage/RemoteBackup.sparseimage';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    height: 700,
    minHeight: 550,
    maxHeight: 550,
    width: 550,
    minWidth: 550,
    maxWidth: 550,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on('google-drive-check', (event) => {
  const isDriveInstalled = fs.existsSync('/Applications/Google Drive.app');
  event.reply('google-drive-check-reply', { isDriveInstalled });
});

ipcMain.on('check-virtual-volume', (event) => {
  const doesVolumeExist = fs.existsSync(backupFilePath);
  return event.reply('check-virtual-volume-reply', { doesVolumeExist });
});

ipcMain.on('create-virtual-volume', (event, { password }) => {
  if (fs.existsSync(backupFilePath)) {
    event.reply('create-virtual-volume-reply', {
      isVolumeCreated: false,
      error: `File ${backupFilePath} already exists`,
    });
  } else {
    try {
      execSync(
        `hdiutil create '${backupFilePath}' -size 300m -fs APFS -volname RemoteBackup -type SPARSE -encryption AES-128 -stdinpass -attach -quiet`,
        { input: password }
      );
      event.reply('create-virtual-volume-reply', { isVolumeCreated: true });
    } catch (error) {
      event.reply('create-virtual-volume-reply', {
        isVolumeCreated: false,
        error: error.toString(),
      });
    }
  }
});

ipcMain.on('set-backup-destination', (event) => {
  const options = {
    name: 'Remote Backup',
    // icns: '/Applications/Electron.app/Contents/Resources/Electron.icns', // (optional)
  };
  // TODO: remove the "full disk privilage is needed" error while executing with sudo here
  sudo.exec('tmutil setdestination /Volumes/RemoteBackup', options, (error) => {
    console.log('tmutil done');
    if (error) {
      console.log('tmutil error', error);
      event.reply('set-backup-destination-reply', {
        success: false,
        error: error.toString(),
      });
    } else {
      event.reply('set-backup-destination-reply', { success: true });
    }
  });
});
