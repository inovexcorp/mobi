describe('User State service', function() {
    var userStateSvc;

    beforeEach(function() {
        module('userState');

        inject(function(userStateService) {
            userStateSvc = userStateService;
        });
    });

    afterEach(function() {
        userStateSvc = null;
    });

    it('should reset variables', function() {
        userStateSvc.reset();
        expect(userStateSvc.selectedGroup).toBeUndefined();
        expect(userStateSvc.selectedUser).toBeUndefined();
        expect(userStateSvc.filteredGroupList).toBe(true);
    });
});