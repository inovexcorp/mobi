describe('Available Prop List directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('availablePropList');
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/availablePropList/availablePropList.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.props = [];
            scope.openProp = jasmine.createSpy('openProp');

            this.element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
            scope.$digest();
        });

        it('props should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.props = ['prop1'];
            scope.$digest();
            expect(scope.props).toEqual(['prop1']);
        });
        it('openProp should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.openProp();

            expect(scope.openProp).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.props = [{'@id': 'id0'}];
            scope.openProp = jasmine.createSpy('openProp');

            this.element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
            scope.$digest();
        });
        it('should call openProp with passed propId', function() {
            var controller = this.element.controller('availablePropList');
            controller.openProperty('test');

            expect(scope.openProp).toHaveBeenCalledWith('test');
        });
        it('should return the entity name of a prop', function() {
            var controller = this.element.controller('availablePropList');
            var name = controller.getPropName(scope.props[0]);

            expect(typeof name).toEqual('string');
        });
        it('should set the selected prop', function() {
            var controller = this.element.controller('availablePropList');
            controller.setSelectedProp(scope.props[0]);

            expect(controller.selectedProp).toEqual(scope.props[0]);
        });
        it('should test whether passed prop is selected', function() {
            var controller = this.element.controller('availablePropList');
            var result = controller.isSelected(scope.props[0]);
            expect(result).toBe(false);

            controller.setSelectedProp(scope.props[0]);
            result = controller.isSelected(scope.props[0]);
            expect(result).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            scope.props = [];
            var element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
            scope.$digest();

            expect(element.hasClass('available-props')).toBe(true);
        });
        it('if given no props', function() {
            scope.props = [];
            var element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
            scope.$digest();

            var listList = element.querySelectorAll('ul');
            expect(listList.length).toBe(0);
            expect(element.html()).toContain('None');
        });
        it('if given props', function() {
            scope.props = [{'@id': 'id0'}];
            var element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
            scope.$digest();

            var listList = element.querySelectorAll('ul');
            expect(element.html()).not.toContain('None');
            expect(listList.length).toBe(1);
            var ul = listList[0];
            expect(ul.querySelectorAll('li').length).toBe(scope.props.length);
        });
        it('if prop is selected', function() {
            scope.props = [{'@id': 'id0'}];
            var element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
            scope.$digest();
            var controller = element.controller('availablePropList');
            controller.selectedProp = scope.props[0];
            scope.$digest();

            var listItem = element.querySelectorAll('ul li')[0];
            var buttons = listItem.querySelectorAll('button');
            expect(buttons.length).toBe(1);
        });
    });
    it('should call setSelectedProp when list item is clicked', function() {
        scope.props = [{'@id': 'id0'}];
        var element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
        scope.$digest();
        var controller = element.controller('availablePropList');
        spyOn(controller, 'setSelectedProp');
        var listItem = element.querySelectorAll('ul li')[0];
        angular.element(listItem).triggerHandler('click');

        expect(controller.setSelectedProp).toHaveBeenCalled();
    });
    it('should call openProp when button is clicked', function() {
        scope.props = [{'@id': 'id0'}];
        scope.openProp = jasmine.createSpy('openProp');
        var element = $compile(angular.element('<available-prop-list props="props" open-prop="openProp(propId)"></available-prop-list>'))(scope);
        scope.$digest();
        var controller = element.controller('availablePropList');
        controller.selectedProp = scope.props[0];
        scope.$digest();

        var button = element.querySelectorAll('ul li button')[0];
        angular.element(button).triggerHandler('click');

        expect(scope.openProp).toHaveBeenCalled();
    });
});