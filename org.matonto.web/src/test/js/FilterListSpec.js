describe('Filter List directive', function() {
    var $compile,
        scope;

    mockCatalogManager();
    beforeEach(function() {
        module('filterList');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/catalog/directives/filterList/filterList.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.filters = {};
            scope.results = {};
            scope.clickFilter = jasmine.createSpy('clickFilter');

            this.element = $compile(angular.element('<filter-list filters="filters" results="results" click-filter="clickFilter()"></filter-list>'))(scope);
            scope.$digest();
        });

        it('clickFilter should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickFilter();

            expect(scope.clickFilter).toHaveBeenCalled();
        });
        it('filters should be two way bound', function() {
            var controller = this.element.controller('filterList');
            controller.filters = {Resources: []};
            scope.$digest();
            expect(scope.filters).toEqual({Resources: []});
        });
        it('results should be two way bound', function() {
            var controller = this.element.controller('filterList');
            controller.results = {results: []};
            scope.$digest();
            expect(scope.results).toEqual({results: []});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.filters = {Resources: [{applied: true}, {applied: false}]};
            scope.results = {results: [{'type': 'test'}]};
            scope.clickFilter = jasmine.createSpy('clickFilter');

            this.element = $compile(angular.element('<filter-list filters="filters" results="results" click-filter="clickFilter()"></filter-list>'))(scope);
            scope.$digest();
        });
        it('should the count of how many resources match the filter', function() {
            var controller = this.element.controller('filterList');
            var result = controller.getCount('Resources', {value: 'test'});

            expect(typeof result).toBe('number');
        });
        it('should get lists of the applied filter values', function() {
            var controller = this.element.controller('filterList');
            var result = controller.getAppliedFilters();

            expect(typeof result).toBe('object');
            expect(_.keys(result)).toEqual(_.keys(controller.filters));
            _.forEach(function(value) {
                var applied = value.filter(function(option) {
                    return option.applied;
                });
                expect(result[key].length).toEqual(applied.length);
            });
        });
        it('should test whether an option should be hidden', function() {
            var controller = this.element.controller('filterList');
            var result = controller.isHidden('Resources', {applied: false});
            expect(result).toBe(true);
            controller.filters.Resources = [];
            result = controller.isHidden('Resources', {applied: false});
            expect(result).toBe(false);
        });
        it('should update the applied value for an option', function() {
            var controller = this.element.controller('filterList');
            var option = controller.filters.Resources[1];
            controller.updateApplied('Resources', option);
            expect(option.applied).toBe(true);
            _.forEach(controller.filters.Resources, function(opt) {
                if (!_.isEqual(opt, option)) {
                    expect(opt.applied).toBe(false);
                }
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.filters = {Resources: [{applied: true}, {applied: false}]};
            scope.results = {results: [{'type': 'test'}]};
            scope.clickFilter = jasmine.createSpy('clickFilter');

            this.element = $compile(angular.element('<filter-list filters="filters" results="results" click-filter="clickFilter()"></filter-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('filters')).toBe(true);
        });
        it('with the correct number of filters', function() {
            var controller = this.element.controller('filterList');
            var filters = this.element.querySelectorAll('.filter');
            expect(filters.length).toBe(_.keys(controller.filters).length);
            for (var i = 0; i < filters.length; i++) {
                var key = _.keys(controller.filters)[i];
                expect(filters[i].querySelectorAll('.filter-header').length).toBe(1);
                expect(filters[i].querySelectorAll('.filter-options').length).toBe(1);
                expect(filters[i].querySelectorAll('li').length).toBe(controller.filters[key].length);
            }
        });
        it('with the correct classes depending on whether an option is applied', function() {
            var controller = this.element.controller('filterList');
            var filters = this.element.querySelectorAll('.filter');
            for (var i = 0; i < filters.length; i++) {
                var key = _.keys(controller.filters)[i];
                var options = filters[i].querySelectorAll('.filter-options li');
                for (var j = 0; j < options.length; j++) {
                    var el = angular.element(options[j]);
                    var i = angular.element(el.find('i')[0]);
                    if (controller.filters[key][j].applied) {
                        expect(el.hasClass('applied')).toBe(true);
                        expect(el.hasClass('not-applied')).toBe(false);
                        expect(i.hasClass('fa-times-circle')).toBe(true);
                        expect(i.hasClass('fa-plus-circle')).toBe(false);
                    } else {
                        expect(el.hasClass('applied')).toBe(false);
                        expect(el.hasClass('not-applied')).toBe(true);
                        expect(i.hasClass('fa-times-circle')).toBe(false);
                        expect(i.hasClass('fa-plus-circle')).toBe(true);
                    }
                }
            }
        });
        it('with a triangle if an option is applied', function() {
            var controller = this.element.controller('filterList');
            var filters = this.element.querySelectorAll('.filter');
            for (var i = 0; i < filters.length; i++) {
                var key = _.keys(controller.filters)[i];
                var options = filters[i].querySelectorAll('.filter-options li');
                for (var j = 0; j < options.length; j++) {
                    var el = angular.element(options[j]);
                    if (controller.filters[key][j].applied) {
                        expect(el.querySelectorAll('.triangle-right').length).toBe(1);
                    } else {
                        expect(el.querySelectorAll('.triangle-right').length).toBe(0);
                    }
                }
            }
        });
    });
    it('should call clickFilter when a filter option is clicked', function() {
        scope.filters = {Resources: [{applied: true}]};
        scope.results = {};
        scope.clickFilter = jasmine.createSpy('clickFilter');

        var element = $compile(angular.element('<filter-list filters="filters" results="results" click-filter="clickFilter()"></filter-list>'))(scope);
        scope.$digest();
        
        var option = element.querySelectorAll('.filter .filter-options li a')[0];
        angular.element(option).triggerHandler('click');

        expect(scope.clickFilter).toHaveBeenCalled();
    });
});