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
     * @name merge-requests.component:commentDisplay
     * @requires shared.service:mergeRequestManagerService
     * @requires shared.service:userManagerService
     * @requires shared.service:loginManagerService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     * @requires shared.service:modalService
     *
     * @description
     * `commentDisplay` is a component which creates a div containing a display of the provided Comment on the
     * provided Merge Request. The display includes the user who made the comment, the datetime is was made,
     * and the body of the comment rendered as HTML Markdown. If the current user is the one who made the comment,
     * a button to remove the comment is shown on hover of the body.
     *
     * @param {Object} request An object representing the Merge Request the Comment belongs to
     * @param {Object} comment The Comment to display
     * @param {boolean} isReply Whether the Comment is a reply comment
     */
    const commentDisplayComponent = {
        templateUrl: 'merge-requests/components/commentDisplay/commentDisplay.component.html',
        bindings: {
            request: '<',
            comment: '<',
            isReply: '<',
            updateRequest: '&'
        },
        controllerAs: 'dvm',
        controller: commentDisplayComponentCtrl
    };

    commentDisplayComponent.$inject = ['$q', 'mergeRequestManagerService', 'userManagerService', 'loginManagerService', 'utilService', 'prefixes', 'modalService', 'showdown'];

    function commentDisplayComponentCtrl($q, mergeRequestManagerService, userManagerService, loginManagerService, utilService, prefixes, modalService, showdown) {
        var dvm = this;
        var um = userManagerService;
        var lm = loginManagerService;
        var util = utilService;
        dvm.mm = mergeRequestManagerService;
        dvm.converter = new showdown.Converter();
        dvm.converter.setFlavor('github');

        dvm.getCreator = function() {
            var iri = getCreatorIRI();
            return _.get(_.find(um.users, {iri}), 'username', '(Unknown)');
        }
        dvm.getComment = function() {
            return dvm.converter.makeHtml(util.getDctermsValue(dvm.comment, 'description'));
        }
        dvm.getIssued = function() {
            return util.getDctermsValue(dvm.comment, 'issued');
        }
        dvm.isCreator = function() {
            return lm.currentUserIRI === getCreatorIRI();
        }
        dvm.confirmDelete = function() {
            modalService.openConfirmModal('<p>Are you sure you want to delete this comment?</p>', dvm.deleteComment);
        }
        dvm.deleteComment = function() {
            dvm.mm.deleteComment(dvm.request.jsonld['@id'], dvm.comment['@id'])
                .then(() => dvm.mm.getComments(dvm.request.jsonld['@id']), $q.reject)
                .then(comments => {
                    dvm.request.comments = comments;
                    dvm.updateRequest({value: dvm.request});
                }, util.createErrorToast);
        }

        function getCreatorIRI() {
            return util.getDctermsId(dvm.comment, 'creator');
        }
    }

    angular.module('merge-requests')
        .component('commentDisplay', commentDisplayComponent);
})();