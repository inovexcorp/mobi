
describe('Branch List component', function() {
    var $compile, scope, $q, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockComponent('catalog', 'entityPublisher');
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.catalogId = 'catalogId';
        this.recordId = 'recordId';
        this.branches = [{}];
        this.totalSize = 10;
        this.headers = {'x-total-count': this.totalSize};

        utilSvc.getPropertyId.and.callFake((obj, propId) => {
            if (propId === prefixes.catalog + 'catalog') {
                return this.catalogId;
            }
            return '';
        });
        catalogManagerSvc.sortOptions = [{field: prefixes.dcterms + 'modified', asc: false}];
        catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);
        catalogManagerSvc.getRecordBranches.and.returnValue($q.when({
            data: this.branches,
            headers: jasmine.createSpy('headers').and.returnValue(this.headers)
        }));
        scope.record = {'@id': this.recordId};
        this.element = $compile(angular.element('<branch-list record="record"></branch-list>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('branchList');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('initializes correctly', function() {
        it('with a catalogId', function() {
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith(scope.record, prefixes.catalog + 'catalog');
            expect(this.controller.catalogId).toEqual(this.catalogId);
        });
        it('with branches', function() {
            expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.recordId, this.catalogId, jasmine.any(Object));
            expect(this.controller.branches).toEqual(this.branches);
            expect(this.controller.totalSize).toEqual(this.totalSize);
        });
    });
    describe('controller bound variable', function() {
        it('record is one way bound', function() {
            this.controller.record = {};
            scope.$digest();
            expect(scope.record).toEqual({'@id': this.recordId});
        });
    });
    describe('controller methods', function() {
        it('should load more branches', function() {
            spyOn(this.controller, 'setBranches');
            this.controller.loadMore();
            expect(this.controller.limit).toEqual(20);
            expect(this.controller.setBranches).toHaveBeenCalled();
        });
        it('should show a branch panel', function() {
            this.controller.branches = [{id: 1}, {id: 2, show: true}]
            this.controller.showPanel(this.controller.branches[0]);
            expect(this.controller.branches[0].show).toEqual(true);
            expect(this.controller.branches[1].show).toBeUndefined();
        });
        describe('should set the branches', function() {
            beforeEach(function() {
                catalogManagerSvc.getRecordBranches.calls.reset();
                this.controller.branches = [];
                this.controller.totalSize = 0;
            });
            describe('if the record is a VersionedRDFRecord', function() {
                it('successfully', function() {
                    this.controller.setBranches();
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.recordId, this.catalogId, {pageIndex: 0, limit: this.controller.limit, sortOption: jasmine.any(Object)});
                    expect(this.controller.branches).toEqual(this.branches);
                    expect(this.controller.totalSize).toEqual(this.totalSize);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless getRecordBranches rejects', function() {
                    catalogManagerSvc.getRecordBranches.and.returnValue($q.reject('Error Message'));
                    this.controller.setBranches();
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(this.recordId, this.catalogId, {pageIndex: 0, limit: this.controller.limit, sortOption: jasmine.any(Object)});
                    expect(this.controller.branches).toEqual([]);
                    expect(this.controller.totalSize).toEqual(0);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                });
            });
            it('unless the record is not a VersionedRDFRecord', function() {
                catalogManagerSvc.isVersionedRDFRecord.and.returnValue(false);
                this.controller.setBranches();
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranches).not.toHaveBeenCalled();
                expect(this.controller.branches).toEqual([]);
                expect(this.controller.totalSize).toEqual(0);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('BRANCH-LIST');
        });
        it('depending on the number of branches', function() {
            expect(this.element.querySelectorAll('.branches-list').length).toEqual(1);
            expect(this.element.querySelectorAll('.expansion-panel').length).toEqual(this.branches.length);

            this.controller.branches = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.branches-list').length).toEqual(0);
            expect(this.element.querySelectorAll('.expansion-panel').length).toEqual(0);
        });
        it('depending on whether there are more branches to load', function() {
            expect(this.element.querySelectorAll('.load-button').length).toEqual(1);
            
            this.controller.totalSize = this.controller.branches.length;
            scope.$digest();
            expect(this.element.querySelectorAll('.load-button').length).toEqual(0);
        });
    });
    it('should open a branch expansion panel when clicked', function() {
        spyOn(this.controller, 'showPanel');
        var panel = angular.element(this.element.querySelectorAll('.expansion-panel-toggler')[0]);
        panel.triggerHandler('click');
        expect(this.controller.showPanel).toHaveBeenCalledWith(this.controller.branches[0]);
    });
    it('should load more branches when the button is clicked', function() {
        spyOn(this.controller, 'loadMore');
        var button = angular.element(this.element.querySelectorAll('.load-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.loadMore).toHaveBeenCalled();
    });
});