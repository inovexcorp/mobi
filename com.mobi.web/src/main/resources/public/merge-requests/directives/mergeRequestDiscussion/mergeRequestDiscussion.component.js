(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mergeRequestDiscussion
         *
         * @description
         * The `mergeRequestDiscussion` module only provides the `mergeRequestDiscussion` component
         * which creates a {@link materialTabset.directive:materialTabset} with tabs related to the discussion and
         * difference of a Merge Request.
         */
        .module('mergeRequestDiscussion', [])
        /**
         * @ngdoc component
         * @name mergeRequestDiscussion.component:mergeRequestDiscussion
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires util.service:utilService
         *
         * @description
         * `mergeRequestDiscussion` is a component which creates a div containing
         * {@link commentDisplay.component:commentDisplay comment displays} of the comment chains on a merge request
         * along with a {@link markdownEditor.component:markdownEditor} for making new comments and
         * {@link replyComment.component:replyComment reply comments} on comment chains. If a request is accepted,
         * no markdown editors are shown since the discussion on the request is now read only.
         *
         * @param {Object} request An object representing a Merge Request with comments
         */
        .component('mergeRequestDiscussion', {
            bindings: {
                request: '='
            },
            controllerAs: 'dvm',
            controller: ['$q', 'mergeRequestManagerService', 'utilService', MergeRequestDiscussionController],
            templateUrl: 'merge-requests/directives/mergeRequestDiscussion/mergeRequestDiscussion.component.html',
        });

    function MergeRequestDiscussionController($q, mergeRequestManagerService, utilService) {
        var dvm = this;
        var util = utilService;
        dvm.mm = mergeRequestManagerService;

        dvm.newComment = '';

        dvm.comment = function() {
            dvm.mm.createComment(dvm.request.jsonld['@id'], dvm.newComment)
                .then(() => {
                    dvm.newComment = '';
                    return dvm.mm.getComments(dvm.request.jsonld['@id']);
                }, $q.reject)
                .then(comments => {
                    dvm.request.comments = comments;
                }, util.createErrorToast);
        }
    }
})();