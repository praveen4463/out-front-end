import React, {useContext} from 'react';
import TestSelect from '../../../components/TestSelect';
import {
  IdeDispatchContext,
  IdeBuildRunSelectedVersionsContext,
  IdeFilesContext,
} from '../../Contexts';
import {CONFIG_BUILD_UPDATE_SELECTED_VERSIONS} from '../../../actions/actionTypes';

const BuildConfig = () => {
  const dispatch = useContext(IdeDispatchContext);
  const files = useContext(IdeFilesContext);
  const selectedVersions = useContext(IdeBuildRunSelectedVersionsContext);

  const onItemSelectionChange = (itemType, itemId, isSelected) => {
    dispatch({
      type: CONFIG_BUILD_UPDATE_SELECTED_VERSIONS,
      payload: {
        files,
        itemType,
        itemId,
        isSelected,
      },
    });
  };

  return (
    <TestSelect
      files={files}
      onItemSelectionChange={onItemSelectionChange}
      selectedVersions={selectedVersions}
      noTestMsg="No test found, add/load some test(s) from explorer."
    />
  );
};

export default BuildConfig;
