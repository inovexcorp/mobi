describe('Property Tree directive', function() {
    var $compile,
        scope,
        element;

    mockPrefixes();

    beforeEach(function() {
        module('propertyTree');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/propertyTree/propertyTree.html');

    beforeEach(function() {
        scope.ontologies = [
            {
                matonto: {
                    classes: [
                        {
                            matonto: {
                                properties: ['prop1', 'prop2']
                            }
                        }
                    ],
                    noDomains: ['prop3']
                }
            }
        ];
        scope.headerText = 'test';
        scope.propertyType = 'test';
        scope.state = {};
        scope.selectItem = jasmine.createSpy('selectItem');

        element = $compile(angular.element('<property-tree header-text="headerText" property-type="propertyType" state="state" select-item="selectItem()" ontologies="ontologies"></property-tree>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('headerText should be one way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.headerText = 'new';
            scope.$digest();
            expect(scope.headerText).toEqual('test');
        });
    });
    describe('controller bound variables', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('propertyTree');
        });
        it('propertyType should be one way bound', function() {
            controller.propertyType = 'new';
            scope.$digest();
            expect(scope.propertyType).toEqual('test');
        });
        it('state should be two way bound', function() {
            controller.state = {prop: 'new'};
            scope.$digest();
            expect(scope.state.hasOwnProperty('prop')).toBe(true);
        });
        it('ontologies should be two way bound', function() {
            controller.ontologies = [];
            scope.$digest();
            expect(scope.ontologies.length).toBe(0);
        });
        it('selectItem should be called in parent scope', function() {
            controller.selectItem();
            expect(scope.selectItem).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on tree class', function() {
            expect(element.hasClass('tree')).toBe(true);
        });
        it('based on container class', function() {
            var container = element.querySelectorAll('.container');
            expect(container.length).toBe(1);
        });
        it('based on ul', function() {
            var uls = element.querySelectorAll('ul');
            expect(uls.length).toBe(3);
        });
        it('based on container tree-items', function() {
            element.controller('propertyTree').isThisType = jasmine.createSpy('isThisType').and.returnValue(true);
            scope.$digest();

            var lis = element.querySelectorAll('.container tree-item');
            var total = scope.ontologies[0].matonto.classes[0].matonto.properties.length + scope.ontologies[0].matonto.noDomains.length;
            expect(lis.length).toBe(total);
        });
    });
    describe('controller methods', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('propertyTree');
        });
        it('isThisType returns a boolean value', function() {
            var result = controller.isThisType({}, 'datatypeproperty');
            expect(typeof result).toBe('boolean');
        });
        it('hasChildren returns a boolean value', function() {
            var result = controller.hasChildren({});
            expect(typeof result).toBe('boolean');
        });
    });
});
