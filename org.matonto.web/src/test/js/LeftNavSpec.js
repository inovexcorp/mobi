describe('Left Nav directive', function() {
    var $compile,
        scope,
        windowSvc;

    beforeEach(function() {
        module('templates');
        module('leftNav');
        module(function($provide) {
            $provide.service('$window', function() {
                this.open = jasmine.createSpy('open');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$window_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            windowSvc = _$window_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.moduleName = '';
            scope.docUrl = '';

            this.element = $compile(angular.element('<left-nav module-name="moduleName" doc-url="docUrl"></left-nav>'))(scope);
            scope.$digest();
        });
        it('moduleName should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.moduleName = 'name';
            scope.$digest();
            expect(scope.moduleName).toBe('name');
        });
        it('docUrl should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.docUrl = 'url';
            scope.$digest();
            expect(scope.docUrl).toBe('url');
        });
    });
    describe('scope methods', function() {
        it('open the passed in doc url', function() {
            scope.docUrl = '';
            var element = $compile(angular.element('<left-nav module-name="moduleName" doc-url="docUrl"></left-nav>'))(scope);
            scope.$digest();
            var isolatedScope = element.isolateScope();
            isolatedScope.openDocs();
            expect(windowSvc.open).toHaveBeenCalledWith(scope.docUrl);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<left-nav module-name="moduleName" doc-url="docUrl"></left-nav>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('left-nav')).toBe(true);
            expect(this.element.hasClass('nav')).toBe(true);
            expect(this.element.hasClass('full-height')).toBe(true);
        });
        it('with a leftNavItem to open the doc url', function() {
            var item = this.element.find('left-nav-item');
            expect(item.length).toBe(1);
            expect(item.hasClass('doc-link')).toBe(true);
        });
    });
});