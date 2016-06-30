# MatOnto

A decentralized, federated and distributed framework for the materials design community. 

## Getting Started

To build the MatOnto source code, you must have the following software and tools installed.

| Technology  | Version  | Download Link  |
| ----------- | -------- | -------------- |
| Java        | 8        | http://www.oracle.com/technetwork/java/javase/downloads/index.html  |
| Maven       | 3.*      | https://maven.apache.org/download.cgi  |
| Node.js     | 4.*      | https://nodejs.org/en/download/  |

Clone the MatOnto project from git and navigate to that directory on your machine. Run the following command to build the source:

```
mvn clean install
```

The build creates the MatOnto distribution as both a `.tar.gz` file and a `.zip` file in the
`org.matonto.distribution/target` directory. Extract one of the files and navigate into that directory.

Inside the extracted distribution directory, start up the MatOnto Karaf instance and open the command line
interface. For Unix/Linux:

```
bin/start
bin/client -u karaf
```

or for Windows:

```
bin\start.bat
bin\client.bat -u karaf -h 127.0.0.1
```

You should see the following information on the command line console:

```

 ,--.   ,--.          ,--.   ,-----.           ,--.
 |   `.'   | ,--,--.,-'  '-.'  .-.  ',--,--, ,-'  '-. ,---.
 |  |'.'|  |' ,-.  |'-.  .-'|  | |  ||      |'-.  .-'| .-. |
 |  |   |  |` '-'  |  |  |  '  '-'  '|  ||  |  |  |  ' '-' '
 `--'   `--' `--`--'  `--'   `-----' `--''--'  `--'   `---'


  Apache Karaf (4.0.2)

Hit '<tab>' for a list of available commands
and '[cmd] --help' for help on a specific command.
Hit '<ctrl-d>' or 'osgi:shutdown' to shutdown MatOnto.

karaf@matonto-framework>
```

To deploy all the MatOnto bundles and services use the following command:

```
matonto-deploy-bundles
```

This command uses OBR to deploy the MatOnto bundles and their dependencies.

The MatOnto web application should now be accessible at `https://localhost:8443/matonto/index.html`.

## License

MatOnto is made available under the terms of the GNU Affero General Public License (AGPL).  See LICENSE.TXT for details.

Third-party library licenses and acknowledgements are detailed in `legal/THIRD-PARTY.txt` and `legal/THIRD-PARTY-ETC.txt`.