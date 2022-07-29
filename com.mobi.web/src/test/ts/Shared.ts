/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import { identity, get, has } from 'lodash';
import { Observable } from 'rxjs';
import 'hammerjs';

import { ControlRecordI } from '../../main/resources/public/ontology-visualization/interfaces/visualization.interfaces';
import { GraphState, StateNode, StateEdge } from  '../../main/resources/public/ontology-visualization/classes';

export function cleanStylesFromDOM(): void {
    const head: HTMLHeadElement = document.getElementsByTagName('head')[0];
    const styles: HTMLCollectionOf<HTMLStyleElement> | [] = head.getElementsByTagName('style');

    for (let i = 0; i < styles.length; i++) {
        head.removeChild(styles[i]);
    }
}

export class mockLoginManager {
    login = jasmine.createSpy('login').and.returnValue(Promise.resolve());
}

export class mockWindowRef {
    public nativeWindow = { open: jasmine.createSpy('open') };
    getNativeWindow = jasmine.createSpy('getNativeWindow').and.returnValue(this.nativeWindow);
}

export class mockProvManager {
    activityTypes = [];
    headers = {
        'x-total-count': 2,
    };
    response = {
        data: {
            activities: [{'@id': 'activity1'}, {'@id': 'activity2'}],
            entities: [{'@id': 'entity1'}]
        },
        headers: this.headers
    };
    getActivities = jasmine.createSpy('getActivities').and.returnValue(Promise.resolve(this.response));
}

export class mockPropertyManager {
    defaultAnnotations = [];
    owlAnnotations = [];
    skosAnnotations = [];
    ontologyProperties = [];
    conceptSchemeRelationshipList = [];
    conceptRelationshipList = [];
    schemeRelationshipList = [];
    defaultDatatypes = [];
    getValuesKey = jasmine.createSpy('getValuesKey').and.returnValue('');
    getDefaultAnnotations = jasmine.createSpy('getDefaultAnnotations').and.returnValue([]);
    remove = jasmine.createSpy('remove');
    addValue = jasmine.createSpy('addValue');
    addId = jasmine.createSpy('addId');
    editValue = jasmine.createSpy('editValue');
    editId = jasmine.createSpy('editId');
    createValueObj = jasmine.createSpy('createValueObj').and.returnValue({});
    create = jasmine.createSpy('create').and.returnValue(Promise.resolve({}));
    getDatatypeMap = jasmine.createSpy('getDatatypeMap').and.returnValue({});
}

export class mockUtil {
    getBeautifulIRI = jasmine.createSpy('getBeautifulIRI').and.callFake(identity);
    getPropertyValue = jasmine.createSpy('getPropertyValue').and.returnValue('');
    setPropertyValue = jasmine.createSpy('setPropertyValue').and.returnValue({});
    hasPropertyValue = jasmine.createSpy('hasPropertyValue').and.returnValue(false);
    removePropertyValue = jasmine.createSpy('removePropertyValue');
    replacePropertyValue = jasmine.createSpy('replacePropertyValue');
    setPropertyId = jasmine.createSpy('setPropertyId').and.returnValue({});
    getPropertyId = jasmine.createSpy('getPropertyId').and.returnValue('');
    hasPropertyId = jasmine.createSpy('hasPropertyId').and.returnValue(false);
    removePropertyId = jasmine.createSpy('removePropertyId');
    replacePropertyId = jasmine.createSpy('replacePropertyId');
    getDctermsValue = jasmine.createSpy('getDctermsValue').and.returnValue('');
    removeDctermsValue = jasmine.createSpy('removeDctermsValue');
    setDctermsValue = jasmine.createSpy('setDctermsValue').and.returnValue({});
    updateDctermsValue = jasmine.createSpy('updateDctermsValue').and.returnValue({});
    mergingArrays = jasmine.createSpy('mergingArrays');
    getDctermsId = jasmine.createSpy('getDctermsId').and.returnValue('');
    parseLinks = jasmine.createSpy('parseLinks').and.returnValue({});
    createErrorToast = jasmine.createSpy('createErrorToast').and.returnValue({});
    createSuccessToast = jasmine.createSpy('createSuccessToast');
    createWarningToast = jasmine.createSpy('createWarningToast');
    clearToast =  jasmine.createSpy('clearToast');
    createJson = jasmine.createSpy('createJson').and.returnValue({});
    getIRINamespace = jasmine.createSpy('getIRINamespace').and.returnValue('');
    getIRILocalName = jasmine.createSpy('getIRILocalName').and.returnValue('');
    getDate = jasmine.createSpy('getDate').and.returnValue(new Date());
    condenseCommitId = jasmine.createSpy('condenseCommitId');
    paginatedConfigToParams = jasmine.createSpy('paginatedConfigToParams').and.returnValue({});
    onError = jasmine.createSpy('onError').and.callFake((error, deferred) => {
        deferred.reject(get(error, 'statusText', ''));
    });
    getErrorMessage = jasmine.createSpy('getErrorMessage').and.returnValue('');
    getResultsPage = jasmine.createSpy('getResultsPage').and.returnValue(Promise.resolve({}));
    getChangesById = jasmine.createSpy('getChangesById');
    getPredicatesAndObjects = jasmine.createSpy('getPredicatesAndObjects');
    getPredicateLocalName = jasmine.createSpy('getPredicateLocalName');
    getPredicateLocalNameOrdered = jasmine.createSpy('getPredicateLocalNameOrdered').and.returnValue([]);
    getIdForBlankNode = jasmine.createSpy('getIdForBlankNode').and.returnValue('');
    getSkolemizedIRI = jasmine.createSpy('getSkolemizedIRI').and.returnValue('');
    getInputType = jasmine.createSpy('getInputType').and.returnValue('');
    getPattern = jasmine.createSpy('getPattern').and.returnValue(/[a-zA-Z]/);
    startDownload = jasmine.createSpy('startDownload');
    rejectError = jasmine.createSpy('rejectError').and.callFake(() => Promise.reject(''));
    rejectErrorObject = jasmine.createSpy('rejectError').and.callFake(() => Promise.reject(''));
    getObjIrisFromDifference = jasmine.createSpy('getObjIrisFromDifference').and.returnValue('');
}

export class mockSettingManager {
    prefSettingType = { iri: `http://mobitest.com/Preference`, userText: 'Preferences'};
    appSettingType = { iri: `http://mobitest.com/ApplicationSetting`, userText: 'Application Settings'};
    getDefaultNamespace = jasmine.createSpy('getDefaultNamespace').and.returnValue(Promise.resolve(''));
    getApplicationSettings = jasmine.createSpy('getApplicationSettings').and.returnValue(Promise.resolve(''));
    getSettings = jasmine.createSpy('getSettings').and.returnValue(Promise.resolve([]));
    getApplicationSettingByType = jasmine.createSpy('getApplicationSettingByType').and.returnValue(Promise.resolve(''));
    getUserPreferenceByType = jasmine.createSpy('getUserPreferenceByType').and.returnValue(Promise.resolve(''));
    getSettingByType = jasmine.createSpy('getSettingByType').and.returnValue(Promise.resolve(''));
    updateUserPreference = jasmine.createSpy('updateUserPreference').and.returnValue(Promise.resolve(''));
    updateApplicationSetting = jasmine.createSpy('updateApplicationSetting').and.returnValue(Promise.resolve(''));
    updateSetting = jasmine.createSpy('updateSetting').and.returnValue(Promise.resolve(''));
    createUserPreference = jasmine.createSpy('createUserPreference').and.returnValue(Promise.resolve(''));
    createApplicationSetting = jasmine.createSpy('createApplicationSetting').and.returnValue(Promise.resolve(''));
    createSetting = jasmine.createSpy('createSetting').and.returnValue(Promise.resolve(''));
    getSettingGroups = jasmine.createSpy('getSettingGroups').and.returnValue(Promise.resolve(''));
    getPreferenceGroups = jasmine.createSpy('getPreferenceGroups').and.returnValue(Promise.resolve(''));
    getApplicationSettingGroups = jasmine.createSpy('getApplicationSettingGroups').and.returnValue(Promise.resolve(''));
    getPreferenceDefinitions = jasmine.createSpy('getPreferenceDefinitions').and.returnValue(Promise.resolve(''));
    getApplicationSettingDefinitions = jasmine.createSpy('getApplicationSettingDefinitions').and.returnValue(Promise.resolve(''));
    getSettingDefinitions = jasmine.createSpy('getSettingDefinitions').and.returnValue(Promise.resolve(''));
}

export class mockModal {
    openModal = jasmine.createSpy('openModal');
    openConfirmModal = jasmine.createSpy('openConfirmModal');
}

export class mockHttpService {
    pending = [];
    isPending = jasmine.createSpy('isPending');
    cancel = jasmine.createSpy('cancel');
    get = jasmine.createSpy('get');
    post = jasmine.createSpy('post');
}

export class mockOntologyState {
    recordIdToClose = 'recordIdToClose';
    annotationSelect = 'select';
    annotationValue = 'value';
    annotationType = {namespace: '', localName: ''};
    key = 'key';
    index = 0;
    annotationIndex = 0;
    listItem = {
        selected: {
            '@id': 'id'
        },
        selectedBlankNodes: [],
        active: true,
        upToDate: true,
        isVocabulary: false,
        editorTabStates: {
           project: {
               active: true,
               entityIRI: '',
               targetedSpinnerId: 'project'
           },
           overview: {
               active: false,
               searchText: '',
               open: {},
               targetedSpinnerId: 'overview'
           },
           classes: {
               active: false,
               searchText: '',
               index: 0,
               open: {},
               targetedSpinnerId: 'classes'
           },
           properties: {
               active: false,
               searchText: '',
               index: 0,
               open: {},
               targetedSpinnerId: 'properties'
           },
           individuals: {
               active: false,
               searchText: '',
               index: 0,
               open: {},
               targetedSpinnerId: 'individuals'
           },
           concepts: {
               active: false,
               searchText: '',
               index: 0,
               open: {},
               targetedSpinnerId: 'concepts'
           },
           schemes: {
               active: false,
               searchText: '',
               index: 0,
               open: {},
               targetedSpinnerId: 'schemes'
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
        },
        userBranch: false,
        createdFromExists: true,
        userCanModify: false,
        userCanModifyMaster: false,
        masterBranchIRI: '',
        ontologyRecord: {
            title: '',
            recordId: '',
            branchId: '',
            commitId: ''
        },
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
        objectProperties: {
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
        ontologyId: 'ontologyId',
        additions: [],
        deletions: [],
        inProgressCommit: {
            additions: [],
            deletions: []
        },
        branches: [],
        tags: [],
        ontology: [{
            '@id': 'id'
        }],
        individualsParentPath: [],
        classesAndIndividuals: {},
        classesWithIndividuals: [],
        importedOntologies: [],
        importedOntologyIds: [],
        iriList: [],
        failedImports: [],
        goTo: {
            entityIRI: '',
            active: false
        }
    };
    states = [];
    list = [];
    uploadList = [];
    initialize = jasmine.createSpy('initialize');
    reset = jasmine.createSpy('reset');
    getOntologyCatalogDetails = jasmine.createSpy('getOntologyCatalogDetails').and.returnValue({});
    createOntology = jasmine.createSpy('createOntology').and.returnValue(Promise.resolve({}));
    uploadThenGet = jasmine.createSpy('uploadThenGet').and.returnValue(Promise.resolve(''));
    uploadChanges = jasmine.createSpy('uploadChanges').and.returnValue(Promise.resolve(''));
    updateOntology = jasmine.createSpy('updateOntology');
    updateOntologyWithCommit = jasmine.createSpy('updateOntologyWithCommit');
    addOntologyToList = jasmine.createSpy('addOntologyToList').and.returnValue(Promise.resolve([]));
    createOntologyListItem = jasmine.createSpy('createOntologyListItem').and.returnValue(Promise.resolve([]));
    addEntity = jasmine.createSpy('addEntity');
    removeEntity = jasmine.createSpy('removeEntity');
    getListItemByRecordId = jasmine.createSpy('getListItemByRecordId').and.returnValue({});
    getEntityByRecordId = jasmine.createSpy('getEntityByRecordId');
    getEntity = jasmine.createSpy('getEntity').and.returnValue(Promise.resolve([]));
    getEntityNoBlankNodes = jasmine.createSpy('getEntityNoBlankNodes').and.returnValue(Promise.resolve({}));
    existsInListItem = jasmine.createSpy('existsInListItem').and.returnValue(true);
    getFromListItem = jasmine.createSpy('getFromListItem').and.returnValue({});
    getOntologyByRecordId = jasmine.createSpy('getOntologyByRecordId');
    getEntityNameByListItem = jasmine.createSpy('getEntityNameByListItem');
    saveChanges = jasmine.createSpy('saveChanges').and.returnValue(Promise.resolve({}));
    addToAdditions = jasmine.createSpy('addToAdditions');
    addToDeletions = jasmine.createSpy('addToDeletions');
    openOntology = jasmine.createSpy('openOntology').and.returnValue(Promise.resolve({}));
    closeOntology = jasmine.createSpy('closeOntology');
    removeBranch = jasmine.createSpy('removeBranch');
    afterSave = jasmine.createSpy('afterSave').and.returnValue(Promise.resolve([]));
    clearInProgressCommit = jasmine.createSpy('clearInProgressCommit');
    setNoDomainsOpened = jasmine.createSpy('setNoDomainsOpened');
    getNoDomainsOpened = jasmine.createSpy('getNoDomainsOpened').and.returnValue(true);
    getUnsavedEntities = jasmine.createSpy('getUnsavedEntities');
    getDataPropertiesOpened = jasmine.createSpy('getDataPropertiesOpened');
    setDataPropertiesOpened = jasmine.createSpy('setDataPropertiesOpened');
    getObjectPropertiesOpened = jasmine.createSpy('getObjectPropertiesOpened');
    setObjectPropertiesOpened = jasmine.createSpy('setObjectPropertiesOpened');
    getAnnotationPropertiesOpened = jasmine.createSpy('getAnnotationPropertiesOpened');
    setAnnotationPropertiesOpened = jasmine.createSpy('setAnnotationPropertiesOpened');
    onEdit = jasmine.createSpy('onEdit');
    setCommonIriParts = jasmine.createSpy('setCommonIriParts');
    setSelected = jasmine.createSpy('setSelected');
    setEntityUsages = jasmine.createSpy('setEntityUsages');
    resetStateTabs = jasmine.createSpy('resetStateTabs');
    getActiveKey = jasmine.createSpy('getActiveKey').and.returnValue('');
    getActivePage = jasmine.createSpy('getActivePage').and.returnValue({});
    getActiveEntityIRI = jasmine.createSpy('getActiveEntityIRI');
    selectItem = jasmine.createSpy('selectItem').and.returnValue(Promise.resolve());
    unSelectItem = jasmine.createSpy('unSelectItem');
    hasChanges = jasmine.createSpy('hasChanges').and.returnValue(true);
    isCommittable = jasmine.createSpy('isCommittable');
    updateIsSaved = jasmine.createSpy('updateIsSaved');
    addEntityToHierarchy = jasmine.createSpy('addEntityToHierarchy');
    deleteEntityFromParentInHierarchy = jasmine.createSpy('deleteEntityFromParentInHierarchy');
    deleteEntityFromHierarchy = jasmine.createSpy('deleteEntityFromHierarchy');
    joinPath = jasmine.createSpy('joinPath').and.returnValue('');
    getPathsTo = jasmine.createSpy('getPathsTo');
    goTo = jasmine.createSpy('goTo');
    openAt = jasmine.createSpy('openAt');
    getDefaultPrefix = jasmine.createSpy('getDefaultPrefix');
    retrieveClassesWithIndividuals = jasmine.createSpy('retrieveClassesWithIndividuals');
    getIndividualsParentPath = jasmine.createSpy('getIndividualsParentPath');
    setVocabularyStuff = jasmine.createSpy('setVocabularyStuff');
    flattenHierarchy = jasmine.createSpy('flattenHierarchy');
    areParentsOpen = jasmine.createSpy('areParentsOpen');
    createFlatEverythingTree = jasmine.createSpy('createFlatEverythingTree');
    createFlatIndividualTree = jasmine.createSpy('createFlatIndividualTree');
    updatePropertyIcon = jasmine.createSpy('updatePropertyIcon');
    isDerivedConcept = jasmine.createSpy('isDerivedConcept');
    isDerivedConceptScheme = jasmine.createSpy('isDerivedConceptScheme');
    hasInProgressCommit = jasmine.createSpy('hasInProgressCommit').and.returnValue(false);
    addToClassIRIs = jasmine.createSpy('addToClassIRIs');
    removeFromClassIRIs = jasmine.createSpy('removeFromClassIRIs');
    addErrorToUploadItem = jasmine.createSpy('addErrorToUploadItem');
    attemptMerge = jasmine.createSpy('attemptMerge').and.returnValue(Promise.resolve());
    checkConflicts = jasmine.createSpy('checkConflicts').and.returnValue(Promise.resolve());
    merge = jasmine.createSpy('merge').and.returnValue(Promise.resolve());
    cancelMerge = jasmine.createSpy('cancelMerge');
    canModify = jasmine.createSpy('canModify');
    createOntologyState = jasmine.createSpy('createOntologyState').and.returnValue(Promise.resolve());
    getOntologyStateByRecordId = jasmine.createSpy('getOntologyStateByRecordId').and.returnValue({});
    updateOntologyState = jasmine.createSpy('updateOntologyState').and.returnValue(Promise.resolve());
    deleteOntologyBranchState = jasmine.createSpy('deleteOntologyBranchState').and.returnValue(Promise.resolve());
    deleteOntologyState = jasmine.createSpy('deleteOntologyState').and.returnValue(Promise.resolve());
    getCurrentStateByRecordId = jasmine.createSpy('getCurrentStateByRecordId').and.returnValue({});
    getCurrentStateIdByRecordId = jasmine.createSpy('getCurrentStateIdByRecordId').and.returnValue('');
    getCurrentStateId = jasmine.createSpy('getCurrentStateId').and.returnValue('');
    getCurrentState = jasmine.createSpy('getCurrentState').and.returnValue({});
    collapseFlatLists = jasmine.createSpy('collapseFlatLists');
    recalculateJoinedPaths = jasmine.createSpy('recalculateJoinedPaths');
    isStateTag = jasmine.createSpy('isStateTag').and.returnValue(false);
    isStateBranch = jasmine.createSpy('isStateBranch').and.returnValue(false);
    isImported = jasmine.createSpy('isImported').and.returnValue(false);
    isSelectedImported = jasmine.createSpy('isSelectedImported').and.returnValue(false);
    handleNewProperty = jasmine.createSpy('handleNewProperty');
    handleDeletedProperty = jasmine.createSpy('handleDeletedProperty');
    addPropertyToClasses = jasmine.createSpy('addPropertyToClasses');
    handleDeletedClass = jasmine.createSpy('handleDeletedClass');
    removePropertyFromClass = jasmine.createSpy('removePropertyFromClass');
    getBnodeIndex = jasmine.createSpy('getBnodeIndex');
}

export class mockOntologyManager {
    ontologyRecords = [];
    entityNameProps = [];
    reset = jasmine.createSpy('reset');
    initialize = jasmine.createSpy('initialize');
    uploadOntology = jasmine.createSpy('uploadOntology');
    getOntology = jasmine.createSpy('getOntology').and.returnValue(Promise.resolve());
    getVocabularyStuff = jasmine.createSpy('getVocabularyStuff').and.returnValue(Promise.resolve());
    getOntologyStuff = jasmine.createSpy('getOntologyStuff').and.returnValue(Promise.resolve());
    getIris = jasmine.createSpy('getIris').and.returnValue(Promise.resolve());
    getImportedIris = jasmine.createSpy('getImportedIris').and.returnValue(Promise.resolve());
    getClassHierarchies = jasmine.createSpy('getClassHierarchies').and.returnValue(Promise.resolve());
    getClassesWithIndividuals = jasmine.createSpy('getClassesWithIndividuals').and.returnValue(Promise.resolve());
    getDataPropertyHierarchies = jasmine.createSpy('getDataPropertyHierarchies').and.returnValue(Promise.resolve());
    getObjectPropertyHierarchies = jasmine.createSpy('getObjectPropertyHierarchies').and.returnValue(Promise.resolve());
    getConceptHierarchies = jasmine.createSpy('getConceptHierarchies').and.returnValue(Promise.resolve());
    getConceptSchemeHierarchies = jasmine.createSpy('getConceptSchemeHierarchies').and.returnValue(Promise.resolve());
    getImportedOntologies = jasmine.createSpy('getImportedOntologies').and.returnValue(Promise.resolve());
    getEntityUsages = jasmine.createSpy('getEntityUsages').and.returnValue(Promise.resolve());
    getOntologyEntityNames = jasmine.createSpy('getOntologyEntityNames').and.returnValue(Promise.resolve());
    getPropertyToRange = jasmine.createSpy('getPropertyToRange').and.returnValue(Promise.resolve());
    getSearchResults = jasmine.createSpy('getSearchResults');
    getQueryResults = jasmine.createSpy('getQueryResults').and.returnValue(Promise.resolve());
    getEntityAndBlankNodes = jasmine.createSpy('getEntityAndBlankNodes').and.returnValue(Promise.resolve());
    isDeprecated = jasmine.createSpy('isDeprecated');
    isOntology = jasmine.createSpy('isOntology');
    isOntologyRecord = jasmine.createSpy('isOntologyRecord');
    hasOntologyEntity = jasmine.createSpy('hasOntologyEntity');
    getOntologyEntity = jasmine.createSpy('getOntologyEntity').and.returnValue({});
    getOntologyIRI = jasmine.createSpy('getOntologyIRI').and.returnValue('');
    isDatatype = jasmine.createSpy('isDatatype');
    isClass = jasmine.createSpy('isClass');
    hasClasses = jasmine.createSpy('hasClasses').and.returnValue(true);
    getClasses = jasmine.createSpy('getClasses').and.returnValue([]);
    getClassIRIs = jasmine.createSpy('getClassIRIs').and.returnValue([]);
    getClassProperties = jasmine.createSpy('getClassProperties').and.returnValue([]);
    getClassPropertyIRIs = jasmine.createSpy('getClassPropertyIRIs').and.returnValue([]);
    getClassProperty = jasmine.createSpy('getClassProperty').and.returnValue({});
    getOntologyClasses = jasmine.createSpy('getOntologyClasses').and.returnValue(Promise.resolve());
    retrieveClasses = jasmine.createSpy('retrieveClasses').and.returnValue(Promise.resolve());

    getOntologyById = jasmine.createSpy('getOntologyById').and.returnValue([]);
    isObjectProperty = jasmine.createSpy('isObjectProperty');
    hasObjectProperties = jasmine.createSpy('hasObjectProperties').and.returnValue(true);
    getObjectProperties = jasmine.createSpy('getObjectProperties').and.returnValue([]);
    getObjectPropertyIRIs = jasmine.createSpy('getObjectPropertyIRIs').and.returnValue([]);
    isDataTypeProperty = jasmine.createSpy('isDataTypeProperty');
    hasDataTypeProperties = jasmine.createSpy('hasDataTypeProperties').and.returnValue(true);
    getDataTypeProperties = jasmine.createSpy('getDataTypeProperties').and.returnValue([]);
    getDataTypePropertyIRIs = jasmine.createSpy('getDataTypePropertyIRIs').and.returnValue([]);
    isProperty = jasmine.createSpy('isProperty').and.returnValue(true);
    hasNoDomainProperties = jasmine.createSpy('hasNoDomainProperties').and.returnValue(true);
    getNoDomainProperties = jasmine.createSpy('getNoDomainProperties').and.returnValue([]);
    getNoDomainPropertyIRIs = jasmine.createSpy('getNoDomainPropertyIRIs').and.returnValue([]);
    isAnnotation = jasmine.createSpy('isAnnotation');
    hasAnnotations = jasmine.createSpy('hasAnnotations').and.returnValue(true);
    getAnnotations = jasmine.createSpy('getAnnotations').and.returnValue([]);
    getAnnotationIRIs = jasmine.createSpy('getAnnotationIRIs').and.returnValue([]);
    isIndividual = jasmine.createSpy('isIndividual').and.returnValue(true);
    hasIndividuals = jasmine.createSpy('hasIndividuals').and.returnValue(true);
    getIndividuals = jasmine.createSpy('getIndividuals').and.returnValue([]);
    hasNoTypeIndividuals = jasmine.createSpy('hasIndividuals').and.returnValue(true);
    getNoTypeIndividuals = jasmine.createSpy('getIndividuals').and.returnValue([]);
    hasClassIndividuals = jasmine.createSpy('hasClassIndividuals').and.returnValue(true);
    getClassIndividuals = jasmine.createSpy('getClassIndividuals').and.returnValue([]);
    isRestriction = jasmine.createSpy('isRestriction').and.returnValue(true);
    getRestrictions = jasmine.createSpy('getRestrictions').and.returnValue([]);
    isBlankNode = jasmine.createSpy('isBlankNode').and.returnValue(true);
    isBlankNodeId = jasmine.createSpy('isBlankNodeId').and.returnValue(false);
    getBlankNodes = jasmine.createSpy('getBlankNodes').and.returnValue([]);
    getEntity = jasmine.createSpy('getEntity').and.returnValue({});
    getEntityName = jasmine.createSpy('getEntityName').and.callFake((ontology, entity) => has(entity, '@id') ? entity['@id'] : '');
    getEntityNames = jasmine.createSpy('getEntityNames').and.callFake((ontology, entity) => has(entity, '@id') ? [entity['@id']] : ['']);
    getEntityDescription = jasmine.createSpy('getEntityDescription').and.returnValue('');
    isConcept = jasmine.createSpy('isConcept').and.returnValue(true);
    hasConcepts = jasmine.createSpy('hasConcepts').and.returnValue(true);
    getConcepts = jasmine.createSpy('getConcepts').and.returnValue([]);
    getConceptIRIs = jasmine.createSpy('getConceptIRIs').and.returnValue([]);
    isConceptScheme = jasmine.createSpy('isConceptScheme').and.returnValue(true);
    hasConceptSchemes = jasmine.createSpy('hasConceptSchemes').and.returnValue(true);
    getConceptSchemes = jasmine.createSpy('getConceptSchemes').and.returnValue([]);
    getConceptSchemeIRIs = jasmine.createSpy('getConceptSchemeIRIs').and.returnValue([]);
    downloadOntology = jasmine.createSpy('downloadOntology');
    deleteOntology = jasmine.createSpy('deleteOntology').and.returnValue(Promise.resolve());
    deleteOntologyBranch = jasmine.createSpy('deleteOntologyBranch').and.returnValue(Promise.resolve());
    getAnnotationPropertyHierarchies = jasmine.createSpy('getAnnotationPropertyHierarchies');
    uploadChangesFile = jasmine.createSpy('uploadChangesFile').and.returnValue(Promise.resolve());
    getFailedImports = jasmine.createSpy('getFailedImports').and.returnValue(Promise.resolve());
    getDataProperties = jasmine.createSpy('getDataProperties').and.returnValue(Promise.resolve());
    getObjProperties = jasmine.createSpy('getObjProperties').and.returnValue(Promise.resolve());
}

export class mockPolicyEnforcement {
    permit = 'Permit';
    deny = 'Deny';
    indeterminate = 'Indeterminate';
    evaluateRequest = jasmine.createSpy('evaulateRequest').and.returnValue(Promise.resolve());
    evaluateMultiDecisionRequest = jasmine.createSpy('evaulateMultiDecisionRequest').and.returnValue(Promise.resolve());
}
export class mockRecordPermissionsManager {
    getRecordPolicy = jasmine.createSpy('getRecordPolicy').and.returnValue(Promise.resolve({}));
    updateRecordPolicy = jasmine.createSpy('getRecordPolicy').and.returnValue(Promise.resolve());
}
export class MockOntologyVisualizationService {
    ERROR_MESSAGE: "ERROR_MESSAGE_1";
    IN_PROGRESS_COMMIT_MESSAGE: "IN_PROGRESS_COMMIT_MESSAGE_2";
    NO_CLASS_MESSAGE: "NO_CLASS_MESSAGE";
    spinnerId: 'ontology-visualization';
    DEFAULT_NODE_LIMIT: 100;

    public get graphStateCache(): Map<string, GraphState> {
       return jasmine.createSpyObj('graphStateCache',['get'], {
           get: jasmine.createSpy('get').and.callThrough(),
           has: jasmine.createSpy('has').and.returnValue(true)
       });
    }

    _sidePanelActionSubjectSubscription = jasmine.createSpyObj('Subscription', {
        'unsubscribe': jasmine.createSpy('Unsubscribe')
    })
    _sidePanelActionSubjectObservable = jasmine.createSpyObj('Observable', {
        'subscribe': this._sidePanelActionSubjectSubscription
    })
    sidePanelActionSubject$ = jasmine.createSpyObj('sidePanelActionSubject$', {
        'asObservable': this._sidePanelActionSubjectObservable,
        'next': jasmine.createSpy('next')
    });
    init = jasmine.createSpy('init').and.returnValue(new Observable<GraphState>( observer => {
            observer.complete();
        })
    );
    getOntologyNetworkObservable(): Observable<any> {
        throw new Error('getOntologyNetworkObservable not implemented.');
    }
    getOntologyLocalObservable(): Observable<any> {
        throw new Error('getOntologyLocalObservable not implemented.');
    }
    buildGraphData(commitGraphState: GraphState, hasInProgress: boolean): Observable<GraphState> {
        throw new Error('buildGraphData not implemented.');
    }
    buildGraph(classParentMap: any, childIris: any, entityInfo: any, classMap: any, ranges: any, hasInProgressCommit: boolean, localNodeLimit: number): { graphNodes: StateNode[]; graphEdges: StateEdge[]; allGraphNodes: ControlRecordI[]; } {
        throw new Error('buildGraph not implemented.');
    }
    getGraphState(commitId: string, error?: boolean): GraphState {
        throw new Error('getGraphState not implemented.');
    }
    getPropertyLabel: (propertyIri: any, entityInfo: any, hasInProgressCommit: any) => string;

    getGraphData = jasmine.createSpy('getGraphData').and.returnValue([
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza',
                'weight': 0,
                'name': 'Pizza'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        },
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
                'weight': 0,
                'name': 'CoberturaDeVegetais'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        },
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'weight': 0,
                'name': 'CoberturaDeTomate'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        },
        {
            'position': {},
            'group': 'edges',
            'removed': false,
            'selected': false,
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'source': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping',
                'target': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping',
                'arrow': 'triangle',
                'weight': 0
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping'
        },
        {
            'selectable': true,
            'locked': false,
            'grabbed': false,
            'grabbable': true,
            'data': {
                'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping',
                'idInt': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping',
                'weight': 0,
                'name': 'CoberturaDePimentaoDoce'
            },
            'id': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping',
            'group': 'nodes',
            'ontologyId': 'http://www.co-ode.org/ontologies/pizza/pizza.owl'
        }
    ]);

}

export class mockPolicyManager {
    actionCreate = 'create';
    actionRead = 'read';
    actionUpdate = 'update';
    actionDelete = 'delete';
    subjectId = 'subjectId';
    resourceId = 'resourceId';
    actionId = 'actionId';
    subjectCategory = 'actionCategory';
    resourceCategory = 'resourceCategory';
    actionCategory = 'actionCategory';
    stringEqual = 'stringEqual';
    getPolicies = jasmine.createSpy('getPolicies').and.returnValue(Promise.resolve([]));
    getPolicy = jasmine.createSpy('getPolicy').and.returnValue(Promise.resolve({}));
    updatePolicy = jasmine.createSpy('updatePolicy').and.returnValue(Promise.resolve());
}

export class mockStateManager {
    states = [];
    initialize = jasmine.createSpy('initialize');
    getStates = jasmine.createSpy('getStates').and.returnValue(Promise.resolve());
    createState = jasmine.createSpy('createState').and.returnValue(Promise.resolve());
    getState = jasmine.createSpy('getState').and.returnValue(Promise.resolve());
    updateState = jasmine.createSpy('updateState').and.returnValue(Promise.resolve());
    deleteState = jasmine.createSpy('deleteState').and.returnValue(Promise.resolve());
}

export class mockShapesGraphManager {
    createShapesGraphRecord = jasmine.createSpy('createShapesGraphRecord').and.returnValue(Promise.resolve());
    deleteShapesGraphRecord = jasmine.createSpy('deleteShapesGraphRecord').and.returnValue(Promise.resolve());
    getShapesGraphMetadata = jasmine.createSpy('getShapesGraphMetadata').and.returnValue(Promise.resolve());
    getShapesGraphIRI = jasmine.createSpy('getShapesGraphIRI').and.returnValue(Promise.resolve());
    getShapesGraphContent = jasmine.createSpy('getShapesGraphContent').and.returnValue(Promise.resolve());
}