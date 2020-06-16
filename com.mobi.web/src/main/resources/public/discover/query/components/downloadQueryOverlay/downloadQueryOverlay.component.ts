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
const template = require('./downloadQueryOverlay.component.html');

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
    template,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    },
    controllerAs: 'dvm',
    controller: downloadQueryOverlayComponentCtrl
};

downloadQueryOverlayComponentCtrl.$inject = ['sparqlManagerService'];

function downloadQueryOverlayComponentCtrl(sparqlManagerService) {
    var dvm = this;
    const options =  [
        {id: 'csv', name: 'CSV',queryType: 'select'},
        {id: 'tsv', name: 'TSV', queryType: 'select'},
        {id: 'xlsx', name: 'Excel (2007)', queryType: 'select' },
        {id: 'xls', name: 'Excel (97-2003)', queryType: 'select'},
        {id: 'ttl', name: 'Turtle', queryType: 'construct'},
        {id: 'rdf', name: 'RDF/XML', queryType: 'construct'},
        {id: 'jsonld', name: 'JsonLD', queryType: 'construct'}
    ];

    var sparql = sparqlManagerService;
    dvm.fileName = 'results';
    dvm.fileType = '';
    dvm.queryType = '';
    dvm.availableOptions = '';

    dvm.$onInit = function() {
        dvm.queryType = dvm.resolve.queryType || 'select';
        dvm.fileType = dvm.queryType == 'select' ? 'csv' : 'ttl';
        dvm.availableOptions = options.filter( item => item.queryType === dvm.queryType );
    }

    dvm.download = function() {
        sparql.downloadResults(dvm.fileType, dvm.fileName);
        dvm.close();
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
}

export default downloadQueryOverlayComponent;