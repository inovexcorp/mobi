import 'angular';
import 'angular-mocks';
import './src/main/resources/public/app.module';

var testsContext = require.context('./src/main/resources/public', true, /spec$/);
testsContext.keys().forEach(testsContext);