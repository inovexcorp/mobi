describe('Activity Title component', function() {
    var $compile, scope, provManagerSvc, userManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('home');
        mockProvManager();
        mockUtil();
        mockUserManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _provManagerService_, _userManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            provManagerSvc = _provManagerService_;
            userManagerSvc = _userManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        provManagerSvc.activityTypes = [{type: 'type1', word: 'word1', pred: 'pred'}, {type: 'type', word: 'word', pred: 'pred'}];
        scope.activity = { '@type': [], pred: [{'@id': 'entity'}, {'@id': 'entity1'}] };
        scope.entities = [{'@id': 'entity'}, {'@id': 'entity1'}];
    });

    beforeEach(function compile() {
        this.compile = function() {
            this.element = $compile(angular.element('<activity-title activity="activity" entities="entities"></activity-title>'))(scope);
            scope.$apply();
            this.controller = this.element.controller('activityTitle');
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        provManagerSvc = null;
        userManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            this.compile();
        });
        it('activity is one way bound', function() {
            this.controller.activity = {};
            scope.$digest();
            expect(scope.activity).toEqual({'@type': [], pred: [{'@id': 'entity'}, {'@id': 'entity1'}]});
        });
        it('entities is one way bound', function() {
            this.controller.entities = [{}];
            scope.$digest();
            expect(scope.entities).toEqual([{'@id': 'entity'}, {'@id': 'entity1'}]);
        });
    });
    describe('should initialize with the correct value for', function() {
        describe('username', function() {
            it('if the activity does not have the wasAssociatedWith property', function() {
                this.compile();
                expect(this.controller.username).toEqual('(None)');
            });
            describe('if the activity has the wasAssociatedWith property', function() {
                beforeEach(function() {
                    this.iri = 'iri';
                    utilSvc.getPropertyId.and.returnValue(this.iri);
                });
                it('and the user was not found', function() {
                    this.compile();
                    expect(this.controller.username).toEqual('(None)');
                });
                it('and the user was found', function() {
                    userManagerSvc.users = [{iri: this.iri, username: 'username'}];
                    this.compile();
                    expect(this.controller.username).toEqual('username');
                });
            });
        });
        describe('word if the activity is', function() {
            it('a supported type', function() {
                scope.activity['@type'].push('type');
                this.compile();
                expect(this.controller.word).toEqual('word');
            });
            it('more than one supported type', function() {
                scope.activity['@type'] = ['type', 'type1'];
                this.compile();
                expect(this.controller.word).toEqual('word1');
            });
            it('unsupported type', function() {
                this.compile();
                expect(this.controller.word).toEqual('affected');
            });
        });
        describe('entities if the activity is', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.callFake(obj => obj['@id']);
            });
            it('a supported type', function() {
                scope.activity['@type'].push('type');
                this.compile();
                expect(this.controller.entitiesStr).toEqual('entity and entity1');
            });
            it('more than one supported type', function() {
                scope.activity['@type'] = ['type', 'type1'];
                this.compile();
                expect(this.controller.entitiesStr).toEqual('entity and entity1');
            });
            it('unsupported type', function() {
                this.compile();
                expect(this.controller.entitiesStr).toEqual('(None)');
            });
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ACTIVITY-TITLE');
            expect(this.element.querySelectorAll('.activity-title').length).toEqual(1);
        });
        it('with the active word for the activity', function() {
            this.controller.word = 'word';
            scope.$digest();
            expect(this.element.html()).toContain(this.controller.word);
        });
        it('with the user for the activity', function() {
            this.controller.username = 'user';
            scope.$digest();
            expect(this.element.html()).toContain(this.controller.username);
        });
        it('with the entities for the activity', function() {
            this.controller.entitiesStr = '';
            scope.$digest();
            expect(this.element.html()).toContain(this.controller.entitiesStr);
        });
    });
});
