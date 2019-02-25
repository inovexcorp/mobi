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
describe('User Access Controls component', function() {
    var $compile, scope, policyManagerSvc, loginManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockPolicyManager();
        mockLoginManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _policyManagerService_, _loginManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            policyManagerSvc = _policyManagerService_;
            loginManagerSvc = _loginManagerService_;
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

        this.users = [{iri: 'user1', username: 'user1'}, {iri: 'user2', username: 'user2'}];
        this.groups = [{iri: 'group1', title: 'group1'}, {iri: 'group2', title: 'group2'}];
        this.scopeItem = {selectedUsers: [this.users[0]], selectedGroups: [this.groups[0]], users: [], groups: []};
        scope.item = this.scopeItem;
        scope.updateItem = jasmine.createSpy('updateItem');
        scope.ruleTitle = '';
        scope.ruleId = '';
        this.element = $compile(angular.element('<user-access-controls item="item" update-item="updateItem(item)" rule-title="ruleTitle" rule-id="ruleId"></user-access-controls>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('userAccessControls');
        this.scope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        policyManagerSvc = null;
        loginManagerSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('item should be one way bound', function() {
            this.controller.item = {};
            scope.$digest();
            expect(scope.item).toEqual(this.scopeItem);
        });
        it('ruleTitle should be one way bound', function() {
            this.controller.ruleTitle = 'test';
            scope.$digest();
            expect(scope.ruleTitle).toEqual('');
        });
        it('ruleId should be one way bound', function() {
            this.controller.ruleId = 'test';
            scope.$digest();
            expect(scope.ruleId).toEqual('');
        });
        it('updateItem should be called in the parent scope', function() {
            this.controller.updateItem({item: this.scopeItem});
            expect(scope.updateItem).toHaveBeenCalledWith(this.scopeItem);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.policy = {
                Rule: [{Target: {AnyOf: [{AllOf: []}]}}]
            };
            this.controller.item = {
                users: this.users,
                groups: this.groups,
                selectedUsers: [],
                selectedGroups: [],
                everyone: false,
                policy: this.policy
            };
        });
        describe('should add a user to a policy', function() {
            beforeEach(function() {
                this.controller.item.selectedUser = {};
                this.controller.item.userSearchText = 'test';
                this.scope.$$childTail = {
                    userSearchText: 'test',
                    selectedUser: {}
                };
            });
            it('if the user is defined', function() {
                var user = this.users[0];
                var newMatch = _.set(angular.copy(this.userMatch), 'AttributeValue.content[0]', user.iri);
                this.controller.addUser(user);
                expect(this.controller.item.userSearchText).toEqual('');
                expect(this.controller.item.selectedUser).toBeUndefined();
                expect(this.controller.item.selectedUsers).toEqual([user]);
                expect(this.controller.item.users).toEqual(_.reject(this.users, user));
                expect(scope.updateItem).toHaveBeenCalledWith(this.controller.item);
                expect(this.scope.$$childTail).toEqual({userSearchText: '', selectedUser: undefined});
                expect(this.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([{Match: [newMatch]}]);
            });
            it('unless the user is undefined', function() {
                var copyItem = angular.copy(this.controller.item);
                var copyChildTail = angular.copy(this.scope.$$childTail);
                this.controller.addUser(undefined);
                expect(this.controller.item).toEqual(copyItem);
                expect(scope.updateItem).not.toHaveBeenCalled();
                expect(this.scope.$$childTail).toEqual(copyChildTail);
            });
        });
        it('should remove a user from a policy', function() {
            var user = this.users[0];
            var blankPolicy = angular.copy(this.policy);
            this.policy.Rule[0].Target.AnyOf[0].AllOf = [{Match: [_.set(angular.copy(this.userMatch), 'AttributeValue.content[0]', user.iri)]}];
            this.controller.item.users = _.reject(this.users, user);
            this.controller.item.selectedUsers = [user];
            this.controller.removeUser(user);
            expect(this.controller.item.selectedUsers).toEqual([]);
            expect(this.controller.item.users).toEqual(this.users);
            expect(scope.updateItem).toHaveBeenCalledWith(this.controller.item);
            expect(this.policy).toEqual(blankPolicy);
        });
        describe('should add a group to a policy', function() {
            beforeEach(function() {
                this.controller.item.selectedGroup = {};
                this.controller.item.groupSearchText = 'test';
                this.scope.$$childTail = {
                    groupSearchText: 'test',
                    selectedGroup: {}
                };
            });
            it('if the user is defined', function() {
                var group = this.groups[0];
                var newMatch = _.set(angular.copy(this.groupMatch), 'AttributeValue.content[0]', group.iri);
                this.controller.addGroup(group, this.controller.item);
                expect(this.controller.item.groupSearchText).toEqual('');
                expect(this.controller.item.selectedGroup).toBeUndefined();
                expect(this.controller.item.selectedGroups).toEqual([group]);
                expect(this.controller.item.groups).toEqual(_.reject(this.groups, group));
                expect(scope.updateItem).toHaveBeenCalledWith(this.controller.item);
                expect(this.scope.$$childTail).toEqual({groupSearchText: '', selectedGroup: undefined});
                expect(this.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([{Match: [newMatch]}]);
            });
            it('unless the user is undefined', function() {
                var copyItem = angular.copy(this.controller.item);
                var copyChildTail = angular.copy(this.scope.$$childTail);
                this.controller.addGroup(undefined, this.controller.item);
                expect(this.controller.item).toEqual(copyItem);
                expect(scope.updateItem).not.toHaveBeenCalled();
                expect(this.scope.$$childTail).toEqual(copyChildTail);
            });
        });
        it('should remove a group from a policy', function() {
            var group = this.groups[0];
            var blankPolicy = angular.copy(this.policy);
            this.policy.Rule[0].Target.AnyOf[0].AllOf = [{Match: [_.set(angular.copy(this.groupMatch), 'AttributeValue.content[0]', group.iri)]}];
            this.controller.item.groups = _.reject(this.groups, group);
            this.controller.item.selectedGroups = [group];
            this.controller.removeGroup(group, this.controller.item);
            expect(this.controller.item.selectedGroups).toEqual([]);
            expect(this.controller.item.groups).toEqual(this.groups);
            expect(scope.updateItem).toHaveBeenCalledWith(this.controller.item);
            expect(this.policy).toEqual(blankPolicy);
        });
        describe('should properly toggle everyone to', function() {
            it('true', function() {
                this.policy.Rule[0].Target.AnyOf[0].AllOf = [{Match: [angular.copy(this.userMatch)]}, {Match: [angular.copy(this.groupMatch)]}];
                var user = this.users[0];
                this.controller.item.users = _.reject(this.users, user);
                this.controller.item.selectedUsers = [user];
                var group = this.groups[0];
                this.controller.item.groups = _.reject(this.groups, group);
                this.controller.item.selectedGroups = [group];
                this.controller.item.everyone = true;
                this.controller.toggleEveryone();
                expect(this.controller.item.users).toEqual(this.users);
                expect(this.controller.item.selectedUsers).toEqual([]);
                expect(this.controller.item.groups).toEqual(this.groups);
                expect(this.controller.item.selectedGroups).toEqual([]);
                expect(scope.updateItem).toHaveBeenCalledWith(this.controller.item);
                expect(this.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([{Match: [this.everyoneMatch]}]);
            });
            it('false', function() {
                loginManagerSvc.currentUserIRI = 'test';
                this.controller.item.users = [{iri: 'test'}];
                this.policy.Rule[0].Target.AnyOf[0].AllOf = [{Match: [angular.copy(this.everyoneMatch)]}];
                spyOn(this.controller, 'addUser');
                this.controller.toggleEveryone();
                expect(scope.updateItem).toHaveBeenCalledWith(this.controller.item);
                expect(this.controller.addUser).toHaveBeenCalledWith({iri: 'test'});
                expect(this.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([]);
            });
        });
    });
    it('should call removeUser when the link is clicked', function() {
        scope.$digest();
        spyOn(this.controller, 'removeUser');
        var link = angular.element(this.element.querySelectorAll('.row .selected-items .selected-item a')[0]);
        link.triggerHandler('click');
        expect(this.controller.removeUser).toHaveBeenCalledWith(this.users[0]);
    });
    it('should call removeGroup when the link is clicked', function() {
        scope.$digest();
        spyOn(this.controller, 'removeGroup');
        var link = angular.element(this.element.querySelectorAll('.row .selected-items .selected-item a')[1]);
        link.triggerHandler('click');
        expect(this.controller.removeGroup).toHaveBeenCalledWith(this.groups[0],);
    });
});