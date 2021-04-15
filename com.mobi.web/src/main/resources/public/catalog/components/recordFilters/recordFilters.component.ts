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

import { forEach, map, filter, find, get, includes} from 'lodash';
import './recordFilters.component.scss';

const template = require('./recordFilters.component.html');

/**
 * @ngdoc component
 * @name catalog.component:recordFilters
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 *
 * @description
 * `recordFilters` is a component which creates a div with collapsible containers for various filters that can be
 * performed on catalog Records. Each filter option has a checkbox to indicate whether that filter is active. These
 * filter categories currently only include {@link shared.service:catalogManagerService record types}. The
 * `recordType` will be the selected record type filter, but is one way bound. The `changeFilter` function is
 * expected to update the `recordType` binding.
 * 
 * @param {Function} changeFilter A function that expects a parameter called `recordType` and will be called when
 * the value of the select is changed. This function should update the `recordType` binding.
 * @param {string} recordType The selected record type filter. Should be a catalog Record type string.
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

    function isEmpty(val){
        return (val === undefined || val == null || val.length <= 0) ? true : false;
    }

    dvm.filters = [];

    dvm.$onInit = function() {
        const recordTypeFilter = {
            title: 'Record Type',
            hide: false,
            pageable: false,
            filterItems: [],
            metaData: {},
            onInit: function(){
                this.setFilterItems();
            },
            getItemText: function(filterItem){
                return dvm.util.getBeautifulIRI(filterItem.value);
            },
            setFilterItems: function(){
               this.filterItems = map(dvm.cm.recordTypes, type => ({
                   value: type,
                   checked: type === dvm.recordType,
               }));
            },
            filter: function(filterItem){
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
                limit: 15,
                totalRecordSize: 0,
                currentRecordPage: 1,
                hasNextPage: false
            },
            filterItems: [],
            onInit: function(){
                const filterInstance = this;
                filterInstance.nextPage();
                console.log("filterInstance.nextPage();");
            },
            nextPage: function(){
                const filterInstance = this;

                const paginatedConfig = {
                    pageIndex: filterInstance.pagingData.currentRecordPage - 1,
                    limit: filterInstance.pagingData.limit,
                };

                dvm.cm.getKeywords(dvm.catalogId, paginatedConfig)
                    .then(response => {
                         if (filterInstance.pagingData.currentRecordPage === 1) {
                            dvm.cm.keywordObjects = response.data
                         } else {
                            dvm.cm.keywordObjects = dvm.cm.keywordObjects.concat(response.data);
                         }

                         filterInstance.setFilterItems();

                         filterInstance.pagingData["totalRecordSize"] = get(response.headers(), 'x-total-count', 0);
                         filterInstance.pagingData["hasNextPage"] = filterInstance.filterItems.length < filterInstance.pagingData.totalRecordSize;
                         filterInstance.pagingData["currentRecordPage"] = filterInstance.pagingData["currentRecordPage"] + 1;
                    }, dvm.util.createErrorToast);

                    console.log("keywordPrefix");
                   console.log(keywordPrefix);

            },
            getItemText: function(filterItem){
                const keywordString = filterItem.value[keywordPrefix];
                const keywordCount = filterItem.value['count'];
                return `${keywordString} (${keywordCount})`;
            },
            setFilterItems: function(){
                this.filterItems = map(dvm.cm.keywordObjects, keywordObject => ({
                    value: keywordObject,
                    checked: includes(dvm.keywordFilterList, keywordObject[keywordPrefix])
                }));
            },
            filter: function(filterItem){
                const checkedKeywordObjects = filter(this.filterItems, currentFilterItem => currentFilterItem.checked);
                const keywords = map(checkedKeywordObjects, currentFilterItem => currentFilterItem.value[keywordPrefix]);
                dvm.changeFilter({recordType: dvm.recordType, keywordFilterList: keywords});
            }
        };

        dvm.filters = [recordTypeFilter, keywordsFilter];
        forEach(dvm.filters, filter => {
            if('onInit' in filter){
                filter.onInit();
            }
        });
    }
    dvm.$onChanges = function(changeObj){
        console.log(changeObj);
    }
    dvm.$onDestroy = function(){
        dvm.cm.keywordObjects = []
    }
}

export default recordFiltersComponent;