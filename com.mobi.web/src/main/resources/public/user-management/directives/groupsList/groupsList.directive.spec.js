describe('Groups List directive', function() {
    var $compile, scope, userManagerSvc, userStateSvc, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('groupsList');
        mockUserManager();
        mockLoginManager();
        mockUserState();

        inject(function(_userManagerService_, _userStateService_, _loginManagerService_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<groups-list></groups-list>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('groupsList');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        userManagerSvc = null;
        userStateSvc = null;
        loginManagerSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should set the selected group when clicked', function() {
            var group = {};
            this.controller.onClick(group);
            expect(userStateSvc.selectedGroup).toEqual(group);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            userStateSvc.filteredGroupList = false;
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('groups-list')).toBe(true);
        });
        it('depending on how many groups there are', function() {
            expect(this.element.find('li').length).toBe(0);

            userManagerSvc.groups = [{title: 'group', members: []}];
            scope.$digest();
            expect(this.element.find('li').length).toBe(userManagerSvc.groups.length);
        });
        it('depending on which group is selected', function() {
            var group = {title: 'group', members: []};
            userManagerSvc.groups = [group];
            scope.$digest();
            var groupLink = angular.element(this.element.querySelectorAll('li a')[0]);
            expect(groupLink.hasClass('active')).toBe(false);

            userStateSvc.selectedGroup = group;
            scope.$digest();
            expect(groupLink.hasClass('active')).toBe(true);
        });
        it('depending on whether the list should be filtered', function() {
            loginManagerSvc.currentUser = 'user';
            userManagerSvc.groups = [{title: 'group1', members: []}, {title: 'group2', members: [loginManagerSvc.currentUser]}];
            scope.$digest();
            expect(this.element.find('li').length).toBe(userManagerSvc.groups.length);

            userStateSvc.filteredGroupList = true;
            scope.$digest();
            expect(this.element.find('li').length).toBe(userManagerSvc.groups.length - 1);
        });
        it('depending on the user search string', function() {
            var group = {title: 'user', members: []};
            userManagerSvc.groups = [group];
            userStateSvc.groupSearchString = group.title;
            scope.$digest();
            expect(this.element.find('li').length).toBe(1);

            userStateSvc.groupSearchString = 'abc';
            scope.$digest();
            expect(this.element.find('li').length).toBe(0);
        });
    });
    it('should call onClick when a group is clicked', function() {
        var group = {title: 'group', members: []};
        userStateSvc.filteredGroupList = false;
        userManagerSvc.groups = [group];
        spyOn(this.controller, 'onClick');
        scope.$digest();

        var groupLink = angular.element(this.element.querySelectorAll('li a')[0]);
        groupLink.triggerHandler('click');
        expect(this.controller.onClick).toHaveBeenCalledWith(group);
    });
});