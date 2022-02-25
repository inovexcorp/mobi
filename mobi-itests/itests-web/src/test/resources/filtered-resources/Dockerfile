FROM maven:3.3-jdk-8

# Maven filtered to produce correct versioning.
ENV MOBI_VERSION ${project.version}

# Base Mobi assembly in the /opt/mobi directory.
WORKDIR /opt/mobi
COPY ./mobi-distribution-$MOBI_VERSION.tar.gz ./
RUN tar xvf mobi-distribution-$MOBI_VERSION.tar.gz && rm mobi-distribution-$MOBI_VERSION.tar.gz
RUN mv mobi-distribution-$MOBI_VERSION mobi-distribution
COPY ./z-catalog-ontology-9p-records.trig ./
COPY ./import.sh ./
RUN echo "\norg.osgi.service.http.port=${http-port}" >> ./mobi-distribution/etc/org.ops4j.pax.web.cfg \
    && echo "\norg.osgi.service.http.port.secure=${https-port}" >> ./mobi-distribution/etc/org.ops4j.pax.web.cfg \
    && sed -i "s|rmiRegistryPort = 1099|rmiRegistryPort = ${rmi-registry-port} |g" ./mobi-distribution/etc/org.apache.karaf.management.cfg \
    && sed -i "s|rmiServerPort = 44444|rmiServerPort = ${rmi-server-port}|g" ./mobi-distribution/etc/org.apache.karaf.management.cfg \
    && sed -i "s|sshPort = 8101|sshPort = ${ssh-port}|g" ./mobi-distribution/etc/org.apache.karaf.shell.cfg
CMD ./mobi-distribution/bin/karaf server

EXPOSE 10000

