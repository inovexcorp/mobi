describe('Merge Tab directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('mergeTab');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<merge-tab></merge-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('merge-tab')).toBe(true);
        });
        it('depending on whether there are conflicts', function() {
            expect(this.element.find('merge-block').length).toBe(1);
            expect(this.element.find('resolve-conflicts-block').length).toBe(0);

            ontologyStateSvc.listItem.merge.conflicts = [{}];
            scope.$digest();
            expect(this.element.find('merge-block').length).toBe(0);
            expect(this.element.find('resolve-conflicts-block').length).toBe(1);
        });
    });
});
