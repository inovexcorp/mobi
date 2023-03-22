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
import { take, includes, get, find } from 'lodash';

import { ExploreState } from '../models/exploreState.interface';

/**
 * @class shared.DiscoverStateService
 *
 * A service which contains various variables to hold the state of the discover module along with some utility functions
 * for those variables.
 */
@Injectable()
export class DiscoverStateService {
    /**
     * Determines which tab of the {@link discover.DiscoverPageComponent} should be displayed.
     * @type {number}
     */
    tabIndex = 0;

    constructor() {
        this._setStates();
    }

    /**
     * 'explore' is an object which holds properties associated with the {@link explore.ExploreTabDirective}.
     * @type {Object}
     */
    explore: ExploreState = {
        breadcrumbs: ['Classes'],
        classDeprecated: false,
        classDetails: [],
        classId: '',
        creating: false,
        editing: false,
        instance: {
            // changed: [],
            entity: [],
            metadata: undefined,
            objectMap: {},
            original: []
        },
        instanceDetails: {
            currentPage: 0,
            data: [],
            limit: 99,
            total: 0,
            links: {
                next: '',
                prev: ''
            },
        },
        recordId: '',
        recordTitle: '',
        hasPermissionError: false
    };

    /**
     * 'query' is an object which holds properties associated with the {@link query.QueryTabComponent}.
     * @type {Object}
     */
    query = {
        datasetRecordId: '',
        datasetRecordTitle: '',
        submitDisabled: false,
        queryString: '',
        response: {},
        selectedPlugin: '',
        executionTime: 0
    };

    /**
     * Resets all state variables.
     */
    reset(): void {
        this.tabIndex = 0;
        this._setStates();
    }

    /**
     * Resets the explore properties to be their initial values.
     */
    resetPagedInstanceDetails(): void {
        this.explore.instanceDetails = {
            currentPage: 0,
            data: [],
            limit: 99,
            total: 0,
            links: {
                next: '',
                prev: ''
            },
        };
    }

    /**
     * Resets the paged details and all data associated with the provided dataset if the provided datasetIRI matches the
     * dataset that is selected in the {@link explore.ExploreTabDirective}. The recordId is also cleared.
     *
     * @param {string} datasetIRI The IRI of the DatasetRecord which was deleted.
     */
    cleanUpOnDatasetDelete(datasetIRI: string): void {
        if (datasetIRI === this.explore.recordId) {
            this._resetOnClear();
            this.explore.recordId = '';
        }
    }

    /**
     * Resets the paged details and all data associated with the provided dataset if the provided datasetIRI matches the
     * dataset that is selected in the {@link explore.ExploreTabDirective}. The recordId is not cleared in this case.
     *
     * @param {string} datasetIRI The IRI of the DatasetRecord which was cleared.
     */
    cleanUpOnDatasetClear(datasetIRI: string): void {
        if (datasetIRI === this.explore.recordId) {
            this._resetOnClear();
        }
    }

    /**
     * Removes the proper number of items from the breadcrumbs for the {@link explore.ExploreTabDirective}.
     *
     * @param {number} index The index of the breadcrumb clicked.
     */
    clickCrumb(index: number): void {
        this.explore.breadcrumbs = take(this.explore.breadcrumbs, index + 1);
        this.explore.editing = false;
        this.explore.creating = false;
    }

    /**
     * Gets the instance from the entity variable which contains the instance and reified statements within the
     * {@link explore.ExploreTabDirective}.
     *
     * @returns {Object} An object which contains the instance's JSON-LD.
     */
    getInstance(): any {
        return find(this.explore.instance.entity, obj => includes(get(obj, '@type'), this.explore.classId));
    }

    private _setStates() {
        this.explore = {
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                entity: [],
                metadata: undefined,
                objectMap: {},
                original: []
            },
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                total: 0,
                links: {
                    next: '',
                    prev: ''
                },
            },
            recordId: '',
            recordTitle: '',
            hasPermissionError: false
        };
        this.query = {
            datasetRecordId: '',
            datasetRecordTitle: '',
            submitDisabled: false,
            queryString: '',
            response: {},
            selectedPlugin: '',
            executionTime: 0
        };
    }
    private _resetOnClear() {
        this.resetPagedInstanceDetails();
        this.explore.breadcrumbs = ['Classes'];
        this.explore.classDetails = [];
        this.explore.classId = '';
        this.explore.instance = {
            entity: [],
            metadata: undefined,
            objectMap: {},
            original: []
        };
        this.query.datasetRecordId = '',
        this.query.datasetRecordTitle = '',
        this.query.submitDisabled = false;
        this.query.queryString =  '';
        this.query.response = {};
        this.query.selectedPlugin = '';
    }   
}
