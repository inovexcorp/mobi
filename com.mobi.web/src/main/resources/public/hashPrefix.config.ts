hashPrefixConfig.$inject = ['$locationProvider'];

function hashPrefixConfig($locationProvider) {
    $locationProvider.hashPrefix('');
}

export default hashPrefixConfig;