/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name rdfPreview
         *
         * @description 
         * The `rdfPreview` module provides the `rdfPreview` directive, which creates
         * a container for generating a preview of delimited data mapped into RDF, and 
         * the `formatRdf` directive used for formatting the mapped data preview string.
         */
        .module('rdfPreview', ['delimitedManager', 'mappingManager'])
        /**
         * @ngdoc directive
         * @name rdfPreview.directive:rdfPreview
         * @scope
         * @restrict E
         *
         * @description 
         * `rdfPreview` is a directive which creates a div with controls to select an RDF
         * serialization and refresh a preview of mapped delimited data and an uneditable
         * textarea to display the mapped data preview. The div contains a tab to slide 
         * the preview area in and out. The serialization options are Turtle, JSON-LD, and
         * RDF/XML. The directive is replaced by the contents of its template.
         */
        .directive('rdfPreview', rdfPreview)
        /**
         * @ngdoc directive
         * @name rdfPreview.directive:formatRdf
         *
         * @description 
         * `formatRdf` is a directive which formats the passed in data into a string depending 
         * on the type of data passed in. If the data is passed as an object, it formats it 
         * into json. If the data isn't an object, it just passes the data back. The default 
         * value is an empty string.
         */
        .directive('formatRdf', formatRdf);

        formatRdf.$inject = ['$filter'];
        rdfPreview.$inject = ['$window', 'delimitedManagerService', 'mappingManagerService'];

        function formatRdf($filter) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function(scope, element, attrs, modelCtrl) {
                    var formatJSON = function(data) {
                        var formatted = (typeof data === 'object') ? $filter('json')(data, 4) : (data || '');
                        return formatted;
                    }
                        
                    modelCtrl.$formatters.push(formatJSON);
                 }
               };
        }

        function rdfPreview($window, delimitedManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.cm = delimitedManagerService;
                    dvm.mm = mappingManagerService;
                    dvm.visible = false;
                    dvm.preview = '';
                    dvm.options = [
                        {
                            name: 'JSON-LD',
                            value: 'jsonld'
                        },
                        {
                            name: 'Turtle',
                            value: 'turtle'
                        },
                        {
                            name: 'RDF/XML',
                            value: 'rdf/xml'
                        }
                    ];
                    dvm.generatePreview = function() {
                        dvm.cm.previewMap(dvm.mm.mapping.jsonld, dvm.serializeOption).then(preview => {
                            dvm.preview = preview;
                        }, errorMessage => {
                            console.log(errorMessage);
                        });
                    }
                },
                templateUrl: 'modules/mapper/directives/rdfPreview/rdfPreview.html'
            }
        }
})();
