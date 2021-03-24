import React, { useState, useEffect, ReactElement } from 'react';
import { ipcRenderer } from 'electron';
import IconParagraph from './IconParagraph';

type GoogleDriveCheckProps = {
  onDone: () => void;
};

const GoogleDriveCheck = ({ onDone }: GoogleDriveCheckProps): ReactElement => {
  const [state, setState] = useState('loading');
  useEffect(() => {
    ipcRenderer.send('google-drive-check');
    ipcRenderer.on(
      'google-drive-check-reply',
      (_event, { isDriveInstalled }) => {
        if (isDriveInstalled) {
          setState('done');
          onDone();
        } else {
          setState('error');
        }
      }
    );
  }, []);
  return (
    <div>
      {state === 'done' && (
        <IconParagraph icon="✅" iconName="check">
          Google Drive is installed
        </IconParagraph>
      )}

      {state === 'error' && (
        <div>
          <IconParagraph icon="❌" iconName="no">
            Google Drive is not installed. Please install it first.
          </IconParagraph>
          <a
            href="https://dl.google.com/drive-file-stream/GoogleDrive.dmg"
            target="_blank"
            rel="noreferrer"
          >
            <button type="button">Download Google Drive for MacOS</button>
          </a>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveCheck;
