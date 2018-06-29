package com.mobi.email.impl;

/*-
 * #%L
 * com.mobi.email.impl
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Modified;
import aQute.configurable.Configurable;
import com.mobi.email.api.EmailService;
import com.mobi.email.api.EmailServiceConfig;
import com.mobi.exception.MobiException;
import org.apache.commons.io.IOUtils;
import org.apache.commons.mail.EmailException;
import org.apache.commons.mail.HtmlEmail;


import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Component
public class SimpleEmailService implements EmailService {

    private static final String EMAIL_TEMPLATE;
    private EmailServiceConfig config;

    static {
        try {
            EMAIL_TEMPLATE = IOUtils.toString(
                    SimpleEmailService.class.getResourceAsStream("/emailTemplate.html"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public CompletableFuture<Boolean> sendSimpleEmail(String subject, String message, String... userEmails) {
        CompletableFuture<Boolean> emailSendResult = CompletableFuture.supplyAsync(() -> setUpEmail())
                .thenApply(email -> {
                    Set<String> invalidEmails = new HashSet<>();
                    email.setSubject(subject);
                    for (String userEmail : userEmails) {
                        try {
                            email.addBcc(userEmail);
                        } catch (EmailException e) {
                            invalidEmails.add(userEmail);
                        }
                    }
                    if (invalidEmails.size() > 0) {
                        // TODO: determine what to do with invalid emails
                    }
                    try {
                        email.buildMimeMessage();
                    } catch (EmailException e) {
                        throw new MobiException("Unable to build MIME message.", e);
                    }

                    int repeatTries = 3;
                    while (repeatTries > 0) {
                        try {
                            email.sendMimeMessage();
                            break;
                        } catch (EmailException e) {
                            if (--repeatTries < 1) {
                                throw new MobiException("Could not send email.", e);
                            }
                        }
                    }

                    return true;
                });
        return emailSendResult;
    }

    @Override
    public CompletableFuture<Boolean> sendEmail(String subject, String htmlMessage, String... userEmails) {
        return null;
    }

    private HtmlEmail setUpEmail() {
        HtmlEmail email = new HtmlEmail();
        if (config.security().equals("STARTTLS")) {
            email.setStartTLSRequired(true);
        }
        email.setSmtpPort(config.port()); // email.setSslSmtpPort();

        email.setSSLCheckServerIdentity(true);
        email.setAuthentication(config.emailAddress(), config.emailPassword());

        email.setHostName(config.smtpServer());
        try {
            email.setFrom(config.emailAddress());
        } catch (EmailException e) {
            throw new MobiException("Invalid 'From' email address.", e);
        }
        return email;

    }

    @Activate
    void activate(Map<String, Object> configuration) {
        config = Configurable.createConfigurable(EmailServiceConfig.class, configuration);
    }

    @Modified
    void modified(Map<String, Object> configuration) {
        deactivate();
        activate(configuration);
    }

    @Deactivate
    void deactivate() {

    }
}
