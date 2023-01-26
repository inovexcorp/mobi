/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { HttpResponse } from '@angular/common/http';
import { cloneDeep, concat, find, get, head, includes, isEmpty, remove } from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { v4 } from 'uuid';

import { CATALOG } from '../../prefixes';
import { CommitDifference } from '../models/commitDifference.interface';
import { Conflict } from '../models/conflict.interface';
import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { State } from '../models/state.interface';
import { VersionedRdfListItem } from '../models/versionedRdfListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { CatalogManagerService } from './catalogManager.service';
import { StateManagerService } from './stateManager.service';
import { UtilService } from './util.service';

/**
 * Service for common VersionedRdfState methods to be used in the ontology-editor or shapes-graph-editor.
 */
export abstract class VersionedRdfState<T extends VersionedRdfListItem> {
    protected sm: StateManagerService;
    protected cm: CatalogManagerService;
    protected util: UtilService;
    protected statePrefix: string;
    protected branchStateNamespace: string;
    protected tagStateNamespace: string;
    protected commitStateNamespace: string;
    protected application: string;
    protected catalogId: string;

    public list: T[];
    public listItem: T;

    protected constructor(statePrefix: string, branchStateNamespace: string, tagStateNamespace: string, commitStateNamespace: string, application: string) {
        this.statePrefix = statePrefix;
        this.branchStateNamespace = branchStateNamespace;
        this.tagStateNamespace = tagStateNamespace;
        this.commitStateNamespace = commitStateNamespace;
        this.application = application;
        this.list = [];
    }

    /**
     * Retrieves the id of the listItem.
     *
     * @return {Promise} A Promise containing the id of the listItem that resolves if the state creation was successful.
     */
    abstract getId(): Promise<string>;

    /**
     * Creates a new state for the application type for the current user.
     *
     * @param versionedRdfStateBase {VersionedRdfStateBase} the state base containing VersionedRDFRecord information.
     * @return {Observable<null>} An Observable that resolves if the state creation was successful or not.
     */
    createState(versionedRdfStateBase: VersionedRdfStateBase): Observable<null> {
        let stateIri;
        const recordState: JSONLDObject = {
            '@id': this.statePrefix + v4(),
            '@type': [this.statePrefix + 'StateRecord'],
            [this.statePrefix + 'record']: [{'@id': versionedRdfStateBase.recordId}],
        };
        const commitStatePartial: Partial<JSONLDObject> = {
            '@type': [this.statePrefix + 'StateCommit'],
            [this.statePrefix + 'commit']: [{'@id': versionedRdfStateBase.commitId}]
        };
        if (versionedRdfStateBase.branchId) {
            stateIri = this.branchStateNamespace + v4();
            recordState[this.statePrefix + 'branchStates'] = [{'@id': stateIri}];
            commitStatePartial['@id'] = stateIri;
            commitStatePartial['@type'].push(this.statePrefix + 'StateBranch');
            commitStatePartial[this.statePrefix + 'branch'] = [{'@id': versionedRdfStateBase.branchId}];
        } else if (versionedRdfStateBase.tagId) {
            stateIri = this.tagStateNamespace + v4();
            commitStatePartial['@id'] = stateIri;
            commitStatePartial['@type'].push(this.statePrefix + 'StateTag');
            commitStatePartial[this.statePrefix + 'tag'] = [{'@id': versionedRdfStateBase.tagId}];
        } else {
            stateIri = this.commitStateNamespace + v4();
            commitStatePartial['@id'] = stateIri;
        }
        recordState[this.statePrefix + 'currentState'] = [{'@id': stateIri}];

        const commitState: JSONLDObject = {
            ...commitStatePartial
        } as JSONLDObject;

        return this.sm.createState([recordState, commitState], this.application);
    }
    /**
     * Retrieves the current state for the provided recordId.
     *
     * @param recordId {string} the VersionedRDFRecord whose state should be retrieved.
     * @return {State} A State object.
     */
    getStateByRecordId(recordId: string): State {
        return find(this.sm.states, {
            model: [{
                [this.statePrefix + 'record']: [{'@id': recordId}]
            }]
        });
    }
    /**
     * Updates the State for the associated VersionedRdfStateBase.recordId with the provided VersionedRdfStateBase.
     *
     * @param versionedRdfStateBase {VersionedRdfStateBase} the new state to update to.
     * @return {Observable<null>} An Observable that resolves if the state update was successful or not.
     */
    updateState(versionedRdfStateBase: VersionedRdfStateBase): Observable<null> {
        const stateObj: State = cloneDeep(this.getStateByRecordId(versionedRdfStateBase.recordId));
        const stateId: string = stateObj.id;
        const model: JSONLDObject[] = stateObj.model;
        const recordState: JSONLDObject = find(model, {'@type': [this.statePrefix + 'StateRecord']});
        let currentStateId: string = get(recordState, `[' ${this.statePrefix}currentState'][0]['@id']`);
        const currentState: JSONLDObject = find(model, {'@id': currentStateId});

        if (currentState && !includes(get(currentState, '@type', []), this.statePrefix + 'StateBranch')) {
            remove(model, currentState);
        }

        if (versionedRdfStateBase.branchId) {
            const branchState: JSONLDObject = find(model, {[this.statePrefix + 'branch']: [{'@id': versionedRdfStateBase.branchId}]});
            if (branchState) {
                currentStateId = branchState['@id'];
                branchState[this.statePrefix + 'commit'] = [{'@id': versionedRdfStateBase.commitId}];
            } else {
                currentStateId = this.branchStateNamespace + v4();
                recordState[this.statePrefix + 'branchStates'] = concat(get(recordState, `['${this.statePrefix}branchStates']`, []), [{'@id': currentStateId}]);
                model.push({
                    '@id': currentStateId,
                    '@type': [this.statePrefix + 'StateCommit', this.statePrefix + 'StateBranch'],
                    [this.statePrefix + 'branch']: [{'@id': versionedRdfStateBase.branchId}],
                    [this.statePrefix + 'commit']: [{'@id': versionedRdfStateBase.commitId}]
                });
            }
        } else if (versionedRdfStateBase.tagId) {
            currentStateId = this.tagStateNamespace + v4();
            model.push({
                '@id': currentStateId,
                '@type': [this.statePrefix + 'StateCommit', this.statePrefix + 'StateTag'],
                [this.statePrefix + 'tag']: [{'@id': versionedRdfStateBase.tagId}],
                [this.statePrefix + 'commit']: [{'@id': versionedRdfStateBase.commitId}]
            });
        } else {
            currentStateId = this.commitStateNamespace + v4();
            model.push({
                '@id': currentStateId,
                '@type': [this.statePrefix + 'StateCommit'],
                [this.statePrefix + 'commit']: [{'@id': versionedRdfStateBase.commitId}]
            });
        }
        recordState[this.statePrefix + 'currentState'] = [{'@id': currentStateId}];
        return this.sm.updateState(stateId, model);
    }
    /**
     * Deletes the state for the provided branchId.
     *
     * @param {string} recordId the IRI of the VersionedRdfRecord that contains the branch.
     * @param {string} branchId the IRI of the branch state to delete.
     * @return {Observable<null>} An Observable that resolves if the state deletion and update was successful or not.
     */
    deleteBranchState(recordId: string, branchId:string): Observable<null> {
        const stateObj: State = cloneDeep(this.getStateByRecordId(recordId));
        const record: JSONLDObject = find(stateObj.model, {'@type': [this.statePrefix + 'StateRecord']});
        const branchState: JSONLDObject = head(remove(stateObj.model, {[this.statePrefix + 'branch']: [{'@id': branchId}]}));
        remove(record[this.statePrefix + 'branchStates'], {'@id': get(branchState, '@id')});
        if (!record[this.statePrefix + 'branchStates'].length) {
            delete record[this.statePrefix + 'branchStates'];
        }
        return this.sm.updateState(stateObj.id, stateObj.model);
    }
    /**
     * Deletes the state for the provided recordId.
     *
     * @param {string} recordId the IRI of the VersionedRdfRecord state to delete.
     * @return {Observable} An Observable that resolves if the state deletion was successful and rejects if not.
     */
    deleteState(recordId: string): Observable<null> {
        const state = this.getStateByRecordId(recordId);
        if (state === undefined) {
            return of();
        }
        return this.sm.deleteState(state.id);
    }
    /**
     * Retrieves the ID of the current State object for the provided recordId.
     *
     * @param recordId {string} the IRI of the VersionedRDFRecord whose state ID to retrieve.
     * @return {string} the ID of the State object.
     */
    getCurrentStateIdByRecordId(recordId: string): string {
        return this.getCurrentStateId(this.getStateByRecordId(recordId));
    }
    /**
     * Retrieves the current State object for the provided recordId.
     *
     * @param recordId {string} the IRI of the VersionedRDFRecord whose state to retrieve.
     * @return {JSONLDObject} the State object associated with the recordId.
     */
    getCurrentStateByRecordId(recordId: string): JSONLDObject {
        const state = this.getStateByRecordId(recordId);
        const currentStateId = this.getCurrentStateId(state);
        return find(get(state, 'model', []), {'@id': currentStateId});
    }
    /**
     * Retrieves the ID of the provided State object.
     *
     * @param state {State} the State object to retrieve the ID of.
     * @return {string} the ID of the State object.
     */
    getCurrentStateId(state: State): string {
        const recordState = find(state.model, {'@type': [this.statePrefix + 'StateRecord']});
        return get(recordState, `['${this.statePrefix}currentState'][0]['@id']`, '');
    }
    /**
     * Retrieves the current JSONLDObject state from the provided State object.
     *
     * @param state {State} the state object.
     * @return {JSONLDObject} the JSONLDObject of the current state.
     */
    getCurrentState(state: State): JSONLDObject {
        return find(state.model, {'@id': this.getCurrentStateId(state)});
    }
    /**
     * Checks if the state is a tag.
     *
     * @param jsonld {JSONLDObject} the JSONLDObject to check for a StateTag.
     * @return {boolean} Whether the JSONLDObject is a StateTag.
     */
    isStateTag(jsonld: JSONLDObject): boolean {
        return includes(jsonld['@type'], this.statePrefix + 'StateTag');
    }
    /**
     * Checks if the state is a branch.
     *
     * @param jsonld {JSONLDObject} the JSONLDObject to check for a StateBranch.
     * @return {boolean} Whether the JSONLDObject is a StateBranch.
     */
    isStateBranch(jsonld: JSONLDObject): boolean {
        return includes(jsonld['@type'], this.statePrefix + 'StateBranch');
    }

    /**
     * Retrieves the catalog information for the specific commit of the record that should be opened for the current 
     * user. If the user has not opened the ontology yet or the branch/commit they were viewing no longer exists,
     * retrieves the latest state of the ontology.
     *
     * @param recordId {string} the IRI of the VersionedRDFRecord.
     * @return {Observable} An Observable containing the record id, branch id, commit id, and inProgressCommit.
     */
    getCatalogDetails(recordId:string): Observable<{recordId: string, branchId: string, commitId: string, tagId?: string, upToDate: boolean, inProgressCommit: Difference}> {
        const state: State = this.getStateByRecordId(recordId);
        if (!isEmpty(state)) {
            let inProgressCommit = new Difference();
            const currentState: JSONLDObject = this.getCurrentState(state);
            const commitId = this.util.getPropertyId(currentState, this.statePrefix + 'commit');
            const tagId = this.util.getPropertyId(currentState, this.statePrefix + 'tag');
            const branchId = this.util.getPropertyId(currentState, this.statePrefix + 'branch');
            let upToDate = false;
            let ob;
            let branchToastShown = false;
            if (branchId) {
                ob = this.cm.getRecordBranch(branchId, recordId, this.catalogId)
                    .pipe(
                        catchError(error => {
                            this.util.createWarningToast('Branch ' + branchId + ' does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                            branchToastShown = true;
                            return throwError(error);
                        }),
                        switchMap(branch => {
                            upToDate = this.util.getPropertyId(branch, CATALOG + 'head') === commitId;
                            return this.cm.getInProgressCommit(recordId, this.catalogId);
                        })
                    );
            } else if (tagId) {
                upToDate = true;
                ob = this.cm.getRecordVersion(tagId, recordId, this.catalogId)
                    .pipe(
                        catchError(() => {
                            this.util.createWarningToast('Tag ' + tagId + ' does not exist. Opening commit ' + this.util.condenseCommitId(commitId), {timeOut: 5000});
                            return this.updateState({recordId, commitId});
                        }),
                        switchMap(() => this.cm.getInProgressCommit(recordId, this.catalogId))
                    );
            } else {
                upToDate = true;
                ob = this.cm.getInProgressCommit(recordId, this.catalogId);
            }
            
            return ob
                .pipe(
                    catchError(response => {
                        if (get(response, 'status') === 404) {
                            return of(inProgressCommit);
                        }
                        return throwError(response);
                    }),
                    switchMap((response: Difference) => {
                        inProgressCommit = response;
                        return this.cm.getCommit(commitId).pipe(map(() => ({recordId, branchId, commitId, tagId, upToDate, inProgressCommit})));
                    }),
                    catchError(() => {
                        if (!branchToastShown) {
                            this.util.createWarningToast('Commit ' + this.util.condenseCommitId(commitId) + ' does not exist. Opening HEAD of MASTER.', {timeOut: 5000});
                        }
                        return this.deleteState(recordId).pipe(switchMap(() => this.getLatestMaster(recordId)));
                    })
                );
        }
        return this.getLatestMaster(recordId);
    }
    /**
     * Retrieves the latest state a VersionedRDFRecord, being the head commit of the master branch, and returns
     * an Observable containing the recordId, branchId, commitId, and inProgressCommit.
     *
     * @param recordId {string} the IRI of the VersionedRDFRecord.
     * @return {Observable} An Observable containing the record id, branch id, commit id, and inProgressCommit.
     */
    getLatestMaster(recordId: string): Observable<{recordId: string, branchId: string, commitId: string, upToDate: boolean, inProgressCommit: Difference}> {
        let branchId, commitId: string;
        return this.cm.getRecordMasterBranch(recordId, this.catalogId)
            .pipe(
                switchMap(masterBranch => {
                    branchId = get(masterBranch, '@id', '');
                    commitId = get(masterBranch, '[\'' + CATALOG + 'head\'][0][\'@id\']', '');
                    return this.createState({recordId, commitId, branchId});
                }),
                map(() => {
                    return {recordId, branchId, commitId, upToDate: true, inProgressCommit: new Difference()};
                })
            );
    }
    /**
     * Updates self.listItem.merge with the updated additions and deletions for the provided commit information.
     *
     * @param sourceCommitId {string} The string IRI of the source commit to get the difference.
     * @param targetCommitId {string} The string IRI of the target commit to get the difference.
     * @param limit {number} The limit for the paged difference.
     * @param offset {number} The offset for the paged difference.
     * @returns {Observable} Observable that resolves if the action was successful; rejects otherwise
     */
    getMergeDifferences(sourceCommitId: string, targetCommitId: string, limit: number, offset: number): Observable<null> {
        this.listItem.merge.startIndex = offset;
        return this.cm.getDifference(sourceCommitId, targetCommitId, limit, offset)
            .pipe(map((response: HttpResponse<CommitDifference>) => {
                if (!this.listItem.merge.difference) {
                    this.listItem.merge.difference = new Difference();
                }
                this.listItem.merge.difference.additions = concat(this.listItem.merge.difference.additions, response.body.additions);
                this.listItem.merge.difference.deletions = concat(this.listItem.merge.difference.deletions, response.body.deletions);
                const headers = response.headers;
                this.listItem.merge.difference.hasMoreResults = (headers.get('has-more-results') || 'false') === 'true';
                return null;
            }));
    }
    /**
     * Attempts the merge, first checking for conflicts.
     *
     * @return {Observable} Observable that resolves if the merge was successful.
     */
    attemptMerge(): Observable<null> {
        return this.checkConflicts().pipe(switchMap(() => this.merge()));
    }
    /**
     * Checks for merge conflicts.
     *
     * @return {Observable} Observable that resolves if there are no conflicts.
     */
    checkConflicts(): Observable<null> {
        return this.cm.getBranchConflicts(this.listItem.versionedRdfRecord.branchId, this.listItem.merge.target['@id'], this.listItem.versionedRdfRecord.recordId, this.catalogId)
            .pipe(map(conflicts => {
                if (!isEmpty(conflicts)) {
                    conflicts.forEach(conflict => {
                        conflict.resolved = false;
                        this.listItem.merge.conflicts.push(conflict as Conflict);
                    });
                    throw new Error('');
                }
                return null;
            }));
    }
    /**
     * Merges VersionedRDFRecord branches.
     */
    protected abstract merge(): Observable<null>;
    /**
     * Resets the merge state.
     */
    cancelMerge(): void {
        this.listItem.merge.active = false;
        this.listItem.merge.target = undefined;
        this.listItem.merge.checkbox = false;
        this.listItem.merge.difference = undefined;
        this.listItem.merge.conflicts = [];
        this.listItem.merge.resolutions = new Difference();
        this.listItem.merge.startIndex = 0;
    }
    /**
     * Retrieves the VersionedRdfListItem from the list of open records.
     *
     * @param recordId the IRI of the VersionedRDFRecord.
     */
    getListItemByRecordId(recordId: string): T {
        return this.list.find(item => item.versionedRdfRecord.recordId === recordId);
    }
}
