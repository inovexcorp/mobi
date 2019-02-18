describe('Merge Requests Page directive', function() {
    var $compile, scope, $q, mergeRequestsStateSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestsPage');
        mockMergeRequestsState();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
        });

        this.element = $compile(angular.element('<merge-requests-page></merge-requests-page>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('merge-requests-page')).toBe(true);
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('if no request is selected and one is not being created', function() {
            expect(this.element.find('merge-request-list').length).toBe(1);
            expect(this.element.find('merge-request-view').length).toBe(0);
            expect(this.element.find('create-request').length).toBe(0);
        });
        it('if a request is selected', function() {
            mergeRequestsStateSvc.selected = {};
            scope.$digest();
            expect(this.element.find('merge-request-list').length).toBe(0);
            expect(this.element.find('merge-request-view').length).toBe(1);
            expect(this.element.find('create-request').length).toBe(0);
        });
        it('if a request is being created', function() {
            mergeRequestsStateSvc.createRequest = true;
            scope.$digest();
            expect(this.element.find('merge-request-list').length).toBe(0);
            expect(this.element.find('merge-request-view').length).toBe(0);
            expect(this.element.find('create-request').length).toBe(1);
        });
    });
});