/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Commit } from './commit.interface';
import { Conflict } from './conflict.interface';
import { Difference } from './difference.class';
import { EntityNames } from './entityNames.interface';
import { ImportedOntology } from './shapesGraphImports.interface';
import { JSONLDObject } from './JSONLDObject.interface';
import { VersionedRdfRecord } from './versionedRdfRecord.interface';

export class VersionedRdfListItem {
  tabIndex: number; //moved into super class to account for we need to keep track in both ontology and shapes editor
  changesPageOpen: boolean;
  currentVersionTitle: string;
  masterBranchIri: string;
  upToDate: boolean;
  userBranch: boolean;
  userCanModify: boolean;
  userCanModifyMaster: boolean;
  versionedRdfRecord: VersionedRdfRecord;
  additions: JSONLDObject[];
  deletions: JSONLDObject[];
  inProgressCommit: Difference;
  merge: {
    active: boolean;
    target: JSONLDObject;
    checkbox: boolean;
    difference: Difference;
    conflicts: Conflict[];
    resolutions: Difference;
    startIndex: number;
  };
  selectedCommit?: Commit;
  hasPendingRefresh: boolean;
  importedOntologies: ImportedOntology[];
  importedOntologyIds: string[];
  failedImports: string[];
  selected: JSONLDObject;
  selectedBlankNodes: JSONLDObject[];
  blankNodes: { [key: string]: string };
  dataPropertyRange: { [key: string]: string };
  entityInfo: EntityNames;

  constructor() {
    this.masterBranchIri = '';
    this.upToDate = true;
    this.userBranch = false;
    this.userCanModify = false;
    this.userCanModifyMaster = false;
    this.versionedRdfRecord = {
      title: '',
      recordId: '',
      branchId: '',
      commitId: ''
    };
    this.importedOntologies = [];
    this.importedOntologyIds = [];
    this.failedImports = [];
    this.hasPendingRefresh = false;
    this.additions = [];
    this.deletions = [];
    this.inProgressCommit = new Difference();
    this.merge = {
      active: false,
      target: undefined,
      checkbox: false,
      difference: undefined,
      conflicts: [],
      resolutions: new Difference(),
      startIndex: 0
    };
    this.selectedCommit = undefined;
    this.selected = undefined;
    this.selectedBlankNodes = [];
    this.dataPropertyRange = {};
    this.blankNodes = {};
    this.entityInfo = {};
  }
}
