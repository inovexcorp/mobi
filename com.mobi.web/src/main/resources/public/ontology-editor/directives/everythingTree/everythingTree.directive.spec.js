describe('Everything Tree directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('everythingTree');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyManagerSvc.hasNoDomainProperties.and.returnValue(true);
        ontologyStateSvc.getOpened.and.returnValue(true);
        ontologyStateSvc.getNoDomainsOpened.and.returnValue(true);
        ontologyStateSvc.listItem.flatEverythingTree = [{
            '@id': 'class1',
            hasChildren: true,
            indent: 0,
            path: ['recordId']
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            path: ['recordId', 'class1']
        }, {
            title: 'Properties',
            get: jasmine.createSpy('get').and.returnValue(true),
            set: jasmine.createSpy('set')
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened
        }];

        this.element = $compile(angular.element('<everything-tree></everything-tree>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('everythingTree');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(this.controller, 'isShown').and.returnValue(true);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('tree')).toBe(true);
            expect(this.element.hasClass('everything-tree')).toBe(true);
            expect(this.element.hasClass('hierarchy-tree')).toBe(true);
            expect(this.element.hasClass('h-100')).toBe(true);
        });
        it('based on .repeater-container', function() {
            expect(this.element.querySelectorAll('.repeater-container').length).toBe(1);
        });
        it('based on .tree-items', function() {
            expect(this.element.querySelectorAll('.tree-item').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('isShown should return', function() {
            describe('true when', function() {
                it('entity does not have an @id', function() {
                    var entity = {};
                    expect(this.controller.isShown(entity)).toBe(true);
                });
                it('entity does have an @id and get returns true', function() {
                    var entity = {
                        '@id': 'id',
                        get: jasmine.createSpy('get').and.returnValue(true)
                    };
                    expect(this.controller.isShown(entity)).toBe(true);
                    expect(entity.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                it('entity does have an @id, does not have a get, indent is greater than 0, and areParentsOpen is true', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(this.controller.isShown(entity)).toBe(true);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(entity);
                });
                it('entity does have an @id, does not have a get, indent is 0, and the parent path has a length of 2', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 0,
                        path: ['recordId', 'iri']
                    };
                    expect(this.controller.isShown(entity)).toBe(true);
                });
            });
            describe('false when', function() {
                it('has an @id', function() {
                    var entity = {'@id': 'id'};
                    expect(this.controller.isShown(entity)).toBe(false);
                });
                it('has a get that returns false', function() {
                    var entity = {
                        '@id': 'id',
                        get: jasmine.createSpy('get').and.returnValue(false)
                    }
                    expect(this.controller.isShown(entity)).toBe(false);
                    expect(entity.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                it('indent is greater than 0 and areParentsOpen is false', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(this.controller.isShown(entity)).toBe(false);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(entity);
                });
                it('indent is 0 and the parent path does not have a length of 2', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 0,
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    expect(this.controller.isShown(entity)).toBe(false);
                });
            });
        });
    });
});