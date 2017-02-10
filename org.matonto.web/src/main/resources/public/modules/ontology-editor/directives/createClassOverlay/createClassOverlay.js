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
        .module('createClassOverlay', [])
        .directive('createClassOverlay', createClassOverlay);

        createClassOverlay.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'ontologyStateService', 'prefixes'];

        function createClassOverlay($filter, REGEX, ontologyManagerService, ontologyStateService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createClassOverlay/createClassOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;

                    dvm.prefix = _.get(dvm.sm.listItem, 'iriBegin', dvm.sm.listItem.ontologyId) + _.get(dvm.sm.listItem,
                        'iriThen', '#');

                    dvm.clazz = {
                        '@id': dvm.prefix,
                        '@type': [prefixes.owl + 'Class'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.clazz['@id'] = dvm.prefix + $filter('camelCase')(
                                dvm.clazz[prefixes.dcterms + 'title'][0]['@value'], 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.clazz['@id'] = iriBegin + iriThen + iriEnd;
                    }

                    dvm.create = function() {
                        if (_.isEqual(dvm.clazz[prefixes.dcterms + 'description'][0]['@value'], '')) {
                            _.unset(dvm.clazz, prefixes.dcterms + 'description');
                        }
                        _.set(dvm.clazz, 'matonto.originalIRI', dvm.clazz['@id']);
                        // add the entity to the ontology
                        dvm.om.addEntity(dvm.sm.listItem.ontology, dvm.clazz);
                        // update relevant lists
                        var split = $filter('splitIRI')(dvm.clazz['@id']);
                        _.get(dvm.sm.listItem, 'subClasses').push({namespace:split.begin + split.then,
                            localName: split.end});
                        _.get(dvm.sm.listItem, 'classHierarchy').push({'entityIRI': dvm.clazz['@id']});
                        _.set(_.get(dvm.sm.listItem, 'index'), dvm.clazz['@id'], dvm.sm.listItem.ontology.length - 1);
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, dvm.clazz);
                        // select the new class
                        dvm.sm.selectItem(_.get(dvm.clazz, '@id'));
                        // hide the overlay
                        dvm.sm.showCreateClassOverlay = false;
                    }
                }
            }
        }
})();
