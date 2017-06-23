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
         * @name instanceEditor
         *
         * @description
         * The `instanceEditor` module only provides the `instanceEditor` directive which creates
         * the instance editor page.
         */
        .module('instanceEditor', [])
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
         * associated with the selected instance in an editable format.
         */
        .directive('instanceEditor', instanceEditor);
        
        instanceEditor.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService', 'prefixes'];

        function instanceEditor($q, discoverStateService, utilService, exploreService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceEditor/instanceEditor.html',
                replace: true,
                scope: {},
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
                    dvm.changed = [];
                    
                    dvm.getValue = function(chip) {
                        return _.get(chip, '@id', _.get(chip, '@value', ''));
                    }
                    
                    dvm.getOptions = function(property) {
                        return [];
                    }
                    
                    dvm.isPropertyOfType = function(propertyIRI, type) {
                        return _.some(dvm.properties, {propertyIRI, type});
                    }
                    
                    dvm.createIdObj = function(string) {
                        return {'@id': string};
                    }
                    
                    dvm.createValueObj = function(string) {
                        return {'@value': string};
                    }
                    
                    dvm.removeIsTag = function(item) {
                        return _.omit(item, ['isTag']);
                    }
                    
                    dvm.addType = function(item, propertyIRI) {
                        var range = _.get(_.find(dvm.properties, {propertyIRI}), 'range', []);
                        if (range.length) {
                            return _.set(dvm.removeIsTag(item), '@type', range[0]);
                        }
                        return dvm.removeIsTag(item);
                    }
                    
                    dvm.addToChanged = function(propertyIRI) {
                        dvm.changed.push(propertyIRI);
                    }
                    
                    dvm.save = function() {
                        es.updateInstance(dvm.ds.explore.recordId, dvm.ds.explore.instance.metadata.instanceIRI, dvm.ds.explore.instance.entity)
                            .then(() => {
                                dvm.ds.explore.instance.changed = changed;
                                dvm.ds.explore.editing = false;
                            }, dvm.util.createErrorToast);
                    }
                    
                    dvm.setIRI = function(begin, then, end) {
                        dvm.ds.explore.instance.entity['@id'] = begin + then + end;
                    }
                    
                    dvm.isChanged = function(propertyIRI) {
                        return _.includes(dvm.ds.explore.instance.changed, propertyIRI);
                    }
                    
                    function getProperties() {
                        $q.all(_.map(dvm.ds.explore.instance.entity['@type'], type => es.getClassPropertyDetails(dvm.ds.explore.recordId, type)))
                            .then(responses => dvm.properties = _.concat(dvm.properties, _.uniq(_.flatten(responses))), () => dvm.properties = []);
                    }
                    
                    getProperties();
                }
            }
        }
})();