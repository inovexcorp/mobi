describe('Tree Item directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();

    beforeEach(function() {
        module('treeItem');
        mockSettingsManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/treeItem/treeItem.html');

    describe('in isolated scope', function() {
        var isolatedScope;

        beforeEach(function() {
            scope.currentEntity = {'@id': ''};
            scope.currentOntology = {'@id': ''};
            scope.isActive = false;
            scope.onClick = jasmine.createSpy('onClick');
            scope.hasChildren = false;
            scope.isOpened = false;

            element = $compile(angular.element('<tree-item current-entity="currentEntity" current-ontology="currentOntology" is-active="isActive" on-click="onClick()" is-opened="isOpened" has-children="hasChildren"></tree-item>'))(scope);
            scope.$digest();

            isolatedScope = element.isolateScope();
        });
        it('onClick should be called in parent scope when invoked', function() {
            isolatedScope.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
        it('currentEntity should be two way bound', function() {
            isolatedScope.currentEntity = {'@id': 'new value'};
            scope.$digest();
            expect(scope.currentEntity['@id']).toBe('new value');
        });
        it('currentOntology should be two way bound', function() {
            isolatedScope.currentOntology = {'@id': 'new value'};
            scope.$digest();
            expect(scope.currentOntology['@id']).toBe('new value');
        });
        it('isActive should be two way bound', function() {
            isolatedScope.isActive = true;
            scope.$digest();
            expect(scope.isActive).toBe(true);
        });
        it('hasChildren should be two way bound', function() {
            isolatedScope.hasChildren = true;
            scope.$digest();
            expect(scope.hasChildren).toBe(true);
        });
        it('isOpened should be two way bound', function() {
            var controller = element.controller('treeItem');
            controller.isOpened = true;
            scope.$digest();
            expect(scope.isOpened).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.currentEntity = {'@id': ''};
            scope.currentOntology = {'@id': ''};
            scope.onClick = jasmine.createSpy('onClick');
            scope.isOpened = false;

            element = $compile(angular.element('<tree-item current-entity="currentEntity" current-ontology="currentOntology" is-active="isActive" on-click="onClick()" is-opened="isOpened" has-children="hasChildren"></tree-item>'))(scope);
        });
        it('for an li', function() {
            scope.$digest();
            expect(element.prop('tagName')).toBe('LI');
        });
        describe('depending on if hasChildren', function() {
            describe('is false', function() {
                beforeEach(function() {
                    scope.hasChildren = false;
                    scope.$digest();
                });
                it('it has an anchor', function() {
                    var anchors = element.querySelectorAll('a');
                    expect(anchors.length).toBe(1);
                });
                it('is has two icons', function() {
                    var icons = element.querySelectorAll('i');
                    expect(icons.length).toBe(2);
                });
            });
            describe('is true', function() {
                beforeEach(function() {
                    scope.hasChildren = true;
                    scope.$digest();
                });
                it('it has an anchor', function() {
                    var anchors = element.querySelectorAll('a');
                    expect(anchors.length).toBe(1);
                });
                it('is has two icons', function() {
                    var icons = element.querySelectorAll('i');
                    expect(icons.length).toBe(2);
                });
                it('it has an anchor with a double click attribute', function() {
                    var anchors = element.querySelectorAll('[ng-dblclick]');
                    expect(anchors.length).toBe(1);
                });
            });
        });

        describe('when isActive', function() {
            it('is true it should have active class', function() {
                scope.isActive = true;
                scope.$digest();
                var anchor = element.querySelectorAll('a')[0];
                expect(angular.element(anchor).hasClass('active')).toBe(true);
            });
            it('is false it should not have active class', function() {
                scope.isActive = false;
                scope.$digest();
                var anchor = element.querySelectorAll('a')[0];
                expect(angular.element(anchor).hasClass('active')).toBe(false);
            });
        });
    });
    describe('controller methods', function() {
        var controller;

        beforeEach(function() {
            scope.currentEntity = {'@id': ''};
            scope.currentOntology = {'@id': ''};
            scope.isActive = false;
            scope.onClick = jasmine.createSpy('onClick');
            scope.isOpened = false;
            scope.hasChildren = true;

            element = $compile(angular.element('<tree-item current-entity="currentEntity" current-ontology="currentOntology" is-active="isActive" on-click="onClick()" is-opened="isOpened" has-children="hasChildren"></tree-item>'))(scope);
            scope.$digest();

            controller = element.controller('treeItem');
        });
        it('should return the proper tree display for the entity', function() {
            var result = controller.getTreeDisplay({'@id': ''});
            expect(typeof result).toBe('string');
        });
        describe('toggleOpen method', function() {
            it('should return true when not set', function() {
                controller.toggleOpen();
                expect(controller.isOpened).toBe(true);
            });
            it('should return true if it is false', function() {
                controller.isOpened = false;
                controller.toggleOpen();
                expect(controller.isOpened).toBe(true);
            });
            it('should return false if it is true', function() {
                controller.isOpened = true;
                controller.toggleOpen();
                expect(controller.isOpened).toBe(false);
            });
        });
        it('should call toggleOpen when double clicked', function() {
            spyOn(controller, 'toggleOpen');
            var anchor = element.querySelectorAll('a')[0];
            angular.element(anchor).triggerHandler('dblclick');
            expect(controller.toggleOpen).toHaveBeenCalled();
        });
    });
});