(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name home.component:activityTitle
     * @requires provManager.service:provManagerService
     * @requires util.service:utilService
     * @requires userManager.service:userManagerService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `activityTitle` is a component which creates a `div` containing a title for the provided `Activity` using
     * the username of the associated user, the word associated with the type of Activity, and the titles of the
     * main associated `Entities`. The word and the predicate to retrieve `Entities` with are collected from the
     * {@link provManager.service:provManagerService provManagerService}.
     *
     * @param {Object} activity A JSON-LD object of an `Activity`
     * @param {Object[]} entities An array of JSON-LD objects of `Entities`
     */
    const activityTitleComponent = {
        templateUrl: 'home/components/activityTitle/activityTitle.component.html',
        bindings: {
            activity: '<',
            entities: '<'
        },
        controllerAs: 'dvm',
        controller: activityTitleComponentCtrl
    };

    activityTitleComponentCtrl.$inject = ['provManagerService', 'utilService', 'userManagerService', 'prefixes'];

    function activityTitleComponentCtrl(provManagerService, utilService, userManagerService, prefixes) {
        var dvm = this;
        var um = userManagerService;
        var util = utilService;
        var pm = provManagerService;
        dvm.username = '(None)';
        dvm.word = 'affected';
        dvm.entitiesStr = '(None)';

        dvm.$onInit = function() {
            setUsername(util.getPropertyId(dvm.activity, prefixes.prov + 'wasAssociatedWith'));
            setWord(dvm.activity);
            setEntities(dvm.activity);
        }

        dvm.$onChanges = function(changesObj) {
            if (changesObj.activity) {
                setUsername(util.getPropertyId(changesObj.activity.currentValue, prefixes.prov + 'wasAssociatedWith'));
                setWord(changesObj.activity.currentValue);
                setEntities(changesObj.activity.currentValue);
            }
        }

        function setEntities(activity) {
            var types = _.get(activity, '@type', []);
            var pred = '';
            _.forEach(pm.activityTypes, obj => {
                if (_.includes(types, obj.type)) {
                    pred = obj.pred;
                    return false;
                }
            });
            var entityTitles = _.map(_.get(activity, "['" + pred + "']", []), idObj => {
                var entity = _.find(dvm.entities, {'@id': idObj['@id']});
                return util.getDctermsValue(entity, 'title');
            });
            dvm.entitiesStr = _.join(entityTitles, ', ').replace(/,(?!.*,)/gmi, ' and') || '(None)';
        }
        function setUsername(iri) {
            if (iri) {
                dvm.username = _.get(_.find(um.users, {iri}), 'username', '(None)');
            } else {
                dvm.username = '(None)';
            }
        }
        function setWord(activity) {
            var types = _.get(activity, '@type', []);
            _.forEach(pm.activityTypes, obj => {
                if (_.includes(types, obj.type)) {
                    dvm.word = obj.word;
                    return false;
                }
            });
        }
    }

    angular.module('home')
        .component('activityTitle', activityTitleComponent);
})();