describe('File Input directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('fileInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.file = undefined;
        this.element = $compile(angular.element('<file-input ng-model="file"></file-input>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the directive with the correct html', function() {
        it('for an input', function() {
            expect(this.element.prop('tagName')).toBe('INPUT');
            expect(this.element.prop('type')).toBe('file');
        });
    });
});