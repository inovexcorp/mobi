describe('Project Tab directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('projectTab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<project-tab></project-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('project-tab')).toBe(true);
        });
        it('with a selected-details', function() {
            expect(this.element.find('selected-details').length).toBe(1);
        });
        it('with a ontology-properties-block', function() {
            expect(this.element.find('ontology-properties-block').length).toBe(1);
        });
        it('with a imports-block', function() {
            expect(this.element.find('imports-block').length).toBe(1);
        });
        it('with a preview-block', function() {
            expect(this.element.find('preview-block').length).toBe(1);
        });
    });
});