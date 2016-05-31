(function() {
    'use strict';

    angular
        .module('iriTemplateOverlay', ['prefixes', 'mapperState', 'mappingManager', 'csvManager'])
        .directive('iriTemplateOverlay', iriTemplateOverlay);

        iriTemplateOverlay.$inject = ['prefixes', 'mapperStateService', 'mappingManagerService', 'csvManagerService'];

        function iriTemplateOverlay(prefixes, mapperStateService, mappingManagerService, csvManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.manager = mappingManagerService;
                    dvm.state = mapperStateService;
                    dvm.csv = csvManagerService;

                    var classMapping = _.find(dvm.manager.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                    var prefix = _.get(classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                    var regex = new RegExp(prefixes.data + '(.*?)\/');
                    var prefixEnd = prefix.replace(regex, '');
                    dvm.beginning = _.pullAt(prefix.match(regex), 0)[0];
                    dvm.beginsWith = prefixEnd.slice(0, -1);
                    dvm.then = prefixEnd[prefixEnd.length - 1];
                    dvm.localNameOptions = [{text: 'UUID', value: '${UUID}'}];
                    _.forEach(dvm.csv.filePreview.headers, (column, idx) => {
                        dvm.localNameOptions.push({text: column, value: '${' + idx + '}'});
                    });
                    var selectedIndex = _.findIndex(dvm.localNameOptions, {'value': _.get(classMapping, "['" + prefixes.delim + "localName'][0]['@value']")});
                    dvm.endsWith = selectedIndex > 0 ? dvm.localNameOptions[selectedIndex] : dvm.localNameOptions[_.findIndex(dvm.localNameOptions, {'text': 'UUID'})];

                    dvm.set = function() {
                        dvm.manager.mapping.jsonld = dvm.manager.editIriTemplate(dvm.manager.mapping.jsonld, dvm.state.selectedClassMappingId, dvm.beginsWith + dvm.then, dvm.endsWith.value);
                        dvm.state.changedMapping();
                    }
                },
                templateUrl: 'modules/mapper/directives/iriTemplateOverlay/iriTemplateOverlay.html'
            }
        }
})();
