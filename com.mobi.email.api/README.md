# Mobi Email Service
This bundle provides the API for the Mobi Email Service (VFS). These services provide a common API for sending emails via a configured SMTP server.

## Simple Implementation
The `com.mobi.email.api` package exported by this bundle will provide a configuration interface with properties for the SMTP server to connect to.

If using a Gmail account, port `465` with a security of `SSL` or `TLS` will enable you to connect. An additional step of allowing less secure apps to access the gmail account is necessary to send emails from Gmail (see, https://myaccount.google.com/lesssecureapps).

If using an Outlook account, port '587' with a security setting of `STARTTLS` will enable you to connect.