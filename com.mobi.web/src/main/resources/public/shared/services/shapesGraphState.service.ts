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
import { Inject, Injectable } from '@angular/core';
import { get, remove, find } from 'lodash';
import { RecordSelectFiltered } from '../../shapes-graph-editor/models/recordSelectFiltered.interface';
import { Difference } from '../models/difference.class';
import { RdfUpload } from '../models/rdfUpload.interface';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { VersionedRdfState } from './versionedRdfState.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { OptionalJSONLD } from '../models/OptionalJSONLD.class';
import { PolicyManagerService } from './policyManager.service';

/**
 * @class shared.ShapesGraphStateService
 *
 * A service which contains various variables to hold the state of the Shapes Graph editor
 */
@Injectable()
export class ShapesGraphStateService extends VersionedRdfState {
    listItem: ShapesGraphListItem;
    list: ShapesGraphListItem[];

    constructor(@Inject('stateManagerService') protected sm, @Inject('prefixes') protected prefixes,
                @Inject('catalogManagerService') protected cm, @Inject('utilService') protected util,
                @Inject('policyEnforcementService') protected pep, 
                private pm: PolicyManagerService, private sgm: ShapesGraphManagerService) {
        super(prefixes.shapesGraphState,
            'http://mobi.com/states/shapes-graph-editor/branch-id/',
            'http://mobi.com/states/shapes-graph-editor/tag-id/',
            'http://mobi.com/states/shapes-graph-editor/commit-id/',
            'shapes-graph-editor'
        );
    }

    initialize(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }

    getId(): Promise<string> {
        return this.sgm.getShapesGraphIRI(this.listItem?.versionedRdfRecord?.recordId, this.listItem?.versionedRdfRecord?.branchId, this.listItem?.versionedRdfRecord?.commitId);
    }

    /**
     * Resets all the main state variables.
     */
    reset(): void {
        this.listItem = new ShapesGraphListItem();
        this.list = [];
    }
    /**
     * Resets the additions and deletions in the in progress commit.
     */
    clearInProgressCommit(): void {
        this.listItem.inProgressCommit = new Difference();
    }
    /**
     * Indicates whether the currently viewed ShapesGraphRecord can be committed. 
     * 
     * @returns {boolean} A boolean indicating if the currently viewed shapes graph record is committable.
     */
    isCommittable(): boolean {
        return (!!this?.listItem?.inProgressCommit?.additions.length|| !!this?.listItem?.inProgressCommit?.deletions.length) && !!this?.listItem?.versionedRdfRecord?.recordId;
    }
    /**
     * Uploads a shapes graph and sets the state to use the newly uploaded shapes graph.
     *
     * @param rdfUpload {RdfUpload} the new ShapesGraphRecord to create.
     * @param showToast {boolean} to display a success toast on creation.
     * @return {Promise} A Promise that resolves if the upload was successful or not.
     */
    uploadShapesGraph(rdfUpload: RdfUpload, showToast=true): Promise<any> {
        return this.sgm.createShapesGraphRecord(rdfUpload)
            .then((response: VersionedRdfUploadResponse) => {
                if (showToast) {
                    this.util.createSuccessToast('Record ' + response.recordId + ' successfully created.');
                }
                const listItem = new ShapesGraphListItem();
                listItem.shapesGraphId = response.shapesGraphId;
                listItem.masterBranchIri = response.branchId;
                listItem.versionedRdfRecord = {
                    title: response.title,
                    recordId: response.recordId,
                    branchId: response.branchId,
                    commitId: response.commitId
                };
                listItem.currentVersionTitle = 'MASTER';
                return this.sgm.getShapesGraphMetadata(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, listItem.shapesGraphId)
            .then((arr: Array<OptionalJSONLD>) => {
                listItem.metadata = find(arr, {'@id': listItem.shapesGraphId});
                this.listItem = listItem;
                return this.sgm.getShapesGraphContent(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId);
            })
            .then(content => {
                this.listItem.content = content;
                this.listItem.userCanModify = true;
                this.listItem.userCanModifyMaster = true;
                this.list.push(this.listItem);
                const stateBase: VersionedRdfStateBase = {
                    recordId: response.recordId,
                    commitId: response.commitId,
                    branchId: response.branchId
                };
                return this.createState(stateBase); 
            })
            .catch(error => Promise.reject(error));
        });
    }
    /**
     * Opens the provided record, retrieving previous state information for the record, and setting it as the active
     * shapes graph.
     *
     * @param record {RecordSelectFiltered} the ShapesGraphRecord to open.
     * @return {Promise} A Promise that resolves if the open was successful or not.
     */
    openShapesGraph(record: RecordSelectFiltered): Promise<any> {
        const item = this.list.find(item => item.versionedRdfRecord.recordId === record.recordId);
        if (item) {
            this.listItem = item;
            return Promise.resolve();
        }
        return this.getCatalogDetails(record.recordId)
            .then(response => {
                const listItem = new ShapesGraphListItem();
                listItem.versionedRdfRecord = {
                    title: record.title,
                    recordId: response.recordId,
                    branchId: response.branchId,
                    commitId: response.commitId,
                    tagId: response.tagId
                };
                listItem.inProgressCommit.additions = response.inProgressCommit.additions;
                listItem.inProgressCommit.deletions = response.inProgressCommit.deletions;
                listItem.changesPageOpen = false;
                listItem.upToDate = response.upToDate;

                this.listItem = listItem;
                return this.updateShapesGraphMetadata(response.recordId, response.branchId, response.commitId);
            })
            .catch(error => Promise.reject(error));
    }

    /**
     * Updates the shapes graph metadata for the given recordId, branchId, commitId combination. Retrieves the
     * shapesGraphId as well. Should be used in cases where the shapesGraphId may have been changed in the backend.
     * Applies the inProgressCommit when retrieving data.
     *
     * @param recordId {string} the IRI of the record to retrieve metadata for.
     * @param branchId {string} the IRI of the branch to retrieve metadata for.
     * @param commitId {string} the IRI of the commit to retrieve metadata for.

     * @return {Promise} A Promise that resolves if the metadata update was successful.
     */
    updateShapesGraphMetadata(recordId: string, branchId: string, commitId: string): Promise<any> {
        return this.sgm.getShapesGraphIRI(recordId, branchId, commitId)
            .then(shapesGraphId => {
                this.listItem.shapesGraphId = shapesGraphId;
                return this.sgm.getShapesGraphMetadata(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId, this.listItem.shapesGraphId);
            })
            .then((arr: Array<OptionalJSONLD>) => {
                this.listItem.metadata = find(arr, {'@id': this.listItem.shapesGraphId});
                return this.sgm.getShapesGraphContent(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId);
            })
            .then(content => {
                this.listItem.content = content;
                return this.cm.getRecordBranches(recordId, this.catalogId);
            })
            .then(branches => {
                this.listItem.branches = branches.data;
                const masterBranch = find(this.listItem.branches, {[this.prefixes.dcterms + 'title']: [{'@value': 'MASTER'}]});
                this.listItem.masterBranchIri = masterBranch ? masterBranch['@id'] : '';
                const modifyRequest: any = {
                    resourceId: this.listItem.versionedRdfRecord.recordId,
                    actionId: this.pm.actionModify
                };
                return this.pep.evaluateRequest(modifyRequest);
            })
            .then(decision => {
                const modifyMasterRequest: any = {
                    resourceId: this.listItem.versionedRdfRecord.recordId,
                    actionId: this.pm.actionModify,
                    actionAttrs: { [this.prefixes.catalog + 'branch']: this.listItem.masterBranchIri }
                };
                this.listItem.userCanModify = decision === this.pep.permit;
                return this.pep.evaluateRequest(modifyMasterRequest);
            })
            .then(decision => {
                this.listItem.userCanModifyMaster = decision === this.pep.permit;
                this.list.push(this.listItem);
                return Promise.resolve();
            })
            .catch(error => Promise.reject(error));
    }
    /**
     * Closes the ShapesGraphRecord by removing it from the list of open records.
     *
     * @param recordId {string} the IRI of the record to close.
     */
    closeShapesGraph(recordId: string): void {
        remove(this.list, item => item.versionedRdfRecord.recordId === recordId);
    }
    /**
     * Deletes the shapes graph record and its corresponding state.
     *
     * @param recordId {string} the IRI of the record to delete.
     * @return {Promise} A Promise that resolves if the delete was successful or not.
     */
    deleteShapesGraph(recordId: string): Promise<any> {
        return this.deleteState(recordId)
            .then(() => {
                return this.sgm.deleteShapesGraphRecord(recordId);
            }, error => Promise.reject(error));
    }

    /**
     * Changes the open shapes graph to a different version (branch/tag/commit) based on the provided fields.
     *
     * @param recordId {string} the IRI of the record to open.
     * @param branchId {string} the IRI of the branch to open.
     * @param commitId {string} the IRI of the commit to open.
     * @param tagId {string} the IRI of the tag to open.
     * @param versionTitle {string} the title of the version to open.
     * @param clearInProgressCommit {boolean} indicates whether the inProgressCommit should be cleared.
     * @param changesPageOpen {boolean} indicates whether or not to open the changes page.
     * @return {Promise} A Promise that resolves if the version change was successful or not.
     */
    changeShapesGraphVersion(recordId: string, branchId: string, commitId: string, tagId: string, versionTitle: string,
                             clearInProgressCommit=false, changesPageOpen=false): Promise<any> {
        const state = {
            recordId,
            branchId,
            commitId,
            tagId
        } as VersionedRdfStateBase;
        return this.updateState(state).then(() => {
            const title = this.listItem.versionedRdfRecord.title;
            remove(this.list, this.listItem);
            const item = new ShapesGraphListItem();
            item.versionedRdfRecord = {
                recordId,
                branchId,
                commitId,
                tagId,
                title
            };
            item.currentVersionTitle = versionTitle ? versionTitle : this.listItem.currentVersionTitle;
            if (this.listItem.inProgressCommit && !clearInProgressCommit) {
                item.inProgressCommit = this.listItem.inProgressCommit;
            }
            if (clearInProgressCommit) {
                item.inProgressCommit = new Difference();
            }
            item.changesPageOpen = changesPageOpen;
            this.listItem = item;
            return this.updateShapesGraphMetadata(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId);
        }, error => Promise.reject(error));
    }
    /**
     * Deletes a branch for a given ShapesGraphRecord.
     *
     * @param recordId {string} the IRI of the record.
     * @param branchId {string} the IRI of the branch to delete.
     * @return {Promise} A Promise that resolves if the branch deletion was successful or not.
     */
    deleteShapesGraphBranch(recordId: string, branchId: string): Promise<any> {
        return this.cm.deleteRecordBranch(branchId, recordId, this.catalogId)
            .then(() => this.deleteBranchState(recordId, branchId), error => Promise.reject(error));
    }
    /**
     * Performs a merge of a branch into another and updates the state.
     *
     * @return {Promise} A Promise that resolves if the merge was successful or not.
     */
    merge(): Promise<any> {
        const sourceId = this.listItem.versionedRdfRecord.branchId;
        const checkbox = this.listItem.merge.checkbox;
        let commitId;
        return this.cm.mergeBranches(sourceId, this.listItem.merge.target['@id'], this.listItem.versionedRdfRecord.recordId, this.catalogId, this.listItem.merge.resolutions)
            .then(commit => {
                commitId = commit;
                if (checkbox) {
                    return this.deleteShapesGraphBranch(this.listItem.versionedRdfRecord.recordId, sourceId);
                } else {
                    return Promise.resolve();
                }
            }, error => Promise.reject(error))
            .then(() => {
                return this.changeShapesGraphVersion(this.listItem.versionedRdfRecord.recordId, this.listItem.merge.target['@id'], commitId, undefined, this.util.getDctermsValue(this.listItem.merge.target, 'title'));
            }, error => Promise.reject(error));
    }

    canModify(): boolean {
        if (!this.listItem.versionedRdfRecord.branchId) {
            return false;
        }
        if (this.listItem.masterBranchIri === this.listItem.versionedRdfRecord.branchId) {
            return this.listItem.userCanModifyMaster;
        } else {
            return this.listItem.userCanModify;
        }
    }
}