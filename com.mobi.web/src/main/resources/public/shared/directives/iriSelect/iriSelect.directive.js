/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    iriSelect.$inject = ['utilService'];

    function iriSelect(utilService) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'shared/directives/iriSelect/iriSelect.directive.html',
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

    angular
        .module('shared')
        /**
         * @ngdoc directive
         * @name shared.directive:iriSelect
         * @restrict E
         * @requires shared.service:utilService
         *
         * @description
         * `iriSelect` is a directive which provides options for a formatted ui-select that takes in a map of IRI to its
         * parent IRI. iriSelect then will group and sort IRIs based on the parent IRI. The directive is
         * replaced by the content of the template.
         *
         * @param {*} bindModel The variable to bind the value of the select results to
         * @param {Object} selectList A map of IRIs to their parent IRI
         * @param {string} displayText The main text to display above the ui-select
         * @param {string} mutedText Additional muted text to display after the displayText
         * @param {boolean} isDisabledWhen A boolean to indicate when to disable the ui-select
         * @param {boolean} isRequiredWhen A boolean to indicate when the ui-select is required
         * @param {boolean} multiSelect A boolean to select whether to use a multiSelect (true) or a single select (false)
         * @param {function} onChange A function to be called when a choice from the drop down is selected
         */
        .directive('iriSelect', iriSelect);
})();
