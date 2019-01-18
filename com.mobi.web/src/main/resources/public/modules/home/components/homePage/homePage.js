/**
 * @ngdoc component
 * @name homePage.component:homePage
 *
 * @description
 * `homePage` is a component which creates the main page of the Home module. The page contains a welcome banner image
 * along with a {@link home.component:quickActionGrid grid of quick actions} and a
 * {@link home.component:activityCard list of activities} within the Mobi instance.
 */
const homePageComponent = {
    templateUrl: 'modules/home/components/homePage/homePage.html',
    bindings: {},
    controllerAs: 'dvm',
    controller: homePageComponentCtrl
};

function homePageComponentCtrl() {
    var dvm = this;
}

angular.module('catalog')
    .component('homePage', homePageComponent);
