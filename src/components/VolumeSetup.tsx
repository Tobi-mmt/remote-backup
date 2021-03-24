import React, { useState, useEffect, ReactElement } from 'react';
import { ipcRenderer } from 'electron';
import IconParagraph from './IconParagraph';

type VolumeSetupProps = {
  onDone: () => void;
};

const VolumeSetup = ({ onDone }: VolumeSetupProps): ReactElement => {
  const [state, setState] = useState('check-existing-volume');
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  const createVolume = () => {
    ipcRenderer.send('create-virtual-volume', { password });
    ipcRenderer.on(
      'create-virtual-volume-reply',
      (_event, { isVolumeCreated, error: err }) => {
        if (isVolumeCreated) {
          setState('done');
          onDone();
        } else {
          setState('error');
          setError(err);
        }
      }
    );
  };
  useEffect(() => {
    ipcRenderer.send('check-virtual-volume');
    ipcRenderer.on(
      'check-virtual-volume-reply',
      (_event, { doesVolumeExist }) => {
        if (doesVolumeExist) {
          setState('exist');
          onDone();
        } else {
          setState('waiting-for-user-input');
        }
      }
    );
  }, []);

  const handleContinue = () => {
    setInputError('');
    if (password.length < 5) {
      setInputError('Min lenght of the password is 5 characters.');
    } else if (password === passwordRepeat) {
      setState('loading');
      createVolume();
    } else {
      setInputError('Repeated password is not the same');
    }
  };

  return (
    <div>
      {state === 'check-existing-volume' && (
        <IconParagraph icon="⏳" iconName="hourglass">
          Checking backup volume
        </IconParagraph>
      )}
      {state === 'waiting-for-user-input' && (
        <div>
          <h3>Set a password for your encrypted backup volume</h3>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(element) => setPassword(element.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password-repeat">Repeat password</label>
            <input
              type="password"
              name="password-repeat"
              value={passwordRepeat}
              onChange={(element) => setPasswordRepeat(element.target.value)}
            />
          </div>
          <p>Do not forget this password!</p>
          {inputError && <p>{inputError}</p>}
          <button type="button" onClick={handleContinue}>
            Create backup volume
          </button>
        </div>
      )}
      {state === 'loading' && (
        <IconParagraph icon="⏳" iconName="hourglass">
          Creating backup volume
        </IconParagraph>
      )}
      {state === 'done' && (
        <IconParagraph icon="✅" iconName="check">
          Backup volume created
        </IconParagraph>
      )}
      {state === 'exist' && (
        <IconParagraph icon="✅" iconName="check">
          Backup volume already exists
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

export default VolumeSetup;
