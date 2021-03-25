import produce from 'immer';
import pull from 'lodash-es/pull';
import {VAR_SET, VAR_NEW, VAR_EDIT, VAR_DELETE} from '../actionTypes';
import {VarTypes} from '../../Constants';
import {getSortedNames} from '../../common';
import {equalIgnoreCase} from '../../utils';

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
    if (entry.isPrimary) {
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
  } else if (payload.type === VarTypes.GLOBAL) {
    delete vars.global.entities.globalVars[id];
    pull(vars.global.result, id);
  }
};

export const getCurrentPrimaryBuildVar = (vars, key) => {
  const {buildVars} = vars.build.entities;
  const currentPrimary = vars.build.result.filter(
    (id) => equalIgnoreCase(buildVars[id].key, key) && buildVars[id].isPrimary
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
  getCurrentPrimaryBuildVar(vars, key).isPrimary = false;
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
    if (entry.isPrimary && !buildVars[entry.id].isPrimary) {
      resetCurrentPrimary(vars, entry.key);
      buildVars[entry.id].isPrimary = true;
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
      value.isPrimary = true; // when it's first var, it should be primary
      vars.build = {
        entities: {buildVars: {[value.id]: value}},
        result: [value.id],
      };
    } else {
      const {build} = vars;
      const {buildVars} = build.entities;
      const existingBuildVarId = build.result.find((id) =>
        equalIgnoreCase(buildVars[id].key, value.key)
      );
      // if this new key doesn't yet exist, mark it primary.
      if (!existingBuildVarId) {
        value.isPrimary = true;
      } else {
        if (value.isPrimary) {
          // if this key exists and new key needs to be primary, reset previous
          resetCurrentPrimary(vars, value.key);
        }
        // when a key exists already, we assign the existing key to whatever is
        // inputted by user, i.e a different cased key is changed to existing key,
        // so that the grouping takes place on existing key, this is done even if
        // user has given same cased key. For example if existing was SITE_URL,
        // and user gives site_url, we change it to SITE_URL.
        value.key = buildVars[existingBuildVarId].key;
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
