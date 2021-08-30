FROM maven:3.3-jdk-8

# Maven filtered to produce correct versioning.
ENV MOBI_VERSION ${project.version}

# Base Mobi assembly in the /opt/mobi directory.
WORKDIR /opt/mobi
ADD ./mobi-distribution-$MOBI_VERSION.tar.gz ./
RUN mv ./mobi-distribution-$MOBI_VERSION ./mobi-distribution
RUN cp -r ./mobi-distribution/etc ./mobi-etc-defaults
CMD chmod +x ./mobi-distribution/docker/docker-start.sh && ./mobi-distribution/docker/docker-start.sh

EXPOSE 8443
