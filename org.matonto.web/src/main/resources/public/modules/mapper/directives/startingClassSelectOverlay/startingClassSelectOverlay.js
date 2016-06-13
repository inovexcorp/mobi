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
        .module('startingClassSelectOverlay', ['ontologyManager'])
        .directive('startingClassSelectOverlay', startingClassSelectOverlay);

        startingClassSelectOverlay.$inject = ['ontologyManagerService'];

        function startingClassSelectOverlay(ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    onClickBack: '&',
                    onClickContinue: '&'
                },
                bindToController: {
                    ontologies: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getOntologyId = function(classObj) {
                        return _.get(ontologyManagerService.findOntologyWithClass(dvm.ontologies, classObj['@id']), '@id', '');
                    }
                    dvm.getClasses = function() {
                        var classes = [];
                        _.forEach(dvm.ontologies, function(ontology) {
                            classes = _.concat(classes, ontologyManagerService.getClasses(ontology));
                        });
                        return classes;
                    }
                    dvm.getName = function(classObj) {
                        return ontologyManagerService.getEntityName(classObj)
                    }
                },
                templateUrl: 'modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html'
            }
        }
})();
