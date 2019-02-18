describe('Permissions Page directive', function() {
    var $compile, scope, $q, policyManagerSvc, catalogManagerSvc, utilSvc, userManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('permissionsPage');
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
        this.scope = this.element.isolateScope();
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
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('permissions-page')).toEqual(true);
            expect(this.element.hasClass('row')).toEqual(true);
            expect(this.element.querySelectorAll('.col').length).toEqual(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with a circle-button', function() {
            var div = this.element.querySelectorAll('.save-container');
            expect(div.length).toEqual(1);
            expect(angular.element(div[0]).find('circle-button').length).toEqual(1);
        });
        it('depending on how many policies there are', function() {
            expect(this.element.querySelectorAll('.policy').length).toEqual(0);

            this.controller.policies = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.policy').length).toEqual(this.controller.policies.length);
        });
    });
});