export {};

type NetworkLoadingState = {
  state: 'loading';
};

type NetworkFailedState = {
  state: 'failed';
  code: number;
};

type NetworkSuccessState = {
  state: 'success';
  response: {
    title: string;
    duration: number;
    summary: string;
  };
};

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState;

const sendResponce = (networkState: NetworkState): String => {
  return networkState.state;
};

const reqSuc = sendResponce({
  state: 'success',
  response: { duration: 20, summary: 'Done', title: 'Connected to DB' },
});

const reqLoading = sendResponce({
  state: 'loading',
  // response: { duration: 20, summary: 'Done', title: 'Connected to DB' }, // WON'T WORK, AS FOR LOADING WE HAVE PROVIDED A DIFFERENT CONTRACT
});

console.log({ reqSuc, reqLoading });
