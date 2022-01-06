/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { cloneDeep, concat, find, forEach, get, head, includes, isEmpty, remove } from 'lodash';
import { v4 } from 'uuid';
import { Conflict } from '../models/conflict.interface';
import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { State } from '../models/state.interface';
import { VersionedRdfListItem } from '../models/versionedRdfListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';

/**
 * Service for common VersionedRdfState methods to be used in the ontology-editor or shapes-graph-editor.
 */
export abstract class VersionedRdfState {
    protected sm: any;
    protected cm: any;
    protected util: any;
    protected prefixes: any;
    protected statePrefix: string;
    protected branchStateNamespace: string;
    protected tagStateNamespace: string;
    protected commitStateNamespace: string;
    protected application: string;
    protected catalogId: string;

    public list: VersionedRdfListItem[];
    public listItem: VersionedRdfListItem;

    protected constructor(statePrefix: string, branchStateNamespace: string, tagStateNamespace: string, commitStateNamespace: string, application: string, catalogId: string) {
        this.statePrefix = statePrefix;
        this.branchStateNamespace = branchStateNamespace;
        this.tagStateNamespace = tagStateNamespace;
        this.commitStateNamespace = commitStateNamespace;
        this.application = application;
        this.catalogId = catalogId;
        this.list = [];
    }

    /**
     * Creates a new state for the application type for the current user.
     *
     * @param versionedRdfStateBase {VersionedRdfStateBase} the state base containing VersionedRDFRecord information.
     * @return {Promise} A Promise that resolves if the state creation was successful or not.
     */
    createState(versionedRdfStateBase: VersionedRdfStateBase): Promise<unknown> {
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
     * @return {Promise} A Promise that resolves if the state update was successful or not.
     */
    updateState(versionedRdfStateBase: VersionedRdfStateBase): Promise<unknown> {
        const stateObj: State = cloneDeep(this.getStateByRecordId(versionedRdfStateBase.recordId));
        const stateId: string = stateObj.id;
        const model: JSONLDObject[] = stateObj.model;
        const recordState: JSONLDObject = find(model, {'@type': [this.statePrefix + 'StateRecord']});
        let currentStateId: string = get(recordState, '[\'' + this.statePrefix + 'currentState' + '\'][0][\'@id\']');
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
                recordState[this.statePrefix + 'branchStates'] = concat(get(recordState, '[\'' + this.statePrefix + 'branchStates\']', []), [{'@id': currentStateId}]);
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
     * @param recordId {string} the IRI of the VersionedRdfRecord that contains the branch.
     * @param branchId {string} the IRI of the branch state to delete.
     * @return {Promise} A Promise that resolves if the state deletion and update was successful or not.
     */
    deleteBranchState(recordId: string, branchId:string): Promise<unknown> {
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
     * @param recordId {string} the IRI of the VersionedRdfRecord state to delete.
     * @return {Promise} A Promise that resolves if the state deletion was successful or not.
     */
    deleteState(recordId: string): Promise<unknown> {
        const stateId = this.getStateByRecordId(recordId).id;
        return this.sm.deleteState(stateId);
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
     * @return {State} the State object associated with the recordId.
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
        return get(recordState, '[\'' + this.statePrefix + 'currentState\'][0][\'@id\']', '');
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
     * Retrieves the catalog information for the specific commit of the record that should be opened for the current user. If
     * the user has not opened the ontology yet or the branch/commit they were viewing no longer exists,
     * retrieves the latest state of the ontology.
     *
     * @param recordId {string} the IRI of the VersionedRDFRecord.
     * @return {Promise} A promise containing the record id, branch id, commit id, and inProgressCommit.
     */
    getCatalogDetails(recordId:string): Promise<any> {
        const state: State = this.getStateByRecordId(recordId);
        if (!isEmpty(state)) {
            let inProgressCommit = new Difference();
            const currentState: JSONLDObject = this.getCurrentState(state);
            const commitId = this.util.getPropertyId(currentState, this.statePrefix + 'commit');
            const tagId = this.util.getPropertyId(currentState, this.statePrefix + 'tag');
            const branchId = this.util.getPropertyId(currentState, this.statePrefix + 'branch');
            let upToDate = false;
            let promise;
            let branchToastShown = false;
            if (branchId) {
                promise = this.cm.getRecordBranch(branchId, recordId, this.catalogId)
                    .then(branch => {
                        upToDate = this.util.getPropertyId(branch, this.prefixes.catalog + 'head') === commitId;
                        return this.cm.getInProgressCommit(recordId, this.catalogId);
                    }, error => {
                        this.util.createWarningToast('Branch ' + branchId + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                        branchToastShown = true;
                        return Promise.reject(error);
                    });
            } else if (tagId) {
                upToDate = true;
                promise = this.cm.getRecordVersion(tagId, recordId, this.catalogId)
                    .then(() => {
                        return this.cm.getInProgressCommit(recordId, this.catalogId);
                    }, () => {
                        this.util.createWarningToast('Tag ' + tagId + ' does not exist. Opening commit ' + this.util.condenseCommitId(commitId), {timeout: 5000});
                        return this.updateState({recordId, commitId});
                    })
                    .then(() => this.cm.getInProgressCommit(recordId, this.catalogId), error => {
                        return Promise.reject(error);
                    });
            } else {
                upToDate = true;
                promise = this.cm.getInProgressCommit(recordId, this.catalogId);
            }
            return promise
                .then(response => {
                    inProgressCommit = response;
                    return this.cm.getCommit(commitId);
                }, response => {
                    if (get(response, 'status') === 404) {
                        return this.cm.getCommit(commitId);
                    }
                    return Promise.reject(response);
                })
                .then(() => ({recordId, branchId, commitId, upToDate, inProgressCommit}), () => {
                    if (!branchToastShown) {
                        this.util.createWarningToast('Commit ' + this.util.condenseCommitId(commitId) + ' does not exist. Opening HEAD of MASTER.', {timeout: 5000});
                    }
                    return this.deleteState(recordId)
                        .then(() => this.getLatestMaster(recordId), error => {
                            return Promise.reject(error);
                        });
                });
        }
        return this.getLatestMaster(recordId);
    }
    /**
     * Retrieves the latest state a VersionedRDFRecord, being the head commit of the master branch, and returns
     * a promise containing the recordId, branchId, commitId, and inProgressCommit.
     *
     * @param recordId {string} the IRI of the VersionedRDFRecord.
     * @return A promise containing the record id, branch id, commit id, and inProgressCommit.
     */
    getLatestMaster(recordId: string): Promise<any> {
        let branchId, commitId: string;
        return this.cm.getRecordMasterBranch(recordId, this.catalogId)
            .then(masterBranch => {
                branchId = get(masterBranch, '@id', '');
                commitId = get(masterBranch, "['" + this.prefixes.catalog + "head'][0]['@id']", '');
                return this.createState({recordId, commitId, branchId});
            }, error => Promise.reject(error))
            .then(() => {
                return {recordId, branchId, commitId, upToDate: true, inProgressCommit: new Difference()};
            }, error => Promise.reject(error));
    }
    /**
     * Updates self.listItem.merge with the updated additions and deletions for the provided commit information.
     *
     * @param sourceCommitId {string} The string IRI of the source commit to get the difference.
     * @param targetCommitId {string} The string IRI of the target commit to get the difference.
     * @param limit {number} The limit for the paged difference.
     * @param offset {number} The offset for the paged difference.
     * @returns {Promise} Promise that resolves if the action was successful; rejects otherwise
     */
    getMergeDifferences(sourceCommitId: string, targetCommitId: string, limit: number, offset: number): Promise<any> {
        this.listItem.merge.startIndex = offset;
        return this.cm.getDifference(sourceCommitId, targetCommitId, limit, offset)
            .then(response => {
                if (!this.listItem.merge.difference) {
                    this.listItem.merge.difference = new Difference()
                }
                this.listItem.merge.difference.additions = concat(this.listItem.merge.difference.additions, response.data.additions);
                this.listItem.merge.difference.deletions = concat(this.listItem.merge.difference.deletions, response.data.deletions);
                const headers = response.headers();
                this.listItem.merge.difference.hasMoreResults = get(headers, 'has-more-results', false) === 'true';
                return Promise.resolve();
            }, error => Promise.reject(error));
    }
    /**
     * Attempts the merge, first checking for conflicts.
     *
     * @return {Promise} Promise that resolves if the merge was successful.
     */
    attemptMerge(): Promise<any> {
        return this.checkConflicts()
            .then(() => this.merge(), error => Promise.reject(error));
    }
    /**
     * Checks for merge conflicts.
     *
     * @return {Promise} Promise that resolves if there are no conflicts.
     */
    checkConflicts(): Promise<any> {
        return this.cm.getBranchConflicts(this.listItem.versionedRdfRecord.branchId, this.listItem.merge.target['@id'], this.listItem.versionedRdfRecord.recordId, this.catalogId)
            .then(conflicts => {
                if (isEmpty(conflicts)) {
                    return Promise.resolve();
                } else {
                    forEach(conflicts, conflict => {
                        conflict.resolved = false;
                        this.listItem.merge.conflicts.push(conflict as Conflict);
                    });
                    return Promise.reject();
                }
            }, error => Promise.reject(error));
    }
    /**
     * Merges VersionedRDFRecord branches.
     */
    protected abstract merge(): Promise<any>;
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
    getListItemByRecordId(recordId: string): VersionedRdfListItem {
        return find(this.list, {versionedRdfRecord: {recordId}});
    }
}
