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
import { Injectable } from '@angular/core';
import { filter, find, get, includes, remove } from 'lodash';
import { first, switchMap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';

import { CatalogManagerService } from './catalogManager.service';
import { RecordSelectFiltered } from '../../shapes-graph-editor/models/recordSelectFiltered.interface';
import { Difference } from '../models/difference.class';
import { RdfUpload } from '../models/rdfUpload.interface';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { VersionedRdfStateBase } from '../models/versionedRdfStateBase.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { VersionedRdfState } from './versionedRdfState.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { BRANCHID, COMMITID, SHAPESGRAPHSTATE, TAGID, GRAPHEDITOR, DCTERMS, CATALOG } from '../../prefixes';
import { StateManagerService } from './stateManager.service';
import { PolicyManagerService } from './policyManager.service';
import { UtilService } from './util.service';
import { PolicyEnforcementService } from './policyEnforcement.service';

/**
 * @class shared.ShapesGraphStateService
 *
 * A service which contains various variables to hold the state of the Shapes Graph editor
 */
@Injectable()
export class ShapesGraphStateService extends VersionedRdfState<ShapesGraphListItem> {

    constructor(protected sm: StateManagerService,
                protected cm: CatalogManagerService,
                protected util: UtilService,
                protected pep: PolicyEnforcementService,
                private pm: PolicyManagerService,
                private sgm: ShapesGraphManagerService) {
        super(SHAPESGRAPHSTATE,
            BRANCHID,
            TAGID,
            COMMITID,
            GRAPHEDITOR
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
                    .then((arr: Array<JSONLDObject>) => {
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
                        return this.createState(stateBase).pipe(first()).toPromise();
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
        return this.getCatalogDetails(record.recordId).pipe(first()).toPromise()
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
            .then((arr: Array<JSONLDObject>) => {
                this.listItem.metadata = find(arr, {'@id': this.listItem.shapesGraphId});
                return this.sgm.getShapesGraphContent(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId);
            })
            .then(content => {
                this.listItem.content = content;
                return this.cm.getRecordBranches(recordId, this.catalogId).pipe(first()).toPromise();
            })
            .then((branches) => {
                this.listItem.branches = branches.body;
                const masterBranch = find(this.listItem.branches, {[DCTERMS + 'title']: [{'@value': 'MASTER'}]});
                this.listItem.masterBranchIri = masterBranch ? masterBranch['@id'] : '';
                const modifyRequest: any = {
                    resourceId: this.listItem.versionedRdfRecord.recordId,
                    actionId: this.pm.actionModify
                };
                return this.pep.evaluateRequest(modifyRequest).pipe(first()).toPromise();
            })
            .then(decision => {
                const modifyMasterRequest: any = {
                    resourceId: this.listItem.versionedRdfRecord.recordId,
                    actionId: this.pm.actionModify,
                    actionAttrs: { [CATALOG + 'branch']: this.listItem.masterBranchIri }
                };
                this.listItem.userCanModify = decision === this.pep.permit;
                return this.pep.evaluateRequest(modifyMasterRequest).pipe(first()).toPromise();
            })
            .then(decision => {
                this.listItem.userCanModifyMaster = decision === this.pep.permit;
                this.list.push(this.listItem);
                return this.cm.getRecordVersions(this.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(first()).toPromise();
            })
            .then(response => {
                this.listItem.tags = filter(response.body, version => includes(get(version, '@type'), CATALOG + 'Tag'));
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
        return this.deleteState(recordId).toPromise()
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
        return this.updateState(state).pipe(first()).toPromise().then(() => {
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
        return this.cm.deleteRecordBranch(branchId, recordId, this.catalogId).pipe(first()).toPromise()
            .then(() => this.deleteBranchState(recordId, branchId), error => Promise.reject(error));
    }
    /**
     * Performs a merge of a branch into another and updates the state.
     *
     * @return {Observable<null>} An Observable that resolves if the merge was successful or not.
     */
    merge(): Observable<null> {
        const sourceId = this.listItem.versionedRdfRecord.branchId;
        const checkbox = this.listItem.merge.checkbox;
        let commitId;
        return this.cm.mergeBranches(sourceId, this.listItem.merge.target['@id'], this.listItem.versionedRdfRecord.recordId, this.catalogId, this.listItem.merge.resolutions)
            .pipe(
                switchMap(commit => {
                    commitId = commit;
                    if (checkbox) {
                        return from(this.deleteShapesGraphBranch(this.listItem.versionedRdfRecord.recordId, sourceId));
                    } else {
                        return of(1);
                    }
                }),
                switchMap(() => {
                    return from(this.changeShapesGraphVersion(this.listItem.versionedRdfRecord.recordId, this.listItem.merge.target['@id'], commitId, undefined, this.util.getDctermsValue(this.listItem.merge.target, 'title')));
                })
            );
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
