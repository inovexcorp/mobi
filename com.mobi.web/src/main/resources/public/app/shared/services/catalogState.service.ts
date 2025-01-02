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
import { Injectable } from '@angular/core';
import { find, includes, get } from 'lodash';

import { CATALOG, DATASET, DCTERMS, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { FilterItem } from '../models/filterItem.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { SortOption } from '../models/sortOption.interface';

/**
 * @class shared.CatalogStateService
 *
 * A service which contains various variables to hold the state of the {@link catalog.CatalogPageComponent} and utility
 * functions to update those variables.
 */
@Injectable()
export class CatalogStateService {

    constructor(private cm: CatalogManagerService) {}

    /**
     * `totalRecordSize` holds an integer for the total number of catalog Records in the latest query on the
     * {@link catalog.RecordsViewComponent}.
     * @type {number}
     */
    totalRecordSize = 0;
    /**
     * `currentRecordPage` holds an 0 based index indicating which page of catalog Records should be displayed
     * in the {@link catalog.RecordsViewComponent}.
     * @type {number}
     */
    currentRecordPage = 0;
    /**
     * `recordLimit` holds an integer representing the maximum number of catalog Records to be shown in a page
     * in the {@link catalog.RecordsViewComponent}.
     * @type {number}
     */
    recordLimit = 10;
    /**
     * `recordSortOption` holds one of the options from the `sortOptions` in the
     * {@link shared.CatalogManagerService} to be used when sorting the catalog Records in the
     * {@link catalog.RecordsViewComponent}.
     * @type {SortOption}
     */
    recordSortOption: SortOption = undefined;
    /**
     * `recordTypeFilterList` holds a list of {@link shared.FilterItem}s representing the IRIs of catalog Record types
     * to be used to filter the results in the {@link catalog.RecordsViewComponent}.
     * @type {FilterItem[]}
     */
    recordTypeFilterList: FilterItem[] = [];
    /**
     * `keywordFilterList` holds a list of {@link shared.FilterItem}s representing keywords to be used to filter the
     * results in the {@link catalog.RecordsViewComponent}.
     * @type {FilterItem[]}
     */
    keywordFilterList: FilterItem[] = [];
    /**
     * `keywordSearchText` holds a keyword search string for {@link catalog.RecordsViewComponent}.
     * @type {string}
     */
    keywordSearchText = '';
    /**
     * `creatorFilterList` holds a list of {@link shared.FilterItem}s representing Users to be used to filter the
     * results in the {@link catalog.RecordsViewComponent}.
     * @type {FilterItem[]}
     */
    creatorFilterList: FilterItem[] = [];
    /**
     * `creatorSearchText` holds a creator search string for {@link catalog.RecordsViewComponent}.
     * @type {string}
     */
    creatorSearchText = '';
    /**
     * `recordSearchText` holds a search text to be used when retrieving catalog Records in the
     * {@link catalog.RecordsViewComponent}.
     * @type {string}
     */
    recordSearchText = '';
    /**
     * `selectedRecord` holds the currently selected catalog Record object that is being viewed in the
     * {@link catalog.CatalogPageComponent}.
     * @type {JSONLDObject}
     */
    selectedRecord: JSONLDObject = undefined;

    /**
     * `editPermissionSelectedRecord` holds the currently selected catalog Record object that is being viewed in the
     * {@link catalog.CatalogPageComponent} for permission page.
     * @type {boolean}
     */
    editPermissionSelectedRecord = false;

    /**
     * `recordIcons` holds each recognized Record type as keys and values of Font Awesome class names to
     * represent the record types.
     * @type {Object}
     */
    recordIcons = {
        [`${ONTOLOGYEDITOR}OntologyRecord`]: 'fa-sitemap',
        [`${DATASET}DatasetRecord`]: 'fa-database',
        [`${DELIM}MappingRecord`]: 'fa-map',
        [`${SHAPESGRAPHEDITOR}ShapesGraphRecord`]: 'mat rule',
        [`${WORKFLOWS}WorkflowRecord`]: 'mat fact_check',
        default: 'fa-book'
    };

    /**
     * Initializes state variables for the {@link catalog.CatalogPageComponent} using information retrieved
     * from {@link shared.CatalogManagerService}.
     */
    initialize(): void {
        this.initializeRecordSortOption();
    }
    /**
     * Returns the type of the provided Record.
     *
     * @param {JSONLDObject} record The JSON-LD Record to retrieve the type from
     * @return {string} The type IRI of the record
     */
    getRecordType(record: JSONLDObject): string {
        return find(Object.keys(this.recordIcons), type => includes(get(record, '@type', []), type)) || `${CATALOG}Record`;
    }
    /**
     * Returns a Font Awesome icon class representing the type of the provided catalog Record object. If the
     * record is not a type that has a specific icon, a generic icon class is returned.
     * 
     * @param {JSONLDObject} record The JSON-LD Record to get an icon for
     * @return {string} A Font Awesome class string
     */
    getRecordIcon(record: JSONLDObject): string {
        const type = this.getRecordType(record);
        return this.recordIcons[type === `${CATALOG}Record` ? 'default' : type];
    }
    /**
     * Resets all state variables for the {@link catalog.CatalogPageComponent}.
     */
    reset(): void {
        this.totalRecordSize = 0;
        this.currentRecordPage = 1;
        this.recordTypeFilterList = [];
        this.keywordFilterList = [];
        this.keywordSearchText = '';
        this.creatorFilterList = [];
        this.creatorSearchText = '';
        this.recordSearchText = '';
        this.initializeRecordSortOption();
        this.selectedRecord = undefined;
        this.editPermissionSelectedRecord = false;
    }
    /**
     * Initializes the `recordSortOption` to a certain sort option from the {@link shared.CatalogManagerService}.
     */
    initializeRecordSortOption(): void {
        this.recordSortOption = find(this.cm.sortOptions, {field: `${DCTERMS}modified`, asc: false});
    }
}
