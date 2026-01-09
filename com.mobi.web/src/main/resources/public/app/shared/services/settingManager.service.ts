/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { createHttpParams, getPropertyValue, handleError, handleErrorObject } from '../utility';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { ONTOLOGYEDITOR, SETTING, SH, SHAPESGRAPHEDITOR } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { REST_PREFIX } from '../../constants';
import { SettingConstants } from '../models/settingConstants.class';
import { ToastService } from './toast.service';

interface NamespaceSetting {
  setting: string,
  propertyShape: string
}

/**
 * @class SettingManagerService
 *
 * A service that provides access to the Mobi Settings REST endpoints and variables
 * to hold information about the different types of settings.
 */
@Injectable()
export class SettingManagerService {
  private readonly NAMESPACE_PREFIX = 'http://mobi.com/ontologies/namespace#';
  private readonly EDITOR_PREFIX = 'https://mobi.solutions/ontologies/editor#';

  public readonly namespaceGroup = `${this.NAMESPACE_PREFIX}NamespaceApplicationSettingGroup`;
  public readonly defaultNamespaceMap: Record<string, NamespaceSetting> = {
    [`${ONTOLOGYEDITOR}OntologyRecord`]: {
      setting: `${this.NAMESPACE_PREFIX}DefaultOntologyNamespaceApplicationSetting`,
      propertyShape: `${this.NAMESPACE_PREFIX}DefaultOntologyNamespaceApplicationSettingPropertyShape`
    },
    [`${SHAPESGRAPHEDITOR}ShapesGraphRecord`]: {
      setting: `${this.NAMESPACE_PREFIX}DefaultShapesGraphNamespaceApplicationSetting`,
      propertyShape: `${this.NAMESPACE_PREFIX}DefaultShapesGraphNamespaceApplicationSettingPropertyShape`,
    }
  };

  public readonly prefix = `${REST_PREFIX}settings`;
  public readonly prefSettingType = {iri: `${SETTING}Preference`, userText: 'Preferences'};
  public readonly appSettingType = {
    iri: `${SETTING}ApplicationSetting`,
    userText: 'Application Settings'
  };

  constructor(private _http: HttpClient, private _toast: ToastService, private _spinnerSvc: ProgressSpinnerService) {}

  /**
   * Retrieves the default namespace value that is set for the Application Setting based on the type of record
   * provided. If the provided string does not match one of the known record types with a default namespace, returns
   * an Error Observable. In all "error" states, such as too many Application Setting instances or missing the
   * hasDataValue property, falls back to the default value set on the Application Setting definition itself.
   *
   * @param {string} type The IRI of a VersionedRDFRecord subclass
   * @returns {Observable} An Observable that resolves with the default namespace for the provided VersionedRDFRecord
   *    subclass from the instance of the appropriate Application Setting; rejects otherwise
   */
  getDefaultNamespace(type: string): Observable<string> {
    if (!this.defaultNamespaceMap[type]) {
      return throwError(`No setting found for record type ${type}`);
    }
    return this.getApplicationSettingByType(this.defaultNamespaceMap[type].setting).pipe(
      switchMap(response => {
        const applicationSetting = response;
        if (applicationSetting.length > 1) {
          this._toast.createErrorToast('Issue retrieving value for default namespace. Please contact support.');
          return throwError('Too many values present for application setting');
        } else if (applicationSetting.length === 1) {
          const defaultNamespace = applicationSetting[0];
          if (has(defaultNamespace, SettingConstants.HAS_DATA_VALUE)) {
            return of(getPropertyValue(defaultNamespace, SettingConstants.HAS_DATA_VALUE));
          }
          return throwError('');
        } else {
          this._toast.createErrorToast('Issue retrieving value for default namespace. Please contact support.');
          return throwError('');
        }
      }),
      catchError(() => this.getDefaultNamespaceFromSetting(type))
    );
  }

  /**
   * Retrieves the default namespace value that is set on the definition of the Application Setting via the
   * sh:defaultValue property based on the type of record provided. If the provided string does not match one of the
   * known record types with a default namespace, returns an Error Observable. Error Observables are also returned
   * for a number of "error" states such as missing the required Property Shape definition, the sh:defaultValue
   * property, etc.
   *
   * @param {string} type The IRI of a VersionedRDFRecord subclass
   * @returns {Observable} An Observable that resolves with the default namespace for the provided VersionedRDFRecord
   *    subclass from the appropriate Application Setting definition; rejects otherwise
   */
  getDefaultNamespaceFromSetting(type: string): Observable<string> {
    if (!this.defaultNamespaceMap[type]) {
      return throwError(`No setting found for record type ${type}`);
    }
    return this.getApplicationSettingDefinitions(this.namespaceGroup).pipe(
      switchMap(response => {
        const newArray = response.filter(el => el['@id'] === this.defaultNamespaceMap[type].propertyShape);
        if (newArray.length !== 1) {
          this._toast.createErrorToast(`Number of matching property shapes must be one, not ${newArray.length}`);
          return throwError('');
        }
        const defaultNamespacePropertyShape = newArray[0];
        if (has(defaultNamespacePropertyShape, `${SH}defaultValue`)) {
          return of(getPropertyValue(defaultNamespacePropertyShape, `${SH}defaultValue`));
        } else {
          this._toast.createErrorToast('No default value found for default namespace');
          return throwError('');
        }
      }), catchError(() => {
        this._toast.createErrorToast('Could not retrieve setting definitions');
        return throwError('');
      })
    );
  }

  /**
   * Retrieve all user preferences for active user
   *
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the GET settings endpoint or is
   * rejected with an error message
   */
  getUserPreferences(isTracked = false): Observable<{ [key: string]: JSONLDObject[] }> {
    return this.getSettings(this.prefSettingType.iri, isTracked);
  }

  /**
   * Retrieve all application settings in the system
   *
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error message
   */
  getSettings(type: string, isTracked = false): Observable<{ [key: string]: JSONLDObject[] }> {
    const params = {type};
    const request = this._http.get<{ [key: string]: JSONLDObject[] }>(this.prefix,
      {params: createHttpParams(params)});
    return this._spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
  }

  /**
   * Get the specific application setting in the repo for the given application setting type.
   *
   * @param {string} applicationSettingType The specific type of application setting to retrieve
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error message
   */
  getSettingByType(type: string, settingSubType: string, isTracked = false): Observable<JSONLDObject[]> {
    const params = {type};
    const request = this._http.get<JSONLDObject[]>(`${this.prefix}/types/${encodeURIComponent(settingSubType)}`,
      {params: createHttpParams(params)});
    return this._spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
  }

  /**
   * Updates the existing user preference identified by the preferenceId with the passed in user preference.
   *
   * @param {string} preferenceId The id of the user preference that will be updated
   * @param {string} preferenceType The type of user preference being updated
   * @param {JSONLDObject[]} userPreference The JSON-LD containing the new user preference values and referenced
   * entities
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error object
   */
  updateSetting(type: string, settingId: string, subType: string, setting: JSONLDObject[],
                isTracked = false): Observable<void> {
    const params = {subType, type};
    const request = this._http.put(`${this.prefix}/${encodeURIComponent(settingId)}`, setting,
      {params: createHttpParams(params)});
    return this._spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleErrorObject), map(() => {
    }));
  }

  /**
   * Creates a new user preference in the system using the passed in user preference.
   *
   * @param {string} preferenceType The type of user preference being created
   * @param {JSONLDObject[]} userPreference The JSON-LD containing the new user preference values and referenced
   * entities
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error object
   */
  createUserPreference(preferenceType: string, userPreference: JSONLDObject[], isTracked = false): Observable<void> {
    return this.createSetting(this.prefSettingType.iri, preferenceType, userPreference, isTracked);
  }

  /**
   * Creates a new application setting in the system using the passed in application setting.
   *
   * @param {string} applicationSettingType The type of application setting being created
   * @param {JSONLDObject[]} applicationSetting The JSON-LD containing the new application setting values and referenced
   * entities
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error object
   */
  createSetting(type: string, subType: string, setting: JSONLDObject[], isTracked = false): Observable<void> {
    const params = {subType, type};
    const request = this._http.post(this.prefix, setting, {params: createHttpParams(params), responseType: 'text'});
    return this._spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleErrorObject), map(() => {
    }));
  }

  /**
   * Makes a call to GET /mobirest/settings/groups to get the JSON-LD representation of each
   * Setting Group currently defined in the repo that correspond to the passed in setting type.
   *
   * @param {string} type The IRI of the type of Setting to find groups for (Application Setting or User Preference)
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error message
   */
  getSettingGroups(type: string, isTracked = false): Observable<JSONLDObject[]> {
    const params = {type};
    const request = this._http.get<JSONLDObject[]>(`${this.prefix}/groups`, {params: createHttpParams(params)});
    return this._spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
  }

  /**
   * Retrieve all preference groups that exist in the system.
   *
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error message
   */
  getPreferenceGroups(isTracked = false): Observable<JSONLDObject[]> {
    return this.getSettingGroups(this.prefSettingType.iri, isTracked);
  }

  /**
   * Retrieve all application setting groups that exist in the system.
   *
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
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
   * @param {boolean} isTracked Whether the request should be tracked by the {@link ProgressSpinnerService}
   * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
   * error message
   */
  getSettingDefinitions(settingGroup: string, type: string, isTracked = false): Observable<JSONLDObject[]> {
    const params = {type};
    const url = `${this.prefix}/groups/${encodeURIComponent(settingGroup)}/definitions`;
    const request = this._http.get<JSONLDObject[]>(url, {params: createHttpParams(params)});
    return this._spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
  }

  /**
   * Retrieves the user's current annotation preference as an observable string value.
   * If there are issues retrieving the value, such as multiple matching preferences
   * or no valid data, falls back to a default derived from the preference definition.
   *
   * @return {Observable<string>} An observable that emits the annotation preference value,
   * or throws an error if it cannot be determined.
   */
  getAnnotationPreference(): Observable<string> {
    const errorMsg = 'Issue retrieving current value for Default Annotation preference. Utilizing default value.';
    const annotationIRI = `${this.EDITOR_PREFIX}DefaultAnnotationPreference`;
    const preferenceGroupIRI = `${this.EDITOR_PREFIX}EditorPreferencesGroup`;

    return this.getUserPreferenceByType(annotationIRI).pipe(
      switchMap(preferences => {
        if (preferences && preferences.length > 1) {
          this._toast.createErrorToast(errorMsg);
          return throwError('Number of matching preferences must be one, not ' + preferences.length);
        } else if (preferences && preferences.length === 1) {
          const annotationPreference = preferences[0];
          if (has(annotationPreference, SettingConstants.HAS_DATA_VALUE)) {
            return of(getPropertyValue(annotationPreference, SettingConstants.HAS_DATA_VALUE));
          }
          return throwError('');
        } else {
          this._toast.createErrorToast(errorMsg);
          return throwError('');
        }
      }),
      catchError(() => this._getPreferenceFromDefinition(preferenceGroupIRI, annotationIRI))
    );
  }

  private _getPreferenceFromDefinition(preferenceGroupIRI: string, annotationIRI: string): Observable<string> {
    return this.getPreferenceDefinitions(preferenceGroupIRI).pipe(
      switchMap(groupDefinitions => {
        const defaultValue = this._getDefaultValueFromDefinition(groupDefinitions, annotationIRI);
        if (defaultValue) {
          return of(defaultValue);
        } else {
          this._toast.createErrorToast('Issue retrieving default value for preference');
          return throwError('No default value');
        }
      }),
      catchError(() => {
        this._toast.createErrorToast('Issue retrieving definition for preference');
        return throwError('No preference definition found');
      })
    );
  }

  private _getDefaultValueFromDefinition(groupDefinition: JSONLDObject[], settingIRI: string): string {
    const propShapeIRI = `${SH}property`;
    const potentialPropertyShapes = groupDefinition.find(definition => definition['@id'] === settingIRI)[propShapeIRI];

    if (potentialPropertyShapes.length !== 1) {
      console.error(`Number of matching property shapes must be one, not ${potentialPropertyShapes.length}`);
      return undefined;
    } else {
      const defaultPropertyShapeIRI = potentialPropertyShapes[0]['@id'];
      const defaultPropertyShape = groupDefinition.find(definition => definition['@id'] === defaultPropertyShapeIRI);
      if (defaultPropertyShape === undefined) {
        console.error(`No default property shape found for ${settingIRI}`);
        return undefined;
      }
      return getPropertyValue(defaultPropertyShape, `${SH}defaultValue`);
    }
  }
}
