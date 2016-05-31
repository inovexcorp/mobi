(function() {
    'use strict';

    angular
        .module('mappingList', ['mappingManager', 'mapperState'])
        .directive('mappingList', mappingList);

        mappingList.$inject = ['mappingManagerService', 'mapperStateService'];

        function mappingList(mappingManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    var openedMappings = [];
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;

                    dvm.onClick = function(mappingName) {
                        var openedMapping = _.find(openedMappings, {name: mappingName});
                        if (openedMapping) {
                            dvm.manager.mapping = openedMapping;
                        } else {
                            dvm.manager.getMapping(mappingName).then(jsonld => {
                                var mapping = {
                                    jsonld,
                                    name: mappingName
                                };
                                dvm.manager.mapping = mapping;
                                openedMappings.push(mapping);
                            }, errorMessage => {
                                console.log(errorMessage);
                            });
                        }
                        _.remove(openedMappings, mapping => dvm.manager.previousMappingNames.indexOf(mapping.name) < 0);
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingList/mappingList.html'
            }
        }
})();
