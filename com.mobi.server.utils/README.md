# server.utils
## Overview
The **`server.utils`** bundle provides utility functionality for generating and managing server-specific identifiers used within the Mobi platform.

## Features
* **Unique Server Identifier Generation:**
  Derives a deterministic UUID based on the machine’s MAC address.
* **MAC Address Retrieval:**
  Attempts to obtain the hardware address from the system’s active network interface.
* **Network Fallback Handling:**
  If a MAC address cannot be determined, it gracefully falls back to a randomly generated UUID.
* **Logging and Error Handling:**
  Uses SLF4J for structured logging and throws `MobiException` on recoverable network errors.

## Build
This bundle is built as part of the Mobi server project.
It is packaged as an OSGi bundle with the symbolic name:
```
com.mobi.server.utils
```
To build it directly with Maven:
```bash
mvn clean install
```

## Usage
Used as a bundle and a command line utility fat jar.

### Programmatic Usage
To generate a server-specific UUID:
```java
import com.mobi.server.utils.ServerIdUtils;
import java.util.UUID;

public class Example {
    public static void main(String[] args) {
        UUID serverId = ServerIdUtils.getServerId();
        System.out.println("Server ID: " + serverId);
    }
}
```
**Output:**
```
Server ID: 8e12a4b3-2f5e-3acb-a7d4-48d2c982f311
```
If the MAC address cannot be determined, a warning will be logged and a random UUID will be generated instead.

### Running as a Standalone Utility
You can also execute the Standalone Utility method directly:
```bash
java -jar target/mobi-serverid.jar                                         
```
**Log output:**
```
10:14:10.788 INFO  com.mobi.server.utils.ServerIdUtils - Server identifier: 8e12a4b3-2f5e-3acb-a7d4-48d2c982f311
10:14:10.789 INFO  com.mobi.server.utils.ServerIdUtils - Server identifier Retrieved
```

### OSGi Usage
When deployed in an OSGi container (e.g., Apache Karaf), the bundle registers its classes for internal use by other Mobi components that need to retrieve or validate a server identity.

No explicit OSGi services are exported; consumers can use the static utility methods directly by importing:
```
Import-Package: com.mobi.server.utils
```
## Error Handling
The utility throws `com.mobi.exception.MobiException` for:

* Network interface access errors
* Failure to resolve local host information

If such exceptions occur, the system logs an error and continues using a fallback random UUID.

## Dependencies
* **SLF4J** for logging
* **MobiException** (from `com.mobi.exception`) for error propagation

## License
This bundle is licensed under the **GNU Affero General Public License v3 (AGPLv3)**.
See the [LICENSE](http://www.gnu.org/licenses/agpl-3.0.html) file for details.
