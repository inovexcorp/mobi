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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { RecordPermissions } from '../models/recordPermissions.interface';
import { UtilService } from './util.service';

/**
 * @class shared.RecordPermissionsManagerService
 *
 * A service that provides access to the Mobi policy REST endpoints and variables with common IRIs used in policies.
 */
@Injectable()
export class RecordPermissionsManagerService {
    prefix = REST_PREFIX + 'record-permissions';
    
    constructor(private http: HttpClient, private util: UtilService, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the GET /mobirest/record-permissions/{recordId} endpoint to get the Record Policy JSON
     * representation of users who are permitted to perform each action (read, delete, update, modify,
     * modifyMaster)  for the provided ID.
     *
     * @param {string} recordId The ID of a Record whose Record Policy JSON to retrieve
     * @return {Observable} An Observable that resolves with the matching Record Policy JSON if found or is rejected
     * with an error message
     */
    getRecordPolicy(recordId: string): Observable<RecordPermissions> {
        return this.spinnerSvc.track(this.http.get<RecordPermissions>(this.prefix + '/' + encodeURIComponent(recordId)))
            .pipe(catchError(this.util.handleError));
    }

    /**
     * Calls the PUT /mobirest/record-permissions/{recordId} endpoint with the provided new Policy object and updates
     * the Policy with the associated recordId.
     *
     * @param {string} recordId The ID of a Record whose Record Policy JSON to update
     * @param {RecordPermissions} newPolicy A Policy JSON object to replace the original with
     * @return {Observable} An Observable that resolves if the update was successful or is rejected with an error
     * message
     */
    updateRecordPolicy(recordId: string, newPolicy: RecordPermissions): Observable<null> {
        return this.spinnerSvc.track(this.http.put(this.prefix + '/' + encodeURIComponent(recordId), newPolicy))
            .pipe(catchError(this.util.handleError));
    }
}
