# Mobi-Web

This module contains the Mobi web application.

## Install npm

Download [node.js](https://nodejs.org/en/) to get npm. You can run the following to check if you've done it right.

```
$ npm -version
```

## Build the Module

The maven build process takes care of installing all dependencies using npm and gulp. Simply run:

```
$ mvn clean install
```

This command will create the web bundle in the target directory.

After installation, the web application will be available at [https://localhost:8443/mobi/index.html](https://localhost:8443/mobi/index.html).

## Testing

[Google Chrome](https://www.google.com/chrome/browser/) is required to run the test suite for the web bundle.
