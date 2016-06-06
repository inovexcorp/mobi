describe('Prop Form directive', function() {
    var $compile,
        $timeout,
        scope,
        ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propForm');
        mockOntologyManager();

        inject(function(_ontologyManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$timeout_, _$rootScope_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.classId = '';
            scope.set = jasmine.createSpy('set');
            scope.setNext = jasmine.createSpy('setNext');
            scope.ontologies = [{}];
            scope.props = [];
            scope.selectedProp = '';
            scope.isDatatypeProp = jasmine.createSpy('isDatatypeProp');
            scope.isObjectProp = jasmine.createSpy('isObjectProp');

            this.element = $compile(angular.element('<prop-form class-id="{{classId}}" set="set()" set-next="setNext()" ontologies="ontologies" props="props" selected-prop="selectedProp" is-datatype-prop="isDatatypeProp()" is-object-prop="isObjectProp()"></prop-form>'))(scope);
            scope.$digest();
            $timeout.flush();
        });

        it('classId should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.classId = 'test';
            scope.$digest();
            expect(scope.classId).not.toBe('test');
        });
        it('set should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.set();

            expect(scope.set).toHaveBeenCalled();
        });
        it('setNext should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.setNext();

            expect(scope.setNext).toHaveBeenCalled();
        });
        it('ontologies should be two way bound', function() {
            var controller = this.element.controller('propForm');
            controller.ontologies = [{'@id': ''}];
            scope.$digest();
            expect(scope.ontologies).toEqual([{'@id': ''}]);
        });
        it('props should be two way bound', function() {
            var controller = this.element.controller('propForm');
            controller.props = [{}];
            scope.$digest();
            expect(scope.props).toEqual([{}]);
        });
        it('selectedProp should be two way bound', function() {
            var controller = this.element.controller('propForm');
            controller.selectedProp = 'test';
            scope.$digest();
            expect(scope.selectedProp).toEqual('test');
        });
        it('isDatatypeProp should be called in the parent scope', function() {
            var controller = this.element.controller('propForm');
            controller.isDatatypeProp();

            expect(scope.isDatatypeProp).toHaveBeenCalled();
        });
        it('isObjectProp should be called in the parent scope', function() {
            var controller = this.element.controller('propForm');
            controller.isObjectProp();

            expect(scope.isObjectProp).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.ontologies = [{}];
            scope.props = [];
            scope.selectedProp = '';
            scope.isDatatypeProp = jasmine.createSpy('isDatatypeProp');
            scope.isObjectProp = jasmine.createSpy('isObjectProp');

            this.element = $compile(angular.element('<prop-form class-id="{{classId}}" set="set()" set-next="setNext()" ontologies="ontologies" props="props" selected-prop="selectedProp" is-datatype-prop="isDatatypeProp()" is-object-prop="isObjectProp()"></prop-form>'))(scope);
            scope.$digest();
            $timeout.flush();
        });
        it('should call the correct method to update depending on the type of selected property', function() {
            var controller = this.element.controller('propForm');
            scope.isObjectProp.calls.reset();
            scope.isDatatypeProp.calls.reset();
            controller.update();
            $timeout.flush();
            expect(scope.isObjectProp).not.toHaveBeenCalled();
            expect(scope.isDatatypeProp).not.toHaveBeenCalled();

            scope.isObjectProp.calls.reset();
            scope.isDatatypeProp.calls.reset();
            controller.selectedProp = 'test';
            controller.props = [{'@id': 'test', '@type': ['ObjectProperty']}];
            controller.update();
            $timeout.flush();
            expect(scope.isObjectProp).toHaveBeenCalled();
            expect(scope.isDatatypeProp).not.toHaveBeenCalled();

            scope.isObjectProp.calls.reset();
            scope.isDatatypeProp.calls.reset();
            controller.props = [{'@id': 'test', '@type': ['DatatypeProperty']}];
            controller.update();
            $timeout.flush();
            expect(scope.isObjectProp).not.toHaveBeenCalled();
            expect(scope.isDatatypeProp).toHaveBeenCalled();
        });
        it('should test whether the selected prop is an object property', function() {
            var controller = this.element.controller('propForm');
            var result = controller.isObjectProperty();
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalled();
            expect(typeof result).toBe('boolean');
        });
        it('should get the name of the passed class', function() {
            var controller = this.element.controller('propForm');
            var result = controller.getClassName('');
            expect(ontologyManagerSvc.getClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.classId = '';
            scope.set = jasmine.createSpy('set');
            scope.setNext = jasmine.createSpy('setNext');
            scope.ontologies = [{}];
            scope.props = [];
            scope.selectedProp = '';
            scope.isDatatypeProp = jasmine.createSpy('isDatatypeProp');
            scope.isObjectProp = jasmine.createSpy('isObjectProp');

            this.element = $compile(angular.element('<prop-form class-id="{{classId}}" set="set()" set-next="setNext()" ontologies="ontologies" props="props" selected-prop="selectedProp" is-datatype-prop="isDatatypeProp()" is-object-prop="isObjectProp()"></prop-form>'))(scope);
            scope.$digest();
            $timeout.flush();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('prop-form')).toBe(true);
        });
        it('with a custom label and a prop select', function() {
            expect(this.element.find('custom-label').length).toBe(1);
            expect(this.element.find('prop-select').length).toBe(1);
        });
        it('depending on the type of the selected property', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(0);
            expect(this.element.find('range-class-description').length).toBe(0);
            
            var controller = this.element.controller('propForm');
            spyOn(controller, 'isObjectProperty').and.returnValue(true);
            scope.$digest();
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Set', 'Set & Next'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Set', 'Set & Next'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
            expect(this.element.find('range-class-description').length).toBe(1);
        });
    });
});