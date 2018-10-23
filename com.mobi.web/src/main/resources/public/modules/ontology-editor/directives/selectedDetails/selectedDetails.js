/*-
 * #%L
 * com.mobi.web
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
        .module('selectedDetails', [])
        .directive('selectedDetails', selectedDetails);

        selectedDetails.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'manchesterConverterService'];

        function selectedDetails($filter, ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, manchesterConverterService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/selectedDetails/selectedDetails.html',
                scope: {},
                bindToController: {
                    readOnly: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var mc = manchesterConverterService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    dvm.getTypes = function() {
                        return _.join(_.orderBy(
                                _.map(_.get(dvm.os.listItem.selected, '@type', []), t => { 
                                    if (dvm.om.isBlankNodeId(t)) {
                                        return mc.jsonldToManchester(t, dvm.os.listItem.ontology);
                                    } else {
                                        return $filter('prefixation')(t);
                                    }
                                })
                        ), ', ');
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.os.onEdit(iriBegin, iriThen, iriEnd)
                            .then(() => {
                                ontoUtils.saveCurrentChanges();
                                ontoUtils.updateLabel();
                            });
                    }
                }
            }
        }
})();
