/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { groupBy, pullAt, map, last, join } from 'lodash';

import './searchForm.component.scss';

const template = require('./searchForm.component.html');

/**
 * @ngdoc component
 * @name search.component:searchForm
 * @requires search.service:searchService
 * @requires shared.service:discoverStateService
 * @requires discover.service:exploreService
 * @requires shared.service:utilService
 * @requires shared.service:modalService
 * @requires shared.service:prefixes
 * @requires shared.service:policyEnforcementService
 *
 * @description
 * `searchForm` is a component that creates a form for creating keyword searches combined with property value searches
 * using AND/OR operators to be transformed into a SPARQL query. It provides a {@link discover.component:datasetFormGroup}
 * for selecting a dataset to perform the search against.
 */
const searchFormComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: searchFormComponentCtrl
};

searchFormComponentCtrl.$inject = ['searchService', 'discoverStateService', 'exploreService', 'utilService', 'modalService', 'prefixes', 'policyEnforcementService'];

function searchFormComponentCtrl(searchService, discoverStateService, exploreService, utilService, modalService, prefixes, policyEnforcementService) {
    const dvm = this;
    const s = searchService;
    const es = exploreService;
    const pep = policyEnforcementService;
    dvm.ds = discoverStateService;
    dvm.util = utilService;
    dvm.typeSearch = '';
    dvm.errorMessage = '';

    dvm.createPropertyFilter = function() {
        modalService.openModal('propertyFilterOverlay');
    }
    dvm.submit = function() {
        const pepRequest = {
            resourceId: dvm.ds.search.datasetRecordId,
            actionId: prefixes.policy + 'Read'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canRead = response !== pep.deny;
                if (canRead) {
                    s.submitSearch(dvm.ds.search.datasetRecordId, dvm.ds.search.queryConfig)
                        .then(data => {
                            dvm.ds.search.results = data;
                            dvm.errorMessage = '';
                        }, errorMessage => {
                            dvm.ds.search.results = undefined;
                            dvm.errorMessage = errorMessage;
                        });
                } else {
                    dvm.util.createErrorToast('You don\'t have permission to read dataset');
                    dvm.ds.search.datasetRecordId = '';
                    dvm.ds.resetSearchQueryConfig();
                }
            }, () => {
                dvm.util.createWarningToast('Could not retrieve record permissions');
            });
    }
    dvm.getTypes = function() {
        const pepRequest = {
            resourceId: dvm.ds.search.datasetRecordId,
            actionId: prefixes.policy + 'Read'
        };
        pep.evaluateRequest(pepRequest)
            .then(response => {
                const canRead = response !== pep.deny;
                if (canRead) {
                    dvm.ds.resetSearchQueryConfig();
                    dvm.ds.search.properties = undefined;
                    es.getClassDetails(dvm.ds.search.datasetRecordId)
                        .then(details => {
                            dvm.ds.search.typeObject = groupBy(details, 'ontologyRecordTitle');
                            dvm.errorMessage = '';
                        }, errorMessage => {
                            dvm.ds.search.typeObject = {};
                            dvm.errorMessage = errorMessage;
                        });
                } else {
                    dvm.util.createErrorToast('You don\'t have permission to read dataset');
                    dvm.ds.search.datasetRecordId = '';
                    dvm.ds.resetSearchQueryConfig();
                }
            }, () => {
                dvm.util.createWarningToast('Could not retrieve record permissions');
            });
    }
    dvm.getSelectedText = function() {
        return join(map(dvm.ds.search.queryConfig.types, 'classTitle'), ', ');
    }
    dvm.removeFilter = function(index) {
        pullAt(dvm.ds.search.queryConfig.filters, index);
    }
    dvm.isSubmittable = function() {
            return dvm.ds.search.datasetRecordId && (dvm.ds.search.queryConfig.keywords.length || dvm.ds.search.queryConfig.types.length || dvm.ds.search.queryConfig.filters.length);
    }
    dvm.getLast = function(path) {
        return last(path);
    }
    dvm.refresh = function() {
        if (dvm.ds.search.datasetRecordId) {
            dvm.getTypes();
        }
    }
    dvm.onChange = function(value) {
        dvm.ds.search.datasetRecordId = value;
        if (dvm.ds.search.datasetRecordId !== '') {
            dvm.getTypes();
        }
    }
}

export default searchFormComponent;
