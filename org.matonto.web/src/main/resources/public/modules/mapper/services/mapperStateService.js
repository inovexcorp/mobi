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
            var cachedOntologyId = '';
            var cachedSourceOntologies = undefined;
            var originalMappingName = '';
            var mm = mappingManagerService,
                om = ontologyManagerService,
                dm = delimitedManagerService;

            // Static step indexes
            self.selectMappingStep = 0;
            self.fileUploadStep = 1;
            self.editMappingStep = 2;

            self.mappingSearchString = '';
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
             * `invalidProps` holds an array of property objects from 
             * {@link ontologyManager.service:ontologyManagerService ontologyManagerService}
             * that are mapped to non-existent column indexes in the currently selected 
             * {@link mappingManager.service:mappingManagerService#mapping mapping}.
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
             * @name displayCancelConfirm
             * @propertyOf mapperState.service:mapperStateService
             * @type {boolean}
             *
             * @description 
             * `displayCancelConfirm` holds a boolean indicating whether or not the cancel confirm 
             * overlay should be shown.
             */
            self.displayCancelConfirm = false;

            self.displayCreateMapping = false;
            self.displayDownloadMapping = false;
            self.displayMappingConfig = false;
            self.displayPropMappingOverlay = false;
            self.displayDeletePropConfirm = false;
            self.displayDeleteClassConfirm = false;
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
                self.availableProps = [];
                originalMappingName = '';
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
                    name: '',
                    jsonld: []
                };
                mm.sourceOntologies = [];
                self.resetEdit();
                self.availablePropsByClass = {};
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
             * @return {number[]} an array of column indexes that haven't been mapped yet
             */
            self.getMappedColumns = function() {
                return _.map(mm.getAllDataMappings(mm.mapping.jsonld), dataMapping => _.get(dataMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']", '0'));
            }

            /**
             * @ngdoc method
             * @name updateAvailableColumns
             * @methodOf mapperState.service:mapperStateService
             *
             * @description 
             * Updates the list of {@link mapperState.service:mapperStateService#availableColumns "available columns"}
             * for the currently selected {@link mappingManager.service:mappingManagerService#mapping mapping} 
             * and saved file preview. If a data property mapping has been selected, adds the header 
             * corresponding to its mapped column index from the available columns.
             */
            self.updateAvailableColumns = function() {
                var mappedColumns = self.getMappedColumns();
                if (self.selectedPropMappingId) {
                    var propMapping = _.find(mm.mapping.jsonld, {'@id': self.selectedPropMappingId});
                    var index = _.get(propMapping, "['" + prefixes.delim + "columnIndex'][0]['@value']", '-1');
                    _.pull(mappedColumns, index);
                }
                self.availableColumns = _.difference(_.map(dm.filePreview.headers, (header, idx) => _.toString(idx)), mappedColumns);
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

            self.removeAvailableProps = function(classMappingId) {
                return _.unset(self.availablePropsByClass, encodeURIComponent(classMappingId));
            }

            /**
             * @ngdoc method
             * @name setAvailableProps
             * @methodOf mapperState.service:mapperStateService
             * 
             * @description 
             * Sets a boolean value for a class mapping in {@link mapperState.service:mapperStateService#availablePropsByClass availablePropsByClass} 
             * indicating whether the class mapping with the passed id has available properties to map.
             * 
             * @param {string} classMappingId The id of the class mapping to set the boolean value of
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