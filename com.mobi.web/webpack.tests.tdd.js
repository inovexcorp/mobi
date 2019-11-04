import './src/main/resources/public/main';
import 'angular-mocks';

var testsContext = require.context('./src/main/resources/public', true, /spec$/);
testsContext.keys().forEach(testsContext);