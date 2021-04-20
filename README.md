![Mobi Logo](com.mobi.web/src/main/resources/public/images/mobi-primary-logo.png?raw=true "Mobi")
***

Mobi is a collaborative knowledge graph platform for teams and communities to develop and publish semantic data and models.

Mobi is built on open semantic web technologies and standards like RDF, OWL, and SPARQL. It provides a collaborative environment for creating, publishing, and consuming OWL ontologies and SKOS vocabularies.
See https://mobi.inovexcorp.com/ for more information.

## Getting Started

To build the Mobi source code, you must have the following software and tools installed.

| Technology  | Version  | Download Link  |
| ----------- | -------- | -------------- |
| Java        | 8        | http://www.oracle.com/technetwork/java/javase/downloads/index.html  |
| Maven       | 3.1+      | https://maven.apache.org/download.cgi  |
| Node.js     | 10+      | https://nodejs.org/en/download/  |
| Google Chrome | 87+ | https://www.google.com/chrome/ |

Clone the Mobi project from git and navigate to that directory on your machine. Run the following command to build the source:

```
mvn clean install
```

The build creates the Mobi distribution as both a `.tar.gz` file and a `.zip` file in the
`mobi-distribution/target` directory. Extract one of the files and navigate into that directory.

Inside the extracted distribution directory, start up the Mobi Karaf instance. The distribution is configured to automatically deploy the required bundles and services to the runtime using Karaf features. To start the runtime, simply open the command line interface and run the start script.

For Unix/Linux:

```
bin/start
```

or for Windows:

```
bin\start.bat
```

The Mobi web application should now be accessible at `https://localhost:8443/mobi/index.html`.

To stop the server, use the respective stop scripts.

### Release Build

To prepare Mobi for a release (non-snapshot) build, run the build using the `release-build` profile, i.e:

```
mvn clean install -P release-build
```

The `release-build` profile will minify the web resources and prepare karaf scripts to use release versions.

### Running Integration Tests

Integration tests are controlled by the `skipITs` system property and are disabled by default. To run integration tests as part of the build, set the property to false:

```
mvn clean install -DskipITs=false
```

### Running Function Tests

Functional tests run tests against a browser and are controlled by the `skipFunctional` system property and are disabled by default. To run integration tests as part of the build, set the property to false:

```
mvn clean install -DskipFunctional=false
```

## Docker

Mobi is also available as a Docker image. Visit https://hub.docker.com/r/inovexis/mobi/ to find available images. Images can also be built locally. See the `mobi-distribution` module for more information.

## License

Mobi is made available under the terms of the GNU Affero General Public License (AGPL).  See LICENSE.TXT for details.

Third-party library licenses and acknowledgements are detailed in `legal/THIRD-PARTY.txt` and `legal/THIRD-PARTY-ETC.txt`.
