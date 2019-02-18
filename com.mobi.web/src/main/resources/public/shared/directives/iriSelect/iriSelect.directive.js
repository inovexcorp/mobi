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
