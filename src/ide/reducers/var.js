import produce from 'immer';
import {pull} from 'lodash-es';
import {VAR_SET, VAR_NEW, VAR_EDIT, VAR_DELETE} from '../actionTypes';
import {VarTypes} from '../../Constants';
import {getSortedNames} from './common';

const setVar = (draft, payload) => {
  if (payload.value === undefined) {
    throw new Error('Insufficient arguments passed to setVar.');
  }
  if (payload.type === VarTypes.BUILD) {
    draft.vars.build = payload.value;
  } else if (payload.type === VarTypes.GLOBAL) {
    draft.vars.global = payload.value;
  }
};

// when build var is deleted, delete it from configs, storage etc.
// not considering the edge case when a delete is reverted on api error, this
// will be a TODO for later.
const onDeleteBuildVar = (buildVar, draft) => {
  // delete from both configs, locally
  if (draft.config.dry.selectedBuildVarIdPerKey[buildVar.key] === buildVar.id) {
    delete draft.config.dry.selectedBuildVarIdPerKey[buildVar.key];
  }
  if (
    draft.config.build.selectedBuildVarIdPerKey[buildVar.key] === buildVar.id
  ) {
    delete draft.config.build.selectedBuildVarIdPerKey[buildVar.key];
  }
  // delete in storage
};

const deleteVar = (draft, payload) => {
  if (payload.id === undefined) {
    throw new Error('Insufficient arguments passed to deleteVar.');
  }
  const {vars} = draft;
  const {id} = payload;
  if (payload.type === VarTypes.BUILD) {
    const {buildVars} = vars.build.entities;
    const entry = buildVars[id];
    // if the deleting entry is a primary, don't allow deletion if there is
    // more than one entries with entry's key, user should first make some other
    // entry in the key group primary before deleting this one. If the key
    // group has just one entry, deletion is allowed.
    if (entry.primary) {
      const {key} = entry;
      const matchingEntries = vars.build.result.filter(
        (r) => buildVars[r].key === key
      );
      if (matchingEntries.length > 1) {
        // don't leave the key group without a primary
        throw new Error(
          `Can't delete a primary variable as more than one variables exists in ${key}`
        );
      }
    }
    delete buildVars[id];
    pull(vars.build.result, id);
    onDeleteBuildVar(entry, draft);
  } else if (payload.type === VarTypes.GLOBAL) {
    delete vars.global.entities.globalVars[id];
    pull(vars.global.result, id);
  }
};

export const getCurrentPrimaryBuildVar = (vars, key) => {
  const {buildVars} = vars.build.entities;
  const currentPrimary = vars.build.result.filter(
    (id) => buildVars[id].key === key && buildVars[id].primary
  );
  const size = currentPrimary.length;
  if (size === 0 || size > 1) {
    throw new Error(
      `unexpected ${size} primary entries for existing buildVar ${key}`
    );
  }
  return buildVars[currentPrimary[0]];
};

const resetCurrentPrimary = (vars, key) => {
  getCurrentPrimaryBuildVar(vars, key).primary = false;
};

const editVar = (draft, payload) => {
  if (payload.value === undefined) {
    throw new Error('Insufficient arguments passed to editVar.');
  }
  const {vars} = draft;
  const entry = payload.value;
  if (payload.type === VarTypes.BUILD) {
    const {buildVars} = vars.build.entities;
    // only value, primary can be edited
    buildVars[entry.id].value = entry.value;
    // if user tries to un-primary a primary var, it won't happen.
    // if var is not primary and being turned to, reset previous primary.
    if (entry.primary && !buildVars[entry.id].primary) {
      resetCurrentPrimary(vars, entry.key);
      buildVars[entry.id].primary = true;
    }
  } else if (payload.type === VarTypes.GLOBAL) {
    // only value can be edited
    vars.global.entities.globalVars[entry.id].value = entry.value;
  }
};

const newVar = (draft, payload) => {
  // don't check value's constructor cause when data is loaded from db, we don't
  // convert it to those constructors, and newVar is also called from delete.
  if (payload.value === undefined) {
    throw new Error('Insufficient arguments passed to newVar.');
  }
  const {vars} = draft;
  // never mutate a payload.
  const value = {...payload.value};
  if (payload.type === VarTypes.BUILD) {
    if (vars.build === null) {
      value.primary = true; // when it's first var, it should be primary
      vars.build = {
        entities: {buildVars: {[value.id]: value}},
        result: [value.id],
      };
    } else {
      const {build} = vars;
      const {buildVars} = build.entities;
      // if this new key doesn't yet exist, mark it primary.
      if (!build.result.some((id) => buildVars[id].key === value.key)) {
        value.primary = true;
      } else if (value.primary) {
        // if this key exists and new key needs to be primary, reset previous
        resetCurrentPrimary(vars, value.key);
      }
      buildVars[value.id] = value;
      build.result.push(value.id);
      build.result = getSortedNames(build.result, buildVars, 'key');
    }
  } else if (payload.type === VarTypes.GLOBAL) {
    if (vars.global === null) {
      vars.global = {
        entities: {globalVars: {[value.id]: value}},
        result: [value.id],
      };
    } else {
      const {global} = vars;
      const {globalVars} = global.entities;
      globalVars[value.id] = value;
      global.result.push(value.id);
      global.result = getSortedNames(global.result, globalVars, 'key');
    }
  }
};

const varReducer = produce((draft, action) => {
  const {payload} = action;
  if (payload.type === undefined) {
    throw new Error('Insufficient arguments passed to varReducer.');
  }
  switch (action.type) {
    case VAR_SET:
      setVar(draft, payload);
      break;
    case VAR_NEW:
      newVar(draft, payload);
      break;
    case VAR_EDIT:
      editVar(draft, payload);
      break;
    case VAR_DELETE:
      deleteVar(draft, payload);
      break;
    default:
      break;
  }
});

export default varReducer;
