FROM maven:3.3-jdk-8

# Maven filtered to produce correct versioning.
ENV MOBI_VERSION ${project.version}

# Base Mobi assembly in the /opt/mobi directory.
WORKDIR /opt/mobi
ADD ./mobi-distribution-$MOBI_VERSION.tar.gz ./
CMD ./mobi-distribution-$MOBI_VERSION/bin/karaf server

EXPOSE 8443
