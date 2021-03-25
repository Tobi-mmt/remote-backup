import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';
import GoogleDriveCheck from './components/GoogleDriveCheck';
import VolumeSetup from './components/VolumeSetup';
import BackupDestination from './components/BackupDestination';
import IconParagraph from './components/IconParagraph';

const Hello = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const startNextStep = () => {
    setCurrentStep((prevState) => prevState + 1);
  };

  return (
    <div className="wrapper">
      <h1 className="title">Setup a backup in Google Drive</h1>
      <div className="steps">
        <GoogleDriveCheck onDone={startNextStep} />
        {currentStep >= 1 && <VolumeSetup onDone={startNextStep} />}
        {currentStep >= 2 && <BackupDestination onDone={startNextStep} />}
        {/* TODO add script to mount volume on each systemstart */}
        {currentStep >= 3 && (
          <IconParagraph icon="✅" iconName="check">
            Done
          </IconParagraph>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
