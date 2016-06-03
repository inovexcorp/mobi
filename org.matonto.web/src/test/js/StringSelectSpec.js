describe('String Select directive', function() {
    var $compile,
        scope,
        element,
        $filter;

    injectHighlightFilter();
    injectTrustedFilter();
    injectSplitIRIFilter();

    beforeEach(function() {
        module('stringSelect');

        module(function($provide) {
            $provide.value('removeIriFromArrayFilter', jasmine.createSpy('removeIriFromArrayFilter').and.callFake(function(arr) {
                return arr;
            }));
        });

        inject(function(_$compile_, _$rootScope_, _$filter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/stringSelect/stringSelect.html');

    beforeEach(function() {
        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.displayText = '';
        scope.selectList = [];
        scope.mutedText = '';

        element = $compile(angular.element('<string-select ng-model="bindModel" change-event="changeEvent" display-text="displayText" exclude-self="excludeSelf" select-list="selectList" muted-text="mutedText"></string-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        _.forEach(['displayText', 'mutedText'], function(item) {
            it(item + ' should be two way bound', function() {
                var isolatedScope = element.isolateScope();
                isolatedScope[item] = 'new value';
                scope.$digest();
                expect(scope[item]).toBe('new value');
            });
        });
        it('selectList should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.selectList = ['new value'];
            scope.$digest();
            expect(scope.selectList.length).toBe(1);
            expect(scope.selectList[0]).toBe('new value');
        });
    });
    describe('controller bound variables', function() {
        it('bindModel should be two way bound to controller', function() {
            var controller = element.controller('stringSelect');
            controller.bindModel = 'new value';
            scope.$digest();
            expect(scope.bindModel).toBe('new value');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('has form-group class', function() {
            expect(element.hasClass('form-group')).toBe(true);
        });
        _.forEach(['custom-label', 'ui-select'], function(item) {
            it('based on ' + item, function() {
                var items = element.querySelectorAll(item);
                expect(items.length).toBe(1);
            });
        });
    });
    it('makes sure getItemNamespace calls splitIRI', function() {
        scope.getItemNamespace = jasmine.createSpy('getItemNamespace');
        scope.$digest();

        var namespace = element.controller('stringSelect').getItemNamespace('test');
        expect(namespace).toBe($filter('splitIRI')('test').begin);
    });
});