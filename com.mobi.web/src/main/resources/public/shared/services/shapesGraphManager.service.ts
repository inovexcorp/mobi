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
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { forEach, get } from 'lodash';

import { REST_PREFIX } from '../../constants';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { HelperService } from './helper.service';
import { RdfUpdate } from '../models/rdfUpdate.interface';

/**
 * @class shared.ShapesGraphManagerService
 *
 * A service that provides access to the Mobi SHACL shapes graphs REST endpoints for adding, removing, and editing Mobi
 * SHACL shapes graphs.
 */
@Injectable()
export class ShapesGraphManagerService {
    prefix = REST_PREFIX + 'shapes-graphs';

    constructor(private http: HttpClient, private helper: HelperService, @Inject('utilService') private util) {}

    /**
     * Calls the POST /mobirest/shapes-graphs endpoint to upload a SHACL shapes graph to Mobi. Returns a Promise that
     * resolves with the result of the call if it was successful and rejects with an error message if it was not.
     *
     * @param {RdfUpload} newRecord the new SHACL record to add
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message otherwise
     */
    createShapesGraphRecord(newRecord: RdfUpload): Promise<VersionedRdfUploadResponse> {
        const fd = new FormData();
        fd.append('title', newRecord.title);
        if (newRecord.jsonld) {
            fd.append('json', JSON.stringify(newRecord.jsonld));
        }
        if (newRecord.file) {
            fd.append('file', newRecord.file);
        }
        if (newRecord.description) {
            fd.append('description', newRecord.description);
        }
        forEach(get(newRecord, 'keywords', []), keyword => fd.append('keywords', keyword));

        return this.http.post(this.prefix, fd)
            .toPromise()
            .then((response: any) => this.getVersionedRdfUpload(response), this.util.rejectErrorObject);
    }
    /**
     * Calls the GET /mobirest/shapes-graphs/{recordId} endpoint using the `window.location` variable which will
     * start a download of the SHACL shapes graph starting at the identified Commit.
     *
     * @param {RdfDownload} rdfDownload the VersionedRdfRecord download parameters
     */
    downloadShapesGraph(rdfDownload: RdfDownload): void {
        const params = this.helper.createHttpParams({
            branchId: rdfDownload.branchId,
            commitId: rdfDownload.commitId,
            rdfFormat: rdfDownload.rdfFormat || 'jsonld',
            fileName: rdfDownload.fileName || 'shapesGraph'
        });
        this.util.startDownload(this.prefix + '/' + encodeURIComponent(rdfDownload.recordId) + '?' + params);
    }

    /**
     * Calls the DELETE /mobirest/shapes-graphs/{recordId} endpoint to delete a SHACL shapes graph record. Returns
     * a Promise that resolves if it was successful and rejects with an error message if it was not.
     *
     * @param {string} recordId the iri of the SHACL shapes graph record to delete
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message otherwise
     */
    deleteShapesGraphRecord(recordId: string): Promise<any> {
        return this.http.delete(`${this.prefix}/${encodeURIComponent(recordId)}`)
            .toPromise().then((response: any) => response, this.util.rejectErrorObject);
    }

    /**
     * Calls the PUT /mobirest/shapes-graphs/{recordId} endpoint which will update the in-progress commit
     * object to be applied to the shapes graph.
     *
     * @param {RdfUpdate} rdfUpdate the uploaded SHACL shapes graph
     * @returns {Promise} A Promise that resolves if the request was successful; rejects with an error message otherwise
     */
    uploadChanges(rdfUpdate: RdfUpdate): Promise<any> {
        const fd = new FormData();
        if (rdfUpdate.file) {
            fd.append('file', rdfUpdate.file);
        }
        if (rdfUpdate.branchId) {
            fd.append('branchId', rdfUpdate.branchId);
        }
        if (rdfUpdate.commitId) {
            fd.append('commitId', rdfUpdate.commitId);
        }
        if (rdfUpdate.jsonld) {
            fd.append('json', JSON.stringify(rdfUpdate.jsonld));
        }
        if (rdfUpdate.replaceInProgressCommit) {
            fd.append('replaceInProgressCommit', rdfUpdate.replaceInProgressCommit ? 'true' : 'false');
        }
        return this.http.put(`${this.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`, fd, { observe: 'response'}).toPromise().then((response: any) => response, this.util.rejectErrorObject);
    }

    /**
     * Returns a VersionedRdfUploadResponse from the provided response.
     *
     * @returns {any} A VersionedRdfUploadResponse
     * @param response a response object
     */
    private getVersionedRdfUpload(response: any): VersionedRdfUploadResponse {
        return {
            shapesGraphId: response.shapesGraphId,
            recordId: response.recordId,
            branchId: response.branchId,
            commitId: response.commitId
        };
    }
}
