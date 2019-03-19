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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name datasets.component:datasetsTabset
     * 
     * @requires shared.service:datasetStateService
     * @requires shared.service:modalService
     *
     * @description
     * `datasetsTabset` is a component which creates a div containing a blue bar, a white bar, and the rest
     * of the datasets page. This includes a form for submitting a search query to retrieve datasets, a button
     * to open the {@link datasets.component:newDatasetOverlay newDatasetOverlay}, and a
     * {@link datasets.component:datasetsList datasetsList}. The list of results in
     * {@link shared.service:datasetStateService datasetStateService} is initialized by this component.
     * The search text input is submitted on press of the enter key. The directive is replaced by the contents
     * of its template.
     */
    const datasetsTabsetComponent = {
        templateUrl: 'datasets/directives/datasetsTabset/datasetsTabset.directive.html',
        controllerAs: 'dvm',
        controller: datasetsTabsetComponentCtrl
    }

    datasetsTabsetComponentCtrl.$inject = ['datasetStateService', 'modalService'];

    function datasetsTabsetComponentCtrl(datasetStateService, modalService) {
        var dvm = this;
        dvm.state = datasetStateService;

        dvm.$onInit = function() {
            dvm.state.setResults();
            dvm.state.submittedSearch = !!dvm.state.paginationConfig.searchText;
        }
        dvm.showNewOverlay = function() {
            modalService.openModal('newDatasetOverlay');
        }
        dvm.onKeyUp = function(event) {
            if (event.keyCode === 13) {
                dvm.state.resetPagination();
                dvm.state.setResults();
                dvm.state.submittedSearch = !!dvm.state.paginationConfig.searchText;
            }
        }
    }

    angular.module('datasets')
        .component('datasetsTabset', datasetsTabsetComponent);
})();
