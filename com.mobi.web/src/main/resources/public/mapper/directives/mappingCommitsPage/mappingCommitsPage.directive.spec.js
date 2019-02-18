describe('Mapping Commits Page directive', function() {
    var $compile, scope, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mappingCommitsPage');
        mockMapperState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
        });

        mapperStateSvc.mapping = {record: {id: 'id'}};
    });

    beforeEach(function compile() {
        this.compile = function(newMapping) {
            mapperStateSvc.newMapping = newMapping;
            this.element = $compile(angular.element('<mapping-commits-page></mapping-commits-page>'))(scope);
            scope.$digest();
        };
    });

    afterEach(function () {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('should initialize correctly', function() {
        it('if the mapping master branch has not been set yet for an existing mapping', function() {
            this.compile(false);
            expect(mapperStateSvc.setMasterBranch).toHaveBeenCalled();
        });
        it('if the mapping master branch has not been set yet for a new mapping', function() {
            this.compile(true);
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
        it('if the mapping master branch has been retrieved already', function() {
            mapperStateSvc.mapping.branch = {};
            this.compile(false);
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile(false);
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-commits-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a commit-history-table', function() {
            expect(this.element.find('commit-history-table').length).toBe(1);
        });
    });
});
