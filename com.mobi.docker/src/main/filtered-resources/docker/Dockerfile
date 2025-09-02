FROM openjdk:17.0.2

RUN microdnf install -y zip unzip findutils --nodocs && \
    microdnf clean all && \
    rm -rf /var/cache/yum /var/cache/dnf

# Maven filtered to produce correct versioning.
ENV MOBI_VERSION ${project.version}
# Base Mobi assembly in the /opt/mobi directory.
WORKDIR /opt/mobi
ADD maven/mobi-distribution-$MOBI_VERSION.tar.gz ./
RUN mv ./mobi-distribution-$MOBI_VERSION ./mobi-distribution
RUN mkdir -p ./mobi-distribution/docker
ADD maven/docker-start.sh ./mobi-distribution/docker/docker-start.sh
RUN cp -r ./mobi-distribution/etc ./mobi-etc-defaults
CMD chmod +x ./mobi-distribution/docker/docker-start.sh && ./mobi-distribution/docker/docker-start.sh

EXPOSE 8443