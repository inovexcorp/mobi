/*-
 * #%L
 * com.mobi.web
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
         * @name instanceForm
         *
         * @description
         * The `instanceForm` module only provides the `instanceForm` directive which creates
         * the instance form.
         */
        .module('instanceForm', [])
        /**
         * @ngdoc directive
         * @name instanceEditor.directive:instanceEditor
         * @scope
         * @restrict E
         * @requires $q
         * @requires discoverState.service:discoverStateService
         * @requires util.service:utilService
         * @requires explore.service:exploreService
         * @requires prefixes.service:prefixes
         * @requires exploreUtils.service:exploreUtilsService
         *
         * @description
         * HTML contents in the instance view page which shows the complete list of properites
         * associated with the instance in an editable format.
         */
        .directive('instanceForm', instanceForm);

        instanceForm.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService', 'prefixes', 'REGEX', 'exploreUtilsService'];

        function instanceForm($q, discoverStateService, utilService, exploreService, prefixes, REGEX, exploreUtilsService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceForm/instanceForm.html',
                replace: true,
                scope: {
                    header: '<'
                },
                bindToController: {
                    isValid: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    dvm.ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.properties = [{
                        propertyIRI: prefixes.dcterms + 'description',
                        type: 'Data'
                    }, {
                        propertyIRI: prefixes.dcterms + 'title',
                        type: 'Data'
                    }, {
                        propertyIRI: prefixes.rdfs + 'comment',
                        type: 'Data'
                    }, {
                        propertyIRI: prefixes.rdfs + 'label',
                        type: 'Data'
                    }];
                    dvm.reificationProperties = [];
                    dvm.regex = REGEX;
                    dvm.prefixes = prefixes;
                    dvm.searchText = {};
                    dvm.showOverlay = false;
                    dvm.showPropertyValueOverlay = false;
                    dvm.changed = [];
                    dvm.missingProperties = [];
                    dvm.propertyIRI = '';
                    dvm.index = 0;
                    dvm.instance = dvm.ds.getInstance();
                    dvm.eu = exploreUtilsService;

                    dvm.getOptions = function(propertyIRI) {
                        var range = dvm.eu.getRange(propertyIRI, dvm.properties);
                        if (range) {
                            return es.getClassInstanceDetails(dvm.ds.explore.recordId, range, {offset: 0, infer: true}, true)
                                .then(response => {
                                    var options = _.filter(response.data, item => !_.some(dvm.instance[propertyIRI], {'@id': item.instanceIRI}));
                                    if (dvm.searchText[propertyIRI]) {
                                        return _.filter(options, item => dvm.eu.contains(item.instanceIRI, dvm.searchText[propertyIRI]));
                                    }
                                    return options;
                                }, errorMessage => {
                                    dvm.util.createErrorToast(errorMessage);
                                    return [];
                                });
                        }
                        return $q.when([]);
                    }

                    dvm.addToChanged = function(propertyIRI) {
                        dvm.changed = _.uniq(_.concat(dvm.changed, [propertyIRI]));
                        dvm.missingProperties = dvm.getMissingProperties();
                    }

                    dvm.isChanged = function(propertyIRI) {
                        return _.includes(dvm.changed, propertyIRI);
                    }

                    dvm.setIRI = function(begin, then, end) {
                        dvm.instance['@id'] = begin + then + end;
                    }

                    dvm.addNewProperty = function(property) {
                        dvm.instance[property] = [];
                        dvm.addToChanged(property);
                        dvm.showOverlay = false;
                    }

                    dvm.onSelect = function(text, propertyIRI, index) {
                        dvm.fullText = text;
                        dvm.propertyIRI = propertyIRI;
                        dvm.index = index;
                        dvm.showPropertyValueOverlay = true;
                    }

                    dvm.getMissingProperties = function() {
                        var missing = [];
                        _.forEach(dvm.properties, property => {
                            _.forEach(_.get(property, 'restrictions', []), restriction => {
                                var length = _.get(dvm.instance, property.propertyIRI, []).length;
                                if (_.includes(restriction.classExpressionType, 'EXACT') && length !== restriction.cardinality) {
                                    missing.push('Must have exactly ' + restriction.cardinality + ' value(s) for ' + dvm.util.getBeautifulIRI(property.propertyIRI));
                                } else if (_.includes(restriction.classExpressionType, 'MIN') && length < restriction.cardinality) {
                                    missing.push('Must have at least ' + restriction.cardinality + ' value(s) for ' + dvm.util.getBeautifulIRI(property.propertyIRI));
                                } else if (_.includes(restriction.classExpressionType, 'MAX') && length > restriction.cardinality) {
                                    missing.push('Must have at most ' + restriction.cardinality + ' value(s) for ' + dvm.util.getBeautifulIRI(property.propertyIRI));
                                }
                            });
                        });
                        dvm.isValid = !missing.length;
                        return missing;
                    }

                    dvm.getRestrictionText = function(propertyIRI) {
                        var details = _.find(dvm.properties, {propertyIRI});
                        var results = [];
                        _.forEach(_.get(details, 'restrictions', []), restriction => {
                            if (_.includes(restriction.classExpressionType, 'EXACT')) {
                                results.push('exactly ' + restriction.cardinality);
                            } else if (_.includes(restriction.classExpressionType, 'MIN')) {
                                results.push('at least ' + restriction.cardinality);
                            } else if (_.includes(restriction.classExpressionType, 'MAX')) {
                                results.push('at most ' + restriction.cardinality);
                            }
                        });
                        return results.length ? ('[' + _.join(results, ', ') + ']') : '';
                    }

                    dvm.cleanUpReification = function($chip, propertyIRI) {
                        var object = angular.copy($chip);
                        _.remove(dvm.ds.explore.instance.entity, {
                            [prefixes.rdf + 'predicate']: [{'@id': propertyIRI}],
                            [prefixes.rdf + 'object']: [object]
                        });
                    }

                    dvm.transformChip = function(item) {
                        dvm.ds.explore.instance.objectMap[item.instanceIRI] = item.title;
                        return dvm.eu.createIdObj(item.instanceIRI)
                    }

                    function getProperties() {
                        $q.all(_.map(dvm.instance['@type'], type => es.getClassPropertyDetails(dvm.ds.explore.recordId, type)))
                            .then(responses => {
                                dvm.properties = _.concat(dvm.properties, _.uniq(_.flatten(responses)));
                                dvm.missingProperties = dvm.getMissingProperties();
                            }, () => dvm.util.createErrorToast('An error occurred retrieving the instance properties.'));
                    }

                    function getReificationProperties() {
                        es.getClassPropertyDetails(dvm.ds.explore.recordId, prefixes.rdf + 'Statement')
                            .then(response => dvm.reificationProperties = response, () => dvm.util.createErrorToast('An error occurred retrieving the reification properties.'));
                    }

                    getProperties();
                    getReificationProperties();
                }
            }
        }
})();