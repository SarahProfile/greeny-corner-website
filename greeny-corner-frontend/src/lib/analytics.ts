import ReactGA from 'react-ga4';

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export const initGA = () => {
  if (MEASUREMENT_ID) {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

export const logPageView = (path: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
    });
  }
};

export const logUserAction = (action: string, details?: any) => {
  logEvent('User Action', action, JSON.stringify(details));
};
