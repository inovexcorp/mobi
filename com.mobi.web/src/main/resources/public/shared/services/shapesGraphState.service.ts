/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { get, remove } from 'lodash';
import { RecordSelectFiltered } from '../../shapes-graph-editor/models/recordSelectFiltered.interface';
import { Difference } from '../models/difference.class';
import { RdfUpload } from '../models/rdfUpload.interface';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { VersionedRdfState } from './versionedRdfState.service';

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
                private sgm: ShapesGraphManagerService) {
        super(prefixes.shapesGraphState,
            'http://mobi.com/states/shapes-graph-editor/branch-id/',
            'http://mobi.com/states/shapes-graph-editor/tag-id/',
            'http://mobi.com/states/shapes-graph-editor/commit-id/',
            'shapes-graph-editor',
            get(cm.localCatalog, '@id', '')
        );
    }

    /**
     * Resets all the main state variables.
     */
    reset(): void {
        this.listItem = new ShapesGraphListItem();
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
                this.listItem = listItem;
                this.list.push(listItem);
                const stateBase: VersionedRdfStateBase = {
                    recordId: response.recordId,
                    commitId: response.commitId,
                    branchId: response.branchId
                };
                return this.createState(stateBase);
            }, error => Promise.reject(error));
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
                listItem.shapesGraphId = response.recordId; // TODO: this should be retrieved from the record's shapesGraphId
                listItem.versionedRdfRecord = {
                    title: record.title,
                    recordId: response.recordId,
                    branchId: response.branchId,
                    commitId: response.commitId
                };
                listItem.inProgressCommit = response.inProgressCommit;
                listItem.changesPageOpen = false;

                this.listItem = listItem;
                this.list.push(this.listItem);
                return Promise.resolve();
            }, error => Promise.reject(error));
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
     * @return {Promise} A Promise that resolves if the version change was successful or not.
     */
    changeShapesGraphVersion(recordId: string, branchId: string, commitId: string, tagId: string, versionTitle: string, clearInProgressCommit=false): Promise<any> {
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
                title
            };
            item.currentVersionTitle = versionTitle ? versionTitle : this.listItem.currentVersionTitle;
            if (this.listItem.inProgressCommit && !clearInProgressCommit) {
                item.inProgressCommit = this.listItem.inProgressCommit;
            }
            this.listItem = item;
            this.list.push(this.listItem);
            return Promise.resolve();
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
}