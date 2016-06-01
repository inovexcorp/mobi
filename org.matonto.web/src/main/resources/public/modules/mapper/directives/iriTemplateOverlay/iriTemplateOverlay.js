(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name iriTemplateOverlay
         * @requires  prefixes
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `iriTemplateOverlay` module only provides the `iriTemplateOverlay` directive which creates
         * an overlay with functionality to change the IRI template of the selected class mapping.
         */
        .module('iriTemplateOverlay', ['prefixes', 'mapperState', 'mappingManager', 'csvManager'])
        /**
         * @ngdoc directive
         * @name iriTemplateOverlay.directive:iriTemplateOverlay
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `iriTemplateOverlay` is a directive that creates an overlay with functionality to change the 
         * IRI template of the selected class mapping. The overlay splits the IRI template into part of 
         * the namespace, the delimiter between the namespace and local name, and the dynamically created
         * local name. The local name can either be a UUID or a column header. The directive is replaced 
         * by the contents of its template.
         */
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
