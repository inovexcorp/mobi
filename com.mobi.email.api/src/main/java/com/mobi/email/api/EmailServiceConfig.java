package com.mobi.email.api;

/*-
 * #%L
 * com.mobi.email.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.metatype.Meta;

@Meta.OCD
public interface EmailServiceConfig {

    /**
     * The Outgoing Mail (SMTP) server address.
     *
     * @return The configured SMTP server address
     */
    @Meta.AD(required = true)
    String smtpServer();

    /**
     * The email address to send emails from via the configured SMTP server.
     *
     * @return The email address to send emails from
     */
    @Meta.AD(required = true)
    String emailAddress();

    /**
     * The password associated with the configured email address to send emails from.
     *
     * @return The password associated with the provided email address
     */
    @Meta.AD(required = true)
    String emailPassword();

    /**
     * The port to use to connect to the SMTP server.
     *
     * @return The port used by the SMTP server
     */
    @Meta.AD(deflt = "587")
    int port();

    /**
     * The connection security setting (SSL, TLS, STARTTLS) to use to connect to the SMTP server.
     *
     * @return The connection security setting to use to connect to the SMTP server
     */
    @Meta.AD(deflt = "SSL")
    String security();

    /**
     * The default base path to resolve images by when a relative path is used in the email template.
     *
     * @return The default base path to use to resolve images
     */
    @Meta.AD(deflt = "file://")
    String imageBasePath();
}