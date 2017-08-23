/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name propertyFilterOverlay
         *
         * @description
         * The `propertyFilterOverlay` module only provides the `propertyFilterOverlay` directive which creates
         * the property filter overlay.
         */
        .module('propertyFilterOverlay', [])
        /**
         * @ngdoc directive
         * @name propertyFilterOverlay.directive:propertyFilterOverlay
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires utilService.service:utilService
         * @requires searchService.service:searchService
         * @requires prefixes.service:prefixes
         * @requires ontologyManagerService.service:ontologyManagerService
         *
         * @description
         * HTML contents for the property filter overlay which provides the users with step by step options for building
         * the property filter for the search page.
         */
        .directive('propertyFilterOverlay', propertyFilterOverlay);
        
        propertyFilterOverlay.$inject = ['discoverStateService', 'utilService', 'searchService', 'prefixes', 'ontologyManagerService'];
        
        function propertyFilterOverlay(discoverStateService, utilService, searchService, prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/search/directives/propertyFilterOverlay/propertyFilterOverlay.html',
                replace: true,
                scope: {},
                bindToController: {
                    closeOverlay: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var util = utilService;
                    var ds = discoverStateService;
                    var s = searchService;
                    dvm.om = ontologyManagerService;
                    dvm.property = undefined;
                    dvm.range = undefined;
                    dvm.keys = getKeys();
                    dvm.filterType = undefined;
                    dvm.begin = '';
                    dvm.end = '';
                    dvm.value = '';
                    dvm.regex = '';
                    dvm.boolean = undefined;

                    dvm.submittable = function() {
                        switch (dvm.filterType) {
                            case 'Boolean':
                                return dvm.boolean !== undefined;
                            case 'Contains':
                            case 'Exact':
                            case 'Greater than':
                            case 'Greater than or equal to':
                            case 'Less than':
                            case 'Less than or equal to':
                                return dvm.value;
                            case 'Existence':
                                return true;
                            case 'Range':
                                return dvm.begin && dvm.end;
                            case 'Regex':
                                return dvm.regex;
                            default:
                                return false;
                        }
                    }

                    dvm.submit = function() {
                        switch (dvm.filterType) {
                            case 'Boolean':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'Is ' + dvm.boolean));
                                ds.search.queryConfig.filters.push(s.createBooleanQuery(dvm.property['@id'], dvm.boolean));
                                break;
                            case 'Contains':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'Contains "' + dvm.value + '"'));
                                ds.search.queryConfig.filters.push(s.createContainsQuery(dvm.property['@id'], dvm.value));
                                break;
                            case 'Exact':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'Exactly matches "' + dvm.value + '"'));
                                ds.search.queryConfig.filters.push(s.createExactQuery(dvm.property['@id'], dvm.value, dvm.range));
                                break;
                            case 'Existence':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'Existence'));
                                ds.search.queryConfig.filters.push(s.createExistenceQuery(dvm.property['@id']));
                                break;
                            case 'Greater than':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'value > ' + dvm.value));
                                ds.search.queryConfig.filters.push(s.createRangeQuery(dvm.property['@id'], { greaterThan: dvm.value }));
                                break;
                            case 'Greater than or equal to':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'value >= ' + dvm.value));
                                ds.search.queryConfig.filters.push(s.createRangeQuery(dvm.property['@id'], { greaterThanOrEqualTo: dvm.value }));
                                break;
                            case 'Less than':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'value < ' + dvm.value));
                                ds.search.queryConfig.filters.push(s.createRangeQuery(dvm.property['@id'], { lessThan: dvm.value }));
                                break;
                            case 'Less than or equal to':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'value <= ' + dvm.value));
                                ds.search.queryConfig.filters.push(s.createRangeQuery(dvm.property['@id'], { lessThanOrEqualTo: dvm.value }));
                                break;
                            case 'Range':
                                ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, dvm.begin + ' <= value <= ' + dvm.end));
                                ds.search.queryConfig.filters.push(s.createRangeQuery(dvm.property['@id'], {
                                    greaterThanOrEqualTo: dvm.begin,
                                    lessThanOrEqualTo: dvm.end
                                }));
                                break;
                            case 'Regex':
                                try {
                                    var regex = new RegExp(dvm.regex);
                                    ds.search.filterMeta.push(createMeta(dvm.property, dvm.range, 'Matches ' + dvm.regex));
                                    ds.search.queryConfig.filters.push(s.createRegexQuery(dvm.property['@id'], dvm.regex));
                                    break;
                                } catch (e) {
                                    util.createErrorToast(e.message);
                                    return;
                                }
                        }
                        dvm.closeOverlay();
                    }

                    function setProperties() {
                        if (!ds.search.properties) {
                            s.getPropertiesForDataset(ds.search.datasetRecordId)
                                .then(response => {
                                    ds.search.properties = {};
                                    ds.search.noDomains = [];
                                    _.forEach(response, property => {
                                        var domains = _.get(property, prefixes.rdfs + 'domain');
                                        _.forEach(domains, domain => {
                                            var id = domain['@id'];
                                            if (!_.has(ds.search.properties, id)) {
                                                ds.search.properties[id] = [property];
                                            } else {
                                                ds.search.properties[id].push(property);
                                            }
                                        });
                                        if (!domains) {
                                            ds.search.noDomains.push(property);
                                        }
                                    });
                                    dvm.keys = getKeys();
                                }, util.createErrorToast);
                        }
                    }

                    function getKeys() {
                        return _.sortBy(_.keys(ds.search.properties));
                    }

                    function createMeta(property, range, display) {
                        return {
                            display,
                            range: util.getBeautifulIRI(range),
                            title: dvm.om.getEntityName(property)
                        };
                    }

                    setProperties();
                }
            }
        }
})();
