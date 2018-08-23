# Mobi Email Service
This bundle provides the API for the Mobi Email Service. This service provides a common API for sending emails via a configured SMTP server.

## Configuration
The `com.mobi.email.api` package exported by this bundle will provide a configuration interface with properties for the SMTP server to connect to.

If using a Gmail account, port `587` with a security setting of `STARTTLS` will enable you to connect. An additional step of allowing less secure apps to access the gmail account is necessary to send emails from Gmail (see, https://myaccount.google.com/lesssecureapps).

If using an Outlook account, port '587' with a security setting of `STARTTLS` will enable you to connect. See https://mobi.inovexcorp.com/docs/ for more configurations.

## Email Template
A default email template is provided in the ${karaf.etc} directory. The email service provides a method for doing a simple string replace on the `!|$MESSAGE!|$` binding. For more complex HTML inserts, the service provides a method to replace all HTML between the two `!|$BODY!|$` bindings.

For custom HTML templates, either replace the `emailTemplate.html` file in the ${karaf.etc} directory or add the new template to the ${karaf.etc} directory and update the `emailTemplate` OSGi config property to the name of the new email template. Custom templates must have the aforementioned bindings (`!|$MESSAGE!|$` & `!|$BODY!|$`). The `!|$MESSAGE!|$` binding must be between two `!|$BODY!|$` bindings. For example:

```
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
...
<body>
!|$BODY!|$
<table>
    <tbody>
    <tr>
        <td>
            <p>
                <!-- A simple message to replace -->
                !|$MESSAGE!|$
            </p>
        </td>
    </tr>
    </tbody>
</table>
!|$BODY!|$
...
</body>
</html>
```