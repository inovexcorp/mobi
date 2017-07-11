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
         *
         * @description
         * HTML contents in the instance view page which shows the complete list of properites
         * associated with the instance in an editable format.
         */
        .directive('instanceForm', instanceForm);
        
        instanceForm.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService', 'prefixes', 'REGEX'];

        function instanceForm($q, discoverStateService, utilService, exploreService, prefixes, REGEX) {
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
                    dvm.regex = REGEX;
                    dvm.prefixes = prefixes;
                    dvm.searchText = {};
                    dvm.showOverlay = false;
                    dvm.showText = false;
                    dvm.changed = [];
                    
                    dvm.getOptions = function(propertyIRI) {
                        var range = getRange(propertyIRI);
                        if (range) {
                            return es.getClassInstanceDetails(dvm.ds.explore.recordId, range, {offset: 0}, true)
                                .then(response => {
                                    var options = _.map(response.data, 'instanceIRI');
                                    if (dvm.searchText[propertyIRI]) {
                                        return _.filter(options, iri => contains(iri, dvm.searchText[propertyIRI]) && !_.some(dvm.ds.explore.instance.entity[propertyIRI], {'@id': iri}))
                                    }
                                    return options;
                                }, errorMessage => {
                                    dvm.util.createErrorToast(errorMessage);
                                    return [];
                                });
                        }
                        return $q.when([]);
                    }
                    
                    dvm.isPropertyOfType = function(propertyIRI, type) {
                        return _.some(dvm.properties, {propertyIRI, type});
                    }
                    
                    dvm.createIdObj = function(string) {
                        return {'@id': string};
                    }
                    
                    dvm.createValueObj = function(string, propertyIRI) {
                        var obj = {'@value': string};
                        var range = getRange(propertyIRI);
                        if (range) {
                            return _.set(obj, '@type', range);
                        }
                        return obj;
                    }
                    
                    dvm.addToChanged = function(propertyIRI) {
                        dvm.changed = _.uniq(_.concat(dvm.changed, [propertyIRI]));
                    }
                    
                    dvm.isChanged = function(propertyIRI) {
                        return _.includes(dvm.changed, propertyIRI);
                    }
                    
                    dvm.save = function() {
                        _.forOwn(dvm.ds.explore.instance.entity, (value, key) => {
                            if (_.isArray(value) && value.length === 0) {
                                delete dvm.ds.explore.instance.entity[key];
                            }
                        });
                        es.updateInstance(dvm.ds.explore.recordId, dvm.ds.explore.instance.metadata.instanceIRI, dvm.ds.explore.instance.entity)
                            .then(() => es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, {offset: dvm.ds.explore.instanceDetails.currentPage * dvm.ds.explore.instanceDetails.limit, limit: dvm.ds.explore.instanceDetails.limit}), $q.reject)
                            .then(response => {
                                dvm.ds.explore.instanceDetails.data = response.data;
                                dvm.ds.explore.instance.metadata = _.find(response.data, {instanceIRI: dvm.ds.explore.instance.entity['@id']});
                                dvm.ds.explore.editing = false;
                            }, dvm.util.createErrorToast);
                    }
                    
                    dvm.setIRI = function(begin, then, end) {
                        dvm.ds.explore.instance.entity['@id'] = begin + then + end;
                    }
                    
                    dvm.isBoolean = function(propertyIRI) {
                        return getRange(propertyIRI) === prefixes.xsd + 'boolean';
                    }
                    
                    dvm.getInputType = function(propertyIRI) {
                        switch (_.replace(getRange(propertyIRI), prefixes.xsd, '')) {
                            case 'dateTime':
                            case 'dateTimeStamp':
                                return 'date';
                            case 'decimal':
                            case 'double':
                            case 'float':
                            case 'int':
                            case 'integer':
                            case 'long':
                            case 'short':
                                return 'number';
                            default:
                                return 'text';
                        }
                    }
                    
                    dvm.getPattern = function(propertyIRI) {
                        switch (_.replace(getRange(propertyIRI), prefixes.xsd, '')) {
                            case 'dateTime':
                            case 'dateTimeStamp':
                                return dvm.regex.DATETIME;
                            case 'decimal':
                            case 'double':
                            case 'float':
                                return dvm.regex.DECIMAL;
                            case 'int':
                            case 'long':
                            case 'short':
                            case 'integer':
                                return dvm.regex.INTEGER;
                            default:
                                return dvm.regex.ANYTHING;
                        }
                    }
                    
                    dvm.getNewProperties = function(text) {
                        var properties = _.difference(_.map(dvm.properties, 'propertyIRI'), _.keys(dvm.ds.explore.instance.entity));
                        if (text) {
                            return _.filter(properties, iri => contains(iri, text));
                        }
                        return properties;
                    }
                    
                    dvm.addNewProperty = function(property) {
                        dvm.ds.explore.instance.entity[property] = [];
                        dvm.addToChanged(property);
                        dvm.showOverlay = false;
                    }
                    
                    dvm.onSelect = function(text) {
                        dvm.fullText = text;
                        dvm.showText = true;
                    }
                    
                    dvm.getMissingProperties = function() {
                        var missing = [];
                        _.forEach(dvm.properties, property => {
                            if (_.has(property, 'restrictions')) {
                                _.forEach(property.restrictions, restriction => {
                                    var length = _.get(dvm.ds.explore.instance.entity, property.propertyIRI, []).length;
                                    if (_.includes(restriction.classExpressionType, 'EXACT') && length !== restriction.cardinality) {
                                        missing.push('Must have exactly ' + restriction.cardinality + ' value(s) for ' + property.propertyIRI);
                                    } else if (_.includes(restriction.classExpressionType, 'MIN') && length < restriction.cardinality) {
                                        missing.push('Must have at least ' + restriction.cardinality + ' value(s) for ' + property.propertyIRI);
                                    } else if (_.includes(restriction.classExpressionType, 'MAX') && length > restriction.cardinality) {
                                        missing.push('Must have at most ' + restriction.cardinality + ' value(s) for ' + property.propertyIRI);
                                    }
                                });
                            }
                        });
                        dvm.isValid = !missing.length;
                        return missing;
                    }
                    
                    dvm.getRestrictionText = function(propertyIRI) {
                        var details = _.find(dvm.properties, {propertyIRI});
                        if (_.has(details, 'restrictions')) {
                            var results = [];
                            _.forEach(details.restrictions, restriction => {
                                if (_.includes(restriction.classExpressionType, 'EXACT')) {
                                    results.push('needs exactly ' + restriction.cardinality);
                                } else if (_.includes(restriction.classExpressionType, 'MIN')) {
                                    results.push('needs at least ' + restriction.cardinality);
                                } else if (_.includes(restriction.classExpressionType, 'MAX')) {
                                    results.push('needs at most ' + restriction.cardinality);
                                }
                            });
                            return '[' + _.join(results, ', ') + ']';
                        }
                        return '';
                    }
                    
                    function contains(string, part) {
                        return _.includes(_.toLower(string), _.toLower(part));
                    }
                    
                    function getProperties() {
                        $q.all(_.map(dvm.ds.explore.instance.entity['@type'], type => es.getClassPropertyDetails(dvm.ds.explore.recordId, type)))
                            .then(responses => dvm.properties = _.concat(dvm.properties, _.uniq(_.flatten(responses))), () => dvm.util.createErrorToast('An error occurred retrieving the instance properties.'));
                    }
                    
                    function getRange(propertyIRI) {
                        var range = _.get(_.find(dvm.properties, {propertyIRI}), 'range', []);
                        if (range.length) {
                            return range[0];
                        }
                        return '';
                    }
                    
                    getProperties();
                }
            }
        }
})();