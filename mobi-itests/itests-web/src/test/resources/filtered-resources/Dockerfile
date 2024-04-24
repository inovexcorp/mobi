FROM openjdk:17.0.2

# Maven filtered to produce correct versioning.
ENV MOBI_VERSION ${project.version}

# Base Mobi assembly in the /opt/mobi directory.
WORKDIR /opt/mobi
ADD ./mobi-distribution-$MOBI_VERSION.tar.gz ./
RUN mv ./mobi-distribution-$MOBI_VERSION ./mobi-distribution
ADD ./dataFiles ./dataFiles
COPY ./import.sh ./
CMD ./mobi-distribution/bin/karaf server

EXPOSE 8443