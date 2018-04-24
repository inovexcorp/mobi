/*-
 * #%L
 * com.mobi.web
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
describe('Branches Filter', function() {
    var $filter, ontologyStateSvc, utilSvc, loginManagerSvc, prefixes;

    beforeEach(function() {
        module('branchesToDisplay');
        mockLoginManager();
        mockOntologyState();
        mockUtil();
        mockPrefixes();

        inject(function(_$filter_, _ontologyStateService_, _utilService_, _loginManagerService_, _prefixes_) {
            $filter = _$filter_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            loginManagerSvc = _loginManagerService_;
            prefixes = _prefixes_;
        });

        this.baseBranch = {
            '@id': 'branch1',
            '@type': ["http://mobi.com/ontologies/catalog#Branch"],
            'http://purl.org/dc/terms/title': [{'@value': 'branch1'}]
        };

        this.userBranch1 = {
            '@id': 'user1branch1',
            '@type': ["http://mobi.com/ontologies/catalog#UserBranch"],
            'http://purl.org/dc/terms/publisher': [{'@id': 'user1'}],
            'http://mobi.com/ontologies/catalog#createdFrom': [{'@id': 'branch1'}],
            'http://purl.org/dc/terms/title': [{'@value': 'branch1'}]
        };

        this.userBranch2 = {
            '@id': 'user2branch1',
            '@type': ["http://mobi.com/ontologies/catalog#UserBranch"],
            'http://purl.org/dc/terms/publisher': [{'@id': 'user2'}],
            'http://mobi.com/ontologies/catalog#createdFrom': [{'@id': 'branch1'}],
            'http://purl.org/dc/terms/title': [{'@value': 'branch1'}]
        };

        this.normalBranch = {
            '@id': 'branch2',
            '@type': ["http://mobi.com/ontologies/catalog#Branch"],
            'http://purl.org/dc/terms/title': [{'@value': 'branch2'}]
        };

        this.branches = [this.baseBranch, this.userBranch1, this.userBranch2, this.normalBranch];
        ontologyStateSvc.isUserBranch.and.callFake(function(branch) {
            if (branch['@id'] === 'branch1') {
                return false;
            } else if (branch['@id'] === 'user1branch1') {
                return true;
            } else if (branch['@id'] === 'user2branch1') {
                return true;
            } else if (branch['@id'] === 'branch2') {
                return false;
            }
        });

        prefixes.catalog = 'http://mobi.com/ontologies/catalog#';
        prefixes.dcterms = 'http://purl.org/dc/terms/';
        utilSvc.getDctermsId.and.callFake(function(entity, property) {
            return _.get(entity, "['" + prefixes.dcterms + property + "'][0]['@id']", '');
        });
        utilSvc.getDctermsValue.and.callFake(function(entity, property) {
            return _.get(entity, "['" + prefixes.dcterms + property + "'][0]['@id']", '');
        });
        utilSvc.getPropertyId.and.callFake(function(entity, propertyIRI) {
            return _.get(entity, "['" + propertyIRI + "'][0]['@id']", '');
        });
    });

    afterEach(function() {
        $filter = null;
        ontologyStateSvc = null;
        utilSvc = null;
        loginManagerSvc = null;
        prefixes = null;
    });

    it('returns non user branches when the user does not have user branch', function() {
        loginManagerSvc.currentUserIRI = 'user3';
        var result;
        result = $filter('branchesToDisplay')(this.branches);
        expect(result.length).toBe(2);
        expect(_.some(result, {'@id': 'branch1'})).toBeTruthy();
        expect(_.some(result, {'@id': 'branch2'})).toBeTruthy();
    });
    it('returns user1branch1 and a non user branch when the user has a user branch', function() {
        loginManagerSvc.currentUserIRI = 'user1';
        var result;
        result = $filter('branchesToDisplay')(this.branches);
        expect(result.length).toBe(2);
        expect(_.some(result, {'@id': 'user1branch1'})).toBeTruthy();
        expect(_.some(result, {'@id': 'branch2'})).toBeTruthy();
    });
    it('returns user2branch1 and a non user branch when the user has a user branch', function() {
        loginManagerSvc.currentUserIRI = 'user2';
        var result;
        result = $filter('branchesToDisplay')(this.branches);
        expect(result.length).toBe(2);
        expect(_.some(result, {'@id': 'user2branch1'})).toBeTruthy();
        expect(_.some(result, {'@id': 'branch2'})).toBeTruthy();
    });
});
