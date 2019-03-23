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
     * @name query.component:downloadQueryOverlay
     * @requires shared.service:sparqlManagerService
     *
     * @description
     * `downloadQueryOverlay` is a component that creates content for a modal with a form to download the results
     * of a {@link shared.service:sparqlManagerService#queryString SPARQL query}. The form includes
     * a selector for the file type and the file name. Meant to be used in conjunction with the
     * {@link shared.service:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const downloadQueryOverlayComponent = {
        templateUrl: 'discover/query/components/downloadQueryOverlay/downloadQueryOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: downloadQueryOverlayComponentCtrl
    };

    downloadQueryOverlayComponent.$inject = ['sparqlManagerService'];

    function downloadQueryOverlayComponentCtrl(sparqlManagerService) {
        var dvm = this;
        var sparql = sparqlManagerService;
        dvm.fileName = 'results';
        dvm.fileType = 'csv';

        dvm.download = function() {
            sparql.downloadResults(dvm.fileType, dvm.fileName);
            dvm.close();
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }

    angular.module('query')
        .component('downloadQueryOverlay', downloadQueryOverlayComponent);
})();
