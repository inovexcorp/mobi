(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mapperSerializationSelect
         *
         * @description
         * The `mapperSerializationSelect` module only provides the `mapperSerializationSelect` directive
         * which creates a select with different serialization formats specifically for the mapping tool.
         */
        .module('mapperSerializationSelect', [])
        /**
         * @ngdoc directive
         * @name mapperSerializationSelect.directive:mapperSerializationSelect
         * @scope
         * @restrict E
         *
         * @description
         * `mapperSerializationSelect` is a directive which creates a select with the following options
         * for a RDF serialization format: JSON-LD, Turtle, and RDF/XML. The directive is replaced by the
         * contents of its template.
         *
         * @param {string} format A string representing an RDF serialization
         */
        .directive('mapperSerializationSelect', mapperSerializationSelect);

        function mapperSerializationSelect() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                require: '^form',
                replace: true,
                scope: {
                    format: '=',
                },
                controller: function() {
                    var dvm = this;
                    dvm.options = [
                        {
                            name: 'JSON-LD',
                            value: 'jsonld'
                        },
                        {
                            name: 'Turtle',
                            value: 'turtle'
                        },
                        {
                            name: 'RDF/XML',
                            value: 'rdf/xml'
                        }
                    ];
                },
                templateUrl: 'mapper/directives/mapperSerializationSelect/mapperSerializationSelect.directive.html'
            }
        }
})();
