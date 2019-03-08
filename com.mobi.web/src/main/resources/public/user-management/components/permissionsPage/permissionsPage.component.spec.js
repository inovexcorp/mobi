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
describe('Permissions Page component', function() {
    var $compile, scope, $q, policyManagerSvc, catalogManagerSvc, utilSvc, userManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('user-management');
        mockCatalogManager();
        mockUtil();
        mockPrefixes();
        mockUserManager();
        mockPolicyManager();
        injectSplitIRIFilter();
        injectBeautifyFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _policyManagerService_, _catalogManagerService_, _utilService_, _userManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            policyManagerSvc = _policyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            userManagerSvc = _userManagerService_;
            prefixes = _prefixes_;
        });

        this.groupAttributeId = 'http://mobi.com/policy/prop-path(' + encodeURIComponent('^<' + prefixes.foaf + 'member' + '>') + ')';
        this.everyoneMatch = {
            AttributeDesignator: {
                AttributeId: prefixes.user + 'hasUserRole',
                Category: policyManagerSvc.subjectCategory,
                DataType: prefixes.xsd + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['http://mobi.com/roles/user'],
                otherAttributes: {},
                DataType: prefixes.xsd + 'string'
            },
            MatchId: policyManagerSvc.stringEqual
        };
        this.userMatch = {
            AttributeDesignator: {
                AttributeId: policyManagerSvc.subjectId,
                Category: policyManagerSvc.subjectCategory,
                DataType: prefixes.xsd + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['user1'],
                otherAttributes: {},
                DataType: prefixes.xsd + 'string'
            },
            MatchId: policyManagerSvc.stringEqual
        };
        this.groupMatch = {
            AttributeDesignator: {
                AttributeId: this.groupAttributeId,
                Category: policyManagerSvc.subjectCategory,
                DataType: prefixes.xsd + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['group1'],
                otherAttributes: {},
                DataType: prefixes.xsd + 'string'
            },
            MatchId: policyManagerSvc.stringEqual
        };

        userManagerSvc.users = [{iri: 'user1', username: 'user1'}, {iri: 'user2', username: 'user2'}];
        userManagerSvc.groups = [{iri: 'group1', title: 'group1'}, {iri: 'group2', title: 'group2'}];
        this.getPolicyDefer = $q.defer();
        policyManagerSvc.getPolicies.and.returnValue(this.getPolicyDefer.promise);
        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        this.element = $compile(angular.element('<permissions-page></permissions-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('permissionsPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        policyManagerSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        userManagerSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('initializes policies correctly when getPolicies', function() {
        describe('resolves', function() {
            beforeEach(function() {
                this.typePolicy = {
                    PolicyId: 'id',
                    Target: {AnyOf: [{AllOf: [{Match: [{
                        AttributeDesignator: {AttributeId: prefixes.rdf + 'type'},
                        AttributeValue: {content: ['type']}
                    }]}]}]}
                };
            });
            it('with a policy that is not for creation restriction', function() {
                var policies = [{}];
                this.getPolicyDefer.resolve(policies);
                scope.$apply();
                expect(this.controller.policies).toEqual([]);
            });
            it('with a policy that allows everyone', function() {
                var policies = [_.set(angular.copy(this.typePolicy), 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', angular.copy(this.everyoneMatch))];
                this.getPolicyDefer.resolve(policies);
                scope.$apply();
                expect(this.controller.policies).toEqual([{
                    policy: policies[0],
                    id: this.typePolicy.PolicyId,
                    type: 'type',
                    changed: false,
                    everyone: true,
                    users: userManagerSvc.users,
                    groups: userManagerSvc.groups,
                    selectedUsers: [],
                    selectedGroups: [],
                    userSearchText: '',
                    groupSearchText: '',
                    selectedUser: undefined,
                    selectedGroup: undefined
                }]);
            });
            it('with a policy that has selected users', function() {
                var policies = [_.set(angular.copy(this.typePolicy), 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', angular.copy(this.userMatch))];
                this.getPolicyDefer.resolve(policies);
                scope.$apply();
                expect(this.controller.policies).toEqual([{
                    policy: policies[0],
                    id: this.typePolicy.PolicyId,
                    type: 'type',
                    changed: false,
                    everyone: false,
                    users: _.reject(userManagerSvc.users, {iri: 'user1', username: 'user1'}),
                    groups: userManagerSvc.groups,
                    selectedUsers: [{iri: 'user1', username: 'user1'}],
                    selectedGroups: [],
                    userSearchText: '',
                    groupSearchText: '',
                    selectedUser: undefined,
                    selectedGroup: undefined
                }]);
            });
            it('with a policy that has selected groups', function() {
                var policies = [_.set(angular.copy(this.typePolicy), 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', angular.copy(this.groupMatch))];
                this.getPolicyDefer.resolve(policies);
                scope.$apply();
                expect(this.controller.policies).toEqual([{
                    policy: policies[0],
                    id: this.typePolicy.PolicyId,
                    type: 'type',
                    changed: false,
                    everyone: false,
                    users: userManagerSvc.users,
                    groups: _.reject(userManagerSvc.groups, {iri: 'group1', title: 'group1'}),
                    selectedUsers: [],
                    selectedGroups: [{iri: 'group1', title: 'group1'}],
                    userSearchText: '',
                    groupSearchText: '',
                    selectedUser: undefined,
                    selectedGroup: undefined
                }]);
            });
        });
        it('rejects', function() {
            this.getPolicyDefer.reject('Error Message');
            scope.$apply();
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.policy = {
                Rule: [{Target: {AnyOf: [{AllOf: []}]}}]
            };
            this.item = {
                changed: false,
                users: userManagerSvc.users,
                groups: userManagerSvc.groups,
                selectedUsers: [],
                selectedGroups: [],
                everyone: false,
                policy: this.policy
            };
        });
        it('should update the specified policy object', function() {
            this.controller.policies = [{id: 1}, {id: 2}];
            this.controller.updatePolicy({id: 1, test: true}, 0);
            expect(this.controller.policies[0]).toEqual({id: 1, test: true, changed: true});
        });
        describe('should save changes to the policies', function() {
            beforeEach(function() {
                this.item.changed = true;
            });
            it('successfully', function() {
                this.controller.policies = [this.item];
                this.controller.saveChanges();
                scope.$apply();
                expect(policyManagerSvc.updatePolicy).toHaveBeenCalledWith(this.policy);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(this.item.changed).toEqual(false);
            });
            it('unless no policies were changed', function() {
                this.controller.saveChanges();
                scope.$apply();
                expect(policyManagerSvc.updatePolicy).not.toHaveBeenCalled();
            });
            it('unless an error occurs', function() {
                this.controller.policies = [this.item];
                policyManagerSvc.updatePolicy.and.returnValue($q.reject('Error'));
                this.controller.saveChanges();
                scope.$apply();
                expect(policyManagerSvc.updatePolicy).toHaveBeenCalledWith(this.policy);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error');
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(this.item.changed).toEqual(true);
            });
        });
        it('should determine whether there are changes to save', function() {
            expect(this.controller.hasChanges()).toEqual(false);
            this.controller.policies = [{changed: false}];
            expect(this.controller.hasChanges()).toEqual(false);
            this.controller.policies = [{changed: true}];
            expect(this.controller.hasChanges()).toEqual(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PERMISSIONS-PAGE');
            expect(this.element.querySelectorAll('.permissions-page').length).toEqual(1);
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col').length).toEqual(1);
            expect(this.element.querySelectorAll('.save-container').length).toEqual(1);
        });
        ['block', 'block-content', 'button.btn-float'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
        it('depending on how many policies there are', function() {
            expect(this.element.querySelectorAll('.policy').length).toEqual(0);

            this.controller.policies = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.policy').length).toEqual(this.controller.policies.length);
        });
    });
});