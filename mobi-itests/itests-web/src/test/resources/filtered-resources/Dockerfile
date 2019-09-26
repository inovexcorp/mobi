FROM maven:3.3-jdk-8

# Maven filtered to produce correct versioning.
ENV MOBI_VERSION ${project.version}

# Base Mobi assembly in the /opt/mobi directory.
WORKDIR /opt/mobi
ADD ./mobi-distribution-$MOBI_VERSION.tar.gz ./
RUN echo "\norg.osgi.service.http.port=${http-port}" >> ./mobi-distribution-$MOBI_VERSION/etc/org.ops4j.pax.web.cfg \
    && echo "\norg.osgi.service.http.port.secure=${https-port}" >> ./mobi-distribution-$MOBI_VERSION/etc/org.ops4j.pax.web.cfg \
    && sed -i "s|rmiRegistryPort = 1099|rmiRegistryPort = ${rmi-registry-port} |g" ./mobi-distribution-$MOBI_VERSION/etc/org.apache.karaf.management.cfg \
    && sed -i "s|rmiServerPort = 44444|rmiServerPort = ${rmi-server-port}|g" ./mobi-distribution-$MOBI_VERSION/etc/org.apache.karaf.management.cfg \
    && sed -i "s|sshPort = 8101|sshPort = ${ssh-port} |g" ./mobi-distribution-$MOBI_VERSION/etc/org.apache.karaf.shell.cfg
CMD ./mobi-distribution-$MOBI_VERSION/bin/karaf server

EXPOSE 9082

