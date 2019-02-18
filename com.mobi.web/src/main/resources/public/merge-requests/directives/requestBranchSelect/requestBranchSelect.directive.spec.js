describe('Request Branch Select directive', function() {
    var $compile, scope, $q, catalogManagerSvc, mergeRequestsStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('requestBranchSelect');
        mockCatalogManager();
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockUtil();
        mockPrefixes();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _mergeRequestsStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            utilSvc = _utilService_;
        });

        utilSvc.getPropertyId.and.callFake(function(obj, prop) {
            return "head";
        });

        this.difference = {
            additions: [],
            deletions: []
        };
        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        catalogManagerSvc.getDifference.and.returnValue($q.when(this.difference));
        this.branchDefer = $q.defer();
        catalogManagerSvc.getRecordBranches.and.returnValue(this.branchDefer.promise);
        mergeRequestsStateSvc.requestConfig.recordId = 'recordId';
        this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('requestBranchSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        mergeRequestsStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('should initialize with the correct values for', function() {
        describe('difference if the source and target branches are', function() {
            it('selected', function() {
                mergeRequestsStateSvc.requestConfig.sourceBranch = {};
                mergeRequestsStateSvc.requestConfig.targetBranch = {};
                this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
                scope.$digest();
                expect(catalogManagerSvc.getDifference).toHaveBeenCalled();
            });
            it('not selected', function() {
                scope.$apply();
                expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
            });
        });
        describe('branches', function() {
            it('successfully', function() {
                this.branchDefer.resolve({data: [{}]});
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith('recordId', 'catalogId');
                expect(this.controller.branches).toEqual([{}]);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless an error occurs', function() {
                this.branchDefer.reject('Error Message');
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith('recordId', 'catalogId');
                expect(this.controller.branches).toEqual([]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
    });
    describe('controller methods', function() {
        describe('should handle changing the target branch', function() {
            beforeEach(function() {
                mergeRequestsStateSvc.requestConfig.difference = {};
            });
            describe('if one has been selected and source branch is', function() {
                beforeEach(function() {
                    mergeRequestsStateSvc.requestConfig.targetBranch = {'@id': 'target'};
                });
                describe('set and getDifference', function() {
                    beforeEach(function() {
                        mergeRequestsStateSvc.requestConfig.sourceBranch = {'@id': 'source'};
                        mergeRequestsStateSvc.requestConfig.sourceBranchId = 'source';
                    });
                    it('resolves', function() {
                        this.controller.changeTarget();
                        scope.$apply();
                        expect(mergeRequestsStateSvc.requestConfig.targetBranchId).toEqual('target');
                        expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('head', 'head');
                        expect(mergeRequestsStateSvc.requestConfig.difference).toEqual(this.difference);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    });
                    it('rejects', function() {
                        catalogManagerSvc.getDifference.and.returnValue($q.reject('Error Message'));
                        this.controller.changeTarget();
                        scope.$apply();
                        expect(mergeRequestsStateSvc.requestConfig.targetBranchId).toEqual('target');
                        expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('head', 'head');
                        expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                    });
                });
                it('not set', function() {
                    this.controller.changeTarget();
                    expect(mergeRequestsStateSvc.requestConfig.targetBranchId).toEqual('target');
                    expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
            });
            it('if one has not been selected', function() {
                this.controller.changeTarget();
                expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('should handle changing the source branch', function() {
            beforeEach(function() {
                mergeRequestsStateSvc.requestConfig.difference = {};
            });
            describe('if one has been selected and target branch is', function() {
                beforeEach(function() {
                    mergeRequestsStateSvc.requestConfig.sourceBranch = {'@id': 'source'};
                });
                describe('set and getDifference', function() {
                    beforeEach(function() {
                        mergeRequestsStateSvc.requestConfig.targetBranch = {'@id': 'target'};
                        mergeRequestsStateSvc.requestConfig.targetBranchId = 'target';
                    });
                    it('resolves', function() {
                        this.controller.changeSource();
                        scope.$apply();
                        expect(mergeRequestsStateSvc.requestConfig.sourceBranchId).toEqual('source');
                        expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('head', 'head');
                        expect(mergeRequestsStateSvc.requestConfig.difference).toEqual(this.difference);
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    });
                    it('rejects', function() {
                        catalogManagerSvc.getDifference.and.returnValue($q.reject('Error Message'));
                        this.controller.changeSource();
                        scope.$apply();
                        expect(mergeRequestsStateSvc.requestConfig.sourceBranchId).toEqual('source');
                        expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('head', 'head');
                        expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                    });
                });
                it('not set', function() {
                    this.controller.changeSource();
                    expect(mergeRequestsStateSvc.requestConfig.sourceBranchId).toEqual('source');
                    expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
            });
            it('if one has not been selected', function() {
                this.controller.changeSource();
                expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('request-branch-select')).toEqual(true);
            expect(this.element.querySelectorAll('.form-container').length).toEqual(1);
        });
        it('depending on whether there is a difference', function() {
            expect(this.element.find('commit-difference-tabset').length).toEqual(0);

            mergeRequestsStateSvc.requestConfig.difference = {};
            scope.$digest();
            expect(this.element.find('commit-difference-tabset').length).toEqual(1);
        });
        it('with .form-groups', function() {
            expect(this.element.querySelectorAll('.form-group').length).toEqual(3);
        });
        it('with branch-selects', function() {
            expect(this.element.find('branch-select').length).toEqual(2);
        });
    });
});
