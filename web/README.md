# MatOnto-Web

This project is used to make the web layer of MatOnto.

## Install npm

Download [node.js](https://nodejs.org/en/) to get npm. You can run the following to check if you've done it right.

```
$ npm -version
```

## Install Bower

Once you have npm installed, you can use it to get bower. You simply need to run this line.

```
$ npm install -g bower
```

You can also run this command to make sure you've done it correctly.

```
bower -version
```

## Import files and install dependencies

Use the following commands to get this project and install all Node and bower dependencies. This will give you the develop branch instead of the master branch. If that is not desired, removed **-b develop --single-branch**.

```
$ git clone -b develop --single-branch git@gitlab.inovexcorp.com:matonto/MatOnto-Web.git
$ cd MatOnto-Web
$ npm install
$ bower install
```

## Create the bundle

The following line of code should be ran from the MatOnto-Web directory from above.

```
$ mvn clean install -Dview.build=dev
```

This will result in a target directory that will contain the bundle needed by Karaf. The **dev** could be replaced with **prod** if you want to minify the css and js.

## Deploy

Now, you simply have to move the bundle to your Karaf local deploy directory. For example, run this code from the MatOnto-Web directory from above.

```
$ mv target/web-1.0-SNAPSHOT.jar ~/path/to/karaf/deploy
```

You should be able to view it here: [http://localhost:8181/index.html](http://localhost:8181/index.html).


