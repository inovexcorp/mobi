describe('Annotation Tab directive', function() {
    var $compile,
        scope,
        element,
        annotations = [{ localName: 'prop1' }, { localName: 'prop2' }];

    injectBeautifyFilter();

    beforeEach(function() {
        module('annotationTab');

        module(function($provide) {
            $provide.value('showAnnotationsFilter', jasmine.createSpy('showAnnotationsFilter').and.callFake(function(obj, arr) {
                return obj ? annotations : [];
            }));
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/annotationTab/annotationTab.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.vm = {
                getItemIri: function(key) { return key.localName; },
                getAnnotationLocalNameLowercase: function(key) { return key.localName; },
                selected: {
                    'prop1': [{'@id': 'value1'}],
                    'prop2': [{'@value': 'value2'}]
                },
                ontology: {
                    matonto: {
                        annotations: [
                            'prop1'
                        ]
                    }
                }
            }
            element = $compile(angular.element('<annotation-tab></annotation-tab>'))(scope);
            scope.$digest();
        });
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on annotation button', function() {
            var icon = element.querySelectorAll('.fa-plus');
            expect(icon.length).toBe(1);
        });
        it('based on listed annotations', function() {
            var formList = element.querySelectorAll('.annotation');
            expect(formList.length).toBe(2);

            scope.vm = {};
            scope.$digest();
            formList = element.querySelectorAll('.annotation');
            expect(formList.length).toBe(0);
        });
        it('based on values', function() {
            var values = element.querySelectorAll('.value-container');
            expect(values.length).toBe(2);
        });
        it('based on buttons', function() {
            var editButtons = element.querySelectorAll('[title=Edit]');
            expect(editButtons.length).toBe(1);
            var deleteButtons = element.querySelectorAll('[title=Delete]');
            expect(deleteButtons.length).toBe(2);
        });
    });
    describe('parent controller functions', function() {
        beforeEach(function() {
            scope.vm = {
                editClicked: jasmine.createSpy('editClicked'),
                openRemoveAnnotationOverlay: jasmine.createSpy('openRemoveAnnotationOverlay'),
                openAddAnnotationOverlay: jasmine.createSpy('openAddAnnotationOverlay'),
                getItemIri: function(key) { return key.localName; },
                getAnnotationLocalNameLowercase: function(key) { return key.localName; },
                selected: {
                    'prop1': [{'@value': 'value1'}]
                },
                ontology: {
                    matonto: {
                        annotations: ['prop1']
                    }
                }
            }
            element = $compile(angular.element('<annotation-tab></annotation-tab>'))(scope);
            scope.$digest();
        });
        it('should call vm.openAddAnnotationOverlay when add button is clicked', function() {
            var buttonContainer = element.querySelectorAll('.btn-container');
            var addButtons = buttonContainer.querySelectorAll('.btn-link');
            expect(addButtons.length).toBe(1);
            angular.element(addButtons[0]).triggerHandler('click');
            expect(scope.vm.openAddAnnotationOverlay).toHaveBeenCalled();
        });
        it('should call vm.editClicked when edit button is clicked', function() {
            var editButtons = element.querySelectorAll('[title=Edit]');
            expect(editButtons.length).toBe(1);
            angular.element(editButtons[0]).triggerHandler('click');
            expect(scope.vm.editClicked).toHaveBeenCalled();
        });
        it('should call vm.openRemoveAnnotationOverlay when remove button is clicked', function() {
            var deleteButtons = element.querySelectorAll('[title=Delete]');
            expect(deleteButtons.length).toBe(1);
            angular.element(deleteButtons[0]).triggerHandler('click');
            expect(scope.vm.openRemoveAnnotationOverlay).toHaveBeenCalled();
        });
    });
});