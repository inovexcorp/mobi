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
        .module('createPropertyOverlay', [])
        .directive('createPropertyOverlay', createPropertyOverlay);

        createPropertyOverlay.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'ontologyStateService', 'prefixes'];

        function createPropertyOverlay($filter, REGEX, ontologyManagerService, ontologyStateService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createPropertyOverlay/createPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var setAsObject = false;
                    var setAsDatatype = false;

                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;

                    dvm.prefix = _.get(dvm.om.getListItemById(dvm.sm.listItem.ontologyId), 'iriBegin',
                        dvm.om.getOntologyIRI(dvm.sm.listItem.ontology)) + _.get(dvm.om.getListItemById(dvm.sm.listItem.ontologyId),
                        'iriThen', '#');

                    dvm.property = {
                        '@id': dvm.prefix,
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.property['@id'] = dvm.prefix + $filter('camelCase')(
                                dvm.property[prefixes.dcterms + 'title'][0]['@value'], 'property');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.property['@id'] = iriBegin + iriThen + iriEnd;
                    }

                    function onCreateSuccess(response) {
                        dvm.sm.showCreatePropertyOverlay = false;
                        dvm.sm.selectItem('property-editor', response.entityIRI, dvm.sm.listItem);
                        // TODO: figure out how to open up where this property is listed
                        // Potentially easier with the getPath function I'm working on
                    }

                    function onCreateError(errorMessage) {
                        dvm.error = errorMessage;
                    }

                    dvm.create = function() {
                        if (dvm.property[prefixes.dcterms + 'description'][0]['@value'] === '') {
                            _.unset(dvm.property, prefixes.dcterms + 'description');
                        }
                        _.forEach(['domain', 'range'], function(axiom) {
                            if (_.isEqual(dvm.property[prefixes.rdfs + axiom], [])) {
                                _.unset(dvm.property, prefixes.rdfs + axiom);
                            }
                        });
                        _.set(dvm.property, 'matonto.originalIRI', dvm.property['@id']);
                        // add the entity to the ontology
                        dvm.om.addEntity(dvm.sm.listItem.ontology, dvm.property);
                        // update relevant lists
                        var split = $filter('splitIRI')(dvm.property['@id']);
                        if (dvm.om.isObjectProperty(dvm.property)) {
                            _.get(dvm.sm.listItem, 'subObjectProperties').push({namespace:split.begin + split.then, localName: split.end});
                            _.get(dvm.sm.listItem, 'objectPropertyHierarchy').push({'entityIRI': dvm.property['@id']});
                        } else {
                            _.get(dvm.sm.listItem, 'subDataProperties').push({namespace:split.begin + split.then, localName: split.end});
                            _.get(dvm.sm.listItem, 'dataPropertyHierarchy').push({'entityIRI': dvm.property['@id']});
                        }
                        _.set(_.get(dvm.sm.listItem, 'index'), dvm.property['@id'], dvm.sm.listItem.ontology.length - 1);
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, dvm.property);
                        // select the new class
                        dvm.sm.selectItem(_.get(dvm.property, '@id'));
                        // hide the overlay
                        dvm.sm.showCreatePropertyOverlay = false;
                    }
                }
            }
        }
})();
