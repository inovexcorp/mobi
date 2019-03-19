/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name merge-requests.component:replyComment
     * @requires shared.service:mergeRequestManagerService
     * @requires shared.service:utilService
     *
     * @description
     * `replyComment` is a component which creates a div containing a box indicating a reply can be made. Once that
     * box is clicked, it is replaced with a {@link shared.component:markdownEditor} for submitting a reply
     * to the provided parent comment of the provided request.
     *
     * @param {Object} request An object representing the Merge Request with the parent comment
     * @param {string} parentId The IRI id of the parent comment this component will reply to
     */
    const replyCommentComponent = {
        templateUrl: 'merge-requests/components/replyComment/replyComment.component.html',
        bindings: {
            request: '=',
            parentId: '<',
        },
        controllerAs: 'dvm',
        controller: replyCommentComponentCtrl
    }

    replyCommentComponent.$inject = ['$q', 'mergeRequestManagerService', 'utilService'];

    function replyCommentComponentCtrl($q, mergeRequestManagerService, utilService) {
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

    angular.module('merge-requests')
        .component('replyComment', replyCommentComponent);
})();