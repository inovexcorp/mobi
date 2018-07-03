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

import java.util.Set;
import java.util.concurrent.CompletableFuture;

public interface EmailService {

    /**
     * Takes the provided text message, formats it, and inserts it into the default email template. Sends an email to
     * the provided userEmails with the given subject.
     *
     * @param subject The message to use as the subject line in the email
     * @param message The simple text message to insert into the email template
     * @param userEmails The email addresses to send the message to
     * @return If all emails sent properly, an empty Set. Otherwise, a list of invalid email addresses.
     */
    CompletableFuture<Set<String>> sendSimpleEmail(String subject, String message, String... userEmails);

    /**
     * Inserts the supplied HTML message into the default email template. Sends an email to the provided userEmails
     * with the given subject.
     *
     * @param subject The message to use as the subject line in the email
     * @param htmlMessage The formatted HTML message to insert into the email template
     * @param userEmails The email addresses to send the message to
     * @return If all emails sent properly, an empty Set. Otherwise, a list of invalid email addresses.
     */
    CompletableFuture<Set<String>> sendEmail(String subject, String htmlMessage, String... userEmails);
}
