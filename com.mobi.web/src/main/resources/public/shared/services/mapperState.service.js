/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    mapperStateService.$inject = ['$q', 'prefixes', 'mappingManagerService', 'ontologyManagerService', 'catalogManagerService', 'delimitedManagerService', 'utilService'];

    function mapperStateService($q, prefixes, mappingManagerService, ontologyManagerService, catalogManagerService, delimitedManagerService, utilService) {
        var self = this;
        var mm = mappingManagerService,
            cm = catalogManagerService,
            om = ontologyManagerService,
            dm = delimitedManagerService,
            util = utilService;

        // Static step indexes
        self.selectMappingStep = 0;
        self.fileUploadStep = 1;
        self.editMappingStep = 2;

        /**
         * @ngdoc property
         * @name mapping
         * @propertyOf shared.service:mapperStateService
         * @type {Object}
         *
         * @description
         * `mapping` holds the mapping object of the mapping being currently viewed/edited.
         * The structure of the object is:
         * ```
         * {
         *    id: '',
         *    jsonld: [],
         *    record: {},
         *    ontology: {},
         *    difference: {
         *      additions: [],
         *      deletions: []
         *    }
         * }
         * ```
         */
        self.mapping = undefined;
        /**
         * @ngdoc property
         * @name openedMappings
         * @propertyOf shared.service:mapperStateService
         * @type {Object[]}
         *
         * @description
         * `openedMappings` holds the list of mappings that have been opened.
         */
        self.openedMappings = [];
        /**
         * @ngdoc property
         * @name sourceOntologies
         * @propertyOf shared.service:mapperStateService
         * @type {Object[]}
         *
         * @description
         * `sourceOntologies` holds an array of all the ontologies used for the currently selected
         * mapping. This includes the source ontology as specified by the mapping array and the
         * imports closure of that ontology.
         */
        self.sourceOntologies = [];
        /**
         * @ngdoc property
         * @name editMapping
         * @propertyOf shared.service:mapperStateService
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
         * @propertyOf shared.service:mapperStateService
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
         * @propertyOf shared.service:mapperStateService
         * @type {number}
         *
         * @description
         * `step` holds a number indicating what step in the mapping process the mapping
         * page is currently on
         */
        self.step = 0;
        /**
         * @ngdoc property
         * @name editTabs
         * @propertyOf shared.service:mapperStateService
         * @type {Object}
         *
         * @description
         * `editTabs` holds an object that represents which tab is open on the
         * {@link editMappingPage.directive:editMappingPage editMappingPage}.
         */
        self.editTabs = {
            edit: true,
            commits: false
        };
        /**
         * @ngdoc property
         * @name invalidProps
         * @propertyOf shared.service:mapperStateService
         * @type {Object[]}
         *
         * @description
         * `invalidProps` holds an array of objects representing property mappings in the
         * current {@link shared.service:mapperStateService#mapping mapping}
         * that are mapped to non-existent column indexes in the currently loaded
         * {@link shared.service:delimitedManagerService#dataRows delimited data}.
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
         * @name availableClasses
         * @propertyOf shared.service:mapperStateService
         * @type {Object[]}
         *
         * @description
         * `availableClasses` holds an array of objects representing the classes from all source ontologies.
         * Each object has the following structure:
         * ```
         * {
         *     ontologyId: '',
         *     classObj: {}
         * }
         * ```
         */
        self.availableClasses = [];
        /**
         * @ngdoc property
         * @name propsByClass
         * @propertyOf shared.service:mapperStateService
         * @type {Object}
         *
         * @description
         * `propsByClass` holds a object with keys for classes in the imports closure of the currently selected
         * {@link shared.service:mapperStateService mapping} and values of all properties that can be
         * set for the class.
         */
        self.propsByClass = {};
        /**
         * @ngdoc property
         * @name selectedClassMappingId
         * @propertyOf shared.service:mapperStateService
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
         * @propertyOf shared.service:mapperStateService
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
         * @propertyOf shared.service:mapperStateService
         * @type {boolean}
         *
         * @description
         * `newProp` holds a boolean indicating whether or not the a new property is being mapped
         */
        self.newProp = false;
        /**
         * @ngdoc property
         * @name highlightIndexes
         * @propertyOf shared.service:mapperStateService
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
         * @propertyOf shared.service:mapperStateService
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
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Sets the main state variables back to their default values and resets the values of
         * {@link shared.service:mapperStateService mapping} and
         * {@link shared.service:mapperStateService sourceOntologies}.
         */
        self.initialize = function() {
            self.editMapping = false;
            self.newMapping = false;
            self.step = 0;
            self.editTabs = {
                edit: true,
                commits: false
            };
            self.invalidProps = [];
            self.propsByClass = {};
            self.availableClasses = [];
            self.mapping = undefined;
            self.sourceOntologies = [];
        }
        /**
         * @ngdoc method
         * @name resetEdit
         * @methodOf shared.service:mapperStateService
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
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Sets the state variables and
         * {@link shared.service:mapperStateService sourceOntologies} to indicate creating a new mapping.
         * Returns a new mapping object.
         */
        self.createMapping = function() {
            self.editMapping = true;
            self.newMapping = true;
            self.sourceOntologies = [];
            self.resetEdit();
            self.propsByClass = {};
            return {
                jsonld: [],
                record: {},
                ontology: undefined,
                difference: {
                    additions: [],
                    deletions: []
                }
            };
        }
        /**
         * @ngdoc method
         * @name openMapping
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Retrieves and selects a mapping to the provided record.
         *
         * @param {Object} record the mapping record to select
         */
        self.selectMapping = function(record) {
            var openedMapping = _.find(self.openedMappings, {record: {id: record.id}});
            if (openedMapping) {
                self.mapping = openedMapping;
            } else {
                mm.getMapping(record.id)
                    .then(jsonld => {
                        var mapping = {
                            jsonld,
                            record,
                            difference: {
                                additions: [],
                                deletions: []
                            }
                        };
                        self.mapping = mapping;
                        self.openedMappings.push(mapping);
                        return cm.getRecord(_.get(mm.getSourceOntologyInfo(jsonld), 'recordId'), cm.localCatalog['@id']);
                    }, () => $q.reject('Mapping ' + record.title + ' could not be found'))
                    .then(ontologyRecord => {
                        self.mapping.ontology = ontologyRecord;
                    }, errorMessage => util.createErrorToast(_.startsWith(errorMessage, 'Mapping') ? errorMessage : 'Ontology could not be found'));
            }
        }
        /**
         * @ngdoc method
         * @name isMappingChanged
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Tests whether changes have been made to the opened mapping.
         *
         * @return {boolean} True if the mapping has been changed; false otherwise
         */
        self.isMappingChanged = function() {
            return _.get(self.mapping, 'difference.additions', []).length > 0 || _.get(self.mapping, 'difference.deletions', []).length > 0;
        }
        /**
         * @ngdoc method
         * @name saveMapping
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Saves the current mapping appropriately depending on whether it is a new mapping or an existing mapping.
         */
        self.saveMapping = function() {
            var catalogId = _.get(cm.localCatalog, '@id', '');
            if (self.newMapping) {
                return mm.upload(self.mapping.jsonld, self.mapping.record.title, self.mapping.record.description, self.mapping.record.keywords);
            } else {
                return cm.updateInProgressCommit(self.mapping.record.id, catalogId, self.mapping.difference)
                    .then(() => {
                        var addedNames = _.map(self.mapping.difference.additions, getChangedEntityName);
                        var deletedNames = _.map(self.mapping.difference.deletions, getChangedEntityName);
                        var commitMessage = 'Changed ' + _.join(_.union(addedNames, deletedNames), ', ');
                        return cm.createBranchCommit(self.mapping.record.branch, self.mapping.record.id, catalogId, commitMessage);
                    }, $q.reject)
                    .then(() => self.mapping.record.id, $q.reject);
            }
        }
        /**
         * @ngdoc method
         * @name setMasterBranch
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Retrieves and saves the master branch of the current mapping for use on the
         * {@link mappingCommitsPage.directive:mappingCommitsPage mappingCommitsPage}.
         */
        self.setMasterBranch = function() {
            var catalogId = _.get(cm.localCatalog, '@id', '');
            cm.getRecordMasterBranch(self.mapping.record.id, catalogId)
                .then(branch => _.set(self.mapping, 'branch', branch), util.createErrorToast);
        }
        /**
         * @ngdoc method
         * @name setInvalidProps
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Validates the current {@link shared.service:mapperStateService mapping} against the currently loaded
         * {@link shared.service:delimitedManagerService delimited data} and sets
         * {@link shared.service:mapperStateService} to the list of data properties in the mapping that link to
         * columns that don't exist in the delimited data.
         */
        self.setInvalidProps = function() {
            self.invalidProps = _.chain(mm.getAllDataMappings(self.mapping.jsonld))
                .map(dataMapping => _.pick(dataMapping, ['@id', prefixes.delim + 'columnIndex']))
                .forEach(obj => _.set(obj, 'index', parseInt(util.getPropertyValue(obj, prefixes.delim + 'columnIndex'), 10)))
                .filter(obj => obj.index > dm.dataRows[0].length - 1)
                .sortBy('index')
                .value();
        }
        /**
         * @ngdoc method
         * @name getMappedColumns
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Finds all of the column indexes that have been mapped to data mappings in the currently selected
         * {@link shared.service:mapperStateService mapping}.
         *
         * @return {string[]} an array of strings of column indexes that have been mapped
         */
        self.getMappedColumns = function() {
            return _.uniq(_.map(mm.getAllDataMappings(self.mapping.jsonld), dataMapping => util.getPropertyValue(dataMapping, prefixes.delim + 'columnIndex')));
        }
        /**
         * @ngdoc method
         * @name hasProps
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Returns the boolean indicating whether a class has properties to map.
         *
         * @param {string} classId The id of the class to check
         * @return {boolean} True if there are properties to map for the class; false otherwise.
         */
        self.hasProps = function(classId) {
            return _.get(self.propsByClass, encodeURIComponent(classId), []).length > 0;
        }
        /**
         * @ngdoc method
         * @name hasPropsByClassMappingId
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Returns the boolean indicating whether the class of a class mapping has properties to map.
         *
         * @param {string} classMappingId The id of the class mapping to check
         * @return {boolean} True if there are properties to map for the class mapping's class; false otherwise.
         */
        self.hasPropsByClassMappingId = function(classMappingId) {
            return self.hasProps(mm.getClassIdByMappingId(self.mapping.jsonld, classMappingId));
        }
        /**
         * @ngdoc method
         * @name hasPropsSet
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Returns the boolean indicating whether the properties for a class have been retrieved.
         *
         * @param {string} classId The id of the class to check
         * @return {boolean} True if properties have been retrieved for the class; false otherwise.
         */
        self.hasPropsSet = function(classId) {
            return _.has(self.propsByClass, encodeURIComponent(classId));
        }
        /**
         * @ngdoc method
         * @name hasPropsSetByClassMappingId
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Returns the boolean indicating whether the properties for a class mapping's class have been retrieved.
         *
         * @param {string} classId The id of the class mapping to check
         * @return {boolean} True if properties have been retrieved for the class of a class mapping; false
         * otherwise.
         */
        self.hasPropsSetByClassMappingId = function() {
            return self.hasPropsSet(mm.getClassIdByMappingId(self.mapping.jsonld, classMappingId));
        }
        /**
         * @ngdoc method
         * @name removeProps
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Removes a key-value pair from `propsByClass` using the passed class id.
         *
         * @param {string} classId The id of a class to remove from the props list.
         */
        self.removeProps = function(classId) {
            _.unset(self.propsByClass, encodeURIComponent(classId));
        }
        /**
         * @ngdoc method
         * @name removePropsByClassMappingId
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Removes a key-value pair from `propsByClass` using the passed class mapping id.
         *
         * @param {string} classId The id of a class mapping whose class will be removed from the props list.
         */
        self.removePropsByClassMappingId = function(classMappingId) {
            self.removeProps(mm.getClassIdByMappingId(self.mapping.jsonld, classMappingId));
        }
        /**
         * @ngdoc method
         * @name setProps
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Sets the value for a class in `propsByClass` to an array of objects representing properties that can be
         * set for that class.
         *
         * @param {string} classId The id of the class to set the array of property objects for
         */
        self.setProps = function(classId) {
            var props = _.concat(self.getClassProps(self.sourceOntologies, classId), _.map(mm.annotationProperties, id => ({ ontologyId: '', propObj: {'@id': id}})));
            _.set(self.propsByClass, encodeURIComponent(classId), props);
        }
        /**
         * @ngdoc method
         * @name setPropsByClassMappingId
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Sets the value for the class of a class mapping in `propsByClass` to an array of objects representing
         * properties that can be set for that class.
         *
         * @param {string} classMappingId The id of the class mapping to set the array of property objects for
         */
        self.setPropsByClassMappingId = function(classMappingId) {
            self.setProps(mm.getClassIdByMappingId(self.mapping.jsonld, classMappingId));
        }
        /**
         * @ngdoc method
         * @name getProps
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Retrieves an array of property objects representing the properties that can be set for the class with
         * the passed id.
         *
         * @param {string} classId The id of the class to retrieve available properties of
         * @return {Object[]} An array of property objects that can be set on the class
         */
        self.getProps = function(classId) {
            return _.get(self.propsByClass, encodeURIComponent(classId), []);
        }
        /**
         * @ngdoc method
         * @name getPropsByClassMappingId
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Retrieves an array of property objects representing the properties that can be set for the class mapping
         * with the passed id.
         *
         * @param {string} classMappingId The id of the class mapping to retrieve available properties of
         * @return {Object[]} An array of property objects that can be set on the class
         */
        self.getPropsByClassMappingId = function(classMappingId) {
            return self.getProps(mm.getClassIdByMappingId(self.mapping.jsonld, classMappingId));
        }
        /**
         * @ngdoc method
         * @name getClassProps
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Collects a list of objects representing the properties that can be mapped for a class from
         * a list of ontologies created by the {@link shared.service:mappingManagerService mappingManagerService}.
         *
         * @param {Object[]} ontologies A list of ontology objects to collect properties from
         * @param {string} classId The id of the class to collect properties for
         * @return {Object[]} An array of objects with a property object and parent ontology id of properties
         * that can be mapped for the specified class.
         */
        self.getClassProps = function(ontologies, classId) {
            var props = [];
            _.forEach(ontologies, ontology => {
                var classProps = _.filter(_.union(om.getClassProperties([ontology.entities], classId), om.getNoDomainProperties([ontology.entities]), om.getAnnotations([ontology.entities])), prop => !(om.isObjectProperty(prop) && om.isDataTypeProperty(prop)));
                props = _.union(props, _.map(classProps, prop => ({ontologyId: ontology.id, propObj: prop})));
            });
            return props;
        }
        /**
         * @ngdoc method
         * @name getClasses
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Collects a list of objects representing all the classes from a list of ontologies created by the
         * {@link shared.service:mappingManagerService mappingManagerService}
         *
         * @param {Object[]} ontologies A list of ontology objects to collect properties from
         * @return {Object[]} An array of objects with the class object and parent ontology id of classes
         */
        self.getClasses = function(ontologies) {
            var classes = [];
            _.forEach(ontologies, ontology => {
                classes = _.concat(classes, _.map(om.getClasses([ontology.entities]), classObj => ({ontologyId: ontology.id, classObj})));
            });
            return classes;
        }
        /**
         * @ngdoc method
         * @name changeProp
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Updates the additions and deletions of the current mapping appropriately when a single property
         * value is changed.
         *
         * @param {string} entityId The id of the entity in the mapping whose property value was changed
         * @param {string} propId The id of the property that was changed
         * @param {string} newValue The new value of the property
         * @param {string} originalValue The original value of the property
         * @param {boolean} isId True if it has an '@id'
         */
        self.changeProp = function(entityId, propId, newValue, originalValue, isId = false) {
            if (newValue !== originalValue) {
                var valueKey = isId ? '@id' : '@value';
                var additionsObj = _.find(self.mapping.difference.additions, {'@id': entityId});
                var deletionsObj = _.find(self.mapping.difference.deletions, {'@id': entityId});
                if (additionsObj) {
                    var deletionsValue = isId ? util.getPropertyId(deletionsObj, propId) : util.getPropertyValue(deletionsObj, propId);
                    if (deletionsValue === newValue) {
                        delete additionsObj[propId];
                        if (_.isEqual(additionsObj, {'@id': entityId})) {
                            _.remove(self.mapping.difference.additions, additionsObj);
                        }
                        delete deletionsObj[propId];
                        if (_.isEqual(deletionsObj, {'@id': entityId})) {
                            _.remove(self.mapping.difference.deletions, deletionsObj);
                        }
                    } else {
                        additionsObj[propId] = [{[valueKey]: newValue}];
                        if (deletionsObj && originalValue && !_.has(deletionsObj, "['" + propId + "']")) {
                            deletionsObj[propId] = [{[valueKey]: originalValue}];
                        }
                    }
                } else {
                    additionsObj = {'@id': entityId, [propId]: [{[valueKey]: newValue}]};
                    self.mapping.difference.additions.push(additionsObj);

                    if (originalValue) {
                        deletionsObj = {'@id': entityId, [propId]: [{[valueKey]: originalValue}]};
                        self.mapping.difference.deletions.push(deletionsObj);
                    }
                }
            }
        }
        /**
         * @ngdoc method
         * @name addClassMapping
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Adds a ClassMapping for the class identified by the passed class ID object and updates the additions
         * and ClassMapping titles appropriately.
         *
         * @param {Object} classIdObj An ID object for a class in an ontology
         * @param {string} classIdObj.ontologyId The ID of the ontology this class is from
         * @param {Object} classIdObj.classObj The JSON-LD of the class
         * @return {Object} The ClassMapping JSON-LD that was added
         */
        self.addClassMapping = function(classIdObj) {
            var ontology = _.find(self.sourceOntologies, {id: classIdObj.ontologyId});
            var originalClassMappings = mm.getClassMappingsByClassId(self.mapping.jsonld, classIdObj.classObj['@id']);
            var classMapping = mm.addClass(self.mapping.jsonld, ontology.entities, classIdObj.classObj['@id']);
            var className = om.getEntityName(classIdObj.classObj);
            if (!originalClassMappings.length) {
                util.setDctermsValue(classMapping, 'title', className);
            } else {
                _.forEach(originalClassMappings, classMapping => {
                    if (util.getDctermsValue(classMapping, 'title') === className) {
                        classMapping[prefixes.dcterms + 'title'][0]['@value'] = className + ' (1)';
                        self.changeProp(classMapping['@id'], prefixes.dcterms + 'title', className + ' (1)', className);
                        return false;
                    }
                });
                setNewTitle(classMapping, className, originalClassMappings);
            }
            self.mapping.difference.additions.push(angular.copy(classMapping));
            return classMapping;
        }
        /**
         * @ngdoc method
         * @name addDataMapping
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Adds a DataMapping for the data property identified by the passed property ID object and updates the
         * additions and adds a title appropriately.
         *
         * @param {Object} propIdObj An ID object for a property in an ontology
         * @param {string} propIdObj.ontologyId The ID of the ontology this property is from
         * @param {Object} propIdObj.propObj The JSON-LD of the data property
         * @param {string} classMappingId The ID of the ClassMapping the DataMapping should be added to
         * @param {string} columnIndex The column index the DataMapping should point to
         * @param {string} datatypeSpec The default datatype the DataMapping should use
         * @param {string} languageSpec The default language tag the DataMapping should use
         * @return {Object} The DataMapping JSON-LD that was added
         */
        self.addDataMapping = function(propIdObj, classMappingId, columnIndex, datatypeSpec, languageSpec) {
            return addPropMapping(propIdObj, classMappingId, mm.addDataProp, columnIndex, datatypeSpec, languageSpec);
        }
        /**
         * @ngdoc method
         * @name addObjectMapping
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Adds a ObjectMapping for the data property identified by the passed property ID object and updates the
         * additions and adds a title appropriately.
         *
         * @param {Object} propIdObj An ID object for a property in an ontology
         * @param {string} propIdObj.ontologyId The ID of the ontology this property is from
         * @param {Object} propIdObj.propObj The JSON-LD of the object property
         * @param {string} classMappingId The ID of the ClassMapping the ObjectMapping should be added to
         * @param {string} rangeClassMappingId The ID of the ClassMapping the ObjectMapping should point to
         * @return {Object} The ObjectMapping JSON-LD that was added
         */
        self.addObjectMapping = function(propIdObj, classMappingId, rangeClassMappingId) {
            return addPropMapping(propIdObj, classMappingId, mm.addObjectProp, rangeClassMappingId);
        }
        /**
         * @ngdoc method
         * @name deleteEntity
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Updates the additions and deletions of the current mapping appropriately when an entity is deleted.
         *
         * @param {Object} entity The JSON-LD object of the entity to delete
         */
        self.deleteEntity = function(entity) {
            var additionsObj = _.find(self.mapping.difference.additions, {'@id': entity['@id']});
            if (_.isEqual(angular.copy(additionsObj), angular.copy(entity))) {
                _.remove(self.mapping.difference.additions, additionsObj);
            } else {
                var deletionObj = _.find(self.mapping.difference.deletions, {'@id': entity['@id']});
                if (deletionObj) {
                    _.merge(deletionObj, entity);
                } else {
                    self.mapping.difference.deletions.push(angular.copy(entity));
                }
            }
        }
        /**
         * @ngdoc method
         * @name deleteClass
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Deletes a ClassMapping with the provided id from the current mapping, updating the additions and
         * deletions appropriately for all properties that point to the ClassMapping and the properties on the
         * ClassMapping.
         *
         * @param {string} classMappingId The id of the ClassMapping to delete.
         */
        self.deleteClass = function(classMappingId) {
            var propsLinkingToClass = _.map(mm.getPropsLinkingToClass(self.mapping.jsonld, classMappingId), propMapping => ({
                    propMapping,
                    classMappingId: mm.findClassWithObjectMapping(self.mapping.jsonld, propMapping['@id'])['@id']
                }));
            var classMappingProps = mm.getPropMappingsByClass(self.mapping.jsonld, classMappingId);
            var deletedClass = mm.removeClass(self.mapping.jsonld, classMappingId);
            self.deleteEntity(deletedClass);
            _.forEach(classMappingProps, propMapping => {
                _.remove(self.invalidProps, {'@id': propMapping['@id']})
                self.deleteEntity(propMapping);
            });
            _.forEach(propsLinkingToClass, obj => cleanUpDeletedProp(obj.propMapping, obj.classMappingId));
            var classId = mm.getClassIdByMapping(deletedClass);
            var classMappings = mm.getClassMappingsByClassId(self.mapping.jsonld, classId);
            if (classMappings.length === 0) {
                self.removeProps(classId);
            } else if (classMappings.length === 1) {
                var lastClassMapping = classMappings[0];
                var originalTitle = util.getDctermsValue(lastClassMapping, 'title');
                var newTitle = originalTitle.replace(/ \((\d+)\)$/, '');
                lastClassMapping[prefixes.dcterms + 'title'][0]['@value'] = newTitle;
                self.changeProp(lastClassMapping['@id'], prefixes.dcterms + 'title', newTitle, originalTitle);
            }
        }
        /**
         * @ngdoc method
         * @name deleteProp
         * @methodOf shared.service:mapperStateService
         *
         * @description
         * Deletes a PropertyMapping with the provided id from the current mapping, updating the additions and
         * deletions appropriately for the parent ClassMapping.
         *
         * @param {string} propMappingId The id of the PropertyMapping to delete
         * @param {string} parentClassMappingId The id of the parent ClassMapping for the PropertyMapping
         */
        self.deleteProp = function(propMappingId, parentClassMappingId) {
            var deletedProp = mm.removeProp(self.mapping.jsonld, parentClassMappingId, propMappingId);
            cleanUpDeletedProp(deletedProp, parentClassMappingId);
        }

        function cleanUpDeletedProp(propMapping, parentClassMappingId) {
            self.deleteEntity(propMapping);
            var additionsObj = _.find(self.mapping.difference.additions, {'@id': parentClassMappingId});
            var prop = prefixes.delim + (mm.isDataMapping(propMapping) ? 'dataProperty' : 'objectProperty');
            if (util.hasPropertyId(additionsObj, prop, propMapping['@id'])) {
                util.removePropertyId(additionsObj, prop, propMapping['@id']);
                if (_.isEqual(additionsObj, {'@id': parentClassMappingId})) {
                    _.remove(self.mapping.difference.additions, additionsObj);
                }
            } else {
                var deletionsObj = _.find(self.mapping.difference.deletions, {'@id': parentClassMappingId});
                if (deletionsObj) {
                    if (!_.has(deletionsObj, "['" + prop + "']")) {
                        deletionsObj[prop] = [];
                    }
                    deletionsObj[prop].push({'@id': propMapping['@id']});
                } else {
                    self.mapping.difference.deletions.push({'@id': parentClassMappingId, [prop]: [{'@id': propMapping['@id']}]});
                }
            }
            _.remove(self.invalidProps, {'@id': propMapping['@id']});
        }
        function getChangedEntityName(diffObj) {
            var entity = _.find(self.mapping.jsonld, {'@id': diffObj['@id']}) || diffObj;
            return util.getDctermsValue(entity, 'title') || util.getBeautifulIRI(diffObj['@id']);
        }
        function setNewTitle(classMapping, className, existingClassMappings) {
            var regex = / \((\d+)\)$/;
            var sortedNums = _.map(
                // Collect all titles that start with the name of the passed entity
                _.filter(
                    _.map(existingClassMappings, obj => util.getDctermsValue(obj, 'title')),
                    title => _.startsWith(title, className)),
                // Collect the index number based on the set string format
                title => parseInt(_.nth(regex.exec(title), 1), 10)
            ).sort((a, b) => a - b);

            // If there are no missing numbers, newIdx is the next number
            var newIdx = ` (${_.last(sortedNums) + 1})`;
            for (var i = 1; i < sortedNums.length; i++) {
                // If there is a missing number between this index and the index of the previous title,
                // newIdx is one more than previous
                if (sortedNums[i] - sortedNums[i - 1] != 1) {
                    newIdx = ` (${sortedNums[i - 1] + 1})`;
                    break;
                }
            }
            util.setDctermsValue(classMapping, 'title', className + newIdx);
        }
        function addPropMapping(propIdObj, classMappingId, func, valueStr, valueStr2, valueStr3) {
            var ontology = _.find(self.sourceOntologies, {id: propIdObj.ontologyId});
            var propMapping = func(self.mapping.jsonld, _.get(ontology, 'entities', []), classMappingId, propIdObj.propObj['@id'], valueStr, valueStr2, valueStr3);
            util.setDctermsValue(propMapping, 'title', om.getEntityName(propIdObj.propObj));
            self.mapping.difference.additions.push(angular.copy(propMapping));
            return propMapping;
        }
    }

    angular
        .module('shared')
        /**
         * @ngdoc service
         * @name shared.service:mapperStateService
         * @requires shared.service:prefixes
         * @requires shared.service:mappingManagerService
         * @requires shared.service:ontologyManagerService
         * @requires shared.service:delimitedManagerService
         *
         * @description
         * `mapperStateService` is a service which contains various variables to hold the
         * state of the mapping tool page and utility functions to update those variables.
         */
        .service('mapperStateService', mapperStateService);
})();
