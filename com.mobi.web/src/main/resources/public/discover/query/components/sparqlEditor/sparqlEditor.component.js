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
     * @name query.component:sparqlEditor
     * @requires shared.service:sparqlManagerService
     * @requires shared.service:prefixes
     *
     * @description
     * `sparqlEditor` is a component that creates a {@link shared.component:block block} with a form for creating
     * a {@link shared.service:sparqlManagerService#queryString SPARQL query}, selecting
     * {@link shared.service:sparqlManagerService#prefixes prefixes} and a
     * {@link shared.service:sparqlManagerService#datasetRecordIRI dataset} and submitting it.
     */
    const sparqlEditorComponent = {
        templateUrl: 'discover/query/components/sparqlEditor/sparqlEditor.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: sparqlEditorComponentCtrl
    };

    sparqlEditorComponent.$inject = ['sparqlManagerService', 'prefixes'];

    function sparqlEditorComponentCtrl(sparqlManagerService, prefixes) {
        var dvm = this;
        dvm.sparql = sparqlManagerService;
        dvm.prefixList = [];
        dvm.editorOptions = {
            mode: 'application/sparql-query',
            indentUnit: 4,
            tabMode: 'indent',
            lineNumbers: true,
            lineWrapping: true,
            matchBrackets: true
        }

        dvm.$onInit = function() {
            dvm.prefixList = _.sortBy(_.map(prefixes, (value, key) => key + ': <' + value + '>'));
        }
    }

    angular.module('query')
        .component('sparqlEditor', sparqlEditorComponent);
})();
