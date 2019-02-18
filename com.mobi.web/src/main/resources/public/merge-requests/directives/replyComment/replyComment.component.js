(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name replyComment
         *
         * @description
         * The `replyComment` module only provides the `replyComment` component which creates a display for replying
         * to comments on a Merge Request.
         */
        .module('replyComment', [])
        /**
         * @ngdoc component
         * @name replyComment.component:replyComment
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires util.service:utilService
         *
         * @description
         * `replyComment` is a component which creates a div containing a box indicating a reply can be made. Once that
         * box is clicked, it is replaced with a {@link markdownEditor.component:markdownEditor} for submitting a reply
         * to the provided parent comment of the provided request.
         *
         * @param {Object} request An object representing the Merge Request with the parent comment
         * @param {string} parentId The IRI id of the parent comment this component will reply to
         */
        .component('replyComment', {
            bindings: {
                request: '=',
                parentId: '<',
            },
            controllerAs: 'dvm',
            controller: ['$q', 'mergeRequestManagerService', 'utilService', ReplyCommentController],
            templateUrl: 'merge-requests/directives/replyComment/replyComment.component.html',
        });

    function ReplyCommentController($q, mergeRequestManagerService, utilService) {
        var dvm = this;
        var mm = mergeRequestManagerService;
        var util = utilService;
        dvm.edit = false;
        dvm.replyComment = '';

        dvm.reply = function() {
            mm.createComment(dvm.request.jsonld['@id'], dvm.replyComment, dvm.parentId)
                .then(() => {
                    dvm.replyComment = '';
                    dvm.edit = false;
                    return mm.getComments(dvm.request.jsonld['@id']);
                }, $q.reject)
                .then(comments => {
                    dvm.request.comments = comments;
                }, util.createErrorToast);
        }
        dvm.cancel = function() {
            dvm.replyComment = '';
            dvm.edit = false;
        }
    }
})();