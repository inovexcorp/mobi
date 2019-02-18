describe('Merge Request Tabset component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('mergeRequestTabset');
        mockMergeRequestManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.request = {difference: {additions: [], deletions: []}};
        this.element = $compile(angular.element('<merge-request-tabset request="request" parent-id="parentId"></merge-request-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('request should be two way bound', function() {
            this.controller.request = {};
            scope.$digest();
            expect(scope.request).toEqual({});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MERGE-REQUEST-TABSET');
            expect(this.element.querySelectorAll('.merge-request-tabset').length).toEqual(1);
        });
        _.forEach(['material-tabset', 'merge-request-discussion', 'commit-history-table', 'commit-changes-display'], tag => {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toEqual(1);
            });
        });
        it('with material-tabs', function() {
            expect(this.element.find('material-tab').length).toEqual(3);
        });
        it('depending on whether the request has any changes', function() {
            expect(this.element.find('info-message').length).toEqual(1);

            this.controller.request.difference.additions = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
        });
    });
});