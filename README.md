# MatOnto

A decentralized, federated and distributed framework for the materials design community. 

## Getting Started

To build the MatOnto source code, you must have the following software and tools installed.

| Technology  | Version  | Download Link  |
| ----------- | -------- | -------------- |
| Java        | 8        | http://www.oracle.com/technetwork/java/javase/downloads/index.html  |
| Maven       | 3.1+      | https://maven.apache.org/download.cgi  |
| Node.js     | 4.*      | https://nodejs.org/en/download/  |

Clone the MatOnto project from git and navigate to that directory on your machine. Run the following command to build the source:

```
mvn clean install
```

The build creates the MatOnto distribution as both a `.tar.gz` file and a `.zip` file in the
`org.matonto.distribution/target` directory. Extract one of the files and navigate into that directory.

Inside the extracted distribution directory, start up the MatOnto Karaf instance. The distribution is configured to
automatically deploy the required bundles and services to the runtime using Karaf features. To start the runtime,
simply open the command line interface and run the start script.

For Unix/Linux:

```
bin/start
```

or for Windows:

```
bin\start.bat
```

The MatOnto web application should now be accessible at `https://localhost:8443/matonto/index.html`.

To stop the server, use the respective stop scripts.

### Release Build

To prepare MatOnto for a release (non-snapshot) build, run the build using the `release-build` profile, i.e:

```
mvn clean install -P release-build
```

The `release-build` profile will minify the web resources and prepare karaf scripts to use release versions.

## License

MatOnto is made available under the terms of the GNU Affero General Public License (AGPL).  See LICENSE.TXT for details.

Third-party library licenses and acknowledgements are detailed in `legal/THIRD-PARTY.txt` and `legal/THIRD-PARTY-ETC.txt`.
