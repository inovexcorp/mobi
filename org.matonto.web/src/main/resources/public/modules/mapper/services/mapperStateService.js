/*-
 * #%L
 * org.matonto.web
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
         * @name mapperState
         * @requires delimitedManager
         *
         * @description 
         * The `mapperState` module only provides the `mapperStateService` service which
         * contains various variables to hold the state of the mapping tool page and 
         * utility functions to update those variables.
         */
        .module('mapperState', ['delimitedManager'])
        /**
         * @ngdoc service
         * @name mapperState.service:mapperStateService
         * @requires prefixes.service:prefixes
         * @requires mappingManager.service:mappingManagerService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires delimitedManager.service:delimitedManagerService
         *
         * @description 
         * `mapperStateService` is a service which contains various variables to hold the 
         * state of the mapping tool page and utility functions to update those variables.
         */
        .service('mapperStateService', mapperStateService);

        mapperStateService.$inject = ['prefixes', 'mappingManagerService', 'ontologyManagerService', 'delimitedManagerService'];

        function mapperStateService(prefixes, mappingManagerService, ontologyManagerService, delimitedManagerService) {
            var self = this;
            var mm = mappingManagerService,
                om = ontologyManagerService,
                dm = delimitedManagerService;

            // Static step indexes
            self.selectMappingStep = 0;
            self.fileUploadStep = 1;
            self.editMappingStep = 2;

            /**
             * @ngdoc property
             * @name editMapping
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `editMapping` holds a boolean indicating whether or not the mapping page is
             * editing a mapping
             */
            self.editMapping = false;
            /**
             * @ngdoc property
             * @name newMapping
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `newMapping` holds a boolean indicating whether or not the mapping page is
             * creating a new mapping
             */
            self.newMapping = false;
            /**
             * @ngdoc property
             * @name step
             * @propertyOf mapperState.service:mapperStateService
             * @type {number}
             *
             * @description 
             * `step` holds a number indicating what step in the mapping process the mapping
             * page is currently on
             */
            self.step = 0;
            /**
             * @ngdoc property
             * @name invalidProps
             * @propertyOf mapperState.service:mapperStateService
             * @type {Object[]}
             *
             * @description 
             * `invalidProps` holds an array of objects representing property mappings in the 
             * current {@link mappingManager.service:mappingManagerService#mapping mapping}
             * that are mapped to non-existent column indexes in the currently loaded 
             * {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}. 
             * The format of the objects is:
             * ```
             * {
             *     '@id': 'propMappingId',
             *     index: 0
             * }
             * ```
             */
            self.invalidProps = [];
            /**
             * @ngdoc property
             * @name availableColumns
             * @propertyOf mapperState.service:mapperStateService
             * @type {string[]}
             *
             * @description 
             * `availableColumns` holds an array of the header strings for all the columns
             * that haven't been mapped yet in the currently selected 
             * {@link mappingManager.service:mappingManagerService#mapping mapping}.
             */
            self.availableColumns = [];
            /**
             * @ngdoc property
             * @name availablePropsByClass
             * @propertyOf mapperState.service:mapperStateService
             * @type {Object}
             *
             * @description 
             * `availablePropsByClass` holds a object with keys for the class mappings in the currently selected
             * {@link mappingManager.service:mappingManagerService#mapping mapping} and values indicating whether
             * the class mapping still has properties available to map.
             */
            self.availablePropsByClass = {};
            /**
             * @ngdoc property
             * @name invalidOntology
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `invalidOntology` holds a boolean indicating whether or not the source ontology for the 
             * currently selected {@link mappingManager.service:mappingManagerService#mapping mapping} is 
             * incompatible.
             */
            self.invalidOntology = false;
            /**
             * @ngdoc property
             * @name editMappingName
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `editMappingName` holds a boolean indicating whether or not the mapping page is
             * editing the mapping name
             */
            self.editMappingName = false;
            /**
             * @ngdoc property
             * @name displayCreateMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayCreateMappingOverlay` holds a boolean indicating whether or not the 
             * {@link createMappingOverlay.directive:createMappingOverlay create mapping overlay} 
             * should be shown.
             */
            self.displayCreateMappingOverlay = false;
            /**
             * @ngdoc property
             * @name displayDownloadMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayDownloadMappingOverlay` holds a boolean indicating whether or not the 
             * {@link downloadMappingOverlay.directive:downloadMappingOverlay download mapping overlay} 
             * should be shown.
             */
            self.displayDownloadMappingOverlay = false;
            /**
             * @ngdoc property
             * @name displayMappingConfigOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayMappingConfigOverlay` holds a boolean indicating whether or not the 
             * {@link mappingConfigOverlay.directive:mappingConfigOverlay mapping configuration overlay} 
             * should be shown.
             */
            self.displayMappingConfigOverlay = false;
            /**
             * @ngdoc property
             * @name displayPropMappingOverlay
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayPropMappingOverlay` holds a boolean indicating whether or not the 
             * {@link propMappingOverlay.directive:propMappingOverlay property mapping overlay} 
             * should be shown.
             */
            self.displayPropMappingOverlay = false;
            /**
             * @ngdoc property
             * @name displayDeletePropConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayDeletePropConfirm` holds a boolean indicating whether or not the delete property 
             * mapping overlay should be shown.
             */
            self.displayDeletePropConfirm = false;
            /**
             * @ngdoc property
             * @name displayDeleteClassConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayDeleteClassConfirm` holds a boolean indicating whether or not the delete class 
             * mapping overlay should be shown.
             */
            self.displayDeleteClassConfirm = false;
            /**
             * @ngdoc property
             * @name displayCancelConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayCancelConfirm` holds a boolean indicating whether or not the cancel confirm 
             * overlay should be shown.
             */
            self.displayCancelConfirm = false;
            /**
             * @ngdoc property
             * @name displayDeleteMappingConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayDeleteMappingConfirm` holds a boolean indicating whether or not the delete 
             * mapping confirm overlay should be shown.
             */
            self.displayDeleteMappingConfirm = false;
            /**
             * @ngdoc property
             * @name editIriTemplate
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `editIriTemplate` holds a boolean indicating whether or not the
             * {@link iriTemplateOverlay.directive:iriTemplateOverlay iriTemplateOverlay} should be
             * shown.
             */
            self.editIriTemplate = false;
            /**
             * @ngdoc property
             * @name selectedClassMappingId
             * @propertyOf mapperState.service:mapperStateService
             * @type {string}
             *
             * @description 
             * `selectedClassMappingId` holds a string with the IRI of the currently selected
             * class mapping.
             */
            self.selectedClassMappingId = '';
            /**
             * @ngdoc property
             * @name selectedPropMappingId
             * @propertyOf mapperState.service:mapperStateService
             * @type {string}
             *
             * @description 
             * `selectedPropMappingId` holds a string with the IRI of the currently selected
             * property mapping.
             */
            self.selectedPropMappingId = '';
            /**
             * @ngdoc property
             * @name newProp
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `newProp` holds a boolean indicating whether or not the a new property is being mapped
             */
            self.newProp = false;
            /**
             * @ngdoc property
             * @name highlightIndexes
             * @propertyOf mapperState.service:mapperStateService
             * @type {string[]}
             *
             * @description 
             * `highlightIndexes` holds an array of strings containing column indexes to highlight
             * in the {@link previewDataGrid.directive:previewDataGrid previewDataGrid}.
             */
            self.highlightIndexes = [];
            /**
             * @ngdoc property
             * @name highlmappingSearchStringightIndex
             * @propertyOf mapperState.service:mapperStateService
             * @type {string}
             *
             * @description 
             * `mappingSearchString` holds a string that will be used to filter the
             * {@link mappingList.directive:mappingList mapping list}.
             */
            self.mappingSearchString = '';

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf mapperState.service:mapperStateService
             * 
             * @description 
             * Sets the main state variables back to their default values.
             */
            self.initialize = function() {
                self.editMapping = false;
                self.newMapping = false;
                self.step = 0;
                self.invalidProps = [];
                self.availableColumns = [];
                self.availablePropsByClass = {};
            }
            /**
             * @ngdoc method
             * @name resetEdit
             * @methodOf mapperState.service:mapperStateService
             * 
             * @description 
             * Sets the edit related state variables back to their default values.
             */
            self.resetEdit = function() {
                self.selectedClassMappingId = '';
                self.selectedPropMappingId = '';
                self.highlightIndexes = [];
                self.newProp = false;
            }
            /**
             * @ngdoc method
             * @name createMapping
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Sets the state variables, {@link mappingManager.service:mappingManagerService#mapping mapping}, and
             * {@link mappingManager.service:mappingManagerService#sourceOntologies sourceOntologies} to indicate creating
             * a new mapping.
             */
            self.createMapping = function() {
                self.editMapping = true;
                self.newMapping = true;
                mm.mapping = {
                    id: '',
                    jsonld: []
                };
                mm.sourceOntologies = [];
                self.resetEdit();
                self.availablePropsByClass = {};
            }
            /**
             * @ngdoc method
             * @name setInvalidProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Validates the current {@link mappingManager.service:mappingManagerService#mapping mapping} against
             * the currently loaded {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}
             * and sets {@link mapperState.service:mapperStateService#invalidProps} to the list of data properties in 
             * the mapping that link to columns that don't exist in the delimited data.
             */
            self.setInvalidProps = function() {
                self.invalidProps = _.chain(mm.getAllDataMappings(mm.mapping.jsonld))
                    .map(dataMapping => _.pick(dataMapping, ['@id', prefixes.delim + 'columnIndex']))
                    .forEach(obj => _.set(obj, 'index', parseInt(obj['@id', prefixes.delim + 'columnIndex'][0]['@value'], 10)))
                    .filter(obj => obj.index > dm.dataRows[0].length - 1)
                    .sortBy('index')
                    .value();
            }
            /**
             * @ngdoc method
             * @name getMappedColumns
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Finds all of the column indexes that haven't been mapped to data mappings yet in the currently selected 
             * {@link mappingManager.service:mappingManagerService#mapping mapping}.
             * 
             * @return {string[]} an array of strings of column indexes that haven't been mapped yet
             */
            self.getMappedColumns = function() {
                return _.map(mm.getAllDataMappings(mm.mapping.jsonld), dataMapping => _.get(dataMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']", ''));
            }
            /**
             * @ngdoc method
             * @name updateAvailableColumns
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Updates the list of {@link mapperState.service:mapperStateService#availableColumns available columns}
             * for the currently selected {@link mappingManager.service:mappingManagerService#mapping mapping} 
             * and saved {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}. If a data 
             * property mapping has been selected, adds the mapped column index back to the available columns.
             */
            self.updateAvailableColumns = function() {
                var mappedColumns = self.getMappedColumns();
                if (self.selectedPropMappingId) {
                    var propMapping = _.find(mm.mapping.jsonld, {'@id': self.selectedPropMappingId});
                    var index = _.get(propMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']", '-1');
                    _.pull(mappedColumns, index);
                }
                self.availableColumns = _.difference(_.map(_.range(0, dm.dataRows[0].length), idx => `${idx}`), mappedColumns);
            }
            /**
             * @ngdoc method
             * @name hasAvailableProps
             * @methodOf mapperState.service:mapperStateService
             * 
             * @description 
             * Returns the boolean indicating whether a class mapping has available properties to map.
             * 
             * @param {string} classMappingId The id of the class mapping to check
             * @return {boolean} True if there are available properties to map for the class mapping;
             * false otherwise.
             */
            self.hasAvailableProps = function(classMappingId) {
                return _.get(self.availablePropsByClass, encodeURIComponent(classMappingId), []).length > 0;
            }
            /**
             * @ngdoc method
             * @name removeAvailableProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Removes a key-value pair from {@link mapperState.service:mapperStateService#availablePropsByClass availablePropsByClass}
             * using the passed class mapping id.
             * 
             * @param {string} classMappingId The id of a class mapping to remove from the available
             * props list.
             */
            self.removeAvailableProps = function(classMappingId) {
                _.unset(self.availablePropsByClass, encodeURIComponent(classMappingId));
            }
            /**
             * @ngdoc method
             * @name setAvailableProps
             * @methodOf mapperState.service:mapperStateService
             * 
             * @description 
             * Sets the value for a class mapping in {@link mapperState.service:mapperStateService#availablePropsByClass availablePropsByClass} 
             * to an array of objects representing properties that haven't been mapped for the class mapping 
             * with the passed id
             * 
             * @param {string} classMappingId The id of the class mapping to set the array of property objects for
             */
            self.setAvailableProps = function(classMappingId) {
                var mappedProps = _.map(mm.getPropMappingsByClass(mm.mapping.jsonld, classMappingId), "['" + prefixes.delim + "hasProperty'][0]['@id']");
                var classId = mm.getClassIdByMappingId(mm.mapping.jsonld, classMappingId);
                var props = self.getClassProps(mm.sourceOntologies, classId);
                _.set(self.availablePropsByClass, encodeURIComponent(classMappingId), _.filter(props, prop => mappedProps.indexOf(prop['@id']) < 0));
            }
            /**
             * @ngdoc method
             * @name getAvailableProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Retrieves an array of property objects from the current {@link mappingManager.service:mappingManagerService#mapping mapping}
             * representing the properties that the class mapping with the passed id hasn't used yet.
             * 
             * @param {string} classMappingId The id of the class mapping to retrieve available properties of
             * @return {Object[]} An array of property objects for the properties that haven't been mapped yet 
             * for the class mapping.
             */
            self.getAvailableProps = function(classMappingId) {
                return _.get(self.availablePropsByClass, encodeURIComponent(classMappingId), []);
            }
            /**
             * @ngdoc method
             * @name getClassProps
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Collects a list of objects representing the properties that can be mapped for a class from
             * a list of ontologies created by the {@link mappingManager.service:mappingManagerService mappingManagerService}.
             * 
             * @param {Object[]} ontologies A list of ontology objects to collect properties from
             * @param {string} classId The id of the class to collect properties for
             * @return {Object[]} An array of objects with the id and parent ontology id of properties
             * that can be mapped for the specified class.
             */
            self.getClassProps = function(ontologies, classId) {
                var props = [];
                _.forEach(ontologies, ontology => {
                    var classProps = _.filter(_.union(om.getClassProperties(ontology.entities, classId), om.getNoDomainProperties(ontology.entities)), prop => !(om.isObjectProperty(prop) && om.isDataTypeProperty(prop)));
                    props = _.union(props, _.map(classProps, prop => {
                        return {ontologyId: ontology.id, '@id': prop['@id']};
                    }));
                });
                return props;
            }
        }
})();