let accessToken = null;
let refreshInFlightPromise = null;
let refreshFailed = false;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;

  if (token) {
    refreshFailed = false;
  }
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const hasRefreshFailed = () => refreshFailed;

export const markRefreshFailed = () => {
  refreshFailed = true;
};

export const clearRefreshFailed = () => {
  refreshFailed = false;
};

export const getRefreshInFlight = () => refreshInFlightPromise;

export const setRefreshInFlight = (promise) => {
  refreshInFlightPromise = promise;
};
