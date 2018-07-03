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
import aQute.bnd.annotation.component.Reference;
import aQute.configurable.Configurable;
import com.mobi.email.api.EmailService;
import com.mobi.email.api.EmailServiceConfig;
import com.mobi.exception.MobiException;
import com.mobi.platform.config.api.server.Mobi;
import org.apache.commons.io.IOUtils;
import org.apache.commons.mail.DefaultAuthenticator;
import org.apache.commons.mail.EmailException;
import org.apache.commons.mail.HtmlEmail;


import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Component
public class SimpleEmailService implements EmailService {

    private static final String EMAIL_TEMPLATE;
    private static final String BODY_BINDING = "!|$BODY!|$";
    private static final String HOSTNAME_BINDING = "!|$HOSTNAME!|$";
    private EmailServiceConfig config;
    private Mobi mobiServer;

    @Reference
    void setMobiServer(Mobi mobiServer) {
        this.mobiServer = mobiServer;
    }

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

    @Activate
    void activate(Map<String, Object> configuration) {
        config = Configurable.createConfigurable(EmailServiceConfig.class, configuration);
    }

    @Modified
    void modified(Map<String, Object> configuration) {
        activate(configuration);
    }

    @Override
    public CompletableFuture<Set<String>> sendSimpleEmail(String subject, String message, String... userEmails) {
        String body = "<tr><td style=\"padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px;"
                + " color: #555555;\"><p style=\"margin: 0;\">" + message + "</p></td></tr>";
        return sendEmail(subject, body, userEmails);
    }

    @Override
    public CompletableFuture<Set<String>> sendEmail(String subject, String htmlMessage, String... userEmails) {
        CompletableFuture<Set<String>> emailSendResult = CompletableFuture.supplyAsync(() -> setUpEmail())
                .thenApply(email -> {
                    Set<String> invalidEmails = new HashSet<>();
                    email.setSubject(subject);
                    String htmlMsg = EMAIL_TEMPLATE.replace(BODY_BINDING, htmlMessage);
                    if (mobiServer.getHostName().endsWith("/")) {
                        htmlMsg = htmlMsg.replace(HOSTNAME_BINDING, mobiServer.getHostName() + "mobi/index.html");
                    } else {
                        htmlMsg = htmlMsg.replace(HOSTNAME_BINDING, mobiServer.getHostName() + "/mobi/index.html");
                    }
                    try {
                        email.setHtmlMsg(htmlMsg);
                    } catch (EmailException e) {
                        throw new MobiException("Unable to set HTML Message content", e);
                    }
                    for (String userEmail : userEmails) {
                        try {
                            email.addBcc(userEmail);
                        } catch (EmailException e) {
                            invalidEmails.add(userEmail);
                        }
                    }
                    try {
                        email.buildMimeMessage();
                    } catch (EmailException e) {
                        throw new MobiException("Unable to build MIME message.", e);
                    }
                    int repeatTries = 2;
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

                    return invalidEmails;
                });
        return emailSendResult;
    }

    private HtmlEmail setUpEmail() {
        HtmlEmail email = new HtmlEmail();
        email.setHostName(config.smtpServer());
        email.setSmtpPort(config.port());
        email.setAuthentication(config.emailAddress(), config.emailPassword());

        if (config.security().equals("SSL") || config.security().equals("TLS")) {
            email.setSSLOnConnect(true);
            email.setSSLCheckServerIdentity(true);
        } else if (config.security().equals("STARTTLS")) {
            email.setStartTLSRequired(true);
        }

        try {
            email.setFrom(config.emailAddress());
        } catch (EmailException e) {
            throw new MobiException("Invalid 'From' email address.", e);
        }
        return email;
    }
}
