import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
  MenuItem,
} from 'electron';
import { ElectronStorageItem } from './ui/src/electron/constants';
// eslint-disable-next-line import/no-cycle
import {
  createWindow,
  getDisplayAppInTrayValue,
  setValueToStore,
  updateDisplayAppInTray,
} from './main.dev';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export const STEP_ZOOM_FACTOR = 0.2;

export default class MenuBuilder {
  public mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    const template = process.platform === 'darwin'
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  getZoomFactor(isZoomIn: boolean = false): number {
    const correctZoomFactor = isZoomIn ? STEP_ZOOM_FACTOR : -STEP_ZOOM_FACTOR;
    const zoomFactor = (this.mainWindow?.webContents.getZoomFactor() * 100 + correctZoomFactor * 100) / 100;
    return zoomFactor;
  }

  setZoomFactor(zoomFactor: number): void {
    setValueToStore(ElectronStorageItem.zoomFactor, zoomFactor);
    this.mainWindow.webContents.setZoomFactor(zoomFactor);
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuApp: DarwinMenuItemConstructorOptions = {
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        {
          label: `Hide ${app.name}`,
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuView: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            const zoomFactor = 1;
            this.setZoomFactor(zoomFactor);
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const zoomFactor = this.getZoomFactor(true);
            this.setZoomFactor(zoomFactor);
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const zoomFactor = this.getZoomFactor();
            this.setZoomFactor(zoomFactor);
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'Command+N',
          click: () => {
            createWindow();
          },
        },
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        {
          label: 'Close',
          accelerator: 'Command+W',
          click: () => {
            this.mainWindow.close();
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Show in Menu Bar',
          type: 'checkbox',
          checked: getDisplayAppInTrayValue(),
          click: (menuItem: MenuItem) => {
            updateDisplayAppInTray(menuItem.checked);
          },
        },
        // { type: 'separator' },
        // { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'License Terms',
          click() {
            shell.openExternal('https://github.com/RedisInsight/RedisInsight/blob/main/LICENSE');
          },
        },
        {
          label: 'Submit a Bug or Idea',
          click() {
            shell.openExternal('https://github.com/RedisInsight/RedisInsight/issues');
          },
        },
        {
          label: 'Learn More',
          click() {
            shell.openExternal('https://docs.redis.com/latest/ri/');
          },
        },
      ],
    };

    return [subMenuApp, subMenuEdit, subMenuWindow, subMenuView, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&Window',
        submenu: [
          {
            label: 'New Window',
            accelerator: 'Ctrl+N',
            click: () => {
              createWindow();
            },
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            },
          },
          // type separator cannot be invisible
          {
            label: '',
            type: process.platform !== 'linux' ? 'separator' : 'normal',
            visible: false,
          },
          {
            label: 'Display On System Tray',
            type: 'checkbox',
            visible: process.platform !== 'linux',
            checked: getDisplayAppInTrayValue(),
            click: (menuItem: MenuItem) => {
              updateDisplayAppInTray(menuItem.checked);
            },
          },
        ],
      },
      {
        label: '&View',
        submenu: [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: () => {
              this.mainWindow.webContents.reload();
            },
          },
          { type: 'separator' },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: () => {
              this.mainWindow.setFullScreen(
                !this.mainWindow.isFullScreen(),
              );
            },
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Ctrl+Shift+I',
            click: () => {
              this.mainWindow.webContents.toggleDevTools();
            },
          },
          { type: 'separator' },
          {
            label: 'Reset &Zoom',
            accelerator: 'Ctrl+0',
            click: () => {
              const zoomFactor = 1;
              this.setZoomFactor(zoomFactor);
            },
          },
          {
            label: 'Zoom &In',
            accelerator: 'Ctrl+=',
            click: () => {
              const zoomFactor = this.getZoomFactor(true);
              this.setZoomFactor(zoomFactor);
            },
          },
          {
            label: 'Zoom &Out',
            accelerator: 'Ctrl+-',
            click: () => {
              const zoomFactor = this.getZoomFactor();
              this.setZoomFactor(zoomFactor);
            },
          },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'License Terms',
            click() {
              shell.openExternal('https://github.com/RedisInsight/RedisInsight/blob/main/LICENSE');
            },
          },
          {
            label: 'Submit a Bug or Idea',
            click() {
              shell.openExternal('https://github.com/RedisInsight/RedisInsight/issues');
            },
          },
          {
            label: 'Learn More',
            click() {
              shell.openExternal('https://docs.redis.com/latest/ri/');
            },
          },
          { type: 'separator' },
          {
            label: `About ${app.name}`,
            click: () => {
              app.showAboutPanel();
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
