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
        /**
         * @ngdoc overview
         * @name iriSelect
         *
         * @description
         * The `iriSelect` module provides the `iriSelect` directive which provides options for a formatted ui-select
         * that takes in a map of IRI to its parent IRI. iriSelect then will group and sort IRIs based on the parent
         * IRI.
         */
        .module('iriSelect', [])
        /**
         * @ngdoc directive
         * @name iriSelect.directive:iriSelect
         * @restrict E
         * @requires util.service:utilService
         *
         * @description
         * `iriSelect` is a directive which provides options for a formatted ui-select that takes in a map of IRI to its
         * parent IRI. iriSelect then will group and sort IRIs based on the parent IRI.
         */
        .directive('iriSelect', iriSelect);

        iriSelect.$inject = ['utilService'];

        function iriSelect(utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'directives/iriSelect/iriSelect.html',
                scope: {},
                bindToController: {
                    bindModel: '=ngModel',
                    selectList: '<',
                    displayText: '<',
                    mutedText: '<',
                    isDisabledWhen: '<',
                    isRequiredWhen: '<',
                    multiSelect: '<?',
                    onChange: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.util = utilService;
                    dvm.multiSelect = angular.isDefined(dvm.multiSelect) ? dvm.multiSelect : true;

                    dvm.values = [];

                    dvm.getOntologyIri = function(iri) {
                        return _.get(dvm.selectList, "['" + iri + "']");
                    }
                    dvm.getValues = function(searchText) {
                        dvm.values = [];
                        var mapped = _.map( _.keys(dvm.selectList), item => ({
                            item,
                            name: dvm.util.getBeautifulIRI(item)
                        }));
                        var sorted = _.sortBy(mapped, item => _.trim(item.name.toUpperCase()));
                        _.forEach(sorted, item => {
                            if (dvm.values.length == 100) {
                                return;
                            } else if (_.includes(item.name.toUpperCase(), searchText.toUpperCase())) {
                                dvm.values.push(item.item);
                            }
                        });}
                }]
            }
        }
})();
