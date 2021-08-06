/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

export function cleanStylesFromDOM(): void {
    const head: HTMLHeadElement = document.getElementsByTagName('head')[0];
    const styles: HTMLCollectionOf<HTMLStyleElement> | [] = head.getElementsByTagName('style');

    for (let i: number = 0; i < styles.length; i++) {
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
    getIdForBlankNode = jasmine.createSpy('getIdForBlankNode').and.returnValue('');
    getSkolemizedIRI = jasmine.createSpy('getSkolemizedIRI').and.returnValue('');
    getInputType = jasmine.createSpy('getInputType').and.returnValue('');
    getPattern = jasmine.createSpy('getPattern').and.returnValue(/[a-zA-Z]/);
    startDownload = jasmine.createSpy('startDownload');
}

export class mockPreferenceManager {
    getUserPreferences = jasmine.createSpy('getUserPreferences').and.returnValue(Promise.resolve(''));
    updateUserPreference = jasmine.createSpy('updateUserPreference').and.returnValue(Promise.resolve(''));
    createUserPreference = jasmine.createSpy('createUserPreference').and.returnValue(Promise.resolve(''));
    getPreferenceGroups = jasmine.createSpy('getPreferenceGroups').and.returnValue(Promise.resolve(''));
    getPreferenceDefinitions = jasmine.createSpy('getPreferenceDefinitions').and.returnValue(Promise.resolve(''));
}

export class mockPrefixes {
    owl = '';
    delim = '';
    data = '';
    mappings = '';
    rdfs = 'rdfs:';
    dc = 'dc:';
    dcterms = 'dcterms:';
    rdf = 'rdf:';
    ontologyState = 'ontologyState:';
    catalog = 'catalog:';
    skos = 'skos:';
    xsd = 'xsd:';
    ontologyEditor = 'ontEdit:';
    dataset = 'dataset:';
    matprov = 'matprov:';
    prov = 'prov:';
    mergereq = 'mergereq:';
    user = 'user:';
    policy = 'policy:';
    roles = "roles:";
    foaf = "foaf:";
    shacl = "shacl:";
    preference = "preference:";
}

export class mockHttpService {
    pending = [];
    isPending = jasmine.createSpy('isPending');
    cancel = jasmine.createSpy('cancel');
    get = jasmine.createSpy('get');
    post = jasmine.createSpy('post');
}

export class mockUserManager {
    users = [];
    groups = [];
    reset = jasmine.createSpy('reset');
    initialize = jasmine.createSpy('initialize');
    getUsername = jasmine.createSpy('getUsername').and.returnValue(Promise.resolve(''));
    setUsers = jasmine.createSpy('setUsers').and.returnValue(Promise.resolve());
    setGroups = jasmine.createSpy('setGroups').and.returnValue(Promise.resolve());
    addUser = jasmine.createSpy('addUser').and.returnValue(Promise.resolve());
    getUser = jasmine.createSpy('getUser').and.returnValue(Promise.resolve());
    updateUser = jasmine.createSpy('updateUser').and.returnValue(Promise.resolve());
    changePassword = jasmine.createSpy('changePassword').and.returnValue(Promise.resolve());
    resetPassword = jasmine.createSpy('resetPassword').and.returnValue(Promise.resolve());
    deleteUser = jasmine.createSpy('deleteUser').and.returnValue(Promise.resolve());
    addUserRoles = jasmine.createSpy('addUserRoles').and.returnValue(Promise.resolve());
    deleteUserRole = jasmine.createSpy('deleteUserRole').and.returnValue(Promise.resolve());
    addUserGroup = jasmine.createSpy('addUserGroup').and.returnValue(Promise.resolve());
    deleteUserGroup = jasmine.createSpy('deleteUserGroup').and.returnValue(Promise.resolve());
    addGroup = jasmine.createSpy('addGroup').and.returnValue(Promise.resolve());
    getGroup = jasmine.createSpy('getGroup').and.returnValue(Promise.resolve());
    updateGroup = jasmine.createSpy('updateGroup').and.returnValue(Promise.resolve());
    deleteGroup = jasmine.createSpy('deleteGroup').and.returnValue(Promise.resolve());
    addGroupRoles = jasmine.createSpy('addGroupRoles').and.returnValue(Promise.resolve());
    deleteGroupRole = jasmine.createSpy('deleteGroupRole').and.returnValue(Promise.resolve());
    getGroupUsers = jasmine.createSpy('getGroupUsers').and.returnValue(Promise.resolve([]));
    addGroupUsers = jasmine.createSpy('addGroupUsers').and.returnValue(Promise.resolve());
    deleteGroupUser = jasmine.createSpy('deleteGroupUser').and.returnValue(Promise.resolve());
    getUserObj = jasmine.createSpy('getUserObj').and.returnValue({});
    getGroupObj = jasmine.createSpy('getGroupObj').and.returnValue({});
    isAdmin = jasmine.createSpy('isAdmin');
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

export class mockDiscoverState {
    explore = {
        active: true,
        breadcrumbs: ['Classes'],
        classDetails: [],
        classId: '',
        creating: false,
        editing: false,
        instance: {
            changed: [],
            entity: [{}],
            metadata: {},
            original: []
        },
        instanceDetails: {
            currentPage: 1,
            data: [],
            limit: 99,
            links: {
                next: '',
                prev: ''
            },
            total: 0
        },
        recordId: ''
    };
    query = {
        active: false
    };
    search = {
        active: false,
        datasetRecordId: '',
        filterMeta: [],
        noDomains: undefined,
        properties: undefined,
        queryConfig: {
            isOrKeywords: false,
            isOrTypes: false,
            keywords: [],
            types: [],
            filters: []
        },
        results: undefined,
        targetedId: 'discover-search-results'
    };
    reset = jasmine.createSpy('reset');
    resetPagedInstanceDetails = jasmine.createSpy('resetPagedInstanceDetails');
    cleanUpOnDatasetDelete = jasmine.createSpy('cleanUpOnDatasetDelete');
    cleanUpOnDatasetClear = jasmine.createSpy('cleanUpOnDatasetClear');
    clickCrumb = jasmine.createSpy('clickCrumb');
    getInstance = jasmine.createSpy('getInstance').and.returnValue({});
    resetSearchQueryConfig = jasmine.createSpy('resetSearchQueryConfig');
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
    getPropertyRange = jasmine.createSpy('getPropertyToRange').and.returnValue(Promise.resolve());
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

export class MockOntologyVisualization {
    init = jasmine.createSpy('init').and.returnValue(Promise.resolve());
    getGraphData = jasmine.createSpy('getGraphData').and.returnValue([
        {
            "selectable": true,
            "locked": false,
            "grabbed": false,
            "grabbable": true,
            "data": {
                "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza",
                "idInt": "http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza",
                "weight": 0,
                "name": "Pizza"
            },
            "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#Pizza",
            "group": "nodes",
            "ontologyId": "http://www.co-ode.org/ontologies/pizza/pizza.owl"
        },
        {
            "selectable": true,
            "locked": false,
            "grabbed": false,
            "grabbable": true,
            "data": {
                "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping",
                "idInt": "http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping",
                "weight": 0,
                "name": "CoberturaDeVegetais"
            },
            "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping",
            "group": "nodes",
            "ontologyId": "http://www.co-ode.org/ontologies/pizza/pizza.owl"
        },
        {
            "selectable": true,
            "locked": false,
            "grabbed": false,
            "grabbable": true,
            "data": {
                "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping",
                "idInt": "http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping",
                "weight": 0,
                "name": "CoberturaDeTomate"
            },
            "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping",
            "group": "nodes",
            "ontologyId": "http://www.co-ode.org/ontologies/pizza/pizza.owl"
        },
        {
            "position": {},
            "group": "edges",
            "removed": false,
            "selected": false,
            "selectable": true,
            "locked": false,
            "grabbed": false,
            "grabbable": true,
            "data": {
                "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping",
                "idInt": "http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping",
                "source": "http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping",
                "target": "http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping",
                "arrow": "triangle",
                "weight": 0
            },
            "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#VegetableTopping-http://www.co-ode.org/ontologies/pizza/pizza.owl#TomatoTopping"
        },
        {
            "selectable": true,
            "locked": false,
            "grabbed": false,
            "grabbable": true,
            "data": {
                "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping",
                "idInt": "http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping",
                "weight": 0,
                "name": "CoberturaDePimentaoDoce"
            },
            "id": "http://www.co-ode.org/ontologies/pizza/pizza.owl#SweetPepperTopping",
            "group": "nodes",
            "ontologyId": "http://www.co-ode.org/ontologies/pizza/pizza.owl"
        }
    ]);
    hasPositions = jasmine.createSpy('hasPositions').and.returnValue(false);
    hasInProgressCommit = jasmine.createSpy('hasInProgressCommit').and.returnValue(false);
    isOverLimit = jasmine.createSpy('isOverLimit').and.returnValue(false);
    setGraphState = jasmine.createSpy('setGraphState');
    updateGraphData = jasmine.createSpy('updateGraphData');
}