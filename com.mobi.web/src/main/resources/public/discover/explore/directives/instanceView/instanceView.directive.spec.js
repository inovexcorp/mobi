describe('Instance View directive', function() {
    var $compile, scope, discoverStateSvc, exploreUtilsSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('instanceView');
        mockDiscoverState();
        mockUtil();
        mockExploreUtils();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _exploreUtilsService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreUtilsSvc = _exploreUtilsService_;
            prefixes = _prefixes_;
        });

        discoverStateSvc.getInstance.and.returnValue({
            '@id': 'ignored',
            '@type': ['ignored'],
            prop1: [{
                '@id': 'http://mobi.com/id'
            }],
            prop2: [{
                '@value': 'value1'
            }, {
                '@value': 'value2'
            }]
        });
        discoverStateSvc.explore.instance.metadata.instanceIRI = 'instanceIRI';
        exploreUtilsSvc.getReification.and.callFake(function(arr, sub, pred, value) {
            if (_.isEqual(value, {'@value': 'value1'})) {
                return {prop3: [{'@value': 'value3'}]};
            }
            return undefined;
        });
        this.element = $compile(angular.element('<instance-view></instance-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceView');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        exploreUtilsSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-view')).toBe(true);
        });
        it('for a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(this.element.find('breadcrumbs').length).toBe(1);
        });
        it('with a .float-right.edit-button', function() {
            expect(this.element.querySelectorAll('.float-right.edit-button').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a .row', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a .col-8.offset-2', function() {
            expect(this.element.querySelectorAll('.col-8.offset-2').length).toBe(1);
        });
        it('with a h2', function() {
            expect(this.element.find('h2').length).toBe(1);
        });
        it('with a small', function() {
            expect(this.element.find('small').length).toBe(1);
        });
        it('with three h3.property', function() {
            expect(this.element.querySelectorAll('h3.property').length).toBe(3);
        });
        it('with three ul.values', function() {
            expect(this.element.querySelectorAll('ul.values').length).toBe(3);
        });
        it('with a .values.show-link', function() {
            expect(this.element.querySelectorAll('.values.show-link').length).toBe(1);

            discoverStateSvc.getInstance.and.returnValue({
                '@id': 'ignored',
                '@type': ['ignored'],
                'prop1': [{
                    '@id': 'http://mobi.com/id'
                }]
            });
            this.element = $compile(angular.element('<instance-view></instance-view>'))(scope);
            scope.$digest();

            expect(this.element.querySelectorAll('.values.show-link').length).toBe(0);
        });
        it('with a .values.show-more', function() {
            expect(this.element.querySelectorAll('.values.show-more').length).toBe(0);
            angular.element(this.element.querySelectorAll('.link')[0]).triggerHandler('click');
            expect(this.element.querySelectorAll('.values.show-more').length).toBe(1);
        });
        it('with three li.link-containers', function() {
            expect(this.element.querySelectorAll('li.link-container').length).toBe(3);
        });
        it('with three a.links', function() {
            expect(this.element.querySelectorAll('a.link').length).toBe(3);
        });
        it('with a a.more', function() {
            expect(this.element.querySelectorAll('a.more').length).toBe(0);
            angular.element(this.element.querySelectorAll('.link')[0]).triggerHandler('click');
            expect(this.element.querySelectorAll('a.more').length).toBe(1);
        });
        it('depending on whether reification statements are shown', function() {
            var showReification = angular.element(this.element.querySelectorAll('.show-reification')[0]);
            var icon = angular.element(showReification.children()[0]);
            expect(icon.hasClass('fa-angle-down')).toBe(true);
            expect(icon.hasClass('fa-angle-up')).toBe(false);

            showReification.triggerHandler('click');
            expect(icon.hasClass('fa-angle-down')).toBe(false);
            expect(icon.hasClass('fa-angle-up')).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('getLimit returns the proper value when limit and array.length are', function() {
            it('equal', function() {
                expect(this.controller.getLimit(['', ''], 2)).toBe(1);
            });
            it('not equal', function() {
                expect(this.controller.getLimit(['', ''], 1)).toBe(2);
            });
        });
        it('getReification should retrieve the Statement object for a property value', function() {
            var statement = {
                '@id': 'test',
                '@type': ['Statement'],
                prop3: [{'@value': 'value'}],
            };
            statement[prefixes.rdf + 'subject'] = [{'@id': 'subject'}];
            statement[prefixes.rdf + 'predicate'] = [{'@id': 'predicate'}];
            statement[prefixes.rdf + 'object'] = [{'@value': 'value'}];
            exploreUtilsSvc.getReification.and.returnValue(statement);
            expect(this.controller.getReification('', {})).toEqual({prop3: [{'@value': 'value'}]});
            expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, discoverStateSvc.explore.instance.metadata.instanceIRI, '', {});

            exploreUtilsSvc.getReification.and.returnValue(undefined);
            expect(this.controller.getReification('', {})).toBeUndefined();
            expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, discoverStateSvc.explore.instance.metadata.instanceIRI, '', {});
        });
        it('edit sets the correct state', function() {
            discoverStateSvc.explore.editing = false;
            discoverStateSvc.explore.instance.original = [];
            this.controller.edit();
            expect(discoverStateSvc.explore.editing).toBe(true);
            expect(discoverStateSvc.explore.instance.original).toEqual(discoverStateSvc.explore.instance.entity);
        });
    });
    it('should call edit when the edit button is clicked', function() {
        spyOn(this.controller, 'edit');
        var button = angular.element(this.element.querySelectorAll('.float-right.edit-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.edit).toHaveBeenCalled();
    });
});