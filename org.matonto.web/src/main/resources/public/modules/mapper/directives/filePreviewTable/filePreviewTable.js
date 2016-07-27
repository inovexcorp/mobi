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
         * @name filePreviewTable
         *
         * @description 
         * The `filePreviewTable` module only provides the `filePreviewTable` directive which creates
         * an expandable preview of an uploaded delimited file.
         */
        .module('filePreviewTable', [])
        /**
         * @ngdoc directive
         * @name filePreviewTable.directive:filePreviewTable
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  delimitedManager.service:delimitedManagerService
         *
         * @description 
         * `filePreviewTable` is a directive that creates a div with a table of rows from an uploaded 
         * delimited file and a button to toggle the number of rows shown. The rows are hidden using 
         * ngIf. A passed in highlight index can be used to highlight a specific column. The table 
         * can also be clickable and sets the selected column when a th or td is clicked. When a column
         * is clicked, it also switches the highlighted column. The directive assumes that a CSS transition 
         * has been set on the parent div and sets event listeners for transition ends to only show more 
         * rows once the transition has completed. The directive is replaced by the contents of its template.
         */
        .directive('filePreviewTable', filePreviewTable);

        filePreviewTable.$inject = ['delimitedManagerService', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function filePreviewTable(delimitedManagerService, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                link: function(scope, elem, attrs, ctrl) {
                    ["transitionend","webkitTransitionEnd","mozTransitionEnd"].forEach(function(transitionEnd) {
                        elem[0].addEventListener(transitionEnd, () => {
                            if (ctrl.big) {
                                ctrl.showNum = delimitedManagerService.filePreview.rows.length;
                                scope.$digest();
                            }
                        });
                    });
                },
                controller: function() {
                    var dvm = this;
                    dvm.dm = delimitedManagerService;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.big = false;
                    dvm.showNum = 5;

                    dvm.toggleTable = function() {
                        dvm.big = !dvm.big;
                        if (!dvm.big) {
                            dvm.showNum = 5;
                        }
                    }
                    dvm.getHighlightIdx = function() {
                        return dvm.isClickable() ? dvm.dm.filePreview.headers.indexOf(dvm.state.selectedColumn) : -1;
                    }
                    dvm.isClickable = function() {
                        return dvm.mm.isDataMapping(_.find(dvm.mm.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId})) 
                            || (!!dvm.state.selectedProp && !dvm.om.isObjectProperty(_.get(dvm.state.selectedProp, '@type', [])));
                    }
                    dvm.clickColumn = function(index) {
                        dvm.state.selectedColumn = dvm.dm.filePreview.headers[index];
                    }
                },
                templateUrl: 'modules/mapper/directives/filePreviewTable/filePreviewTable.html'
            }
        }
})();
