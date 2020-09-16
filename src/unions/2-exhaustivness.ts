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

type NetworkFromCachedState = {
  state: 'from_cache';
  id: string;
  response: NetworkSuccessState['response'];
};

type NetworkState =
  | NetworkLoadingState
  | NetworkFailedState
  | NetworkSuccessState
  | NetworkFromCachedState;

function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x);
}

function logger(s: NetworkState): string {
  switch (s.state) {
    case 'loading':
      return 'loading request';
    case 'failed':
      return `failed with code ${s.code}`;
    case 'success':
      return 'got response';

    case 'from_cache':
      return 'obtaining from cache';
    default:
      return assertNever(s); // WON'T WORK IF COMMENT THE LAST CASE AS WE HAVEN'T COVERED ALL CASES IN SWITCH ('NetworkFromCachedState')
  }
}
