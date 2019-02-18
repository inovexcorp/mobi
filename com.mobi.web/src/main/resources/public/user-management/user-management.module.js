(function() {
    'use strict';

    angular
        .module('user-management', [
            /* Custom directives */
            'createGroupOverlay',
            'createUserOverlay',
            'editGroupInfoOverlay',
            'editUserProfileOverlay',
            'groupsList',
            'groupsPage',
            'memberTable',
            'permissionsInput',
            'permissionsPage',
            'resetPasswordOverlay',
            'userManagementTabset',
            'usersList',
            'usersPage',

            /* Custom Filters */
            'usernameSearch'
        ]);
})();
