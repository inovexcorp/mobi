describe('Commits Tab directive', function() {
    var $compile, scope, ontologyStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('commitsTab');
        mockOntologyState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.element = $compile(angular.element('<commits-tab></commits-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitsTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commits-tab')).toBe(true);
        });
        it('with a .col-8', function() {
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a commit-history-table', function() {
            expect(this.element.find('commit-history-table').length).toBe(1);
        });
        it('depending on how many commits there are', function() {
            expect(this.element.querySelectorAll('.view-table').length).toEqual(0);

            this.controller.commits = [{id: '1'}, {id: '2'}];
            scope.$digest();
            expect(this.element.querySelectorAll('.view-table').length).toEqual(1);
            expect(this.element.querySelectorAll('.view-table tbody tr').length).toEqual(this.controller.commits.length);
        });
        it('depending on whether the user has unsaved changes', function() {
            ontologyStateSvc.hasChanges.and.returnValue(false);
            this.controller.commits = [{id: 'commit'}];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.view-table tbody button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.hasChanges.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the user has saved changes', function() {
            ontologyStateSvc.hasChanges.and.returnValue(false);
            ontologyStateSvc.isCommittable.and.returnValue(false);
            this.controller.commits = [{id: 'commit'}];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.view-table tbody button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.isCommittable.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        describe('should get the title for the current head commit currently selected branch', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.returnValue('title');
            });
            it('if a branch is checked out', function() {
                var branch = {'@id': 'branchId', 'http://purl.org/dc/terms/title': [{'@value': 'title'}]};
                ontologyStateSvc.listItem = {branches: [branch], ontologyRecord: {branchId: branch['@id']}};
                expect(this.controller.getHeadTitle()).toEqual('title');
                expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
            });
            it('if a tag is checked out', function() {
                ontologyStateSvc.getCurrentStateByRecordId.and.returnValue({});
                var tag = {'@id': 'tag'};
                utilSvc.getPropertyId.and.returnValue(tag['@id']);
                ontologyStateSvc.isStateTag.and.returnValue(true);
                ontologyStateSvc.listItem = {tags: [tag], ontologyRecord: {recordId: 'recordId'}};
                expect(this.controller.getHeadTitle()).toEqual('title');
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.ontologyState + 'tag');
                expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(tag, 'title');
            });
            it('if a commit is checked out', function() {
                expect(this.controller.getHeadTitle()).toEqual('');
            });
        });
        it('should open the ontology at a commit', function() {
            this.controller.openOntologyAtCommit({id: 'commit'});
            expect(ontologyStateSvc.updateOntologyWithCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, 'commit');
        });
    });
    it('should open an ontology at a commit when its view button is clicked', function() {
        this.controller.commits = [{id: 'commit'}];
        scope.$digest();
        spyOn(this.controller, 'openOntologyAtCommit');

        var button = angular.element(this.element.querySelectorAll('.view-table tbody button')[0]);
        button.triggerHandler('click');
        expect(this.controller.openOntologyAtCommit).toHaveBeenCalledWith({id: 'commit'});
    });
});
