package com.mobi.email.api;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/*-
 * #%L
 * com.mobi.email.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

@ObjectClassDefinition(name = "Email Service Config", description = "Configure the email details")
public @interface EmailServiceConfig {

    /**
     * The Outgoing Mail (SMTP) server address.
     *
     * @return The configured SMTP server address
     */
    @AttributeDefinition
    String smtpServer();

    /**
     * The email address to send emails from via the configured SMTP server.
     *
     * @return The email address to send emails from
     */
    @AttributeDefinition
    String emailAddress();

    /**
     * The password associated with the configured email address to send emails from.
     *
     * @return The password associated with the provided email address
     */
    @AttributeDefinition
    String emailPassword();

    /**
     * The port to use to connect to the SMTP server.
     *
     * @return The port used by the SMTP server
     */
    @AttributeDefinition(defaultValue = "587")
    int port();

    /**
     * The connection security setting (SSL, TLS, STARTTLS) to use to connect to the SMTP server.
     *
     * @return The connection security setting to use to connect to the SMTP server
     */
    @AttributeDefinition(defaultValue = "SSL")
    String security();

    /**
     * The default email template located in the ${karaf.etc} directory to use to send emails.
     *
     * @return The default email template filename
     */
    @AttributeDefinition(defaultValue = "emailTemplate.html")
    String emailTemplate();
}
