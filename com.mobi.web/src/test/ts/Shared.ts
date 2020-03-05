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

import { identity, get } from 'lodash';

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
    // getActivities = jasmine.createSpy('getActivities').and.returnValue(Promise.reject('Error message'));
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
    createJson = jasmine.createSpy('createJson').and.returnValue({});
    getIRINamespace = jasmine.createSpy('getIRINamespace').and.returnValue('');
    getIRILocalName = jasmine.createSpy('getIRILocalName').and.returnValue('');
    getDate = jasmine.createSpy('getDate').and.returnValue(new Date());
    condenseCommitId = jasmine.createSpy('condenseCommitId');
    paginatedConfigToParams = jasmine.createSpy('paginatedConfigToParams').and.returnValue({});
    onError = jasmine.createSpy('onError').and.callFake((error, deferred) => {
        deferred.reject(get(error, 'statusText', ''));
    });
    // rejectError = jasmine.createSpy('rejectError').and.returnValue(Promise.reject(''));
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