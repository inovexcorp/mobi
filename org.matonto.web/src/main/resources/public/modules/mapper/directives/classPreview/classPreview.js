(function() {
    'use strict';

    angular
        .module('classPreview', ['prefixes'])
        .directive('classPreview', classPreview);

        classPreview.$inject = ['prefixes'];

        function classPreview(prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classObj: '='
                },
                controller: function($filter) {
                    var dvm = this;

                    dvm.createTitle = function() {
                        if (dvm.classObj) {
                            return dvm.classObj.hasOwnProperty(prefixes.rdfs + 'label') ? dvm.classObj[prefixes.rdfs + 'label'][0]['@value'] : $filter('beautify')($filter('splitIRI')(dvm.classObj['@id']).end);
                        }
                        return '';
                    }
                    dvm.createPropList = function() {
                        if (dvm.classObj) {
                            return dvm.classObj.matonto.properties.map(function(prop) {
                                return prop.hasOwnProperty(prefixes.rdfs + 'label') ? prop[prefixes.rdfs + 'label'][0]['@value'] : $filter('beautify')($filter('splitIRI')(prop['@id']).end);
                            });                            
                        }
                        return [];
                    }
                },
                templateUrl: 'modules/mapper/directives/classPreview/classPreview.html'
            }
        }
})();
