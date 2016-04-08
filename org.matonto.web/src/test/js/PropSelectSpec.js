describe('Prop Select directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    mockOntologyManager();
    beforeEach(function() {
        module('propSelect');

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(ontologyManagerService) {
            ontologyManagerSvc = ontologyManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/propSelect/propSelect.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.props = [];
            scope.selectedProp = '';
            scope.onChange = jasmine.createSpy('onChange');

            this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
        });

        it('props should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.props = [{}];
            scope.$digest();
            expect(scope.props).toEqual([{}]);
        });
        it('onChange should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onChange();

            expect(scope.onChange).toHaveBeenCalled();
        });
        it('selectedProp should be two way bound', function() {
            var controller = this.element.controller('propSelect');
            controller.selectedProp = 'test';
            scope.$digest();
            expect(scope.selectedProp).toEqual('test');
        });
    });
    describe('controller methods', function() {
        it('should get the name of the passed property object', function() {
            var element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
            var controller = element.controller('propSelect');
            var result = controller.getName({});
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({});
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('prop-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
});