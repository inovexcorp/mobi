describe('Class Tree directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('classTree');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.vm = {
            ontologies: [
                {
                    matonto: {
                        classes: ['class1', 'class2']
                    }
                }
            ]
        }

    });

    injectDirectiveTemplate('modules/ontology-editor/directives/classTree/classTree.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<class-tree></class-tree>'))(scope);
            scope.$digest();
        });
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
            expect(uls.length).toBe(2);
        });
        it('based on container tree-items', function() {
            var lis = element.querySelectorAll('.container tree-item');
            expect(lis.length).toBe(scope.vm.ontologies[0].matonto.classes.length);
        });
    });
});