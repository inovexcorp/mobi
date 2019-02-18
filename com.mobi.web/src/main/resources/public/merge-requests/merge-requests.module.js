(function() {
    'use strict';

    angular
        .module('merge-requests', [
            /* Custom Directives */
            'commentDisplay',
            'createRequest',
            'editRequestOverlay',
            'mergeRequestDiscussion',
            'mergeRequestList',
            'mergeRequestsPage',
            'mergeRequestTabset',
            'mergeRequestView',
            'replyComment',
            'requestBranchSelect',
            'requestDetailsForm',
            'requestRecordSelect'
        ]);
})();
