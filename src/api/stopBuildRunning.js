import {ApiStatuses} from '../Constants';

export default function stopBuildRunning(buildId, onSuccess, onError) {
  setTimeout(() => {
    // send stop request using buildId
    const response = {
      status: ApiStatuses.STOPPING,
    };
    /*
    const response = {
      status: ApiStatuses.FAILURE,
      error: {
        reason: 'Thread contention',
      },
    };
    */
    if (response.status === ApiStatuses.STOPPING) {
      onSuccess();
    } else if (response.status === ApiStatuses.FAILURE) {
      onError(response);
    }
  }, 500);
}
