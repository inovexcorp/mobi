describe('Annotation Tab directive', function() {
    var $compile,
        scope,
        element,
        annotations = [{ localName: 'prop1' }, { localName: 'prop2' }];

    beforeEach(function() {
        module('annotationTab');

        module(function($provide) {
            $provide.value('beautifyFilter', jasmine.createSpy('beautifyFilter'));
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
        it('for a ANNOTATION-TAB', function() {
            expect(element.prop('tagName')).toBe('ANNOTATION-TAB');
        });
        it('based on annotation button', function() {
            var button = element.querySelectorAll('.btn-annotation');
            expect(button.length).toBe(1);
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
            var editButtons = element.querySelectorAll('.btn-edit');
            expect(editButtons.length).toBe(1);
            var deleteButtons = element.querySelectorAll('.btn-delete');
            expect(deleteButtons.length).toBe(2);
        });
    });
    describe('parent controller functions', function() {
        beforeEach(function() {
            scope.vm = {
                editClicked: jasmine.createSpy('editClicked'),
                removeAnnotation: jasmine.createSpy('removeAnnotation'),
                getItemIri: function(key) { return key.localName; },
                getAnnotationLocalNameLowercase: function(key) { return key.localName; },
                selected: {
                    'prop1': [{'@value': 'value1'}]
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
        it('should call vm.editClicked when edit button clicked', function() {
            var editButtons = element.querySelectorAll('.btn-edit');
            expect(editButtons.length).toBe(1);
            angular.element(editButtons[0]).triggerHandler('click');
            expect(scope.vm.editClicked).toHaveBeenCalled();
        });
        it('should call vm.removeAnnotation when remove button clicked', function() {
            var deleteButtons = element.querySelectorAll('.btn-delete');
            expect(deleteButtons.length).toBe(1);
            angular.element(deleteButtons[0]).triggerHandler('click');
            expect(scope.vm.removeAnnotation).toHaveBeenCalled();
        });
    });
});