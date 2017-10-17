# Mobi Distribution

This module builds Mobi distribution artifacts.

## Docker

The module includes support for building and deploying Docker images. 

To build the Docker image, specify the `docker:build` target when running your mvn operation in order to use the currently building distribution to generate a docker image.

To run the Docker image in a local Docker container, run the following command after the build: 
`docker run --name Mobi -p 8443:8443 -d inovexis/mobi`

### Docker Deployment

In order to deploy tags of the docker container to DockerHub, you must first be part of the DockerHub Mobi project.  Run `mvn docker:build -DpushImageTag` to push tags of the Mobi docker image to the hub.  Key to this configuration is to provide maven your DockerHub credentials.  To do this, add an entry in the `<servers>` entry of your `~/.m2/settings.xml`:

```
<server>
  <id>docker-hub</id>
  <username>{username}</username>
  <password>{J0QfBsYxFCkHKWpkA+b74DH72XwUaxvgCEPYltmTRfk=}</password>
  <configuration>
    <email>{email.address}</email>
  </configuration>
</server>
```

*Note: If you want to encrypt your maven passwords in your settings.xml file, please refer to:*  https://maven.apache.org/guides/mini/guide-encryption.html
