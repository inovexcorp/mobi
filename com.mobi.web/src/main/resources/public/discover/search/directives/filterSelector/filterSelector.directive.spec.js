describe('Filter Selector directive', function() {
    var $compile, scope, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('filterSelector');
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        scope.begin = 'begin';
        scope.end = 'end';
        scope.filterType = undefined;
        scope.range = 'range';
        scope.regex = '/[a-zA-Z]/';
        scope.value = 'value';
        scope.boolean = false;
        this.element = $compile(angular.element('<filter-selector begin="begin" end="end" filter-type="filterType" range="range" regex="regex" value="value" boolean="boolean"></filter-selector>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('filterSelector');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('begin should be two way bound', function() {
            this.controller.begin = 'new-begin';
            scope.$apply();
            expect(scope.begin).toEqual('new-begin');
        });
        it('end should be two way bound', function() {
            this.controller.end = 'new-end';
            scope.$apply();
            expect(scope.end).toEqual('new-end');
        });
        it('filterType should be two way bound', function() {
            this.controller.filterType = 'new-type';
            scope.$apply();
            expect(scope.filterType).toEqual('new-type');
        });
        it('range should be one way bound', function() {
            this.controller.range = 'new-range';
            scope.$apply();
            expect(scope.range).toEqual('range');
        });
        it('regex should be two way bound', function() {
            this.controller.regex = '/[a-z]/';
            scope.$apply();
            expect(scope.regex).toEqual('/[a-z]/');
        });
        it('value should be two way bound', function() {
            this.controller.value = 'new-value';
            scope.$apply();
            expect(scope.value).toEqual('new-value');
        });
        it('boolean should be two way bound', function() {
            this.controller.boolean = true;
            scope.$apply();
            expect(scope.boolean).toEqual(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('filter-selector')).toBe(true);
        });
        describe('when isBoolean is', function() {
            describe('false', function() {
                beforeEach(function() {
                    spyOn(this.controller, 'isBoolean').and.returnValue(false);
                    scope.$apply();
                });
                it('with a custom-label', function() {
                    expect(this.element.find('custom-label').length).toBe(1);
                });
                it('with a md-select', function() {
                    expect(this.element.find('md-select').length).toBe(1);
                });
                describe('with md-options when type is', function() {
                    it('datetime-local', function() {
                        this.controller.type = 'datetime-local';
                        scope.$apply();
                        expect(this.element.find('md-option').length).toBe(7);
                    });
                    it('number', function() {
                        this.controller.type = 'number';
                        scope.$apply();
                        expect(this.element.find('md-option').length).toBe(7);
                    });
                    it('text', function() {
                        this.controller.type = 'text';
                        scope.$apply();
                        expect(this.element.find('md-option').length).toBe(4);
                    });
                });
                describe('and filterType is', function() {
                    it('Existence with a .input-container', function() {
                        this.controller.filterType = 'Existence';
                        scope.$apply();
                        expect(this.element.find('.input-container').length).toBe(0);
                    });
                    describe('Regex', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Regex';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(this.element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(this.element.find('input').length).toBe(1);
                        });
                    });
                    describe('Contains', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Contains';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(this.element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(this.element.find('input').length).toBe(1);
                        });
                    });
                    describe('Exact', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Exact';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(this.element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(this.element.find('input').length).toBe(1);
                        });
                    });
                    describe('Range', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Range';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a .range-container', function() {
                            expect(this.element.querySelectorAll('.range-container').length).toBe(1);
                        });
                        it('with md-input-containers', function() {
                            expect(this.element.find('md-input-container').length).toBe(2);
                        });
                        it('with inputs', function() {
                            expect(this.element.find('input').length).toBe(2);
                        });
                    });
                });
            });
            describe('true', function() {
                beforeEach(function() {
                    spyOn(this.controller, 'isBoolean').and.returnValue(true);
                    scope.$apply();
                });
                it('with a custom-label', function() {
                    expect(this.element.find('custom-label').length).toBe(1);
                });
                it('with a md-select', function() {
                    expect(this.element.find('md-select').length).toBe(1);
                });
                it('with md-options', function() {
                    expect(this.element.find('md-option').length).toBe(2);
                });
            });
        });
    });
    describe('controller methods', function() {
        it('needsOneInput should return whether or not the value is in the array', function() {
            ['Contains', 'Exact', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to'].forEach(function(item) {
                this.controller.filterType = item;
                expect(this.controller.needsOneInput()).toBe(true);
            }, this);
            this.controller.filterType = 'Other';
            expect(this.controller.needsOneInput()).toBe(false);
        });
        describe('isBoolean returns the correct value when range', function() {
            it('is xsd:boolean', function() {
                this.controller.range = prefixes.xsd + 'boolean';
                expect(this.controller.isBoolean()).toBe(true);
            });
            it('is not xsd:boolean', function() {
                expect(this.controller.isBoolean()).toBe(false);
            });
        });
    });
});
