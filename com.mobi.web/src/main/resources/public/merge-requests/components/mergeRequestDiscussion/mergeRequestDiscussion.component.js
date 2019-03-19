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
     * @name merge-requests.component:mergeRequestDiscussion
     * @requires shared.service:mergeRequestManagerService
     * @requires shared.service:utilService
     *
     * @description
     * `mergeRequestDiscussion` is a component which creates a div containing
     * {@link commentDisplay.component:commentDisplay comment displays} of the comment chains on a merge request
     * along with a {@link shared.component:markdownEditor} for making new comments and
     * {@link replyComment.component:replyComment reply comments} on comment chains. If a request is accepted,
     * no markdown editors are shown since the discussion on the request is now read only.
     *
     * @param {Object} request An object representing a Merge Request with comments
     */
    const mergeRequestDiscussionComponent = {
        templateUrl: 'merge-requests/components/mergeRequestDiscussion/mergeRequestDiscussion.component.html',
        bindings: {
            request: '='
        },
        controllerAs: 'dvm',
        controller: mergeRequestDiscussionComponentCtrl
    };

    mergeRequestDiscussionComponent.$inject = ['$q', 'mergeRequestManagerService', 'utilService'];

    function mergeRequestDiscussionComponentCtrl($q, mergeRequestManagerService, utilService) {
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

    angular.module('merge-requests')
        .component('mergeRequestDiscussion', mergeRequestDiscussionComponent);

})();