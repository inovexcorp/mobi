describe('Ontology Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('ontologyTab');
        mockOntologyState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _catalogManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.element = $compile(angular.element('<ontology-tab></ontology-tab>'))(scope);
        this.branchId = 'masterId';
        this.branch = {
            '@id': this.branchId,
            [prefixes.dcterms]: [{
                '@value': 'MASTER'
            }]
        };
        ontologyStateSvc.listItem.branches = [this.branch];
        this.commitId = 'commitId';
        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        var ontoState = {
            model: [
                {
                    '@id': 'state-id'
                },
                {
                    '@id': 'branch-id',
                    [prefixes.ontologyState + 'branch']: [{'@id': this.branchId}],
                    [prefixes.ontologyState + 'commit']: [{'@id': this.commitId}]
                }
            ]
        };
        this.errorMessage = 'error';

        catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({ commit: { '@id': this.commitId } }));
        ontologyStateSvc.getOntologyStateByRecordId.and.returnValue(ontoState);
        utilSvc.getDctermsValue.and.returnValue('MASTER');
        utilSvc.getPropertyId.and.returnValue(this.commitId);
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
    });

    describe('should initialize calling the correct methods', function() {
        describe('when the ontology is open on a branch', function() {
            describe('and the branch does not exist', function() {
                beforeEach(function() {
                    ontologyStateSvc.listItem.ontologyRecord.branchId = 'not found';
                });
                describe('and getBranchHeadCommit is resolved', function() {
                    it('and updateOntology is resolved', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.when());
                        scope.$digest();
                        expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(this.branchId,ontologyStateSvc.listItem.ontologyRecord.recordId, this.catalogId);
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                            this.branchId, this.commitId, true);
                        expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                    });
                    it('and updateOntology does not resolve', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.reject(this.errorMessage));
                        scope.$digest();
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                        expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                    });
                });
                it('and getBranchHeadCommit does not resolve', function() {
                    catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.reject(this.errorMessage));
                    scope.$digest();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith(this.errorMessage);
                    expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                });
            });
            it('and the branch exists', function() {
                ontologyStateSvc.listItem.ontologyRecord.branchId = this.branchId;
                scope.$digest();
                expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
                expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
            });
        });
        it('when the ontology is not open on a branch', function() {
            scope.$digest();
            expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
            expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
            expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.$digest();
        })
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-tab')).toBe(true);
        });
        it('with a material-tabset', function() {
            expect(this.element.find('material-tabset').length).toBe(1);
        });
        it('with mateiral-tabs', function() {
            expect(this.element.find('material-tab').length).toBe(10);
        });
        ['ontology-button-stack', 'project-tab', 'overview-tab', 'classes-tab', 'properties-tab', 'individuals-tab', 'concepts-tab', 'concept-schemes-tab', 'search-tab', 'saved-changes-tab', 'commits-tab'].forEach(function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        }, this);
        it('if branches are being merged', function() {
            expect(this.element.find('merge-tab').length).toBe(0);

            ontologyStateSvc.listItem.merge.active = true;
            scope.$digest();
            expect(this.element.find('material-tabset').length).toBe(0);
            expect(this.element.find('ontology-button-stack').length).toBe(0);
            expect(this.element.find('merge-tab').length).toBe(1);
        });
    });
});