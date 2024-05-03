FROM openjdk:17.0.2

# Base Mobi assembly in the /opt/mobi directory.
WORKDIR /opt/mobi
ADD ./mobi-distribution.tar.gz ./
RUN mv ./mobi-distribution* ./mobi-distribution
ADD ./dataFiles ./dataFiles
COPY ./import.sh ./
CMD ./mobi-distribution/bin/karaf server

EXPOSE 8443