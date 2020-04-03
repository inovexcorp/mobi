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
import * as angular from 'angular';
import {
    forEach,
    get,
    find,
    map,
    remove,
    includes,
    concat,
    set,
    isEmpty,
    union,
    flatten,
    values,
    filter,
    some,
    keys,
    assign,
    has,
    uniq,
    difference,
    mapValues,
    lowerCase,
    sortBy,
    merge, 
    unset,
    head,
    forOwn,
    omit,
    pull,
    pullAt,
    result,
    findLast,
    isEqual,
    findKey,
    tail,
    initial,
    join,
    replace,
    findIndex,
    isObject, 
    mergeWith,
    indexOf,
    identity
} from 'lodash';

ontologyStateService.$inject = ['$q', '$filter', 'ontologyManagerService', 'updateRefsService', 'stateManagerService', 'utilService', 'catalogManagerService', 'propertyManagerService', 'prefixes', 'manchesterConverterService', 'policyEnforcementService', 'policyManagerService', 'httpService', 'uuid'];

/**
 * @ngdoc service
 * @name shared.service:ontologyStateService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:updateRefsService
 * @requires shared.service:stateManagerService
 * @requires shared.service:utilService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:propertyManagerService
 * @requires shared.service:prefixes
 * @requires shared.service:manchesterConverterService
 * @requires shared.service:policyEnforcementService
 * @requires shared.service:policyManagerService
 * @requires shared.service:httpService
 */
function ontologyStateService($q, $filter, ontologyManagerService, updateRefsService, stateManagerService, utilService, catalogManagerService, propertyManagerService, prefixes, manchesterConverterService, policyEnforcementService, policyManagerService, httpService, uuid) {
    var self = this;
    var om = ontologyManagerService;
    var pm = propertyManagerService;
    var sm = stateManagerService;
    var cm = catalogManagerService;
    var util = utilService;
    var mc = manchesterConverterService;
    var pe = policyEnforcementService;
    var polm = policyManagerService;
    var catalogId = '';
    var tagStateNamespace = 'http://mobi.com/states/ontology-editor/tag-id/';
    var branchStateNamespace = 'http://mobi.com/states/ontology-editor/branch-id/';
    var commitStateNamespace = 'http://mobi.com/states/ontology-editor/commit-id/';

    var ontologyEditorTabStates = {
        project: {
            entityIRI: '',
            active: true,
            targetedSpinnerId: 'project-entity-spinner'
        },
        overview: {
            active: false,
            searchText: '',
            open: {},
            targetedSpinnerId: 'overview-entity-spinner'
        },
        classes: {
            active: false,
            searchText: '',
            index: 0,
            open: {},
            targetedSpinnerId: 'classes-entity-spinner'
        },
        properties: {
            active: false,
            searchText: '',
            index: 0,
            open: {},
            targetedSpinnerId: 'properties-entity-spinner'
        },
        individuals: {
            active: false,
            searchText: '',
            index: 0,
            open: {},
            targetedSpinnerId: 'individuals-entity-spinner'
        },
        concepts: {
            active: false,
            searchText: '',
            index: 0,
            open: {},
            targetedSpinnerId: 'concepts-entity-spinner'
        },
        schemes: {
            active: false,
            searchText: '',
            index: 0,
            open: {},
            targetedSpinnerId: 'schemes-entity-spinner'
        },
        search: {
            active: false
        },
        savedChanges: {
            active: false
        },
        commits: {
            active: false
        }
    };

    var ontologyListItemTemplate = {
        active: true,
        upToDate: true,
        isVocabulary: false,
        editorTabStates: angular.copy(ontologyEditorTabStates),
        ontologyRecord: {
            title: '',
            recordId: '',
            branchId: '',
            commitId: ''
        },
        ontologyId: '',
        ontology: [],
        importedOntologies: [],
        importedOntologyIds: [],
        userBranch: false,
        createdFromExists: true,
        userCanModify: false,
        userCanModifyMaster: false,
        masterBranchIRI: '',
        merge: {
            active: false,
            target: undefined,
            checkbox: false,
            difference: undefined,
            conflicts: [],
            resolutions: {
                additions: [],
                deletions: []
            }
        },
        dataPropertyRange: {},
        derivedConcepts: [],
        derivedConceptSchemes: [],
        derivedSemanticRelations: [],
        classes: {
            iris: {},
            parentMap: {},
            childMap: {},
            flat: []
        },
        dataProperties: {
            iris: {},
            parentMap: {},
            childMap: {},
            flat: []
        },
        objectProperties: {
            iris: {},
            parentMap: {},
            childMap: {},
            flat: []
        },
        annotations: {
            iris: {},
            parentMap: {},
            childMap: {},
            flat: []
        },
        individuals: {
            iris: {},
            flat: []
        },
        concepts: {
            iris: {},
            parentMap: {},
            childMap: {},
            flat: []
        },
        conceptSchemes: {
            iris: {},
            parentMap: {},
            childMap: {},
            flat: []
        },
        blankNodes: {},
        index: {},
        additions: [],
        deletions: [],
        inProgressCommit: {
            additions: [],
            deletions: []
        },
        branches: [],
        tags: [],
        classesAndIndividuals: {},
        classesWithIndividuals: [],
        individualsParentPath: [],
        propertyIcons: {},
        noDomainProperties: [],
        classToChildProperties: {},
        iriList: [],
        selected: {},
        selectedBlankNodes: [],
        failedImports: [],
        goTo: {
            entityIRI: '',
            active: false
        }
    };
    forEach(pm.defaultDatatypes, iri => addIri(ontologyListItemTemplate.dataPropertyRange, iri));

    var emptyInProgressCommit = {
        additions: [],
        deletions: []
    };

    /**
     * @ngdoc property
     * @name list
     * @propertyOf shared.service:ontologyStateService
     * @type {Object[]}
     *
     * @description
     * `list` holds an array of ontology objects which contain properties associated with the ontology.
     * The structure of the ontology object is based on the templates.
     */
    self.list = [];

    self.listItem = {};

    self.vocabularySpinnerId = 'concepts-spinner';

    /**
     * @ngdoc property
     * @name uploadFiles
     * @propertyOf shared.service:ontologyStateService
     * @type {Object[]}
     *
     * @description
     * `uploadFiles` holds an array of File objects for uploading ontologies. It is utilized in the
     * {@link uploadOntologyTab.directive:uploadOntologyTab} and
     * {@link ontology-editor.component:uploadOntologyOverlay}.
     */
    self.uploadFiles = [];

    /**
     * @ngdoc property
     * @name uploadList
     * @propertyOf shared.service:ontologyStateService
     * @type {Object[]}
     *
     * @description
     * `uploadList` holds an array of upload objects which contain properties about the uploaded files.
     * The structure of the upload object is:
     * {
     *     error: '',
     *     id: '',
     *     promise: {},
     *     title: ''
     * }
     */
    self.uploadList = [];

    /**
     * @ngdoc property
     * @name uploadPending
     * @propertyOf shared.service:ontologyStateService
     * @type {number}
     *
     * @description
     * `uploadFiles` holds the number of pending uploads.
     */
    self.uploadPending = 0;

    /**
     * @ngdoc method
     * @name initialize
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Initializes the `catalogId` variable.
     */
    self.initialize = function() {
        catalogId = get(cm.localCatalog, '@id', '');
    }
    /**
     * @ngdoc method
     * @name createOntologyState
     * @methodOf shared.service:stateManagerService
     *
     * @description
     * Creates a new state for the ontology editor for the user using the IRIs. The Record IRI and Commit IRI
     * are required. The id object can optionally have a Branch IRI or a Tag IRI or neither. The state holds the
     * last thing the user had checked out for that Record and keeps track of the last commit a User was viewing
     * on a Branch. Returns a Promise indicating the success.
     *
     * @param {Object} idObj An object of IRI ids
     * @param {string} idObj.recordId A string identifying the Record to keep state for
     * @param {string} idObj.commitId A string identifying the Commit the user is currently viewing
     * @param {string} [idObj.branchId = ''] An optional string identifying the Branch the user is currently
     * viewing
     * @param {string} [idObj.tagId = ''] An optional string identifying the Tag the user is currently viewing
     * @returns {Promise} A promise that resolves if the creation was successful or rejects with an error message
     */
    self.createOntologyState = function(idObj) {
        return sm.createState(makeOntologyState(idObj), 'ontology-editor');
    }
    /**
     * @ngdoc method
     * @name getOntologyStateByRecordId
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Retrieves an ontology editor state from the {@link shared.service:stateManagerService} by the id
     * of the Record it is about.
     *
     * @param {string} recordId A string identifying the Record of a state
     * @returns {Object} A state object from the stateManagerService
     */
    self.getOntologyStateByRecordId = function(recordId) {
        return find(sm.states, {
            model: [{
                [prefixes.ontologyState + 'record']: [{'@id': recordId}]
            }]
        });
    }
    /**
     * @ngdoc method
     * @name updateOntologyState
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Updates an ontology editor state for the identified Record using the provided objects of IRIs and updates
     * the current state. The Record IRI and Commit IRI are required. The id object can optionally have a Branch
     * IRI or a Tag IRI or neither. If the current state was originally not a Branch state, it is removed. If a
     * Branch IRI is provided and there is already a Branch state for it, updates the Commit on the state to the
     * provided IRI. Uses the {@link shared.service:stateManagerService} to do the update. Returns a
     * Promise indicating the success.
     *
     * @param {Object} idObj An object of IRI ids
     * @param {string} idObj.recordId A string identifying the Record of a state
     * @param {string} idObj.commitId A string identifying the Commit the user is now viewing
     * @param {string} [idObj.branchId = ''] An optional string identifying the Branch the user is now viewing
     * @param {string} [idObj.tagId = ''] An optional string identifying the Tag the user is now viewing
     * @returns {Promise} A promise that resolves if the update was successful or rejects with an error message
     */
    self.updateOntologyState = function(idObj) {
        var ontologyState = angular.copy(self.getOntologyStateByRecordId(idObj.recordId));
        var stateId = get(ontologyState, 'id', '');
        var model = get(ontologyState, 'model', '');
        var recordState = find(model, {'@type': [prefixes.ontologyState + 'StateRecord']});
        var currentStateId = get(recordState, "['" + prefixes.ontologyState + 'currentState' + "'][0]['@id']");
        var currentState = find(model, {'@id': currentStateId});

        if (currentState && !includes(get(currentState, '@type', []), prefixes.ontologyState + 'StateBranch')) {
            remove(model, currentState);
        }

        if (idObj.branchId) {
            var branchState = find(model, {[prefixes.ontologyState + 'branch']: [{'@id': idObj.branchId}]});
            if (branchState) {
                currentStateId = branchState['@id'];
                branchState[prefixes.ontologyState + 'commit'] = [{'@id': idObj.commitId}];
            } else {
                currentStateId = branchStateNamespace + uuid.v4();
                recordState[prefixes.ontologyState + 'branchStates'] = concat(get(recordState, "['" + prefixes.ontologyState + "branchStates']", []), [{'@id': currentStateId}]);
                model.push({
                    '@id': currentStateId,
                    '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateBranch'],
                    [prefixes.ontologyState + 'branch']: [{'@id': idObj.branchId}],
                    [prefixes.ontologyState + 'commit']: [{'@id': idObj.commitId}]
                });
            }
        } else if (idObj.tagId) {
            currentStateId = tagStateNamespace + uuid.v4();
            model.push({
                '@id': currentStateId,
                '@type': [prefixes.ontologyState + 'StateCommit', prefixes.ontologyState + 'StateTag'],
                [prefixes.ontologyState + 'tag']: [{'@id': idObj.tagId}],
                [prefixes.ontologyState + 'commit']: [{'@id': idObj.commitId}]
            });
        } else {
            currentStateId = commitStateNamespace + uuid.v4();
            model.push({
                '@id': currentStateId,
                '@type': [prefixes.ontologyState + 'StateCommit'],
                [prefixes.ontologyState + 'commit']: [{'@id': idObj.commitId}]
            });
        }
        recordState[prefixes.ontologyState + 'currentState'] = [{'@id': currentStateId}];
        return sm.updateState(stateId, model);
    }
    /**
     * @ngdoc method
     * @name deleteOntologyBranchState
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Updates an ontology editor state for the identified Record when the identified Branch is deleted. The
     * Branch state for the Branch is removed from the state array and the Record state object. Calls the
     * {@link shared.service:stateManagerService} to do the update. Returns a Promise indicating the
     * success.
     *
     * @param {string} recordId A string identifying the Record of a state
     * @param {string} branchId A string identifying the Branch that was removed
     * @returns {Promise} A promise that resolves if the update was successful or rejects with an error message
     */
    self.deleteOntologyBranchState = function(recordId, branchId) {
        var ontologyState = angular.copy(self.getOntologyStateByRecordId(recordId));
        var record = find(ontologyState.model, {'@type': [prefixes.ontologyState + 'StateRecord']});
        var branchState = head(remove(ontologyState.model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]}));
        remove(record[prefixes.ontologyState + 'branchStates'], {'@id': get(branchState, '@id')});
        if (!record[prefixes.ontologyState + 'branchStates'].length) {
            delete record[prefixes.ontologyState + 'branchStates'];
        }
        return sm.updateState(ontologyState.id, ontologyState.model);

    }
    /**
     * @ngdoc method
     * @name deleteOntologyState
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Deletes the ontology editor state for the identified Record using the
     * {@link shared.service:stateManagerService}. Returns a Promise indicating the success.
     *
     * @param {string} recordId A string identifying the Record of a state
     * @returns {Promise} A promise that resolves if the deletion was successful or rejects with an error message
     */
    self.deleteOntologyState = function(recordId) {
        var stateId = get(self.getOntologyStateByRecordId(recordId), 'id', '');
        return sm.deleteState(stateId);
    }
    /**
     * @ngdoc method
     * @name getCurrentStateIdByRecordId
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Finds the ID of the current state of the ontology with the provided Record ID. The state refers to the
     * object detailing what the user has currently "checked out".
     *
     * @param {string} recordId A string identifying the Record of a state
     * @returns {string} The string ID of the current state object
     */
    self.getCurrentStateIdByRecordId = function(recordId) {
        return self.getCurrentStateId(self.getOntologyStateByRecordId(recordId));
    }
    /**
     * @ngdoc method
     * @name getCurrentStateByRecordId
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Finds the current state of the ontology with the provided Record ID. The state refers to the object
     * detailing what the user has currently "checked out".
     *
     * @param {string} recordId A string identifying the Record of a state
     * @returns {Object} The JSON-LD object representing the current state
     */
    self.getCurrentStateByRecordId = function(recordId) {
        var state = self.getOntologyStateByRecordId(recordId);
        var currentStateId = self.getCurrentStateId(state);
        return find(get(state, 'model', []), {'@id': currentStateId});
    }
    /**
     * @ngdoc method
     * @name getCurrentStateId
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Finds the ID of the current state from the provided JSON-LD of an ontology state. The state refers to the
     * object detailing what the user has currently "checked out".
     *
     * @param {Object} state A JSON-LD array of an ontology state from the
     * {@link shared.service:stateManagerService}
     * @returns {string} The string ID of the current state object
     */
    self.getCurrentStateId = function(state) {
        var recordState = find(get(state, 'model', []), {'@type': [prefixes.ontologyState + 'StateRecord']});
        return get(recordState, "['" + prefixes.ontologyState + "currentState'][0]['@id']", '');
    }
    /**
     * @ngdoc method
     * @name getCurrentState
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Finds the current state from the provided JSON-LD of an ontology state. The state refers to the object
     * detailing what the user has currently "checked out".
     *
     * @param {Object} state A JSON-LD array of an ontology state from the
     * {@link shared.service:stateManagerService}
     * @returns {Object} The JSON-LD object representing the current state
     */
    self.getCurrentState = function(state) {
        return find(get(state, 'model', []), {'@id': self.getCurrentStateId(state)});
    }
    /**
     * @ngdoc method
     * @name isStateTag
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Determines whether the provided JSON-LD is a StateTag or not.
     *
     * @param {Object} obj A JSON-LD object
     * @returns {boolean} True if the object is a StateTag; false otherwise
     */
    self.isStateTag = function(obj) {
        return includes(get(obj, '@type', []), prefixes.ontologyState + 'StateTag');
    }
    /**
     * @ngdoc method
     * @name isStateBranch
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Determines whether the provided JSON-LD is a StateBranch or not.
     *
     * @param {Object} obj A JSON-LD object
     * @returns {boolean} True if the object is a StateBranch; false otherwise
     */
    self.isStateBranch = function(obj) {
        return includes(get(obj, '@type', []), prefixes.ontologyState + 'StateBranch');
    }

    function makeOntologyState(idObj) {
        var stateIri;
        var recordState = {
            '@id': 'http://mobi.com/states/ontology-editor/' + uuid.v4(),
            '@type': [prefixes.ontologyState + 'StateRecord'],
            [prefixes.ontologyState + 'record']: [{'@id': idObj.recordId}],
        };
        var commitState = {
            '@type': [prefixes.ontologyState + 'StateCommit'],
            [prefixes.ontologyState + 'commit']: [{'@id': idObj.commitId}]
        };
        if (idObj.branchId) {
            stateIri = branchStateNamespace + uuid.v4();
            recordState[prefixes.ontologyState + 'branchStates'] = [{'@id': stateIri}];
            commitState['@id'] = stateIri;
            commitState['@type'].push(prefixes.ontologyState + 'StateBranch');
            commitState[prefixes.ontologyState + 'branch'] = [{'@id': idObj.branchId}];
        } else if (idObj.tagId) {
            stateIri = tagStateNamespace + uuid.v4();
            commitState['@id'] = stateIri;
            commitState['@type'].push(prefixes.ontologyState + 'StateTag');
            commitState[prefixes.ontologyState + 'tag'] = [{'@id': idObj.tagId}];
        } else {
            stateIri = commitStateNamespace + uuid.v4();
            commitState['@id'] = stateIri;
        }
        recordState[prefixes.ontologyState + 'currentState'] = [{'@id': stateIri}];
        return [recordState, commitState];
    }

    /**
     * @ngdoc method
     * @name addErrorToUploadItem
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Adds the error message to the list item with the identified id.
     *
     * @param {string} id The id of the upload item.
     * @param {string} error The error message for the upload item.
     */
    self.addErrorToUploadItem = function(id, error) {
        set(find(self.uploadList, {id}), 'error', error);
    }
    /**
     * @ngdoc method
     * @name reset
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Resets all state variables.
     */
    self.reset = function() {
        self.list = [];
        self.listItem = {};
        self.showUploadTab = false;
        self.uploadList = [];
    }
    /**
     * @ngdoc method
     * @name getOntology
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Retrieves the last visible state of the ontology for the current user in the provided RDF format. If
     * the user has not opened the ontology yet or the branch/commit they were viewing no longer exists,
     * retrieves the latest state of the ontology.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
     * @returns {Promise} A promise containing the record id, branch id, commit id, inProgressCommit,
     * and JSON-LD serialization of the ontology.
     */
    self.getOntology = function(recordId, rdfFormat = 'jsonld') {
        var state = self.getOntologyStateByRecordId(recordId);
        if (!isEmpty(state)) {
            var inProgressCommit = emptyInProgressCommit;
            var currentState = self.getCurrentState(state);
            var commitId = util.getPropertyId(currentState, prefixes.ontologyState + 'commit');
            var tagId = util.getPropertyId(currentState, prefixes.ontologyState + 'tag');
            var branchId = util.getPropertyId(currentState, prefixes.ontologyState + 'branch');
            var upToDate = false;
            var promise;
            if (branchId) {
                promise = cm.getRecordBranch(branchId, recordId, catalogId)
                    .then(branch => {
                        upToDate = util.getPropertyId(branch, prefixes.catalog + 'head') === commitId;
                        return cm.getInProgressCommit(recordId, catalogId);
                    }, $q.reject);
            } else if (tagId) {
                upToDate = true;
                promise = cm.getRecordVersion(tagId, recordId, catalogId)
                    .then(() => {
                        return cm.getInProgressCommit(recordId, catalogId);
                    }, () => self.updateOntologyState({recordId, commitId}).then(() => cm.getInProgressCommit(recordId, catalogId)), $q.reject);
            } else {
                upToDate = true;
                promise = cm.getInProgressCommit(recordId, catalogId);
            }
            return promise
                .then(response => {
                    inProgressCommit = response;
                    return om.getOntology(recordId, branchId, commitId, rdfFormat);
                }, response => {
                    if (get(response, 'status') === 404) {
                        return om.getOntology(recordId, branchId, commitId, rdfFormat);
                    }
                    return $q.reject();
                })
                .then(ontology => ({ontology, recordId, branchId, commitId, upToDate, inProgressCommit}), () =>
                    self.deleteOntologyState(recordId)
                        .then(() => self.getLatestOntology(recordId, rdfFormat), $q.reject)
                );
        }
        return self.getLatestOntology(recordId, rdfFormat);
    }
    /**
     * @ngdoc method
     * @name getLatestOntology
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Retrieves the latest state of an ontology, being the head commit of the master branch, and returns
     * a promise containing the ontology id, record id, branch id, commit id, inProgressCommit, and
     * serialized ontology.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} rdfFormat The format string to identify the serialization requested.
     * @return {Promise} A promise containing the ontology id, record id, branch id, commit id,
     *                    inProgressCommit, and JSON-LD serialization of the ontology.
     */
    self.getLatestOntology = function(recordId, rdfFormat = 'jsonld') {
        var branchId, commitId;
        return cm.getRecordMasterBranch(recordId, catalogId)
            .then(masterBranch => {
                branchId = get(masterBranch, '@id', '');
                commitId = get(masterBranch, "['" + prefixes.catalog + "head'][0]['@id']", '');
                return self.createOntologyState({recordId, commitId, branchId});
            }, $q.reject)
            .then(() => om.getOntology(recordId, branchId, commitId, rdfFormat), $q.reject)
            .then(ontology => {return {ontology, recordId, branchId, commitId, upToDate: true, inProgressCommit: emptyInProgressCommit}}, $q.reject);
    }
    /**
     * @ngdoc method
     * @name createOntology
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Uploads the provided JSON-LD as a new ontology and creates a new list item for the new ontology.
     * Returns a promise with the entityIRI, recordId, branchId, and commitId for the state of the newly
     * created ontology.
     *
     * @param {string} ontologyJson The JSON-LD representing the ontology.
     * @param {string} title The title for the OntologyRecord.
     * @param {string} description The description for the OntologyRecord.
     * @param {string} keywords The array of keywords for the OntologyRecord.
     * @returns {Promise} A promise with the entityIRI, recordId, branchId, and commitId for the state of the newly created
     * ontology.
     */
    self.createOntology = function(ontologyJson, title, description, keywords) {
        var listItem;
        return om.uploadJson(ontologyJson, title, description, keywords)
            .then(data => {
                listItem = setupListItem(data.ontologyId, data.recordId, data.branchId, data.commitId, [ontologyJson], emptyInProgressCommit, true, title);
                return cm.getRecordBranch(data.branchId, data.recordId, catalogId);
            }, $q.reject)
            .then(branch => {
                listItem.branches = [branch];
                listItem.masterBranchIRI = listItem.ontologyRecord.branchId;
                listItem.userCanModify = true;
                listItem.userCanModifyMaster = true;
                self.list.push(listItem);
                self.listItem = listItem;
                self.setSelected(self.getActiveEntityIRI(), false);
                return {
                    entityIRI: ontologyJson['@id'],
                    recordId: listItem.ontologyRecord.recordId,
                    branchId: listItem.ontologyRecord.branchId,
                    commitId: listItem.ontologyRecord.commitId
                };
            }, $q.reject);
    }
    /**
     * @ngdoc method
     * @name uploadChanges
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Uploads the provided file as an ontology and uses it as a basis for updating the existing ontology .
     *
     * @param {File} file The updated ontology file.
     * @param {string} the ontology record ID.
     * @param {string} the ontology branch ID.
     * @param {string} the ontology commit ID.
     */
    self.uploadChanges = function(file, recordId, branchId, commitId) {
        return om.uploadChangesFile(file, recordId, branchId, commitId)
            .then(() => cm.getInProgressCommit(recordId, catalogId), $q.reject)
            .then(commit => {
                var listItem = self.getListItemByRecordId(recordId);
                return self.updateOntology(recordId, branchId, commitId, listItem.upToDate, commit);
            }, $q.reject);
    }
    /**
     * @ngdoc method
     * @name updateOntology
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Used to update an ontology that is already open within the Ontology Editor. It will replace the existing
     * listItem with a new listItem consisting of the data associated with the record ID, branch ID, and commit
     * ID provided. Returns a promise.
     *
     * @param {string} recordId The record ID associated with the requested ontology.
     * @param {string} branchId The branch ID associated with the requested ontology.
     * @param {string} commitId The commit ID associated with the requested ontology.
     * @param {boolean} [upToDate=true] The flag indicating whether the ontology is upToDate or not.
     * @param {boolean} [inProgressCommit=emptyInProgressCommit] The Object containing the saved changes to apply.
     * @param {boolean} [clearCache=false] Boolean indicating whether or not you should clear the cache.
     * @returns {Promise} A promise indicating the success or failure of the update.
     */
    self.updateOntology = function(recordId, branchId, commitId, upToDate = true, inProgressCommit = emptyInProgressCommit, clearCache = false) {
        var listItem;
        var oldListItem = self.getListItemByRecordId(recordId);

        return om.getOntology(recordId, branchId, commitId, 'jsonld', clearCache)
            .then(ontology => self.createOntologyListItem(om.getOntologyIRI(ontology), recordId, branchId, commitId, ontology, inProgressCommit, upToDate, oldListItem.ontologyRecord.title), $q.reject)
            .then(response => {
                listItem = response;
                listItem.editorTabStates = oldListItem.editorTabStates;
                if (listItem.ontologyId !== oldListItem.ontologyId) {
                    self.resetStateTabs(listItem);
                } else {
                    listItem.selected = oldListItem.selected;
                    listItem.selectedBlankNodes = oldListItem.selectedBlankNodes;
                    listItem.blankNodes = oldListItem.blankNodes;
                }
                return self.updateOntologyState({recordId, commitId, branchId});
            }, $q.reject)
            .then(() => {
                var activeKey = self.getActiveKey(oldListItem);
                assign(oldListItem, listItem);
                self.setActivePage(activeKey, oldListItem);
            }, $q.reject);
    }
    /**
     * @ngdoc method
     * @name updateOntologyWithCommit
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Used to update an ontology that is already open within the Ontology Editor to the specified commit. It
     * will replace the existing listItem with a new listItem consisting of the data associated with the record
     * ID, commit ID, and optional tag ID provided. Returns a promise.
     *
     * @param {string} recordId The record ID associated with the requested ontology.
     * @param {string} commitId The commit ID associated with the requested ontology.
     * @param {string} [tagId=''] A tag ID associated with the requested ontology.
     * @returns {Promise} A promise indicating the success or failure of the update.
     */
    self.updateOntologyWithCommit = function(recordId, commitId, tagId = '') {
        var listItem;
        var oldListItem = self.getListItemByRecordId(recordId);

        return om.getOntology(recordId, '', commitId, 'jsonld')
            .then(ontology => self.createOntologyListItem(om.getOntologyIRI(ontology), recordId, '', commitId, ontology, emptyInProgressCommit, true, oldListItem.ontologyRecord.title), $q.reject)
            .then(response => {
                listItem = response;
                listItem.editorTabStates = oldListItem.editorTabStates;
                if (listItem.ontologyId !== oldListItem.ontologyId) {
                    self.resetStateTabs(listItem);
                } else {
                    listItem.selected = oldListItem.selected;
                    listItem.selectedBlankNodes = oldListItem.selectedBlankNodes;
                    listItem.blankNodes = oldListItem.blankNodes;
                }
                return tagId ? self.updateOntologyState({recordId, commitId, tagId}) : self.updateOntologyState({recordId, commitId});
            }, $q.reject)
            .then(() => {
                var activeKey = self.getActiveKey(oldListItem);
                assign(oldListItem, listItem);
                self.setActivePage(activeKey, oldListItem);
            }, $q.reject);
    }
    self.addOntologyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, upToDate = true) {
        return self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title)
            .then(listItem => {
                self.list.push(listItem);
                return listItem;
            }, $q.reject);
    }
    self.createOntologyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate = true, title) {
        var modifyRequest: any = {
            resourceId: recordId,
            actionId: polm.actionModify
        };
        var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title);
        return $q.all([
            om.getOntologyStuff(recordId, branchId, commitId),
            cm.getRecordBranches(recordId, catalogId),
            cm.getRecordVersions(recordId, catalogId)
        ]).then(response => {
            forEach(response[0].propertyToRanges, (properties, key) => {
                listItem.propertyIcons[key] = getIcon(properties);
            });
            listItem.noDomainProperties = response[0].noDomainProperties;
            listItem.classToChildProperties = response[0].classToAssociatedProperties;
            listItem.iriList.push(listItem.ontologyId);
            var responseIriList = get(response[0], 'iriList', {});
            listItem.iriList = union(listItem.iriList, flatten(values(responseIriList)));
            get(responseIriList, 'annotationProperties', []).forEach(iri => addIri(listItem.annotations.iris, iri, ontologyId));
            forEach(get(responseIriList, 'classes', []), iri => self.addToClassIRIs(listItem, iri));
            get(responseIriList, 'dataProperties', []).forEach(iri => addIri(listItem.dataProperties.iris, iri, ontologyId));
            get(responseIriList, 'objectProperties', []).forEach(iri => addIri(listItem.objectProperties.iris, iri, ontologyId));
            get(responseIriList, 'namedIndividuals', []).forEach(iri => addIri(listItem.individuals.iris, iri, ontologyId));
            get(responseIriList, 'concepts', []).forEach(iri => addIri(listItem.concepts.iris, iri, ontologyId));
            get(responseIriList, 'conceptSchemes', []).forEach(iri => addIri(listItem.conceptSchemes.iris, iri, ontologyId));
            listItem.derivedConcepts = get(responseIriList, 'derivedConcepts', []);
            listItem.derivedConceptSchemes = get(responseIriList, 'derivedConceptSchemes', []);
            listItem.derivedSemanticRelations = get(responseIriList, 'derivedSemanticRelations', []);
            get(responseIriList, 'datatypes', []).forEach(iri => addIri(listItem.dataPropertyRange, iri, ontologyId));
            forEach(get(response[0], 'importedIRIs'), iriList => {
                iriList.annotationProperties.forEach(iri => addIri(listItem.annotations.iris, iri, iriList.id));
                iriList.classes.forEach(iri => self.addToClassIRIs(listItem, iri, iriList.id));
                iriList.dataProperties.forEach(iri => addIri(listItem.dataProperties.iris, iri, iriList.id));
                iriList.objectProperties.forEach(iri => addIri(listItem.objectProperties.iris, iri, iriList.id));
                iriList.namedIndividuals.forEach(iri => addIri(listItem.individuals.iris, iri, iriList.id));
                iriList.concepts.forEach(iri => addIri(listItem.concepts.iris, iri, iriList.id));
                iriList.conceptSchemes.forEach(iri => addIri(listItem.conceptSchemes.iris, iri, iriList.id));
                iriList.datatypes.forEach(iri => addIri(listItem.dataPropertyRange, iri, iriList.id));
                listItem.iriList.push(iriList['id'])
                listItem.iriList = union(listItem.iriList, flatten(values(iriList)))
            });
            forEach(get(response[0], 'importedOntologies'), importedOntObj => {
                addImportedOntologyToListItem(listItem, importedOntObj);
            });
            setHierarchyInfo(listItem.classes, response[0], 'classHierarchy');
            listItem.classes.flat = self.flattenHierarchy(listItem.classes, listItem);
            setHierarchyInfo(listItem.dataProperties, response[0], 'dataPropertyHierarchy');
            listItem.dataProperties.flat = self.flattenHierarchy(listItem.dataProperties, listItem);
            setHierarchyInfo(listItem.objectProperties, response[0], 'objectPropertyHierarchy');
            listItem.objectProperties.flat = self.flattenHierarchy(listItem.objectProperties, listItem);
            setHierarchyInfo(listItem.annotations, response[0], 'annotationHierarchy');
            listItem.annotations.flat = self.flattenHierarchy(listItem.annotations, listItem);
            setHierarchyInfo(listItem.concepts, response[0], 'conceptHierarchy');
            listItem.concepts.flat = self.flattenHierarchy(listItem.concepts, listItem);
            setHierarchyInfo(listItem.conceptSchemes, response[0], 'conceptSchemeHierarchy');
            listItem.conceptSchemes.flat = self.flattenHierarchy(listItem.conceptSchemes, listItem);
            listItem.classesAndIndividuals = response[0].individuals;
            listItem.classesWithIndividuals = keys(listItem.classesAndIndividuals);
            listItem.individualsParentPath = self.getIndividualsParentPath(listItem);
            listItem.individuals.flat = self.createFlatIndividualTree(listItem);
            listItem.flatEverythingTree = self.createFlatEverythingTree(listItem);
            concat(pm.ontologyProperties, keys(listItem.dataProperties.iris), keys(listItem.objectProperties.iris), listItem.derivedSemanticRelations, pm.conceptSchemeRelationshipList, pm.schemeRelationshipList).forEach(iri => delete listItem.annotations.iris[iri]);
            listItem.failedImports = get(response[0], 'failedImports', []);
            listItem.branches = response[1].data;
            var branch = find(listItem.branches, { '@id': listItem.ontologyRecord.branchId })
            listItem.userBranch = cm.isUserBranch(branch);
            if (listItem.userBranch) {
                listItem.createdFromExists = some(listItem.branches, {'@id': util.getPropertyId(branch, prefixes.catalog + 'createdFrom')});
            }
            listItem.masterBranchIRI = find(listItem.branches, {[prefixes.dcterms + 'title']: [{'@value': 'MASTER'}]})['@id'];
            listItem.tags = filter(response[2].data, version => includes(get(version, '@type'), prefixes.catalog + 'Tag'));
            return pe.evaluateRequest(modifyRequest);
        },  $q.reject)
        .then(decision => {
            listItem.userCanModify = decision == pe.permit;
            modifyRequest.actionAttrs = {[prefixes.catalog + 'branch']: listItem.masterBranchIRI};
            return pe.evaluateRequest(modifyRequest);
        }, $q.reject)
        .then(decision => {
            listItem.userCanModifyMaster = decision == pe.permit;
            return listItem;
        }, $q.reject);
    }

    function addIri(iriObj, iri, ontologyId = undefined) {
        if (!has(iriObj, "['" + iri + "']")) {
            iriObj[iri] = ontologyId || $filter('splitIRI')(iri).begin;
        }
    }

    self.getIndividualsParentPath = function(listItem) {
        var result = [];
        forEach(Object.keys(listItem.classesAndIndividuals), classIRI => {
            result = result.concat(getParents(listItem.classes.childMap, classIRI));
        });
        return uniq(result);
    }
    function getParents(childMap, classIRI) {
        var result = [classIRI];
        if (has(childMap, classIRI)) {
            var toFind = [classIRI];
            while (toFind.length) {
                var temp = toFind.pop();
                forEach(childMap[temp], parent => {
                    result.push(parent);
                    if (has(childMap, parent)) {
                        toFind.push(parent);
                    }
                });
            }
        }
        return result;
    }
    self.setVocabularyStuff = function(listItem = self.listItem) {
        httpService.cancel(self.vocabularySpinnerId);
        om.getVocabularyStuff(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, self.vocabularySpinnerId)
            .then(response => {
                listItem.derivedConcepts = get(response, 'derivedConcepts', []);
                listItem.derivedConceptSchemes = get(response, 'derivedConceptSchemes', []);
                listItem.derivedSemanticRelations = get(response, 'derivedSemanticRelations', []);
                listItem.concepts.iris = {};
                response.concepts.forEach(iri => addIri(listItem.concepts.iris, iri, listItem.ontologyId));
                setHierarchyInfo(listItem.concepts, response, 'conceptHierarchy');
                listItem.concepts.flat = self.flattenHierarchy(listItem.concepts, listItem);
                listItem.conceptSchemes.iris = {};
                response.conceptSchemes.forEach(iri => addIri(listItem.conceptSchemes.iris, iri, listItem.ontologyId));
                setHierarchyInfo(listItem.conceptSchemes, response, 'conceptSchemeHierarchy');
                listItem.conceptSchemes.flat = self.flattenHierarchy(listItem.conceptSchemes, listItem);
                unset(listItem.editorTabStates.concepts, 'entityIRI');
                unset(listItem.editorTabStates.concepts, 'usages');
            }, util.createErrorToast);
    }
    /**
     * @ngdoc method
     * @name flattenHierarchy
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Flattens the provided hierarchy information into an array that represents the hierarchical structure to be
     * used with a virtual scrolling solution.
     *
     * @param {Object} hierarchyInfo An Object with hierarchical information. Expects it to have a `iris` key with
     * an object of iris in the hierarchy, a `parentMap` key with a map of parent IRIs to arrays of children IRIs,
     * and a `childMap` key with a map of child IRIs to arrays of parent IRIs.
     * @param {Object} [listItem=self.listItem] The listItem associated with the provided hierarchy.
     * @returns {Object[]} An array which represents the provided hierarchy.
     */
    self.flattenHierarchy = function(hierarchyInfo, listItem = self.listItem) {
        var topLevel = difference(Object.keys(hierarchyInfo.iris), Object.keys(hierarchyInfo.childMap)).sort((s1, s2) => compareEntityName(s1, s2, listItem));
        var sortedParentMap = mapValues(hierarchyInfo.parentMap, arr => arr.sort((s1, s2) => compareEntityName(s1, s2, listItem)));
        var result = [];
        forEach(topLevel, iri => {
            addNodeToFlatHierarchy(iri, result, 0, [listItem.ontologyRecord.recordId], sortedParentMap, listItem, listItem.ontologyRecord.recordId);
        });
        return result;
    }
    function compareEntityName(s1, s2, listItem) {
        return lowerCase(self.getEntityNameByIndex(s1, listItem)).localeCompare(lowerCase(self.getEntityNameByIndex(s2, listItem)));
    }
    function addNodeToFlatHierarchy(iri, result, indent, path, parentMap, listItem, joinedPath) {
        var newPath = path.concat(iri);
        var newJoinedPath = joinedPath + '.' + iri;
        var item = {
            entityIRI: iri,
            hasChildren: parentMap.hasOwnProperty(iri),
            indent,
            path: newPath,
            entity: getEntityFromListItem(listItem, iri),
            joinedPath: newJoinedPath
        };
        result.push(item);
        forEach(get(parentMap, iri, []), child => {
            addNodeToFlatHierarchy(child, result, indent + 1, newPath, parentMap, listItem, newJoinedPath);
        });
    }
    /**
     * @ngdoc method
     * @name createFlatEverythingTree
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Creates an array which represents the hierarchical structure of the relationship between classes
     * and properties of the ontology represented by the provided `listItem` to be used with a virtual
     * scrolling solution.
     *
     * @param {Object} listItem The listItem representing the ontology to create the structure for
     * @returns {Object[]} An array which contains the class-property relationships.
     */
    self.createFlatEverythingTree = function(listItem = self.listItem) {
        var result = [];
        var ontology = get(listItem, 'ontology');
        var ontologyId = get(listItem, 'ontologyId');
        var importedOntologyListItems = get(listItem, 'importedOntologies', []);
        var importedOntologyIds = get(listItem, 'importedOntologyIds');
        var indices = getIndices(listItem);
        var classes = map(listItem.classes.iris, (val, entityIRI) => getEntityFromIndices(entityIRI, indices, ontology, ontologyId, importedOntologyListItems, importedOntologyIds));
        var orderedClasses = sortBy(classes, entity => lowerCase(getEntityNameByIndex(entity['@id'], indices)));

        var orderedProperties = [];
        var path = [];

        forEach(orderedClasses, clazz => {
            var classProps = get(listItem.classToChildProperties, clazz['@id'], []);

            orderedProperties = classProps.sort((s1, s2) => compareEntityName(s1, s2, listItem));
            path = [listItem.ontologyRecord.recordId, clazz['@id']];
            result.push(merge({}, clazz, {
                indent: 0,
                hasChildren: !!orderedProperties.length,
                path,
                joinedPath: self.joinPath(path)
            }));
            forEach(orderedProperties, property => {
                result.push(merge({}, getEntityFromIndices(property, indices, ontology, ontologyId, importedOntologyListItems, importedOntologyIds), {
                    indent: 1,
                    hasChildren: false,
                    path: concat(path, property['@id']),
                    joinedPath: self.joinPath(concat(path, property['@id']))
                }));
            });
        });
        var noDomainProps = listItem.noDomainProperties;

        var orderedNoDomainProperties = noDomainProps.sort((s1, s2) => compareEntityName(s1, s2, listItem));
        if (orderedNoDomainProperties.length) {
            result.push({
                title: 'Properties',
                get: self.getNoDomainsOpened,
                set: self.setNoDomainsOpened
            });
            forEach(orderedNoDomainProperties, property => {
                result.push(merge({}, getEntityFromIndices(property, indices, ontology, ontologyId, importedOntologyListItems, importedOntologyIds), {
                    indent: 1,
                    hasChildren: false,
                    get: self.getNoDomainsOpened,
                    path: [listItem.ontologyRecord.recordId, property['@id']],
                    joinedPath: self.joinPath([listItem.ontologyRecord.recordId, property['@id']])
                }));
            });
        }
        return result;
    }
    /**
     * @ngdoc method
     * @name createFlatIndividualTree
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Creates an array which represents the hierarchical structure of the relationship between classes
     * and individuals to be used with a virtual scrolling solution.
     *
     * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
     * @returns {Object[]} An array which contains the class-individuals relationships.
     */
    self.createFlatIndividualTree = function(listItem) {
        var result = [];
        var neededClasses = get(listItem, 'individualsParentPath', []);
        var classesWithIndividuals = get(listItem, 'classesAndIndividuals', {});
        if (neededClasses.length && !isEmpty(classesWithIndividuals)) {
            forEach(get(listItem, 'classes.flat', []), node => {
                if (includes(neededClasses, node.entityIRI)) {
                    result.push(merge({}, node, {isClass: true}));
                    var sortedIndividuals = sortBy(get(classesWithIndividuals, node.entityIRI), entityIRI => lowerCase(self.getEntityNameByIndex(entityIRI, listItem)));
                    forEach(sortedIndividuals, entityIRI => {
                        addNodeToFlatHierarchy(entityIRI, result, node.indent + 1, node.path, {}, listItem, self.joinPath(node.path));
                    });
                }
            });
        }
        return result;
    }
    /**
     * @ngdoc method
     * @name addEntity
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Adds the entity represented by the entityJSON to the ontology with the provided ontology ID in the
     * Mobi repository. Adds the new entity to the index.
     *
     * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
     * @param {string} entityJSON The JSON-LD representation for the entity you want to add to the ontology.
     */
    self.addEntity = function(listItem, entityJSON) {
        listItem.ontology.push(entityJSON);
        listItem.iriList.push(entityJSON['@id']);
        get(listItem, 'index', {})[entityJSON['@id']] = {
            position: listItem.ontology.length - 1,
            label: om.getEntityName(entityJSON),
            ontologyIri: listItem.ontologyId
        }         
    }
    /**
     * @ngdoc method
     * @name removeEntity
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the Mobi
     * repository along with any referenced blank nodes. Removes the entityIRI and any reference blank nodes
     * from the index.
     *
     * @param {Object} listItem The listItem linked to the ontology you want to remove the entity from.
     * @returns {Object[]} The list of JSON-LD entities that were removed.
     */
    self.removeEntity = function(listItem, entityIRI) {
        var toRemove = [];
        var toTest = [];

        // Helper method
        function addToLists(iri) {
            var newObj = {entityIRI: iri, position: get(listItem.index, "['" + iri + "'].position")};
            toRemove.push(newObj);
            toTest.push(newObj);
        }
        addToLists(entityIRI);
        while (toTest.length) {
            var obj = toTest.pop();
            var entity = listItem.ontology[obj.position];
            forOwn(omit(entity, ['@id', '@type']), (value, key) => {
                if (om.isBlankNodeId(key)) {
                    addToLists(key);
                }
                forEach(value, valueObj => {
                    var id = get(valueObj, '@id');
                    if (om.isBlankNodeId(id)) {
                        addToLists(id);
                    }
                });
            });
        }
        var removed = pullAt(listItem.ontology, map(toRemove, 'position'));
        forEach(toRemove, obj => {
            var newPosition = get(listItem.index, "['" + obj.entityIRI + "'].position");
            pull(listItem.iriList, obj.entityIRI);
            unset(listItem.index, obj.entityIRI);
            if (om.isBlankNodeId(obj.entityIRI)) {
                delete listItem.blankNodes[obj.entityIRI];
            }
            forOwn(listItem.index, (value, key) => {
                if (value.position > newPosition) {
                    listItem.index[key].position = value.position - 1;
                }
            });
        });
        return removed;
    }
    /**
     * @ngdoc method
     * @name getListItemByRecordId
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Gets the associated object from the {@link shared.service:ontologyStateService#list list} that
     * contains the requested record ID. Returns the list item.
     *
     * @param {string} recordId The record ID of the requested ontology.
     * @returns {Object} The associated Object from the
     * {@link shared.service:ontologyStateService#list list}.
     */
    self.getListItemByRecordId = function(recordId) {
        return find(self.list, {ontologyRecord: {recordId}});
    }
    /**
     * @ngdoc method
     * @name getOntologyByRecordId
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Gets the ontology from the {@link shared.service:ontologyStateService#list list} using the
     * requested recordId ID. Returns the JSON-LD of the ontology.
     *
     * @param {string} recordId The record ID of the requested ontology.
     * @returns {Object[]} The JSON-LD of the requested ontology.
     */
    self.getOntologyByRecordId = function(recordId) {
        return get(self.getListItemByRecordId(recordId), 'ontology', []);
    }
    /**
     * @ngdoc method
     * @name getEntityByRecordId
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Gets entity with the provided IRI from the ontology linked to the provided recordId in the Mobi
     * repository. Returns the entity Object.
     *
     * @param {string} recordId The recordId linked to the ontology you want to check.
     * @param {string} entityIRI The IRI of the entity that you want.
     * @returns {Object} An Object which represents the requested entity.
     */
    self.getEntityByRecordId = function(recordId, entityIRI, listItem) {
        if (!isEmpty(listItem)) {
            return getEntityFromListItem(listItem, entityIRI);
        }
        return getEntityFromListItem(self.getListItemByRecordId(recordId), entityIRI);
    }
    /**
     * @ngdoc method
     * @name getEntity
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Gets entity with the provided IRI from the ontology in the provided `listItem` using
     * {@link shared.service:ontologyManagerService getEntityAndBlankNodes}. Returns the resulting promise with a
     * JSON-LD array with the entity and its blank nodes.
     *
     * @param {string} entityIRI The IRI of the entity that you want
     * @param {Object} listItem The `listItem` to perform this action against
     * @returns {Promise} A Promise that resolves with a JSON-LD array containing the entity and its blank nodes;
     * rejects otherwise.
     */
    self.getEntity = function(entityIRI, listItem = self.listItem) {
        return om.getEntityAndBlankNodes(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, entityIRI);
    }
    /**
     * @ngdoc method
     * @name getEntityNoBlankNodes
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Gets entity with the provided IRI from the ontology in the provided `listItem` using
     * {@link shared.service:ontologyManagerService getEntityAndBlankNodes}. Returns the resulting promise with a
     * JSON-LD object for the entity.
     *
     * @param {string} entityIRI The IRI of the entity that you want
     * @param {Object} listItem The `listItem` to perform this action against
     * @returns {Promise} A Promise that resolves with a JSON-LD object for the entity; rejects otherwise.
     */
    self.getEntityNoBlankNodes = function(entityIRI, listItem = self.listItem) {
        return self.getEntity(entityIRI, listItem).then(arr => find(arr, {'@id': entityIRI}), $q.reject);
    }
    /**
     * @ngdoc method
     * @name getEntityNameByIndex
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Gets the entity's name using the provided entityIRI and listItem to find the entity's label in the index.
     * If that entityIRI is not in the index, retrieves the beautiful IRI of the entity IRI.
     *
     * @param {Object} entity The entity you want the name of.
     * @returns {string} The beautified IRI string.
     */
    self.getEntityNameByIndex = function(entityIRI, listItem = self.listItem) {
        return getEntityNameByIndex(entityIRI, getIndices(listItem));
    }
    function getEntityNameByIndex(entityIRI, indices) {
        var entity = result(findLast(indices, index => {
            var entity = get(index, entityIRI);
                return (entity !== null && has(entity, 'label'));
        }), entityIRI);
        return !entity ? utilService.getBeautifulIRI(entityIRI) : entity.label;
    }
    /**
     * @ngdoc method
     * @name saveChanges
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Saves all changes to the ontology with the specified record id by updating the in progress commit.
     *
     * @param {string} recordId The record ID of the requested ontology.
     * @param {Object} differenceObj The object containing statements that represent changes made.
     * @param {Object[]} differenceObj.additions The statements that were added.
     * @param {Object[]} differenceObj.deletions The statements that were deleted.
     * @returns {Promise} A promise with the ontology ID.
     */
    self.saveChanges = function(recordId, differenceObj) {
        return cm.updateInProgressCommit(recordId, catalogId, differenceObj);
    }
    self.addToAdditions = function(recordId, json) {
        addToInProgress(recordId, json, 'additions');
    }
    self.addToDeletions = function(recordId, json) {
        addToInProgress(recordId, json, 'deletions');
    }
    /**
     * @ngdoc method
     * @name openOntology
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Used to open an ontology from the Mobi repository. It calls
     * {@link shared.service:ontologyStateService#getOntology getOntology} to get the specified
     * ontology from the Mobi repository. Returns a promise.
     *
     * @param {string} recordId The record ID of the requested ontology.
     * @param {string} recordTitle The title of the requested ontology.
     * @returns {Promise} A promise with the ontology ID or error message.
     */
    self.openOntology = function(recordId, recordTitle) {
        var ontologyId;
        return self.getOntology(recordId)
            .then(response => {
                ontologyId = om.getOntologyIRI(response.ontology);
                return self.addOntologyToList(ontologyId, recordId, response.branchId, response.commitId, response.ontology, response.inProgressCommit, recordTitle, response.upToDate);
            }, $q.reject)
            .then(response => {
                self.listItem = response;
                self.setSelected(self.getActiveEntityIRI(), false);
                return ontologyId;
            }, $q.reject);
    }
    /**
     * @ngdoc method
     * @name closeOntology
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Used to close an ontology from the Mobi application. It removes the ontology list item from the
     * {@link shared.service:ontologyStateService#list list}.
     *
     * @param {string} recordId The record ID of the requested ontology.
     */
    self.closeOntology = function(recordId) {
        if (get(self.listItem, 'ontologyRecord.recordId') == recordId) {
            self.listItem = {};
        }
        remove(self.list, { ontologyRecord: { recordId }});
    }
    /**
     * @ngdoc method
     * @name removeBranch
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Removes the specified branch from the `listItem` for the specified record. Meant to be called after the
     * Branch has already been deleted. Also updates the `tags` list on the `listItem` to account for any tags
     * that were removed as a result of the branch removal.
     *
     * @param {string} recordId The IRI of the Record whose Branch was deleted
     * @param {string} branchId The IRI of the Branch that was deleted
     */
    self.removeBranch = function(recordId, branchId) {
        var listItem = self.getListItemByRecordId(recordId);
        remove(listItem.branches, {'@id': branchId});
        return cm.getRecordVersions(recordId, catalogId)
            .then(response => {
                listItem.tags = filter(response.data, version => includes(get(version, '@type'), prefixes.catalog + 'Tag'));
            }, $q.reject);
    }
    self.afterSave = function() {
        return cm.getInProgressCommit(self.listItem.ontologyRecord.recordId, catalogId)
            .then(inProgressCommit => {
                self.listItem.inProgressCommit = inProgressCommit;

                self.listItem.additions = [];
                self.listItem.deletions = [];

                return isEqual(inProgressCommit, emptyInProgressCommit) ? cm.deleteInProgressCommit(self.listItem.ontologyRecord.recordId, catalogId) : $q.when();
            }, $q.reject)
            .then(() => {
                forOwn(self.listItem.editorTabStates, (value, key) => {
                    unset(value, 'usages');
                });

                if (isEmpty(self.getOntologyStateByRecordId(self.listItem.ontologyRecord.recordId))) {
                    return self.createOntologyState({recordId: self.listItem.ontologyRecord.recordId, commitId: self.listItem.ontologyRecord.commitId, branchId: self.listItem.ontologyRecord.branchId});
                } else {
                    return self.updateOntologyState({recordId: self.listItem.ontologyRecord.recordId, commitId: self.listItem.ontologyRecord.commitId, branchId: self.listItem.ontologyRecord.branchId});
                }
            }, $q.reject);
    }
    self.clearInProgressCommit = function() {
        self.listItem.inProgressCommit = {'additions': [], 'deletions': []}
    }
    self.setNoDomainsOpened = function(recordId, isOpened) {
        set(self.listItem.editorTabStates, getOpenPath(recordId, 'noDomainsOpened'), isOpened);
    }
    self.getNoDomainsOpened = function(recordId) {
        return get(self.listItem.editorTabStates, getOpenPath(recordId, 'noDomainsOpened'), false);
    }
    self.setDataPropertiesOpened = function(recordId, isOpened) {
        set(self.listItem.editorTabStates, getOpenPath(recordId, 'dataPropertiesOpened'), isOpened);
    }
    self.getDataPropertiesOpened = function(recordId) {
        return get(self.listItem.editorTabStates, getOpenPath(recordId, 'dataPropertiesOpened'), false);
    }
    self.setObjectPropertiesOpened = function(recordId, isOpened) {
        set(self.listItem.editorTabStates, getOpenPath(recordId, 'objectPropertiesOpened'), isOpened);
    }
    self.getObjectPropertiesOpened = function(recordId) {
        return get(self.listItem.editorTabStates, getOpenPath(recordId, 'objectPropertiesOpened'), false);
    }
    self.setAnnotationPropertiesOpened = function(recordId, isOpened) {
        set(self.listItem.editorTabStates, getOpenPath(recordId, 'annotationPropertiesOpened'), isOpened);
    }
    self.getAnnotationPropertiesOpened = function(recordId) {
        return get(self.listItem.editorTabStates, getOpenPath(recordId, 'annotationPropertiesOpened'), false);
    }
    // TODO: Keep an eye on this
    self.onEdit = function(iriBegin, iriThen, iriEnd) {
        var newIRI = iriBegin + iriThen + iriEnd;
        var oldEntity = omit(angular.copy(self.listItem.selected), 'mobi');
        self.getActivePage().entityIRI = newIRI;
        if (some(self.listItem.additions, oldEntity)) {
            remove(self.listItem.additions, oldEntity);
            updateRefsService.update(self.listItem, self.listItem.selected['@id'], newIRI);
        } else {
            updateRefsService.update(self.listItem, self.listItem.selected['@id'], newIRI);
            self.addToDeletions(self.listItem.ontologyRecord.recordId, oldEntity);
        }
        if (self.getActiveKey() !== 'project') {
            self.setCommonIriParts(iriBegin, iriThen);
        }
        self.addToAdditions(self.listItem.ontologyRecord.recordId, omit(angular.copy(self.listItem.selected), 'mobi'));
        return om.getEntityUsages(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId, oldEntity['@id'], 'construct')
            .then(statements => {
                forEach(statements, statement => self.addToDeletions(self.listItem.ontologyRecord.recordId, statement));
                updateRefsService.update(statements, oldEntity['@id'], newIRI);
                forEach(statements, statement => self.addToAdditions(self.listItem.ontologyRecord.recordId, statement));
            }, errorMessage => util.createErrorToast('Associated entities were not updated due to an internal error.'));
    }
    self.setCommonIriParts = function(iriBegin, iriThen) {
        set(self.listItem, 'iriBegin', iriBegin);
        set(self.listItem, 'iriThen', iriThen);
    }
    /**
     * @ngdoc method
     * @name setSelected
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Sets the `selected`, `selectedBlankNodes`, and `blankNodes` properties on the provided `listItem` based on the
     * response from {@link shared.service:ontologyManagerService getEntityAndBlankNodes}. Returns a Promise indicating
     * the success of the action. If the provided `entityIRI` or `listItem` are not valid, returns a Promise that
     * resolves. Sets the entity usages if the provided `getUsages` parameter is true. Also accepts a spinner id to use
     * in the call to fetch the entity.
     *
     * @param {string} entityIRI The IRI of the entity to retrieve
     * @param {string} [getUsages=true] Whether to set the usages of the entity after fetching
     * @param {string} [listItem=self.listItem] The listItem to execute these actions against
     * @param {string} [spinnerId=''] A spinner id to attach to the call to fetch the entity
     * @return {Promise} A promise indicating the success of the action
     */
    self.setSelected = function(entityIRI, getUsages = true, listItem = self.listItem, spinnerId = '') {
        if  (!entityIRI || !listItem) {
            if (listItem) {
                listItem.selected = undefined;
                listItem.selectedBlankNodes = [];
                listItem.blankNodes = {};
            }
            return $q.when();
        }
        if (spinnerId) {
            httpService.cancel(spinnerId);
        }
        // TODO: Add targeted spinner for
        return om.getEntityAndBlankNodes(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, entityIRI, undefined, undefined, undefined, spinnerId)
            .then(arr => {
                listItem.selected = find(arr, {'@id': entityIRI});
                listItem.selectedBlankNodes = getArrWithoutEntity(entityIRI, arr);
                var bnodeIndex = {};
                listItem.selectedBlankNodes.forEach((bnode, idx) => {
                    bnodeIndex[bnode['@id']] = {position: idx};
                });
                listItem.selectedBlankNodes.forEach(bnode => {
                    listItem.blankNodes[bnode['@id']] = mc.jsonldToManchester(bnode['@id'], listItem.selectedBlankNodes, bnodeIndex);
                });
                if (om.isIndividual(listItem.selected)) {
                    findValuesMissingDatatypes(listItem.selected);
                }
                
                // TODO: Remove these once these properties are in their own maps
                self.updatePropertyIcon(listItem.selected);
                var importedOntObj = find(listItem.importedOntologies, ont => entityIRI in ont.index);
                if (importedOntObj) {
                    set(listItem.selected, 'mobi.imported', true);
                    set(listItem.selected, 'mobi.importedIRI', importedOntObj.ontologyId);
                }

                if (getUsages && !has(self.getActivePage(), 'usages') && listItem.selected) {
                    self.setEntityUsages(entityIRI);
                }
            });
    }
    self.setEntityUsages = function(entityIRI) {
        var page = self.getActivePage();
        var id = 'usages-' + self.getActiveKey() + '-' + self.listItem.ontologyRecord.recordId;
        httpService.cancel(id);
        om.getEntityUsages(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId, entityIRI, 'select', id)
            .then(bindings => set(page, 'usages', bindings),
                response => set(page, 'usages', []));
    }
    /**
     * @ngdoc method
     * @name resetStateTabs
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Resets the state of each of the tabs in the provided `listItem`. If the active tab is the project tab, sets the
     * selected entity back to the Ontology object. If the active tab is not the project tab, unsets the selected entity
     * and its blank nodes.
     *
     * @param {string} [listItem=self.listItem] The listItem to execute these actions against
     */
    self.resetStateTabs = function(listItem = self.listItem) {
        forOwn(listItem.editorTabStates, (value, key) => {
            if (key == 'search') {
                unset(value, 'entityIRI');
                unset(value, encodeURIComponent(listItem.ontologyRecord.recordId));
                value.open = {};
            }
            else if (key !== 'project' && key !== 'search') {
                unset(value, 'entityIRI');
                unset(value, encodeURIComponent(listItem.ontologyRecord.recordId));
                value.open = {};
                value.searchText = '';
            }
            else {
                value.entityIRI = om.getOntologyIRI(listItem.ontology);
                value.preview = '';
            }
            unset(value, 'usages');
        });
        self.resetSearchTab(listItem);
        if (self.getActiveKey() !== 'project') {
            listItem.selected = undefined;
            listItem.selectedBlankNodes = [];
            listItem.blankNodes = {};
        } else {
            self.setSelected(listItem.editorTabStates.project.entityIRI, false, listItem, 'project');
        }
    }
    self.resetSearchTab = function(listItem = self.listItem) {
        httpService.cancel(listItem.editorTabStates.search.id);
        listItem.editorTabStates.search.errorMessage = '';
        listItem.editorTabStates.search.highlightText = '';
        listItem.editorTabStates.search.infoMessage = '';
        listItem.editorTabStates.search.results = {};
        listItem.editorTabStates.search.searchText = '';
        listItem.editorTabStates.search.selected = {};
        listItem.editorTabStates.search.entityIRI = '';
    }
    self.getActiveKey = function(listItem = self.listItem) {
        return findKey(listItem.editorTabStates, 'active') || 'project';
    }
    self.getActivePage = function(listItem = self.listItem) {
        return listItem.editorTabStates[self.getActiveKey(listItem)];
    }
    self.setActivePage = function(key, listItem = self.listItem) {
        if (has(listItem.editorTabStates, key)) {
            self.getActivePage(listItem).active = false;
            listItem.editorTabStates[key].active = true;
        }
    }
    self.getActiveEntityIRI = function() {
        return get(self.getActivePage(), 'entityIRI');
    }
    /**
     * @ngdoc method
     * @name selectItem
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Selects the entity with the specified IRI in the current `listItem`. Optionally can set the usages of the entity.
     * Also accepts a spinner id to use in the call to fetch the entity. Returns a Promise indicating the success of the
     * action.
     * 
     * @param {string} entityIRI The IRI of an entity in the current `listItem`
     * @param {boolean} [getUsages=true] Whether to set the usages of the specified entity
     * @param {string} [spinnerId=''] A spinner id to attach to the call to fetch the entity
     * @returns {Promise} Promise that resolves if the action was successful; rejects otherwise
     */
    self.selectItem = function(entityIRI, getUsages = true, spinnerId = '') {
        if (entityIRI && entityIRI !== self.getActiveEntityIRI()) {
            set(self.getActivePage(), 'entityIRI', entityIRI);
            if (getUsages) {
                self.setEntityUsages(entityIRI);
            }
        }
        return self.setSelected(entityIRI, false, self.listItem, spinnerId);
    }
    /**
     * @ngdoc method
     * @name unSelectItem
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Unselects the currently selected entity. This includes wiping the usages, stored RDF, and the related blank
     * nodes.
     */
    self.unSelectItem = function() {
        var activePage = self.getActivePage();
        unset(activePage, 'entityIRI');
        unset(activePage, 'usages');
        self.listItem.selected = undefined;
        self.listItem.selectedBlankNodes = [];
        self.listItem.blankNodes = {};
    }
    self.hasChanges = function(listItem) {
        return !!get(listItem, 'additions', []).length || !!get(listItem, 'deletions', []).length;
    }
    self.isCommittable = function(listItem) {
        return !!get(listItem, 'inProgressCommit.additions', []).length || !!get(listItem, 'inProgressCommit.deletions', []).length;
    }
    self.updateIsSaved = function() {
        self.listItem.isSaved = self.isCommittable(self.listItem);
    }
    self.addEntityToHierarchy = function(hierarchyInfo, entityIRI, parentIRI) {
        if (parentIRI && has(hierarchyInfo.iris, parentIRI)) {
            hierarchyInfo.parentMap[parentIRI] = union(get(hierarchyInfo.parentMap, parentIRI), [entityIRI]);
            hierarchyInfo.childMap[entityIRI] = union(get(hierarchyInfo.childMap, entityIRI), [parentIRI]);
        }
    }
    self.deleteEntityFromParentInHierarchy = function(hierarchyInfo, entityIRI, parentIRI) {
        pull(hierarchyInfo.parentMap[parentIRI], entityIRI);
        if (!get(hierarchyInfo.parentMap, parentIRI, []).length) {
            delete hierarchyInfo.parentMap[parentIRI];
        }
        pull(hierarchyInfo.childMap[entityIRI], parentIRI);
        if (!get(hierarchyInfo.childMap, entityIRI, []).length) {
            delete hierarchyInfo.childMap[entityIRI];
        }
    }
    self.deleteEntityFromHierarchy = function(hierarchyInfo, entityIRI) {
        var children = get(hierarchyInfo.parentMap, entityIRI, []);
        delete hierarchyInfo.parentMap[entityIRI];
        forEach(children, child => {
            pull(hierarchyInfo.childMap[child], entityIRI); 
            if (!get(hierarchyInfo.childMap, child, []).length) {
                delete hierarchyInfo.childMap[child];
            }
        });
        var parents = get(hierarchyInfo.childMap, entityIRI, []);
        delete hierarchyInfo.childMap[entityIRI];
        forEach(parents, parent => {
            pull(hierarchyInfo.parentMap[parent], entityIRI);
            if (!get(hierarchyInfo.parentMap, parent, []).length) {
                delete hierarchyInfo.parentMap[parent];
            }
        });
    }
    self.getPathsTo = function(hierarchyInfo, entityIRI) {
        var result = [];
        if (has(hierarchyInfo.iris, entityIRI)) {
            if (has(hierarchyInfo.childMap, entityIRI)) {
                var toFind = [[entityIRI]];
                while (toFind.length) {
                    var temp = toFind.pop();
                    forEach(hierarchyInfo.childMap[temp[0]], parent => {
                        var temp2 = [parent].concat(temp);
                        if (has(hierarchyInfo.childMap, parent)) {
                            toFind.push(temp2);
                        } else {
                            result.push(temp2);
                        }
                    });
                }
            } else {
                result.push([entityIRI]);
            }
        }
        return result;
    }
    self.areParentsOpen = function(node, tab) {
        var allOpen = true;
        for (var i = node.path.length - 1; i > 1; i--) {
            var fullPath = self.joinPath(node.path.slice(0, i));

            if (!self.listItem.editorTabStates[tab].open[fullPath]) {
                allOpen = false;
                break;
            };
        }
        return allOpen;
    }
    self.joinPath = function(path) {
        return join(path, '.');
    }
    self.goTo = function(iri) {
        var entity = self.getEntityByRecordId(self.listItem.ontologyRecord.recordId, iri);
        if (om.isOntology(entity)) {
            commonGoTo('project', iri);
        } else if (om.isClass(entity)) {
            commonGoTo('classes', iri, self.listItem.classes.flat);
            self.listItem.editorTabStates.classes.index = getScrollIndex(iri, self.listItem.classes.flat);
        } else if (om.isDataTypeProperty(entity)) {
            commonGoTo('properties', iri, self.listItem.dataProperties.flat);
            self.setDataPropertiesOpened(self.listItem.ontologyRecord.recordId, true);
            // Index is incremented by 1 to account for Data Property folder
            self.listItem.editorTabStates.properties.index = getScrollIndex(iri, self.listItem.dataProperties.flat, true, self.getDataPropertiesOpened) + 1;
        } else if (om.isObjectProperty(entity)) {
            commonGoTo('properties', iri, self.listItem.objectProperties.flat);
            self.setObjectPropertiesOpened(self.listItem.ontologyRecord.recordId, true);

            var index = 0;
            // If Data Properties are present, count the number of shown properties and increment by 1 for the Data Property folder
            if (self.listItem.dataProperties.flat.length > 0) {
                index += getScrollIndex(iri, self.listItem.dataProperties.flat, true, self.getDataPropertiesOpened) + 1;
            }
            // Index is incremented by 1 to account for Object Property folder
            self.listItem.editorTabStates.properties.index = index + getScrollIndex(iri, self.listItem.objectProperties.flat, true, self.getObjectPropertiesOpened) + 1;
        } else if (om.isAnnotation(entity)) {
            commonGoTo('properties', iri, self.listItem.annotations.flat);
            self.setAnnotationPropertiesOpened(self.listItem.ontologyRecord.recordId, true);

            var index = 0;
            // If Data Properties are present, count the number of shown properties and increment by 1 for the Data Property folder
            if (self.listItem.dataProperties.flat.length > 0) {
                index += getScrollIndex(iri, self.listItem.dataProperties.flat, true, self.getDataPropertiesOpened) + 1;
            }
            // If Object Properties are present, count the number of shown properties and increment by 1 for the Object Property folder
            if (self.listItem.objectProperties.flat.length > 0) {
                index += getScrollIndex(iri, self.listItem.objectProperties.flat, true, self.getObjectPropertiesOpened) + 1;
            }
            // Index is incremented by 1 to account for Annotation Property folder
            self.listItem.editorTabStates.properties.index = index + getScrollIndex(iri, self.listItem.annotations.flat, true, self.getAnnotationPropertiesOpened) + 1;
        } else if (om.isConcept(entity, self.listItem.derivedConcepts)) {
            commonGoTo('concepts', iri, self.listItem.concepts.flat);
            self.listItem.editorTabStates.concepts.index = getScrollIndex(iri, self.listItem.concepts.flat);
        } else if (om.isConceptScheme(entity, self.listItem.derivedConceptSchemes)) {
            commonGoTo('schemes', iri, self.listItem.conceptSchemes.flat);
            self.listItem.editorTabStates.schemes.index = getScrollIndex(iri, self.listItem.conceptSchemes.flat);
        } else if (filter(self.listItem.individuals.flat, {entityIRI: iri}).length != 0) {
            commonGoTo('individuals', iri, self.listItem.individuals.flat);
            self.listItem.editorTabStates.individuals.index = getScrollIndex(iri, self.listItem.individuals.flat);
        }
    }
    self.openAt = function(flatHierarchy, entityIRI) {
        var path = get(find(flatHierarchy, {entityIRI}), 'path', []);
        if (path.length) {
            var pathString = head(path);
            forEach(tail(initial(path)), pathPart => {
                pathString += '.' + pathPart;
                self.listItem.editorTabStates[self.getActiveKey()].open[pathString] = true;
            });
        }
    }
    self.getDefaultPrefix = function() {
        var prefixIri = replace(get(self.listItem, 'iriBegin', self.listItem.ontologyId), '#', '/') + get(self.listItem, 'iriThen', '#');
        if (om.isBlankNodeId(prefixIri)) {
            var nonBlankNodeId = find(keys(self.listItem.index), iri => !om.isBlankNodeId(iri));
            if (nonBlankNodeId) {
                var split = $filter('splitIRI')(nonBlankNodeId);
                prefixIri = split.begin + split.then;
            } else {
                prefixIri = 'https://mobi.com/blank-node-namespace/' + uuid.v4() + '#';
            }
        }
        return prefixIri;
    }
    self.updatePropertyIcon = function(entity) {
        if (om.isProperty(entity)) {
            setPropertyIcon(entity);
        }
    }
    self.hasInProgressCommit = function(listItem = self.listItem) {
        return listItem.inProgressCommit !== undefined
                && ((listItem.inProgressCommit.additions !== undefined && listItem.inProgressCommit.additions.length > 0)
                || (listItem.inProgressCommit.deletions !== undefined && listItem.inProgressCommit.deletions.length > 0));
    }
    self.addToClassIRIs = function(listItem, iri, ontologyId) {
        if (!existenceCheck(listItem.classes.iris, iri)) {
            if (iri === prefixes.skos + 'Concept' || iri === prefixes.skos + 'ConceptScheme') {
                listItem.isVocabulary = true;
            }
            listItem.classes.iris[iri] = ontologyId || listItem.ontologyId;
        }
    }
    self.removeFromClassIRIs = function(listItem, iri) {
        var conceptCheck = iri === prefixes.skos + 'Concept' && !existenceCheck(listItem.classes.iris, prefixes.skos + 'ConceptScheme');
        var schemeCheck = iri === prefixes.skos + 'ConceptScheme' && !existenceCheck(listItem.classes.iris, prefixes.skos + 'Concept');
        if (conceptCheck || schemeCheck) {
            listItem.isVocabulary = false;
        }
        delete listItem.classes.iris[iri];
    }
    self.attemptMerge = function() {
        return self.checkConflicts()
            .then(() => self.merge(), $q.reject);
    }
    self.checkConflicts = function() {
        return cm.getBranchConflicts(self.listItem.ontologyRecord.branchId, self.listItem.merge.target['@id'], self.listItem.ontologyRecord.recordId, catalogId)
            .then(conflicts => {
                if (isEmpty(conflicts)) {
                    return $q.when();
                } else {
                    forEach(conflicts, conflict => {
                        conflict.resolved = false;
                        self.listItem.merge.conflicts.push(conflict);
                    });
                    return $q.reject();
                }
            }, $q.reject);
    }
    self.merge = function() {
        var sourceId = self.listItem.ontologyRecord.branchId;
        var checkbox = self.listItem.merge.checkbox;
        var commitId;
        return cm.mergeBranches(sourceId, self.listItem.merge.target['@id'], self.listItem.ontologyRecord.recordId, catalogId, self.listItem.merge.resolutions)
            .then(commit => {
                commitId = commit;
                if (checkbox) {
                    return om.deleteOntologyBranch(self.listItem.ontologyRecord.recordId, sourceId)
                        .then(() => self.removeBranch(self.listItem.ontologyRecord.recordId, sourceId), $q.reject)
                        .then(() => self.deleteOntologyBranchState(self.listItem.ontologyRecord.recordId, sourceId), $q.reject);
                } else {
                    return $q.when();
                }
            }, $q.reject)
            .then(() => self.updateOntology(self.listItem.ontologyRecord.recordId, self.listItem.merge.target['@id'], commitId), $q.reject);
    }
    self.cancelMerge = function() {
        self.listItem.merge.active = false;
        self.listItem.merge.target = undefined;
        self.listItem.merge.checkbox = false;
        self.listItem.merge.difference = undefined;
        self.listItem.merge.conflicts = [];
        self.listItem.merge.resolutions = {
            additions: [],
            deletions: []
        };
    }
    self.canModify = function() {
        if (!self.listItem.ontologyRecord.branchId) {
            return false;
        }
        if (self.listItem.masterBranchIRI === self.listItem.ontologyRecord.branchId) {
            return self.listItem.userCanModifyMaster;
        } else {
            return self.listItem.userCanModify;
        }
    }
    /**
     * @ngdoc method
     * @name getFromIndices
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Retrieves the combined index value for the provided IRI from the defined ontology index and all the imported
     * ontology indices inside the provided `listItem`.
     *
     * @param {string} [listItem=self.listItem] The listItem to execute these actions against
     * @returns {Object} The merged index value for the provided IRI from all indices
     */
    self.getFromIndices = function(iri, listItem = self.listItem) {
        var indices = getIndices(listItem);
        var found = [];
        forEach(indices, index => {
            var entity = index[iri];
            if (entity) {
                found.push(entity);
            }
        });
        return merge.apply({}, found);
    }
    /**
     * @ngdoc method
     * @name existsInIndices
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Determines whether the provided IRI exists in any index within the provided `listItem`. Returns a boolean.
     *
     * @param {string} [listItem=self.listItem] The listItem to execute these actions against
     * @returns {boolean} True if the IRI exists in one of the indices; false otherwise
     */
    self.existsInIndices = function(iri, listItem = self.listItem) {
        var indices = getIndices(listItem);
        return some(indices, index => iri in index);
    }
    /**
     * @ngdoc method
     * @name handleDeletedClass
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Updates property maps on the current listItem based on the provided deleted class IRI
     *
     * @param {string} The iri of the entity to be deleted
     */
    self.handleDeletedClass = function(classIRI) {
        var classProperties = get(self.listItem.classToChildProperties, classIRI, []);
        delete self.listItem.classToChildProperties[classIRI];
        classProperties.forEach(property => {
            checkForPropertyDomains(property);
        });
    }
    /**
     * @ngdoc method
     * @name handleDeletedProperty
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Deletes traces of a removed property from the noDomainProperty and classToChild maps
     *
     * @param {string} The iri of the property to be deleted
     */
    self.handleDeletedProperty = function(property) {
        forEach(self.listItem.classToChildProperties, (value,key) => {
            let hasProperty = self.listItem.classToChildProperties[key].includes(property);
            let classIRI = key;
            if (hasProperty) {
                pull(self.listItem.classToChildProperties[classIRI], property);
            }
        });
    }
    /**
     * @ngdoc method
     * @name handleNewProperty
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * adds property iri to the correct map; either noDomainProperties or classToChildProperties
     *
     * @param {string} The iri of the property to be added to either map
     */
    self.handleNewProperty = function(property) {
        var domainPath = prefixes.rdfs + 'domain';
        if (property[domainPath] == [] || property[domainPath] == undefined ){
            self.listItem.noDomainProperties.push(property['@id'])
        } else {
            property[domainPath].forEach(domain => {
                var classIRI = domain['@id'];
                var path =  self.listItem.classToChildProperties[classIRI];
                if (!path){
                    self.listItem.classToChildProperties[classIRI] = [];
                }
                self.listItem.classToChildProperties[classIRI].push(property ['@id']);
            });
        }
    }
    /**
     * @ngdoc method
     * @name changePropertyHierarchy
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Determines whether a deleted classes set of properties still has a domain or not
     *
     * @param {string} The iri of the property being altered in the hierarchy
     * @param {Array} An array of values that are being added to the property.
     */
    self.changePropertyHierarchy = function(property, values){
        values.forEach(parentclass => {
            if (!self.listItem.classToChildProperties[parentclass]){
                self.listItem.classToChildProperties[parentclass] = [];
            }
            self.listItem.classToChildProperties[parentclass].push(property);
        });
        if (self.listItem.noDomainProperties.includes(property)) {
            pull(self.listItem.noDomainProperties, property);
        }
    }
    /**
     * @ngdoc method
     * @name removePropertyFromEntity
     * @methodOf shared.service:ontologyStateService
     *
     * @description
     * Determines whether a deleted classes set of properties still has a domain or not
     *
     * @param {string} The iri of the property to be removed
     * @param {string} The iri of the entity the property is being removed from
     */
    self.removePropertyFromEntity = function(property, entity){
        if (self.listItem.classToChildProperties[entity].includes(property)){
            remove(self.listItem.classToChildProperties[entity], classproperties =>{
                return classproperties == property;
            });
        }
        checkForPropertyDomains(property);
    }

    /* Private helper functions */
    function checkForPropertyDomains(property) {
        let hasDomain = false;
        forEach(self.listItem.classToChildProperties, (propertyIRIs) =>{
            if (propertyIRIs.includes(property)){
                hasDomain = true;
                return false;
            }
        })
        if (hasDomain == false){
            self.listItem.noDomainProperties.push(property);
        }
    }
    function existenceCheck(iriObj, iri) {
        return has(iriObj, "['" + iri + "']");
    }
    function getIndices(listItem) {
        return concat([get(listItem, 'index')], map(get(listItem, 'importedOntologies'), 'index'));
    }
    function commonGoTo(key, iri, flatHierarchy = undefined) {
        self.setActivePage(key);
        self.selectItem(iri, undefined, self.getActivePage().vocabularySpinnerId);
        if (flatHierarchy) {
            self.openAt(flatHierarchy, iri);
        }
    }
    function getScrollIndex(iri, flatHierarchy, property = false, checkPropertyOpened = identity) {
        var scrollIndex = 0;
        var index = findIndex(flatHierarchy, {entityIRI: iri});
        if (index < 0) {
            index = flatHierarchy.length;
        }
        for (var i = 0; i < index; i++) {
            var node = flatHierarchy[i];
            if (!property && ((node.indent > 0 && self.areParentsOpen(node, self.getActiveKey())) || node.indent === 0)) {
                scrollIndex++;
            } else if (property && self.areParentsOpen(node, self.getActiveKey()) && checkPropertyOpened(self.listItem.ontologyRecord.recordId)) {
                scrollIndex++;
            }
        }
        return scrollIndex;
    }
    function getOpenPath(...args) {
        return self.getActiveKey() + '.' + join(map(args, encodeURIComponent), '.');
    }
    function setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title) {
        var listItem = angular.copy(ontologyListItemTemplate);
        var blankNodes = {};
        var index = {};
        forEach(ontology, (entity, i) => {
            if (has(entity, '@id')) {
                index[entity['@id']] = {
                    position: i,
                    label: om.getEntityName(entity),
                    ontologyIri: ontologyId
                }
            } else {
                set(entity, 'mobi.anonymous', ontologyId + ' (Anonymous Ontology)');
            }
            if (om.isIndividual(entity)) {
                findValuesMissingDatatypes(entity);
            }
        });
        listItem.ontologyId = ontologyId;
        listItem.editorTabStates.project.entityIRI = ontologyId;
        listItem.ontologyRecord.title = title;
        listItem.ontologyRecord.recordId = recordId;
        listItem.ontologyRecord.branchId = branchId;
        listItem.ontologyRecord.commitId = commitId;
        listItem.ontology = ontology;
        listItem.blankNodes = blankNodes;
        listItem.index = index;
        listItem.inProgressCommit = inProgressCommit;
        listItem.upToDate = upToDate;
        return listItem;
    }
    function findValuesMissingDatatypes(object) {
        if (has(object, '@value')) {
            if (!has(object, '@type') && !has(object, '@language')) {
                object['@type'] = prefixes.xsd + "string";
            }
        } else if (isObject(object)) {
            forEach(keys(object), key => {
                findValuesMissingDatatypes(object[key]);
            });
        }
    }
    function setPropertyIcon(entity) {
        set(self.listItem.propertyIcons, [entity["@id"]], getIcon(entity));
    }
    function getIcon(property) {
        var range = get(property, prefixes.rdfs + 'range');
        var value;
        if (!range) {
            range = property;
            value = property[0];
        }
        else { value = range[0]['@id']; }
        var icon = 'fa-square-o';
        if (range) {
            if (range.length === 1) {
                switch(value) {
                    case prefixes.xsd + 'string':
                    case prefixes.rdf + 'langString':
                        icon = 'fa-font';
                        break;
                    case prefixes.xsd + 'decimal':
                    case prefixes.xsd + 'double':
                    case prefixes.xsd + 'float':
                    case prefixes.xsd + 'int':
                    case prefixes.xsd + 'integer':
                    case prefixes.xsd + 'long':
                    case prefixes.xsd + 'nonNegativeInteger':
                        icon = 'fa-calculator';
                        break;
                    case prefixes.xsd + 'language':
                        icon = 'fa-language';
                        break;
                    case prefixes.xsd + 'anyURI':
                        icon = 'fa-external-link';
                        break;
                    case prefixes.xsd + 'dateTime':
                        icon = 'fa-clock-o';
                        break;
                    case prefixes.xsd + 'boolean':
                    case prefixes.xsd + 'byte':
                        icon = 'fa-signal';
                        break;
                    case prefixes.rdfs + 'Literal':
                        icon = 'fa-cube';
                        break;
                    default:
                        icon = 'fa-link';
                        break;
                }
            } else {
                icon = 'fa-cubes';
            }
        }
        return icon;
    }
    function getEntityFromListItem(listItem, entityIRI) {
        if  (!entityIRI || !listItem) {
            return;
        }
        var ontology = listItem.ontology;
        var ontologyId = listItem.ontologyId;
        var importedOntologyListItems = listItem.importedOntologies || [];
        var importedOntologyIds = listItem.importedOntologyIds;
        var indices = getIndices(listItem);
        return getEntityFromIndices(entityIRI, indices, ontology, ontologyId, importedOntologyListItems, importedOntologyIds);
    }
    function getEntityFromIndices(entityIRI, indices, ontology, ontologyId, importedOntologyListItems, importedOntologyIds) {
        var entities = [];
        forEach(indices, index => {
            var entity = get(index, entityIRI);
            if (entity && has(entity, 'position') && has(entity, 'ontologyIri')) {
                if (entity.ontologyIri === ontologyId) {
                    entities.push(ontology[entity.position]);
                } else {
                    entities.push(importedOntologyListItems[indexOf(importedOntologyIds, entity.ontologyIri)].ontology[entity.position]);
                }
            }
        });
        var combinedEntity = merge.apply({}, entities);
        if (isEmpty(combinedEntity)) {
            return;
        } else {
            return combinedEntity;
        }
    }
    function addToInProgress(recordId, json, prop) {
        var listItem = self.getListItemByRecordId(recordId);
        var entity = find(listItem[prop], {'@id': json['@id']});
        var filteredJson = omit(angular.copy(json), 'mobi');
        if (entity) {
            mergeWith(entity, filteredJson, util.mergingArrays);
        } else  {
            listItem[prop].push(filteredJson);
        }
    }
    function addImportedOntologyToListItem(listItem, importedOntObj) {
        var index = {};
        forEach(importedOntObj.ontology, (entity, i) => {
            if (has(entity, '@id')) {
                index[entity['@id']] = {
                    position: i,
                    label: om.getEntityName(entity),
                    ontologyIri: importedOntObj.id
                }
            }
            set(entity, 'mobi.imported', true);
            set(entity, 'mobi.importedIRI', importedOntObj.ontologyId);
        });
        var importedOntologyListItem = {
            id: importedOntObj.id,
            ontologyId: importedOntObj.ontologyId,
            ontology: importedOntObj.ontology,
            index,
        };
        listItem.importedOntologyIds.push(importedOntObj.id);
        listItem.importedOntologies.push(importedOntologyListItem);
    }
    function setHierarchyInfo(obj, response, key) {
        var hierarchyInfo = get(response, key, {parentMap: {}, childMap: {}});
        obj.parentMap = hierarchyInfo.parentMap;
        obj.childMap = hierarchyInfo.childMap;
    }
    function getArrWithoutEntity(iri, arr) {
        if (!arr || !arr.length) {
            return [];
        }
        arr.splice(arr.findIndex(entity => entity['@id'] === iri), 1);
        return arr;
    }

}

export default ontologyStateService;