#MatOnto Virtual Filesystem
This bundle provides the API that the VFS will implement in the MatOnto
system.  Essentially it will provide a common service API for accessing 
file data to abstract that layer of development away from the users.

Providing this layer of abstraction on top of the filesystem could more
easily allow the development of a distributed framework of services that
can act upon a shared set of files without requiring developers to build
the same file reading/writing code over and over again.

##Simple Implementation
The org.matonto.vfs.impl.commons package exported by this bundle will provide
a basic implementation of the VFS API built on top of the Apache 
Commons VFS library.  

Please see the Apache Commons-VFS web site for more information
about the features available.