#!/bin/sh
################################################
## ORM Build Script
##
## Simple script to build rdf-orm and
##  the corresponding itest project
################################################
# Install the rdf-orm project, rebuild binaries!
mvn clean install $1

# Install the itests-orm binaries: run itests, which builds the generated code and runs the tests.
cd ../com.mobi.itests/itests-orm/
mvn clean install $1

# Return to the orm directory.
cd ../../rdf-orm