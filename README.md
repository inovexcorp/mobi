# Mobi

Mobi is a decentralized, federated, and distributed graph data platform for teams and communities to publish and discover data, data models, and analytics that are instantly consumable.

See https://mobi.inovexcorp.com/ for more information.

## Getting Started

To build the Mobi source code, you must have the following software and tools installed.

| Technology  | Version  | Download Link  |
| ----------- | -------- | -------------- |
| Java        | 8        | http://www.oracle.com/technetwork/java/javase/downloads/index.html  |
| Maven       | 3.1+      | https://maven.apache.org/download.cgi  |
| Node.js     | 6+      | https://nodejs.org/en/download/  |

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

### Image Caching

The build caches minified image files to improve performance. If you build the project in more than one location on your machine, you may have to clear the frontend cache of optimized images. To do this, you will have to run a Gulp command. If you have Node.js installed, run the following command to install `gulp` globally.

```
npm install -g gulp

```

*NOTE: This action may have to be run as root.*

Once `gulp` is installed, the image cache can be cleared by navigating into the `com.mobi.web` directory and running the following command.

```
gulp clearcache
```

## Docker

Mobi is also availble as a Docker image. Visit https://hub.docker.com/r/inovexis/mobi/ to find available images. Images can also be built locally. See the `mobi-distribution` module for more information.

## License

Mobi is made available under the terms of the GNU Affero General Public License (AGPL).  See LICENSE.TXT for details.

Third-party library licenses and acknowledgements are detailed in `legal/THIRD-PARTY.txt` and `legal/THIRD-PARTY-ETC.txt`.
