/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import './recordFilters.component.scss';

import { forEach, map, filter, get, includes} from 'lodash';

const template = require('./recordFilters.component.html');

/**
 * @ngdoc component
 * @name catalog.component:recordFilters
 * @requires shared.service:catalogStateService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `recordFilters` is a component which creates a div with collapsible containers for various filters that can be
 * performed on catalog Records. Each filter option has a checkbox to indicate whether that filter is active. These
 * filter categories currently only include {@link shared.service:catalogManagerService record types}.
 * The `recordType` will be the selected record type filter, it is one way bound.
 * The `keywordFilterList` will be the selected keywords filter, it is one way bound.
 * The `changeFilter` function is expected to update the `recordType` and `keywordFilterList` binding.
 * The `catalogId` will be the catalog Id, it is one way bound.
 * 
 * @param {Function} changeFilter A function that expect parameters called `recordType` and `keywordFilterList`.
 * It will be called when the value of the select is changed. This function should update the `recordType` binding and
 * `keywordFilterList` binding.
 * @param {string} recordType The selected record type filter. Should be a catalog Record type string.
 * @param {list} keywordFilterList The selected keywords list for filter. Should be a list of strings.
 * @param {catalogId} catalogId The catalog ID.
 */
const recordFiltersComponent = {
    template,
    bindings: {
        changeFilter: '&',
        recordType: '<',
        keywordFilterList: '<',
        catalogId: '<'
    },
    controllerAs: 'dvm',
    controller: recordFiltersComponentCtrl
};

recordFiltersComponentCtrl.$inject = ['catalogManagerService', 'utilService', 'prefixes'];

function recordFiltersComponentCtrl(catalogManagerService, utilService, prefixes) {
    var dvm = this;
    dvm.cm = catalogManagerService;
    dvm.util = utilService;
    const keywordPrefix = prefixes.catalog + 'keyword';

    dvm.filters = [];

    dvm.$onInit = function() {
        const recordTypeFilter = {
            title: 'Record Type',
            hide: false,
            pageable: false,
            filterItems: [],
            onInit: function() {
                this.setFilterItems();
            },
            getItemText: function(filterItem) {
                return dvm.util.getBeautifulIRI(filterItem.value);
            },
            setFilterItems: function() {
               this.filterItems = map(dvm.cm.recordTypes, type => ({
                   value: type,
                   checked: type === dvm.recordType,
               }));
            },
            filter: function(filterItem) {
                if (filterItem.checked) {
                    forEach(this.filterItems, typeFilter => {
                        if (typeFilter.value !== filterItem.value) {
                            typeFilter.checked = false;
                        }
                    });
                    dvm.changeFilter({recordType: filterItem.value, keywordFilterList: dvm.keywordFilterList});
                } else {
                    if (dvm.recordType === filterItem.value) {
                        dvm.changeFilter({recordType: '', keywordFilterList: dvm.keywordFilterList});
                    }
               }
            }
        };

        const keywordsFilter = {
            title: 'Keywords',
            hide: false,
            pageable: true,
            pagingData:{
                limit: 12,
                totalKeywordSize: 0,
                currentKeywordPage: 1,
                hasNextPage: false
            },
            rawFilterItems: [],
            filterItems: [],
            onInit: function() {
                const filterInstance = this;
                filterInstance.nextPage();
            },
            nextPage: function() {
                const filterInstance = this;
                const pagingData = filterInstance.pagingData;
                const paginatedConfig = {
                    pageIndex: pagingData.currentKeywordPage - 1,
                    limit: pagingData.limit,
                };
                dvm.cm.getKeywords(dvm.catalogId, paginatedConfig)
                    .then(response => {
                         if (pagingData.currentKeywordPage === 1) {
                            filterInstance.rawFilterItems = response.data
                         } else {
                            filterInstance.rawFilterItems = filterInstance.rawFilterItems.concat(response.data);
                         }
                         filterInstance.setFilterItems();
                         pagingData['totalKeywordSize'] = get(response.headers(), 'x-total-count', 0);
                         pagingData['hasNextPage'] = filterInstance.filterItems.length < pagingData.totalKeywordSize;
                         pagingData['currentKeywordPage'] = pagingData['currentKeywordPage'] + 1;
                    }, dvm.util.createErrorToast);
            },
            getItemText: function(filterItem) {
                const keywordString = filterItem.value[keywordPrefix];
                const keywordCount = filterItem.value['count'];
                return `${keywordString} (${keywordCount})`;
            },
            setFilterItems: function() {
                this.filterItems = map(this.rawFilterItems, keywordObject => ({
                    value: keywordObject,
                    checked: includes(dvm.keywordFilterList, keywordObject[keywordPrefix])
                }));
            },
            filter: function(filterItem) {
                const checkedKeywordObjects = filter(this.filterItems, currentFilterItem => currentFilterItem.checked);
                const keywords = map(checkedKeywordObjects, currentFilterItem => currentFilterItem.value[keywordPrefix]);
                dvm.changeFilter({recordType: dvm.recordType, keywordFilterList: keywords});
            }
        };

        dvm.filters = [recordTypeFilter, keywordsFilter];
        forEach(dvm.filters, filter => {
            if ('onInit' in filter) {
                filter.onInit();
            }
        });
    }
}

export default recordFiltersComponent;