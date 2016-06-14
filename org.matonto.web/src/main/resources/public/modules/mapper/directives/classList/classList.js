(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classList
         * @requires  prefixes
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `classList` module only provides the `classList` directive which creates
         * a "boxed" area with a list of all the class and property mappings in the selected
         * mapping.
         */
        .module('classList', ['prefixes', 'ontologyManager', 'mappingManager', 'mapperState', 'csvManager'])
        /**
         * @ngdoc directive
         * @name classList.directive:classList
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `classList` is a directive that creates a "boxed" div with an unordered list of the 
         * class and property mappings in the selected mapping. The properties for each class
         * mapping are listed beneath them and are collapsible. Each class that has properties left
         * to map has an "Add Property" link. The directive is replaced by the contents of its template.
         */
        .directive('classList', classList);

        classList.$inject = ['prefixes', 'ontologyManagerService', 'mappingManagerService', 'mapperStateService', 'csvManagerService'];

        function classList(prefixes, ontologyManagerService, mappingManagerService, mapperStateService, csvManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.mm = mappingManagerService;
                    dvm.state = mapperStateService;
                    dvm.cm = csvManagerService;

                    dvm.hasProps = function(classMapping) {
                        return dvm.mm.getPropMappingsByClass(dvm.mm.mapping.jsonld, classMapping['@id']).length > 0;
                    }
                    dvm.toggleOpen = function(classMappingId) {
                        if (dvm.isOpen(classMappingId)) {
                            _.pull(dvm.state.openedClasses, classMappingId);
                        } else {
                            dvm.state.openedClasses.push(classMappingId);
                        }
                    }
                    dvm.isOpen = function(classMappingId) {
                        return _.includes(dvm.state.openedClasses, classMappingId);
                    }
                    dvm.clickClass = function(classMapping) {
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                        dvm.state.updateAvailableProps();
                    }
                    dvm.clickProp = function(propMapping, classMapping) {
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                        dvm.state.selectedPropMappingId = propMapping['@id'];
                        dvm.state.updateAvailableColumns();
                        dvm.state.selectedColumn = dvm.cm.filePreview.headers[parseInt(_.get(propMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']"), 10)];
                    }
                    dvm.clickAddProp = function(classMapping) {
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                        dvm.state.newProp = true;
                        dvm.state.updateAvailableColumns();
                        dvm.state.updateAvailableProps();
                    }
                    dvm.getInvalidPropIds = function() {
                        return _.map(dvm.state.invalidProps, '@id');
                    }
                    dvm.getClassTitle = function(classMapping) {
                        var className = getClassName(classMapping);
                        var links = dvm.getLinks(classMapping);
                        if (links) {
                            className = className + ' - ' + links;
                        } 
                        return className;
                    }
                    dvm.getPropTitle = function(propMapping, classMapping) {
                        var propName = getPropName(propMapping, classMapping);
                        var mappingName = '';
                        if (dvm.mm.isObjectMapping(propMapping)) {
                            var wrapperClassMapping = _.find(dvm.mm.mapping.jsonld, {'@id': propMapping[prefixes.delim + 'classMapping'][0]['@id']});
                            mappingName = getClassName(wrapperClassMapping);
                        } else if (dvm.mm.isDataMapping(propMapping)) {
                            var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                            mappingName = dvm.cm.filePreview.headers[index];
                        }
                        return propName + ': ' + mappingName;
                    }
                    dvm.mappedAllProps = function(classMapping) {
                        var mappedProps = dvm.mm.getPropMappingsByClass(dvm.mm.mapping.jsonld, classMapping['@id']);
                        var classId = getClassId(classMapping);
                        var ontology = dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, classId);
                        var classProps = dvm.om.getClassProperties(ontology, classId);

                        return mappedProps.length === classProps.length;
                    }
                    dvm.getLinks = function(classMapping) {
                        var objectMappings = _.filter(
                            _.filter(dvm.mm.mapping.jsonld, {'@type': [prefixes.delim + 'ObjectMapping']}),
                            ["['" + prefixes.delim + "classMapping'][0]['@id']", classMapping['@id']]
                        );
                        return _.join(
                            _.map(objectMappings, objectMapping => {
                                var wrapperClassMapping = dvm.mm.findClassWithObjectMapping(dvm.mm.mapping.jsonld, objectMapping['@id']);
                                var className = getClassName(wrapperClassMapping);
                                var propName = getPropName(objectMapping, wrapperClassMapping);
                                return dvm.mm.getPropMappingTitle(className, propName);
                            }),
                            ', '
                        );
                    }
                    function getClassName(classMapping) {
                        var classId = getClassId(classMapping);
                        var ontology = dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, classId);
                        return dvm.om.getEntityName(dvm.om.getClass(ontology, classId));
                    }
                    function getPropName(propMapping, classMapping) {
                        var classId = getClassId(classMapping);
                        var ontology = dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, classId);
                        var propId = getPropId(propMapping);
                        return dvm.om.getEntityName(dvm.om.getClassProperty(ontology, classId, propId));
                    }
                    function getClassId(classMapping) {
                        return dvm.mm.getClassIdByMapping(classMapping);
                    }
                    function getPropId(propMapping) {
                        return dvm.mm.getPropIdByMapping(propMapping);
                    }
                },
                templateUrl: 'modules/mapper/directives/classList/classList.html'
            }
        }
})();
