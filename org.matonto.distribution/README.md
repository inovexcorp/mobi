#MatOnto Distribution

## Docker
Specify the `docker:build` target when running your mvn operation in order
to use the currently building distribution to generate a docker image.  This
means that if you specify this target, you can then run a docker image 
containing the distribution just built.

To run your docker container after building it: 
`docker run --name MatOnto -p 8443:8443 -d matonto/matonto`