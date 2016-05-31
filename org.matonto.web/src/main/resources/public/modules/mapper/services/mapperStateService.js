(function() {
    'use strict';

    angular
        .module('mapperState', ['prefixes', 'mappingManager', 'csvManager', 'ontologyManager'])
        .service('mapperStateService', mapperStateService);

        mapperStateService.$inject = ['prefixes', 'mappingManagerService', 'csvManagerService', 'ontologyManagerService'];

        function mapperStateService(prefixes, mappingManagerService, csvManagerService, ontologyManagerService) {
            var self = this;
            var cachedOntologyId = undefined;
            var cachedSourceOntologies = undefined;
            var originalMappingName = '';
            var manager = mappingManagerService,
                csv = csvManagerService,
                ontology = ontologyManagerService;

            self.editMapping = false;
            self.newMapping = false;
            self.step = 0;
            self.invalidProps = [];
            self.availableColumns = [];
            self.availableProps = [];
            self.editMappingName = false;
            self.displayCancelConfirm = false;
            self.displayNewMappingConfirm = false;
            self.changeOntology = false;
            self.displayDeleteEntityConfirm = false;
            self.displayDeleteMappingConfirm = false;
            self.previewOntology = false;
            self.editIriTemplate = false;

            self.selectedClassMappingId = '';
            self.selectedPropMappingId = '';
            self.selectedProp = undefined;
            self.selectedColumn = '';
            self.newProp = false;
            self.deleteId = '';

            self.initialize = function() {
                self.editMapping = false;
                self.newMapping = false;
                self.step = 0;
                self.invalidProps = [];
                self.availableColumns = [];
                self.invalidProps = [];
                originalMappingName = '';
            }
            self.resetEdit = function() {
                self.selectedClassMappingId = '';
                self.selectedPropMappingId = '';
                self.selectedProp = undefined;
                self.selectedColumn = '';
                self.newProp = false;
            }
            self.createMapping = function() {
                self.editMapping = true;
                self.newMapping = true;
                self.step = 0;
                manager.mapping = {
                    name: '',
                    jsonld: []
                };
                manager.sourceOntologies = undefined;
                self.editMappingName = true;
                self.resetEdit();
            }
            self.cacheSourceOntologies = function() {
                cachedOntologyId = manager.getSourceOntologyId(manager.mapping.jsonld);
                cachedSourceOntologies = angular.copy(manager.sourceOntologies);
            }
            self.clearCachedSourceOntologies = function() {
                cachedOntologyId = '';
                cachedSourceOntologies = undefined;
            }
            self.restoreCachedSourceOntologies = function() {
                manager.sourceOntologies = cachedSourceOntologies;
                manager.setSourceOntology(manager.mapping.jsonld, cachedOntologyId);
            }
            self.getCachedSourceOntologyId = function() {
                return cachedOntologyId;
            }
            self.getMappedColumns = function() {
                return _.chain(manager.getAllDataMappings(manager.mapping.jsonld))
                    .map(dataMapping => parseInt(dataMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']", '0'), 10)
                    .forEach(index => _.get(csv.filePreview.headers, index))
                    .value();
            }
            self.updateAvailableColumns = function() {
                var mappedColumns = self.getMappedColumns();
                if (self.selectedPropMappingId) {
                    var propMapping = _.find(manager.mapping.jsonld, {'@id': self.selectedPropMappingId});
                    var index = parseInt(_.get(propMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']", '0'), 10);
                    _.pull(mappedColumns, csv.filePreview.headers[index]);
                }
                self.availableColumns = _.difference(csv.filePreview.headers, mappedColumns);
            }
            self.updateAvailableProps = function() {
                var mappedProps = _.map(manager.getPropMappingsByClass(manager.mapping.jsonld, self.selectedClassMappingId), "['" + prefixes.delim + "hasProperty'][0]['@id']");
                var classId = manager.getClassIdByMappingId(manager.mapping.jsonld, self.selectedClassMappingId);
                var properties = ontology.getClassProperties(ontology.findOntologyWithClass(manager.sourceOntologies, classId), classId);
                self.availableProps = _.filter(properties, prop => mappedProps.indexOf(prop['@id']) < 0);
            }
            self.changedMapping = function() {
                if (!self.newMapping && !originalMappingName) {
                    originalMappingName = manager.mapping.name;
                    manager.mapping.name = originalMappingName + '_' + Math.floor(Date.now() / 1000);
                }
            }
        }
})();