describe('Ontology Download Overlay directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();

    beforeEach(function() {
        module('ontologyDownloadOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.html');

    beforeEach(function() {
        element = $compile(angular.element('<ontology-download-overlay></ontology-download-overlay>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        _.forEach(['.content', 'h6', '.form-group', '.btn-container', '.error-msg'], function(item) {
            it('based on ' + item, function() {
                var items = element.querySelectorAll(item);
                expect(items.length).toBe(1);
            });
        });
    });

    describe('has-error class', function() {
        it('is not there when variable is undefined', function() {
            var formGroup = element.querySelectorAll('.form-group');
            expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(false);
        });
        it('is there when variable is true', function() {
            scope.vm = {
                downloadForm: {
                    fileName: {
                        '$error': {
                            pattern: true
                        }
                    }
                }
            }
            scope.$digest();

            var formGroup = element.querySelectorAll('.form-group');
            expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(true);
        });
    });
});