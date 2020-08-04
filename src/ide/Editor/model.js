import {immerable} from 'immer';

function Tab(versionId, temporary, selected) {
  this.versionId = versionId;
  this.temporary = temporary;
  this.selected = selected;
  this[immerable] = true;
}

export default Tab;
