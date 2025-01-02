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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { has } from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { SETTING, SHACL } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { SettingConstants } from '../models/settingConstants.class';
import { ToastService } from './toast.service';
import { createHttpParams, getPropertyValue, handleError, handleErrorObject } from '../utility';

/**
 * @class shared.SettingManagerService
 *
 * A service that provides access to the Mobi Settings REST endpoints and variables
 * to hold information about the different types of settings.
 */
@Injectable()
export class SettingManagerService {
    prefix = `${REST_PREFIX}settings`;
    prefSettingType = { iri: `${SETTING}Preference`, userText: 'Preferences'};
    appSettingType = { iri: `${SETTING}ApplicationSetting`, userText: 'Application Settings'};
    
    namespaceGroup = 'http://mobi.com/ontologies/namespace#NamespaceApplicationSettingGroup';
    defaultOntologyNamespaceSetting = 'http://mobi.com/ontologies/namespace#DefaultOntologyNamespaceApplicationSetting';
    defaultOntologyNamespacePropertyShape = 'http://mobi.com/ontologies/namespace#DefaultOntologyNamespaceApplication'
        + 'SettingPropertyShape';

    constructor(private http: HttpClient, private toast: ToastService, private spinnerSvc: ProgressSpinnerService) {}

    getDefaultNamespace(): Observable<string> {
        return this.getApplicationSettingByType(this.defaultOntologyNamespaceSetting).pipe(
            switchMap(response => {
                const applicationSetting = response;
                if (applicationSetting.length > 1) {
                    this.toast.createErrorToast('Too many values present for application setting');
                    return throwError('');
                } else if (applicationSetting.length === 1) {
                    const defaultNamespace = applicationSetting[0];
                    if (has(defaultNamespace, SettingConstants.HAS_DATA_VALUE)) {
                        return of(getPropertyValue(defaultNamespace, SettingConstants.HAS_DATA_VALUE));
                    }
                    return throwError('');
                } else {
                    this.toast.createErrorToast('No values found for application setting. For some reason, endpoint '
                        + 'did not return error.');
                    return throwError('');
                }
            }),
            catchError(() => {
                return this.getApplicationSettingDefinitions(this.namespaceGroup).pipe(
                    switchMap(response => {
                        const newArray = response.filter(el => {
                            return el['@id'] === this.defaultOntologyNamespacePropertyShape;
                        });
                        if (newArray.length !== 1) {
                            this.toast.createErrorToast(`Number of matching property shapes must be one, not ${newArray.length}`);
                            return throwError('');
                        }
                        const defaultNamespacePropertyShape = newArray[0];
                        if (has(defaultNamespacePropertyShape, `${SHACL}defaultValue`)) {
                            return of(getPropertyValue(defaultNamespacePropertyShape, `${SHACL}defaultValue`));
                        } else {
                            this.toast.createErrorToast('No default value found for default namespace');
                            return throwError('');
                        }
                    }),
                    catchError(() => {
                        this.toast.createErrorToast('Could not retrieve setting definitions');
                        return throwError('');
                    })
                );
            }),
        );
    }

    /**
     * Retrieve all user preferences for active user
     *
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the GET settings endpoint or is
     * rejected with an error message
     */
    getUserPreferences(isTracked = false): Observable<{ [key: string]: JSONLDObject[] }> {
        return this.getSettings(this.prefSettingType.iri, isTracked);
    }

    /**
     * Retrieve all application settings in the system
     *
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the GET settings endpoint or is
     * rejected with an error message
     */
    getApplicationSettings(isTracked = false): Observable<{ [key: string]: JSONLDObject[] }> {
        return this.getSettings(this.appSettingType.iri, isTracked);
    }

    /**
     * @description
     * Makes a call to GET /mobirest/settings to get a JSON object of all settings and
     * referenced entities of the passed in setting type. The return object will have a
     * key for each setting subType that has been previously created and values that are
     * a json-ld representation of the instance of Setting and referenced entities that
     * they have previously created for that type.
     * 
     * @param {string} type The setting type to get settings for
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getSettings(type: string, isTracked = false): Observable<{ [key: string]: JSONLDObject[] }> {
        const params = { type };
        const request = this.http.get<{ [key: string]: JSONLDObject[] }>(this.prefix, 
            { params: createHttpParams(params) });
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }

    /**
     * Get the specific application setting in the repo for the given application setting type.
     *
     * @param {string} applicationSettingType The specific type of application setting to retrieve
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getApplicationSettingByType(applicationSettingType: string, isTracked = false): Observable<JSONLDObject[]> {
        return this.getSettingByType(this.appSettingType.iri, applicationSettingType, isTracked);
    }

    /**
     * Get the specific application setting in the repo for the given user preference type.
     *
     * @param {string} preferenceType The specific type of user preference to retrieve
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getUserPreferenceByType(preferenceType: string, isTracked = false): Observable<JSONLDObject[]> {
        return this.getSettingByType(this.prefSettingType.iri, preferenceType, isTracked);
    }

    /**
     * Makes a call to GET /mobirest/settings/types/{settingSubType} to get a JSON array consisting of the json-ld 
     * representation of the current value of the setting for the given setting subType and setting type as well as
     * all referenced entities.
     *
     * @param {string} type The setting type to retrieve a setting for
     * @param {string} settingSubType The specific setting subType to retrieve
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getSettingByType(type: string, settingSubType: string, isTracked = false): Observable<JSONLDObject[]> {
        const params = { type };
        const request = this.http.get<JSONLDObject[]>(`${this.prefix}/types/${encodeURIComponent(settingSubType)}`, 
            {params: createHttpParams(params)});
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }

    /**
     * Updates the existing user preference identified by the preferenceId with the passed in user preference.
     *
     * @param {string} preferenceId The id of the user preference that will be updated 
     * @param {string} preferenceType The type of user preference being updated
     * @param {JSONLDObject[]} userPreference The JSON-LD containing the new user preference values and referenced 
     * entities
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error object
     */
    updateUserPreference(preferenceId: string, preferenceType: string, userPreference: JSONLDObject[], 
      isTracked = false): Observable<void> {
        return this.updateSetting(this.prefSettingType.iri, preferenceId, preferenceType, userPreference, isTracked);
    }

    /**
     * Updates the existing application setting identified by the applicationSettingId with the passed in
     * applicationSetting.
     *
     * @param {string} applicationSettingId The id of the application setting that will be updated 
     * @param {string} applicationSettingType The type of application setting being updated
     * @param {JSONLDObject[]} applicationSetting The JSON-LD containing the new application setting values and 
     * referenced entities
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error object
     */
    updateApplicationSetting(applicationSettingId: string, applicationSettingType: string, 
      applicationSetting: JSONLDObject[], isTracked = false): Observable<void> {
        return this.updateSetting(this.appSettingType.iri, applicationSettingId, applicationSettingType, 
            applicationSetting, isTracked);
    }

    /**
     * Calls the PUT /mobirest/settings/{settingId} endpoint and updates the Setting with the passed in settingId
     * using the JSON-LD provided in the passed in object. Errors are returned in the form of a {@link RESTError}.
     *
     * @param {string} type The setting type of the setting to be updated
     * @param {string} settingId The id of the setting that will be updated 
     * @param {string} subType The specific subType of setting being updated
     * @param {JSONLDObject[]} setting The JSON-LD containing the new setting values and referenced entities
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error object
     */
    updateSetting(type: string, settingId: string, subType: string, setting: JSONLDObject[], 
      isTracked = false): Observable<void> {
        const params = { subType, type };
        const request = this.http.put(`${this.prefix}/${encodeURIComponent(settingId)}`, setting, 
            {params: createHttpParams(params)});
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleErrorObject), map(() => {}));
    }

    /**
     * Creates a new user preference in the system using the passed in user preference.
     *
     * @param {string} preferenceType The type of user preference being created
     * @param {JSONLDObject[]} userPreference The JSON-LD containing the new user preference values and referenced 
     * entities
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error object
     */
    createUserPreference(preferenceType: string, userPreference: JSONLDObject[], isTracked = false): Observable<void> {
        return this.createSetting(this.prefSettingType.iri , preferenceType, userPreference, isTracked);
    }

    /**
     * Creates a new application setting in the system using the passed in application setting.
     *
     * @param {string} applicationSettingType The type of application setting being created
     * @param {JSONLDObject[]} userPreference The JSON-LD containing the new application setting values and referenced 
     * entities
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error object
     */
    createApplicationSetting(applicationSettingType: string, applicationSetting: JSONLDObject[], 
      isTracked = false): Observable<void> {
        return this.createSetting(this.appSettingType.iri, applicationSettingType, applicationSetting, isTracked);
    }

    /**
     * Calls the POST /mobirest/settings endpoint and creates an instance of setting as well as it's referenced entities 
     * for of the type defined by the passed in subType using the JSON-LD provided in the passed in object. Errors are
     * returned in the form of a {@link RESTError}.
     *
     * @param {string} type The setting type being updated
     * @param {string} subType The specific subType of setting being updated
     * @param {JSONLDObject[]} setting The JSON-LD containing the new setting values and referenced entities
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error object
     */
    createSetting(type: string, subType: string, setting: JSONLDObject[], isTracked = false): Observable<void> {
        const params = { subType, type };
        const request = this.http.post(this.prefix, setting, {params: createHttpParams(params), responseType: 'text'});
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleErrorObject), map(() => {}));
    }

    /**
     * Makes a call to GET /mobirest/settings/groups to get the JSON-LD representation of each
     * Setting Group currently defined in the repo that correspond to the passed in setting type.
     *
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getSettingGroups(type: string, isTracked = false): Observable<JSONLDObject[]> {
        const params = { type };
        const request = this.http.get<JSONLDObject[]>(`${this.prefix}/groups`, {params: createHttpParams(params)});
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }

    /**
     * Retrieve all preference groups that exist in the system.
     *
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getPreferenceGroups(isTracked = false): Observable<JSONLDObject[]> {
        return this.getSettingGroups(this.prefSettingType.iri, isTracked);
    }

    /**
     * Retrieve all application setting groups that exist in the system.
     *
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getApplicationSettingGroups(isTracked = false): Observable<JSONLDObject[]> {
        return this.getSettingGroups(this.appSettingType.iri, isTracked);
    }

    /**
     * Retrieve all preference definitions that are part of the passed in preference group.
     * 
     * @param {string} settingGroup The preference group to retrieve definitions for
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getPreferenceDefinitions(settingGroup: string, isTracked = false): Observable<JSONLDObject[]> {
        return this.getSettingDefinitions(settingGroup, this.prefSettingType.iri, isTracked);
    }

    /**
     * Retrieve all application setting definitions that are part of the passed in application setting group.
     * 
     * @param {string} applicationSettingGroup The application setting group to retrieve definitions for
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getApplicationSettingDefinitions(applicationSettingGroup: string, isTracked = false): Observable<JSONLDObject[]> {
        return this.getSettingDefinitions(applicationSettingGroup, this.appSettingType.iri, isTracked);
    }

    /**
     * Makes a call to GET /mobirest/settings/groups/{settingGroup}/definitions to get the JSON-LD representation
     * of each setting subType defined in the repo that is declared as being part of the passed in Setting Group.
     *
     * @param {string} settingGroup The setting group to retrieve setting definitions for
     * @param {string} type The type of setting to get definitions for
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getSettingDefinitions(settingGroup: string, type: string, isTracked = false): Observable<JSONLDObject[]> {
        const params = { type };
        const url = `${this.prefix}/groups/${encodeURIComponent(settingGroup)}/definitions`;
        const request = this.http.get<JSONLDObject[]>(url, {params: createHttpParams(params)});
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
}
