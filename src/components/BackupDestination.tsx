import React, { useState, useEffect, ReactElement } from 'react';
import { ipcRenderer } from 'electron';
import IconParagraph from './IconParagraph';

type BackupDestinationProps = {
  onDone: () => void;
};

const BackupDestination = ({
  onDone,
}: BackupDestinationProps): ReactElement => {
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    ipcRenderer.send('set-backup-destination');
    ipcRenderer.on(
      'set-backup-destination-reply',
      (_event, { isDriveInstalled, error: err }) => {
        if (isDriveInstalled) {
          setState('done');
          onDone();
        } else {
          setState('error');
          setError(err);
        }
      }
    );
  }, []);

  return (
    <div>
      {state === 'loading' && (
        <IconParagraph icon="⏳" iconName="hourglass">
          Changing backup location
        </IconParagraph>
      )}
      {state === 'done' && (
        <IconParagraph icon="✅" iconName="check">
          Changed backup location
        </IconParagraph>
      )}

      {state === 'error' && (
        <div>
          <IconParagraph icon="🤯" iconName="brain explosion">
            Something went wrong!
          </IconParagraph>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default BackupDestination;
