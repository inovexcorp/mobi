# Mobi Encryption Service
This bundle provides the API for the Mobi Encryption Service. This service enables the automatic encryption of plaintext passwords stored within service configurations on startup and subsequent updates.

### Configuring Password Encryption

In order to enable password encryption, you must ensure that a file called `com.mobi.security.api.EncryptionService.cfg` exists in the `${karaf.etc}` directory and contains the following fields:

```
enabled=true
password=ENTER_A_UNIQUE_PASSWORD_HERE 
```

**NOTE:** This password is not the password you want to encrypt, rather it is a unique master password used for encrypt and decrypt operations 

**IMPORTANT:** If there is a default password in the password field (i.e. `CHANGEME`), make sure you change it before you start Mobi. Otherwise your passwords will be easy to decrypt.

An alternate way of providing an encryption master password is via environment variable. To configure the use of an environment variable, use the following fields:

```
enabled=true
variable=MY_CHOSEN_ENVIRONMENT_VARIABLE
```
If you use an environment variable, make sure before you start Mobi that you have stored a unique password as the value for that environment variable.

To disable password encryption: stop Mobi, change the enabled property to false in `com.mobi.security.api.EncryptionService.cfg`, re-enter all of your passwords in plaintext, and restart Mobi.