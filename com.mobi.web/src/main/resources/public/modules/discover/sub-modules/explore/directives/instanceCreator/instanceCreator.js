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
         * @name instanceCreator
         *
         * @description
         * The `instanceCreator` module only provides the `instanceCreator` directive which creates
         * the instance creator page.
         */
        .module('instanceCreator', [])
        /**
         * @ngdoc directive
         * @name instanceCreator.directive:instanceCreator
         * @scope
         * @restrict E
         * @requires $q
         * @requires discoverState.service:discoverStateService
         * @requires util.service:utilService
         * @requires explore.service:exploreService
         *
         * @description
         * HTML contents in the instance view page which shows the complete list of properites
         * available for the new instance in an editable format.
         */
        .directive('instanceCreator', instanceCreator);

        instanceCreator.$inject = ['$q', 'discoverStateService', 'utilService', 'exploreService', 'exploreUtilsService', 'prefixes'];

        function instanceCreator($q, discoverStateService, utilService, exploreService, exploreUtilsService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceCreator/instanceCreator.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    var eu = exploreUtilsService;
                    dvm.ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.isValid = true;

                    dvm.save = function() {
                        dvm.ds.explore.instance.entity = eu.removeEmptyPropertiesFromArray(dvm.ds.explore.instance.entity);
                        var instance = dvm.ds.getInstance();
                        es.createInstance(dvm.ds.explore.recordId, dvm.ds.explore.instance.entity)
                            .then(() => {
                                dvm.ds.explore.instanceDetails.total++;
                                var offset = (dvm.ds.explore.instanceDetails.currentPage - 1) * dvm.ds.explore.instanceDetails.limit;
                                return es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, {offset, limit: dvm.ds.explore.instanceDetails.limit});
                            }, $q.reject)
                            .then(response => {
                                var resultsObject = es.createPagedResultsObject(response);
                                dvm.ds.explore.instanceDetails.data = resultsObject.data;
                                dvm.ds.explore.instanceDetails.links = resultsObject.links;
                                var metadata = {instanceIRI: instance['@id']};
                                metadata.title = getPreferredValue(instance, [prefixes.dcterms + 'title', prefixes.rdfs + 'label'], dvm.util.getBeautifulIRI(instance['@id']));
                                metadata.description = getPreferredValue(instance, [prefixes.dcterms + 'description', prefixes.rdfs + 'comment'], '');
                                dvm.ds.explore.instance.metadata = metadata;
                                dvm.ds.explore.breadcrumbs[dvm.ds.explore.breadcrumbs.length - 1] = dvm.ds.explore.instance.metadata.title;
                                dvm.ds.explore.creating = false;
                                return es.getClassDetails(dvm.ds.explore.recordId);
                            }, $q.reject)
                            .then(response => {
                                dvm.ds.explore.classDetails = response;
                            }, dvm.util.createErrorToast);
                    }

                    dvm.cancel = function() {
                        dvm.ds.explore.instance.entity = {};
                        dvm.ds.explore.creating = false;
                        dvm.ds.explore.breadcrumbs = _.initial(dvm.ds.explore.breadcrumbs);
                    }

                    function getPreferredValue(entity, props, defaultValue) {
                        var prop = _.find(props, prop => entity[prop]);
                        return prop ? _.get(_.find(entity[prop], obj => !obj['@lang'] || obj['@lang'] === 'en'), '@value') : defaultValue;
                    }
                }
            }
        }
})();