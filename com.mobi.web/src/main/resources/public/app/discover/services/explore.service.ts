/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { ClassDetails } from '../models/classDetails.interface';
import { InstanceDetails } from '../models/instanceDetails.interface';
import { PropertyDetails } from '../models/propertyDetails.interface';
import { getBeautifulIRI, handleError, paginatedConfigToHttpParams } from '../../shared/utility';

/**
 * @class discover.ExploreService
 *
 * @description
 * `exploreService` is a service that provides access to the Mobi explorable-datasets REST
 * endpoints.
 */
@Injectable()
export class ExploreService {
    prefix = `${REST_PREFIX}explorable-datasets/`;
    
    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the GET /mobirest/explorable-datasets/{recordId}/class-details endpoint and returns the array of class
     * details.
     *
     * @returns {Observable} An observable that resolves to an array of the class details for the identified dataset
     * record.
     */
    getClassDetails(recordId: string): Observable<ClassDetails[]> {
        const url = `${this.prefix}${encodeURIComponent(recordId)}/class-details`;
        return this.spinnerSvc.track(this.http.get<ClassDetails[]>(url, {observe: 'body'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/instance-details endpoint and returns
     * the array of instance details.
     *
     * @param {string} recordId The id of the Record
     * @param {string} classId The id of the Class
     * @param {PaginatedConfig} params The paginated configuration for the REST call. Supports just pageIndex and limit
     * @param {boolean} isTracked Whether or not the request is tracked elsewhere
     * @returns {Observable} An observable that resolves to an array of the instance details for the identified class of
     * the identified dataset record.
     */
    getClassInstanceDetails(recordId: string, classId: string, paginatedConfig: PaginatedConfig, 
        isTracked = false): Observable<HttpResponse<InstanceDetails[]>>{
        const params = paginatedConfigToHttpParams(paginatedConfig);
        const url = `${this.prefix}${encodeURIComponent(recordId)}/classes/${encodeURIComponent(classId)}/instance-details`;
        return this._trackedRequest(this.http.get<InstanceDetails[]>(url, { params, observe: 'response' }), isTracked)
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/explorable-datasets/{recordId}/classes/{classId}/property-details endpoint and returns
     * the array of class property details.
     *
     * @param {string} recordId The id of the Record
     * @param {string} classId The id of the Class
     * @returns {Observable} An observable that resolves to an array of the class property details for the identified
     * class of the identified dataset record.
     */
    getClassPropertyDetails(recordId: string, classId: string): Observable<PropertyDetails[]> {
        const url = `${this.prefix}${encodeURIComponent(recordId)}/classes/${encodeURIComponent(classId)}/property-details`;
        return this.spinnerSvc.track(this.http.get<PropertyDetails[]>(url)).pipe(
            catchError(handleError),
            tap(details => {
                details.forEach(detail => {
                    detail.display = getBeautifulIRI(detail.propertyIRI);
                });
            })
        );
    }

    /**
     * Calls the POST /mobirest/explorable-datasets/{recordId}/instances endpoint and returns the
     * instance IRI.
     *
     * @param {string} recordId The id of the Record
     * @param {JSONLDObject} json The JSON-LD of the instance being created
     * @returns {Observable} An observable that resolves to the instance IRI.
     */
    createInstance(recordId: string, json: JSONLDObject[]): Observable<string> {
        const url = `${this.prefix}${encodeURIComponent(recordId)}/instances`;
        return this.spinnerSvc.track(this.http.post(url, json, {responseType: 'text'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/explorable-datasets/{recordId}/instances/{instanceId} endpoint and
     * returns the instance.
     *
     * @param {string} recordId The id of the Record
     * @param {string} instanceId The id of the instance
     * @returns {Observable} An observable that resolves to an instance object defined as the identified class in the
     * identified dataset record.
     */
    getInstance(recordId: string, instanceId: string): Observable<JSONLDObject[]> {
        const url = `${this.prefix}${encodeURIComponent(recordId)}/instances/${encodeURIComponent(instanceId)}`;
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(url))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the PUT /mobirest/explorable-datasets/{recordId}/instances/{instanceId} endpoint and
     * identifies if the instance was updated.
     *
     * @param {string} recordId The id of the Record
     * @param {string} instanceId The id of the instance
     * @param {Object} json The JSON-LD object of the new instance
     * @returns {Observable} A promise that indicates if the instance was updated successfully.
     */
    updateInstance(recordId: string, instanceId: string, json: JSONLDObject[]): Observable<void> {
        const url = `${this.prefix}${encodeURIComponent(recordId)}/instances/${encodeURIComponent(instanceId)}`;
        return this.spinnerSvc.track(this.http.put(url, json)).pipe(
            catchError(handleError),
            map(() => {})
        );
    }

    /**
     * Calls the DELETE /mobirest/explorable-datasets/{recordId}/classes/{classId}/instances/{instanceId} endpoint and
     * identifies if the instance was deleted.
     *
     * @param {string} recordId The id of the Record
     * @param {string} instanceId The id of the instance
     * @returns {Observable} A promise that indicates if the instance was deleted successfully.
     */
    deleteInstance(recordId: string, instanceId: string): Observable<void> {
        const url = `${this.prefix}${encodeURIComponent(recordId)}/instances/${encodeURIComponent(instanceId)}`;
        return this.spinnerSvc.track(this.http.delete(url)).pipe(
            catchError(handleError),
            map(() => {})
        );
    }

    /**
     * Creates an object which contains all of the paginated details from the provided response in the expected format.
     *
     * @param {HttpResponse} response The response of an HttpClient call which should contain paginated details in the
     * header.
     * @returns An object which contains all of the paginated details in the expected format.
     */
    createPagedResultsObject<Type>(response: HttpResponse<Type>): { data: Type, total: number } {
        return {
            data: response.body,
            total: Number(response.headers.get('x-total-count'))
        };
    }

    private _trackedRequest(request, tracked: boolean) {
        if (tracked) {
            return request;
        } else {
            return this.spinnerSvc.track(request);
        }
    }
}
