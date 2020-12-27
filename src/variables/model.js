import {schema} from 'normalizr';
import {immerable} from 'immer';

// key/value pair must be unique
function GlobalVars(id, key, value) {
  this.id = id;
  this.key = key;
  this.value = value;
  this[immerable] = true;
}

// allows duplicate key/value
function BuildVars(id, key, value, isPrimary) {
  this.id = id;
  this.key = key;
  this.value = value;
  this.isPrimary = isPrimary;
  this[immerable] = true;
}

const globalVarsSchema = [new schema.Entity('globalVars')];
const buildVarsSchema = [new schema.Entity('buildVars')];

export {GlobalVars, BuildVars, globalVarsSchema, buildVarsSchema};
