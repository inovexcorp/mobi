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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { get, remove, set } from 'lodash';
import { Observable, of } from 'rxjs';

import { catchError, map } from 'rxjs/operators';
import { REST_PREFIX } from '../../constants';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { State } from '../models/state.interface';
import { ToastService } from './toast.service';
import { createHttpParams, handleError } from '../utility';

/**
 * @class shared.StateManagerService
 *
 * A service that provides access to the Mobi state REST endpoints and the `states` variable which holds all the state
 * for the currently logged in user.
 */
@Injectable()
export class StateManagerService {
    prefix = `${REST_PREFIX}states`;

    constructor(private http: HttpClient, private toast: ToastService) {}

    /**
     * `states` holds the list of all states for the current user.
     * @type {State[]}
     */
    states: State[] = [];

    /**
     * Initializes the `states` variable using the `getStates` method. If the states cannot be retrieved,
     * creates an error toast.
     *
     * @returns {Observable<null>} An Observable that resolves whether the initialization was successful or not
     */
    initialize(): Observable<null> {
        return this.getStates().pipe(
            map(states => {
                this.states = states;
                return null;
            }),
            catchError(() => {
                this.toast.createErrorToast('Problem getting states');
                return of(null);
            })
        );
    }
    /**
     * Calls the GET /mobirest/states endpoint with the provided parameters and returns the array of state
     * objects.
     *
     * @param {Object} stateConfig The query parameters to add to the request
     * @returns {Observable<State[]>} An Observable that resolves to the array of state objects or rejects with an error 
     * message
     */
    getStates(applicationId = '', subjects: string[] = []): Observable<State[]> {
        const params = createHttpParams({
            applicationId,
            subjects
        });
        return this.http.get<State[]>(this.prefix, { params })
            .pipe(catchError(handleError));
    }
    /**
     * Calls the POST /mobirest/states endpoint with the provided state JSON-LD and a string identifying the
     * application that state will be for. If the state was created successfully, it is added to the `states`
     * array. Returns a Promise.
     *
     * @param {JSONLDObject[]} stateJson A JSON-LD array of the state data.
     * @param {string} application A string identifying the application the state will belong to
     * @returns {Observable<null>} An Observable that resolves if the creation was successful or rejects with an error 
     * message
     */
    createState(stateJson: JSONLDObject[], application?: string): Observable<null> {
        const headers = new HttpHeaders().append('Content-Type', 'application/json');
        const params = createHttpParams(application ? { application } : {});
        return this.http.post(this.prefix, stateJson, { headers, params, responseType: 'text' }).pipe(
            catchError(handleError),
            map(stateId => {
                this.states.push({id: stateId, model: stateJson});
                return null;
            })
        );
    }
    /**
     * Calls the GET /mobirest/states/{stateId} endpoint with the provided state IRI string to retrieve a
     * state object. Returns a Promise with the state object.
     *
     * @param {string} stateId A string identifying the state to retrieve
     * @returns {Observable<State>} An Observable that resolves with the identified state object or rejects with an
     * error message
     */
    getState(stateId: string): Observable<State> {
        return this.http.get<State>(`${this.prefix}/${encodeURIComponent(stateId)}`)
            .pipe(catchError(handleError));
    }
    /**
     * Calls the PUT /mobirest/states/{stateId} endpoint and updates the identified state with the provided IRI
     * string with the provided JSON-LD array of new data. If the update was successful, updates the `states`
     * array with the new model data. Returns a Promise indicating the success.
     *
     * @param {string} stateId A string identifying the state to retrieve
     * @param {JSONLDObject[]} stateJson A JSON-LD array of the new state data
     * @returns {Observable<null>} An Observable that resolves if the update was successful or rejects with an error 
     * message
     */
    updateState(stateId: string, stateJson: JSONLDObject[]): Observable<null> {
        return this.http.put(`${this.prefix}/${encodeURIComponent(stateId)}`, stateJson).pipe(
            catchError(handleError),
            map(() => {
                this.states.forEach(state => {
                    if (get(state, 'id', '') === stateId) {
                        set(state, 'model', stateJson);
                        return false;
                    }
                });
                return null;
            })
        );
    }
    /**
     * Calls the DELETE /mobirest/states/{stateId} endpoint to remove the identified state object with the
     * provided IRI from the application. If the deletion was successful, updates the `states` array. Returns a
     * Promise indicating the success.
     *
     * @param {string} stateId A string identifying the state to delete
     * @returns {Observable} An Observable that resolves if the deletion was successful or rejects with an error message
     */
    deleteState(stateId: string): Observable<null> {
        return this.http.delete(`${this.prefix}/${encodeURIComponent(stateId)}`).pipe(
            catchError(handleError),
            map(() => {
                remove(this.states, {id: stateId});
                return null;
            })
        );
    }
}
