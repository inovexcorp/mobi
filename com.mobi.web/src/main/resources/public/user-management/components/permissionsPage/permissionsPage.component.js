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
     * @name user-management.component:permissionsPage
     * @requires shared.service:policyManagerService
     * @requires shared.service:catalogManagerService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     * @requires shared.service:userManagerService
     *
     * @description
     * `permissionsPage` is a component that creates a Bootstrap `row` div with a single column containing a
     * {@link shared.component:block block} for viewing and updating overall permissions from policies retrieved through
     * the {@link shared.service:policyManagerService}. The list is refreshed everytime this component is rendered for
     * the first time so any changes made to the policies will reset when navigating away and back. Currently, the only
     * policies displayed are those for restrictions on record creation.
     */
    const permissionsPageComponent = {
        templateUrl: 'user-management/components/permissionsPage/permissionsPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: permissionsPageComponentCtrl
    };

    permissionsPageComponentCtrl.$inject = ['$q', 'policyManagerService', 'catalogManagerService', 'utilService', 'prefixes', 'userManagerService'];

    function permissionsPageComponentCtrl($q, policyManagerService, catalogManagerService, utilService, prefixes, userManagerService) {
        var dvm = this;
        var pm = policyManagerService;
        var um = userManagerService;
        var util = utilService;
        var catalogId = '';
        var action = pm.actionCreate;
        var groupAttributeId = 'http://mobi.com/policy/prop-path(' + encodeURIComponent('^<' + prefixes.foaf + 'member' + '>') + ')';
        var userRole = 'http://mobi.com/roles/user';

        dvm.policies = [];

        dvm.$onInit = function() {
            catalogId = _.get(catalogManagerService.localCatalog, '@id', '');
            setPolicies();
        }
        dvm.updatePolicy = function(item, policyIndex) {
            item.changed = true;
            dvm.policies[policyIndex] = item;
        }
        dvm.getTitle = function(item) {
            return util.getBeautifulIRI(item.type);
        }
        dvm.saveChanges = function() {
            var changedPolicies = _.filter(dvm.policies, 'changed');
            $q.all(_.map(changedPolicies, item => pm.updatePolicy(item.policy)))
                .then(() => {
                    _.forEach(changedPolicies, item => item.changed = false);
                    util.createSuccessToast('Permissions updated');
                }, util.createErrorToast);
        }
        dvm.hasChanges = function() {
            return _.some(dvm.policies, 'changed');
        }

        function setPolicies() {
            dvm.policies = [];
            pm.getPolicies(catalogId, undefined, action)
                .then(result => {
                    dvm.policies = _.chain(result)
                        .map(policy => ({
                            policy,
                            id: policy.PolicyId,
                            type: getRecordType(policy),
                            changed: false,
                            everyone: false,
                            users: [],
                            groups: [],
                            selectedUsers: [],
                            selectedGroups: [],
                            userSearchText: '',
                            groupSearchText: '',
                            selectedUser: undefined,
                            selectedGroup: undefined
                        }))
                        .filter('type')
                        .forEach(setInfo)
                        .value();
                }, util.createErrorToast);
        }
        function getRecordType(policy) {
            return _.chain(policy)
                .get('Target.AnyOf', [])
                .map('AllOf').flatten()
                .map('Match').flatten()
                .find(['AttributeDesignator.AttributeId', prefixes.rdf + 'type'])
                .get('AttributeValue.content', [])
                .head()
                .value();
        }
        function setInfo(item) {
            var matches = _.chain(item.policy)
                .get('Rule[0].Target.AnyOf[0].AllOf', [])
                .map('Match[0]')
                .map(match => ({
                    id: _.get(match, 'AttributeDesignator.AttributeId'),
                    value: _.get(match, 'AttributeValue.content[0]')
                }))
                .value();
            if (_.find(matches, {id: prefixes.user + 'hasUserRole', value: userRole})) {
                item.everyone = true;
            } else {
                item.selectedUsers = sortUsers(_.chain(matches)
                    .filter({id: pm.subjectId})
                    .map(obj => _.find(um.users, {iri: obj.value}))
                    .reject(_.isNull)
                    .value());
                item.selectedGroups = sortGroups(_.chain(matches)
                    .filter({id: groupAttributeId})
                    .map(obj => _.find(um.groups, {iri: obj.value}))
                    .reject(_.isNull)
                    .value());
            }
            item.users = sortUsers(_.difference(um.users, item.selectedUsers));
            item.groups = sortGroups(_.difference(um.groups, item.selectedGroups));
        }
        function sortUsers(users) {
            return _.sortBy(users, 'username');
        }
        function sortGroups(groups) {
            return _.sortBy(groups, 'title');
        }
    }

    angular.module('user-management')
        .component('permissionsPage', permissionsPageComponent);
})();
