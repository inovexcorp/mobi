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
import { HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';

import { forEach, map, filter, includes} from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CATALOG, DCTERMS } from '../../../prefixes';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FilterItem } from '../../../shared/models/filterItem.interface'; 
import { UserManagerService } from '../../../shared/services/userManager.service';
import { FilterType, ListFilter } from '../../../shared/models/list-filter.interface';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';

/**
 * @class catalog.RecordFiltersComponent
 *
 * A component which creates a div with collapsible containers for various filters that can be
 * performed on catalog Records. Each filter option has a checkbox to indicate whether that filter is active. These
 * filter categories currently only include {@link shared.CatalogManagerService record types}.
 * The `recordType` will be the selected record type filter, it is one way bound.
 * The `keywordFilterList` will be the selected keywords filter, it is one way bound.
 * The `changeFilter` function is expected to update the `recordType` and `keywordFilterList` binding.
 * The `catalogId` will be the catalog Id, it is one way bound.
 * 
 * @param {Function} changeFilter A function that expect parameters called `recordType` and `keywordFilterList`.
 * It will be called when the value of the select is changed. This function should update the `recordType` binding and
 * `keywordFilterList` binding.
 * @param {string} recordType The selected record type filter. Should be a catalog Record type string.
 * @param {string[]} keywordFilterList The selected keywords list for filter. Should be a list of strings.
 * @param {string[]} creatorFilterList The selected creators list for filter. Should be a list of IRI strings.
 * @param {string} catalogId The catalog ID.
 */
@Component({
    selector: 'record-filters',
    templateUrl: './recordFilters.component.html',
    styleUrls: ['./recordFilters.component.scss']
})
export class RecordFiltersComponent implements OnInit, OnChanges, OnDestroy {
    filters: ListFilter[] = [];
    private _destroySub$ = new Subject<void>();
    
    @Input() catalogId: string;
    @Input() recordType: string;
    @Input() keywordFilterList: string[];
    @Input() creatorFilterList: string[];
    @Output() changeFilter = new EventEmitter<{recordType: string, keywordFilterList: string[], creatorFilterList: string[]}>();
    
    recordTypeFilterItem: FilterItem;

    constructor(public state: CatalogStateService, public cm: CatalogManagerService, private toast: ToastService, 
      private _um: UserManagerService) {}

    ngOnInit(): void {
        this.recordTypeFilterItem = {
            value: this.recordType,
            checked: false
        };
        const componentContext = this;
        const recordTypeFilter: ListFilter = this.cm.getRecordTypeFilter(this.recordTypeFilterItem, (value) => componentContext.changeFilter.emit({recordType: value, keywordFilterList: componentContext.keywordFilterList, creatorFilterList: componentContext.creatorFilterList}));
        const getNumChecked = (items => items.filter(item => item.checked).length);

        const creatorFilter: SearchableListFilter = {
            title: 'Creators',
            type: FilterType.CHECKBOX,
            numChecked: 0,
            hide: false,
            pageable: true,
            searchable: true,
            pagingData: {
              limit: 10,
              totalSize: 0,
              pageIndex: 1,
              hasNextPage: false
            },
            rawFilterItems: [],
            filterItems: [],
            onInit: function() {
                this.setFilterItems();
            },
            searchModel: componentContext.state.creatorSearchText,
            searchChanged: function(value: string){
                componentContext.state.creatorSearchText = value;
            },
            searchSubmitted: function() {
                this.pagingData['totalSize'] = 0;
                this.pagingData['pageIndex'] = 1;
                this.pagingData['hasNextPage'] = false;
                this.nextPage();
            },
            nextPage: function() {
                const filtered = componentContext._um.filterUsers(this.rawFilterItems.map(item => item.value.user), componentContext.state.creatorSearchText);
                this.pagingData['totalSize'] = filtered.length;

                const offset = this.pagingData.limit * (this.pagingData.pageIndex - 1);
                this.filterItems = filtered.slice(0, offset + this.pagingData.limit).map(user => this.rawFilterItems.find(item => user === item.value.user));
                this.pagingData['hasNextPage'] = filtered.length > this.filterItems.length;
            },
            getItemText: function(filterItem: FilterItem) {
                const userDisplay = filterItem.value['user'].displayName;
                const count = filterItem.value['count'];
                return `${userDisplay} (${count})`;
            },
            getItemTooltip: function(filterItem: FilterItem) {
                const userDisplay = filterItem.value['user'].username;
                return `Username: ${userDisplay}`;
            },
            setFilterItems: function() {
                const filterInstance = this;
                componentContext.cm.getRecords(componentContext.catalogId, {}).pipe(
                    takeUntil(componentContext._destroySub$),
                ).subscribe(response => {
                    const userMap: {[key: string]: string[]} = {};
                    response.body.forEach(record => {
                        if (!userMap[record[`${DCTERMS}publisher`][0]['@id']]) {
                            userMap[record[`${DCTERMS}publisher`][0]['@id']] = [];
                        }
                        userMap[record[`${DCTERMS}publisher`][0]['@id']].push(record['@id']);
                    });
                    filterInstance.rawFilterItems = Object.keys(userMap).map(userIri => ({
                        value: {
                            user: componentContext._um.users.find(user => user.iri === userIri),
                            count: userMap[userIri].length
                        },
                        checked: componentContext.creatorFilterList.includes(userIri)
                    })).sort((item1, item2) => item1.value.user.username.localeCompare(item2.value.user.username));
                    filterInstance.nextPage();
                    this.numChecked = getNumChecked(this.filterItems);
                });
            },
            filter: function() {
                const checkedCreatorObjects = filter(this.filterItems, currentFilterItem => currentFilterItem.checked);
                const creators = map(checkedCreatorObjects, currentFilterItem => currentFilterItem.value['user'].iri);
                componentContext.changeFilter.emit({recordType: componentContext.recordTypeFilterItem.value, keywordFilterList: componentContext.keywordFilterList, creatorFilterList: creators});
                this.numChecked = getNumChecked(this.filterItems);
            }
        };

        const keywordsFilter: SearchableListFilter = {
            title: 'Keywords',
            type: FilterType.CHECKBOX,
            numChecked: 0,
            hide: false,
            pageable: true,
            searchable: true,
            pagingData: {
                limit: 12,
                totalSize: 0,
                pageIndex: 1,
                hasNextPage: false
            },
            rawFilterItems: [],
            filterItems: [],
            onInit: function() {
                this.nextPage();
            },
            searchModel: componentContext.state.keywordSearchText,
            searchChanged: function(value: string){
                componentContext.state.keywordSearchText = value;
            },
            searchSubmitted: function(){
                this.pagingData['totalSize'] = 0;
                this.pagingData['pageIndex'] = 1;
                this.pagingData['hasNextPage'] = false;
                this.nextPage();
            },
            nextPage: function() {
                const filterInstance = this;
                const pagingData = filterInstance.pagingData;
                const paginatedConfig = {
                    searchText: componentContext.state.keywordSearchText,
                    pageIndex: pagingData.pageIndex - 1,
                    limit: pagingData.limit,
                };
                componentContext.cm.getKeywords(componentContext.catalogId, paginatedConfig).pipe(
                    takeUntil(componentContext._destroySub$),
                ).subscribe((response: HttpResponse<KeywordCount[]>) => {
                        if (pagingData.pageIndex === 1) {
                            filterInstance.rawFilterItems = response.body;
                        } else {
                            filterInstance.rawFilterItems = filterInstance.rawFilterItems.concat(response.body);
                        }
                        filterInstance.setFilterItems();
                        pagingData['totalSize'] = Number(response.headers.get('x-total-count')) || 0;
                        pagingData['hasNextPage'] = filterInstance.filterItems.length < pagingData.totalSize;
                        filterInstance.numChecked = getNumChecked(this.filterItems);
                    }, error => componentContext.toast.createErrorToast(error));
            },
            getItemText: function(filterItem) {
                const keywordString = filterItem.value[`${CATALOG}keyword`];
                const keywordCount = filterItem.value['count'];
                return `${keywordString} (${keywordCount})`;
            },
            setFilterItems: function() {
                this.filterItems = map(this.rawFilterItems, keywordObject => ({
                    value: keywordObject,
                    checked: includes(componentContext.keywordFilterList, keywordObject[`${CATALOG}keyword`])
                }));
                const keywords = filter(componentContext.state.keywordFilterList, keyword => {
                    return this.filterItems.filter(currentFilterItem => currentFilterItem.value[`${CATALOG}keyword`].indexOf(keyword) !== -1).length;
                });
                componentContext.changeFilter.emit({recordType: componentContext.recordTypeFilterItem.value, keywordFilterList: keywords, creatorFilterList: componentContext.creatorFilterList});
            },
            filter: function() {
                const checkedKeywordObjects = filter(this.filterItems, currentFilterItem => currentFilterItem.checked);
                const keywords = map(checkedKeywordObjects, currentFilterItem => currentFilterItem.value[`${CATALOG}keyword`]);
                componentContext.changeFilter.emit({recordType: componentContext.recordTypeFilterItem.value, keywordFilterList: keywords, creatorFilterList: componentContext.creatorFilterList});
                this.numChecked = getNumChecked(this.filterItems);
            }
        };

        this.filters = [recordTypeFilter, creatorFilter, keywordsFilter];
        forEach(this.filters, filter => {
            if ('onInit' in filter) {
                filter.onInit();
            }
        });
    }
    
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.recordType && !changes.recordType.isFirstChange()) {
            this.recordTypeFilterItem.value = changes.recordType.currentValue;
        }
    }

    ngOnDestroy(): void {
        this._destroySub$.next();
        this._destroySub$.complete();
    }
}
